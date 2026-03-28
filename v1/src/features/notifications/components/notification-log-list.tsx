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

      <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-border/70 bg-white/76">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-secondary/55">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 text-right font-medium">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {notifications.length ? (
                notifications.map((notification) => (
                  <tr key={notification.id} className="align-top text-sm">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">
                        {notification.customer.name}
                      </div>
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
                      <div className="mt-1 text-xs text-muted-foreground">
                        {notification.provider}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{notification.destination}</td>
                    <td className="px-4 py-4">
                      <StatusPill priority={getStatusPriority(notification.status)}>
                        {notification.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-foreground">
                        {notification.createdAt.toLocaleString("en-PH")}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {notification.errorMessage || "Queued and delivered without logged provider error."}
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
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No notification attempts are logged yet. Send a reminder, final notice, or print notice to start the communication trail.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminSurfacePanel>
  );
}
