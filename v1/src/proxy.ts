import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isProtectedPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/admin");
}

function isChangePasswordPath(pathname: string) {
  return pathname === "/change-password" || pathname.startsWith("/change-password/");
}

function isSignInPath(pathname: string) {
  return pathname === "/sign-in" || pathname.startsWith("/sign-in/");
}

export const proxy = auth(async (request) => {
  const { nextUrl } = request;
  const sessionUserId = request.auth?.user?.id;
  const sessionUser = sessionUserId
    ? await prisma.user.findUnique({
        where: {
          id: sessionUserId,
        },
        select: {
          id: true,
          isActive: true,
          mustChangePassword: true,
        },
      })
    : null;
  const isAuthenticated = Boolean(sessionUser?.id && sessionUser.isActive);
  const mustChangePassword = Boolean(sessionUser?.mustChangePassword);

  if (isSignInPath(nextUrl.pathname) && isAuthenticated) {
    return NextResponse.redirect(
      new URL(mustChangePassword ? "/change-password" : "/dashboard", nextUrl)
    );
  }

  if (isChangePasswordPath(nextUrl.pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/sign-in", nextUrl));
  }

  if (isChangePasswordPath(nextUrl.pathname) && isAuthenticated && !mustChangePassword) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isProtectedPath(nextUrl.pathname) && isAuthenticated && mustChangePassword) {
    return NextResponse.redirect(new URL("/change-password", nextUrl));
  }

  if (isProtectedPath(nextUrl.pathname) && !isAuthenticated) {
    const signInUrl = new URL("/sign-in", nextUrl);
    const callbackUrl = `${nextUrl.pathname}${nextUrl.search}`;

    signInUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api)(.*)",
  ],
};
