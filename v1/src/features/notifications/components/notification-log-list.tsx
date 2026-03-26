import Link from "next/link";
import type {
  NotificationChannel,
  NotificationStatus,
  NotificationTemplate,
} from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
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
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Communication Log
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Recent print, email, and SMS activity
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {notifications.length} recent attempt{notifications.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
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
    </section>
  );
}
