"use client";

import { useMemo, useState, useTransition } from "react";
import { ComplaintCategory } from "@prisma/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { createRouteComplaint } from "@/features/routes/actions";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

const complaintCategoryOptions: Array<{ value: ComplaintCategory; label: string }> = [
  { value: ComplaintCategory.LEAK, label: "Leak report" },
  { value: ComplaintCategory.NO_WATER, label: "No water" },
  { value: ComplaintCategory.LOW_PRESSURE, label: "Low pressure" },
  { value: ComplaintCategory.BILLING_DISPUTE, label: "Billing dispute" },
  { value: ComplaintCategory.METER_DAMAGE, label: "Meter damage" },
  { value: ComplaintCategory.OTHER, label: "Other" },
];

type RouteComplaintPanelProps = {
  canManageRoutes: boolean;
  routes: {
    id: string;
    name: string;
    code: string;
    zoneName: string;
  }[];
  meterOptions: {
    id: string;
    meterNumber: string;
    customerName: string | null;
    currentRouteId: string | null;
    currentRouteName: string | null;
  }[];
};

export function RouteComplaintPanel({
  canManageRoutes,
  routes,
  meterOptions,
}: RouteComplaintPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [complaintForm, setComplaintForm] = useState<{
    serviceRouteId: string;
    meterId: string;
    category: ComplaintCategory;
    summary: string;
    detail: string;
  }>({
    serviceRouteId: routes[0]?.id ?? "",
    meterId: "",
    category: ComplaintCategory.LEAK,
    summary: "",
    detail: "",
  });

  const scopedMeterOptions = useMemo(
    () =>
      meterOptions.filter((meter) => meter.currentRouteId === complaintForm.serviceRouteId),
    [complaintForm.serviceRouteId, meterOptions]
  );

  return (
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Complaint Intake"
        title="Log route-linked complaint pressure"
        description="Record route-area complaints here so `/admin/routes` can surface high-complaint areas from real field signals instead of guesswork."
      />

      <form
        className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
        onSubmit={(event) => {
          event.preventDefault();
          setServerError(null);

          startTransition(async () => {
            try {
              await createRouteComplaint(complaintForm);
              setComplaintForm((current) => ({
                ...current,
                meterId: "",
                category: ComplaintCategory.LEAK,
                summary: "",
                detail: "",
              }));
              router.refresh();
            } catch (error) {
              console.error(error);
              setServerError(
                error instanceof Error ? error.message : "Complaint intake failed."
              );
            }
          });
        }}
      >
        <div className="space-y-4 border-t border-border/60 pt-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Complaint details</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Start with the route area, then optionally link the affected meter if it is known.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="complaintRouteId">
              Route
            </label>
            <select
              id="complaintRouteId"
              className={`${fieldClassName} bg-white`}
              disabled={!canManageRoutes || isPending || routes.length === 0}
              value={complaintForm.serviceRouteId}
              onChange={(event) =>
                setComplaintForm((current) => {
                  const nextRouteId = event.target.value;
                  const selectedMeterStillMatches = meterOptions.some(
                    (meter) =>
                      meter.id === current.meterId && meter.currentRouteId === nextRouteId
                  );

                  return {
                    ...current,
                    serviceRouteId: nextRouteId,
                    meterId: selectedMeterStillMatches ? current.meterId : "",
                  };
                })
              }
            >
              {routes.length ? (
                routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.code} - {route.name} ({route.zoneName})
                  </option>
                ))
              ) : (
                <option value="">Create a route first</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="complaintMeterId">
              Meter
            </label>
            <select
              id="complaintMeterId"
              className={`${fieldClassName} bg-white`}
              disabled={!canManageRoutes || isPending || routes.length === 0}
              value={complaintForm.meterId}
              onChange={(event) =>
                setComplaintForm((current) => ({ ...current, meterId: event.target.value }))
              }
            >
              <option value="">No meter linked</option>
              {scopedMeterOptions.map((meter) => (
                <option key={meter.id} value={meter.id}>
                  {meter.meterNumber}
                  {meter.customerName ? ` - ${meter.customerName}` : ""}
                  {meter.currentRouteName ? ` (${meter.currentRouteName})` : ""}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              Only meters already mapped to the selected route are listed here.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="complaintCategory">
              Category
            </label>
            <select
              id="complaintCategory"
              className={`${fieldClassName} bg-white`}
              disabled={!canManageRoutes || isPending}
              value={complaintForm.category}
              onChange={(event) =>
                setComplaintForm((current) => ({
                  ...current,
                  category: event.target.value as ComplaintCategory,
                }))
              }
            >
              {complaintCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 border-t border-border/60 pt-4">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="complaintSummary">
              Summary
            </label>
            <input
              id="complaintSummary"
              className={fieldClassName}
              disabled={!canManageRoutes || isPending}
              value={complaintForm.summary}
              onChange={(event) =>
                setComplaintForm((current) => ({ ...current, summary: event.target.value }))
              }
              placeholder="Example: Three homes reported no water after the morning run"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="complaintDetail">
              Detail
            </label>
            <textarea
              id="complaintDetail"
              className={`${fieldClassName} min-h-32`}
              disabled={!canManageRoutes || isPending}
              value={complaintForm.detail}
              onChange={(event) =>
                setComplaintForm((current) => ({ ...current, detail: event.target.value }))
              }
              placeholder="Capture caller context, landmarks, or service notes if they matter for route review."
            />
          </div>

          <Button
            type="submit"
            className="h-11 rounded-2xl px-5"
            disabled={!canManageRoutes || isPending || routes.length === 0}
          >
            {isPending ? "Saving..." : "Record complaint"}
          </Button>

          {!canManageRoutes ? (
            <p className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              This role can review complaint-area visibility but cannot log new complaint records.
            </p>
          ) : null}

          {serverError ? (
            <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
        </div>
      </form>
    </AdminSurfacePanel>
  );
}
