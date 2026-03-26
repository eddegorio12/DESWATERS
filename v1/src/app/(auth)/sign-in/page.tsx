import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Sign in to the DWDS admin workspace."
      description="Use the internal admin credentials assigned to you. This is an admin-only system, and there is no public signup."
    >
      <SignInForm callbackUrl={resolvedSearchParams.callbackUrl} />
    </AuthShell>
  );
}
