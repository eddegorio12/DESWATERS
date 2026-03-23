import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { clerkAppearance } from "@/features/auth/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in to the DESWATERS admin system."
      description="Use your Clerk account to access protected operations screens for billing, customer records, and metering workflows."
    >
      <SignIn
        appearance={clerkAppearance}
        forceRedirectUrl="/admin/dashboard"
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
      />
    </AuthShell>
  );
}
