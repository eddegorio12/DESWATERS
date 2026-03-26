import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { getCurrentStaffUser } from "@/features/auth/lib/authorization";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const currentUser = await getCurrentStaffUser();
  const resolvedSearchParams = await searchParams;

  if (currentUser.isAuthenticated && currentUser.user?.id) {
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
