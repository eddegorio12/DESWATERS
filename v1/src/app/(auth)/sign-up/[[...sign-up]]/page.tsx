import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { clerkAppearance } from "@/features/auth/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create a DEGORIO WATER DISTRIBUTION SERVICES staff account."
      description="This flow creates the Clerk identity first, then DWDS submits a staff access request that must be approved by an admin or manager before dashboard access is granted."
    >
      <SignUp
        appearance={clerkAppearance}
        forceRedirectUrl="/admin/dashboard"
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
      />
    </AuthShell>
  );
}
