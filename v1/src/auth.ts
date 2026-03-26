import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const signInSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsedCredentials = signInSchema.safeParse(rawCredentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const admin = await prisma.user.findUnique({
          where: {
            email: parsedCredentials.data.email,
          },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            mustChangePassword: true,
            role: true,
            isActive: true,
          },
        });

        if (!admin?.isActive) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          parsedCredentials.data.password,
          admin.passwordHash
        );

        if (!passwordMatches) {
          return null;
        }

        await prisma.user.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          mustChangePassword: admin.mustChangePassword,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role as Role;
        token.mustChangePassword = Boolean(user.mustChangePassword);
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub && token.role !== undefined) {
        session.user.id = token.sub;
        session.user.role = token.role as Role;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }

      return session;
    },
  },
});
