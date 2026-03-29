import Link from "next/link";
import type {
  NotificationChannel,
  NotificationStatus,
  NotificationTemplate,
} from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
import { StatusPill } from "@/features/admin/components/status-pill";
import { cn } from "@/lib/utils";

type NotificationLogListProps = {
  notifications: {
    id: string;
    channel: NotificationChannel;
    template: NotificationTemplate;
    status: NotificationStatus;
    provider: string;
    destination: string;
    errorMessage: string | null;
    createdAt: Date;
    customer: {
      accountNumber: string;
      name: string;
    };
    bill: {
      billingPeriod: string;
    } | null;
  }[];
};

function getStatusPriority(status: NotificationStatus) {
  if (status === "SENT") {
    return "success" as const;
  }

  if (status === "FAILED") {
    return "attention" as const;
  }

  if (status === "SKIPPED") {
    return "readonly" as const;
  }

  return "pending" as const;
}

export function NotificationLogList({ notifications }: NotificationLogListProps) {
  return (
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Communication Log"
        title="Review the latest print, email, and SMS notice attempts in one audit strip."
        aside={`${notifications.length} recent attempt${notifications.length === 1 ? "" : "s"}`}
      />

      <div className="mt-6">
        <ResponsiveDataTable
          columns={["Customer", "Template", "Channel", "Destination", "Status", "Detail", "Record"]}
          colSpan={7}
          hasRows={notifications.length > 0}
          emptyMessage="No notification attempts are logged yet. Send a reminder, final notice, or print notice to start the communication trail."
          mobileCards={notifications.map((notification) => (
            <article key={notification.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{notification.customer.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notification.customer.accountNumber}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notification.createdAt.toLocaleString("en-PH")}
                  </p>
                </div>
                <StatusPill priority={getStatusPriority(notification.status)}>
                  {notification.status}
                </StatusPill>
              </div>

              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Template
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    <div className="font-medium text-foreground">
                      {notification.template.replaceAll("_", " ")}
                    </div>
                    <div className="mt-1 text-xs">
                      {notification.bill?.billingPeriod || "Customer-level notice"}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Delivery
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    <div>{notification.channel}</div>
                    <div className="mt-1 text-xs">{notification.provider}</div>
                    <div className="mt-1 text-xs break-all">{notification.destination}</div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Detail
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    {notification.errorMessage ||
                      "Queued and delivered without logged provider error."}
                  </dd>
                </div>
              </dl>

              {notification.channel === "PRINT" ? (
                <Link
                  href={`/admin/notices/${notification.id}`}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "mt-4 w-full justify-center rounded-xl px-3",
                    })
                  )}
                >
                  Open notice
                </Link>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">Logged delivery</p>
              )}
            </article>
          ))}
          rows={notifications.map((notification) => (
            <tr key={notification.id} className="align-top text-sm">
              <td className="px-4 py-4">
                <div className="font-medium text-foreground">{notification.customer.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {notification.customer.accountNumber}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="font-medium text-foreground">
                  {notification.template.replaceAll("_", " ")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {notification.bill?.billingPeriod || "Customer-level notice"}
                </div>
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {notification.channel}
                <div className="mt-1 text-xs text-muted-foreground">{notification.provider}</div>
              </td>
              <td className="px-4 py-4 text-muted-foreground">{notification.destination}</td>
              <td className="px-4 py-4">
                <StatusPill priority={getStatusPriority(notification.status)}>
                  {notification.status}
                </StatusPill>
              </td>
              <td className="px-4 py-4">
                <div className="text-foreground">{notification.createdAt.toLocaleString("en-PH")}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {notification.errorMessage ||
                    "Queued and delivered without logged provider error."}
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                {notification.channel === "PRINT" ? (
                  <Link
                    href={`/admin/notices/${notification.id}`}
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "rounded-xl px-3",
                      })
                    )}
                  >
                    Open notice
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">Logged delivery</span>
                )}
              </td>
            </tr>
          ))}
        />
      </div>
    </AdminSurfacePanel>
  );
}
