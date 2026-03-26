import { redirect } from "next/navigation";

import { getCurrentStaffUser } from "@/features/auth/lib/authorization";

export default async function DashboardLandingPage() {
  const currentUser = await getCurrentStaffUser();

  if (!currentUser.isAuthenticated || !currentUser.user) {
    redirect("/sign-in");
  }

  redirect("/admin/dashboard");
}
