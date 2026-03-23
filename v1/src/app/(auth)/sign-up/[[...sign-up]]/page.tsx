import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { clerkAppearance } from "@/features/auth/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create a DESWATERS staff account."
      description="This flow creates the Clerk identity first, then the app provisions the matching local user record when the protected dashboard loads."
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
