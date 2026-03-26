import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ChangePasswordPanel } from "@/features/auth/components/change-password-panel";

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!session.user.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Change your temporary password before continuing."
      description="This account was created or reset with a temporary password. Replace it now to unlock the DWDS dashboard."
    >
      <div className="w-full max-w-3xl">
        <ChangePasswordPanel />
      </div>
    </AuthShell>
  );
}
