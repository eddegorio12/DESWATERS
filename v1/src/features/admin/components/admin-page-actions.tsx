import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import { cn } from "@/lib/utils";

type AdminPageActionLink = {
  href: string;
  label: string;
};

type AdminPageActionsProps = {
  links?: readonly AdminPageActionLink[];
  includeDashboardLink?: boolean;
  dashboardLabel?: string;
  includeSessionButton?: boolean;
};

const adminActionButtonClassName =
  "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white";

export function AdminPageActions({
  links = [],
  includeDashboardLink = true,
  dashboardLabel = "Back to dashboard",
  includeSessionButton = true,
}: AdminPageActionsProps) {
  const actionLinks = includeDashboardLink
    ? [...links, { href: "/admin/dashboard", label: dashboardLabel }]
    : [...links];

  return (
    <>
      {actionLinks.map((link) => (
        <Link
          key={`${link.href}:${link.label}`}
          href={link.href}
          className={cn(
            buttonVariants({
              variant: "outline",
              className: adminActionButtonClassName,
            })
          )}
        >
          {link.label}
        </Link>
      ))}
      {includeSessionButton ? <AdminSessionButton /> : null}
    </>
  );
}
