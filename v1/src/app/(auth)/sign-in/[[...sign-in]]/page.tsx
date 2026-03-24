import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { clerkAppearance } from "@/features/auth/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in to the DEGORIO WATER DISTRIBUTION SERVICES admin system."
      description="Use your Clerk account to request or open approved staff access for protected billing, customer, metering, and collections workflows."
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
