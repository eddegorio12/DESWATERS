"use client";

import { useState, useTransition } from "react";
import { RouteResponsibility, type Role } from "@prisma/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  assignMeterRoute,
  assignStaffRoute,
  createServiceRoute,
  createServiceZone,
} from "@/features/routes/actions";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

type RouteOperationsManagerProps = {
  canManageRoutes: boolean;
  zones: {
    id: string;
    name: string;
  }[];
  routes: {
    id: string;
    name: string;
    code: string;
    zoneName: string;
  }[];
  staffOptions: {
    id: string;
    name: string;
    role: Role;
  }[];
  meterOptions: {
    id: string;
    meterNumber: string;
    customerName: string | null;
    currentRouteName: string | null;
  }[];
};

export function RouteOperationsManager({
  canManageRoutes,
  zones,
  routes,
  staffOptions,
  meterOptions,
}: RouteOperationsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [routeForm, setRouteForm] = useState({
    zoneId: zones[0]?.id ?? "",
    name: "",
    code: "",
    description: "",
  });
  const [staffAssignmentForm, setStaffAssignmentForm] = useState<{
    userId: string;
    serviceRouteId: string;
    responsibility: RouteResponsibility;
  }>({
    userId: staffOptions[0]?.id ?? "",
    serviceRouteId: routes[0]?.id ?? "",
    responsibility: RouteResponsibility.METER_READING,
  });
  const [meterAssignmentForm, setMeterAssignmentForm] = useState({
    meterId: meterOptions[0]?.id ?? "",
    serviceRouteId: routes[0]?.id ?? "",
  });

  function runAction(action: () => Promise<void>, onSuccess?: () => void) {
    setServerError(null);

    startTransition(async () => {
      try {
        await action();
        onSuccess?.();
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Route operations update failed."
        );
      }
    });
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Coverage Setup
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Define zones and service routes
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Build the field map first so reading ownership, print grouping, and analytics all use
            the same route records.
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <form
            className="space-y-4 rounded-[1.4rem] border border-[#dbe9e5] bg-[#fbfdfc] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                async () => {
                  await createServiceZone(zoneForm);
                },
                () => {
                  setZoneForm({
                    name: "",
                    code: "",
                    description: "",
                  });
                }
              );
            }}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Create zone</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Use one zone per collection or geographic grouping.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="zoneName">
                Zone name
              </label>
              <input
                id="zoneName"
                className={fieldClassName}
                disabled={!canManageRoutes || isPending}
                value={zoneForm.name}
                onChange={(event) =>
                  setZoneForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="zoneCode">
                Zone code
              </label>
              <input
                id="zoneCode"
                className={fieldClassName}
                disabled={!canManageRoutes || isPending}
                value={zoneForm.code}
                onChange={(event) =>
                  setZoneForm((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="ZN-01"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="zoneDescription">
                Description
              </label>
              <textarea
                id="zoneDescription"
                className={`${fieldClassName} min-h-24`}
                disabled={!canManageRoutes || isPending}
                value={zoneForm.description}
                onChange={(event) =>
                  setZoneForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
            <Button
              type="submit"
              className="h-11 rounded-2xl px-5"
              disabled={!canManageRoutes || isPending}
            >
              {isPending ? "Saving..." : "Create zone"}
            </Button>
          </form>

          <form
            className="space-y-4 rounded-[1.4rem] border border-[#dbe9e5] bg-[#fbfdfc] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                async () => {
                  await createServiceRoute(routeForm);
                },
                () => {
                  setRouteForm((current) => ({
                    ...current,
                    name: "",
                    code: "",
                    description: "",
                  }));
                }
              );
            }}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Create route</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Routes sit under zones and become the ownership unit for readers and distributors.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="routeZoneId">
                Zone
              </label>
              <select
                id="routeZoneId"
                className={`${fieldClassName} bg-white`}
                disabled={!canManageRoutes || isPending || zones.length === 0}
                value={routeForm.zoneId}
                onChange={(event) =>
                  setRouteForm((current) => ({ ...current, zoneId: event.target.value }))
                }
              >
                {zones.length ? (
                  zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))
                ) : (
                  <option value="">Create a zone first</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="routeName">
                Route name
              </label>
              <input
                id="routeName"
                className={fieldClassName}
                disabled={!canManageRoutes || isPending}
                value={routeForm.name}
                onChange={(event) =>
                  setRouteForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="routeCode">
                Route code
              </label>
              <input
                id="routeCode"
                className={fieldClassName}
                disabled={!canManageRoutes || isPending}
                value={routeForm.code}
                onChange={(event) =>
                  setRouteForm((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="R-01"
              />
            </div>
            <Button
              type="submit"
              className="h-11 rounded-2xl px-5"
              disabled={!canManageRoutes || isPending || zones.length === 0}
            >
              {isPending ? "Saving..." : "Create route"}
            </Button>
          </form>
        </div>
      </article>

      <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Ownership
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Assign staff and meter coverage
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Route ownership determines who should read the meter path and who should handle bill
            distribution for that same field area.
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <form
            className="space-y-4 rounded-[1.4rem] border border-[#dbe9e5] bg-[#fbfdfc] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(async () => {
                await assignStaffRoute(staffAssignmentForm);
              });
            }}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Assign staff owner</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Store route responsibility directly on the staff record relationship.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="staffUserId">
                Staff account
              </label>
              <select
                id="staffUserId"
                className={`${fieldClassName} bg-white`}
                disabled={!canManageRoutes || isPending || staffOptions.length === 0}
                value={staffAssignmentForm.userId}
                onChange={(event) =>
                  setStaffAssignmentForm((current) => ({ ...current, userId: event.target.value }))
                }
              >
                {staffOptions.length ? (
                  staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role.replaceAll("_", " ")})
                    </option>
                  ))
                ) : (
                  <option value="">No eligible staff</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="staffRouteId">
                Route
              </label>
              <select
                id="staffRouteId"
                className={`${fieldClassName} bg-white`}
                disabled={!canManageRoutes || isPending || routes.length === 0}
                value={staffAssignmentForm.serviceRouteId}
                onChange={(event) =>
                  setStaffAssignmentForm((current) => ({
                    ...current,
                    serviceRouteId: event.target.value,
                  }))
                }
              >
                {routes.length ? (
                  routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.code} - {route.name} ({route.zoneName})
                    </option>
                  ))
                ) : (
                  <option value="">No routes available</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="responsibility">
                Responsibility
              </label>
              <select
                id="responsibility"
                className={`${fieldClassName} bg-white`}
                disabled={!canManageRoutes || isPending}
                value={staffAssignmentForm.responsibility}
                onChange={(event) =>
                  setStaffAssignmentForm((current) => ({
                    ...current,
                    responsibility: event.target.value as RouteResponsibility,
                  }))
                }
              >
                <option value={RouteResponsibility.METER_READING}>Meter reading</option>
                <option value={RouteResponsibility.BILL_DISTRIBUTION}>Bill distribution</option>
              </select>
            </div>
            <Button
              type="submit"
              className="h-11 rounded-2xl px-5"
              disabled={!canManageRoutes || isPending || routes.length === 0 || staffOptions.length === 0}
            >
              {isPending ? "Saving..." : "Assign staff"}
            </Button>
          </form>

          <form
            className="space-y-4 rounded-[1.4rem] border border-[#dbe9e5] bg-[#fbfdfc] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(async () => {
                await assignMeterRoute(meterAssignmentForm);
              });
            }}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Map meter to route</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Existing service meters can be folded into route coverage without re-registering
                them.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="meterId">
                Meter
              </label>
              <select
                id="meterId"
                className={`${fieldClassName} bg-white`}
                disabled={!canManageRoutes || isPending || meterOptions.length === 0}
                value={meterAssignmentForm.meterId}
                onChange={(event) =>
                  setMeterAssignmentForm((current) => ({ ...current, meterId: event.target.value }))
                }
              >
                {meterOptions.length ? (
                  meterOptions.map((meter) => (
                    <option key={meter.id} value={meter.id}>
                      {meter.meterNumber}
                      {meter.customerName ? ` - ${meter.customerName}` : ""}
                      {meter.currentRouteName ? ` (${meter.currentRouteName})` : ""}
                    </option>
                  ))
                ) : (
                  <option value="">No meters available</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="meterRouteId">
                Route
              </label>
              <select
                id="meterRouteId"
                className={`${fieldClassName} bg-white`}
                disabled={!canManageRoutes || isPending || routes.length === 0}
                value={meterAssignmentForm.serviceRouteId}
                onChange={(event) =>
                  setMeterAssignmentForm((current) => ({
                    ...current,
                    serviceRouteId: event.target.value,
                  }))
                }
              >
                {routes.length ? (
                  routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.code} - {route.name} ({route.zoneName})
                    </option>
                  ))
                ) : (
                  <option value="">No routes available</option>
                )}
              </select>
            </div>
            <Button
              type="submit"
              className="h-11 rounded-2xl px-5"
              disabled={!canManageRoutes || isPending || routes.length === 0 || meterOptions.length === 0}
            >
              {isPending ? "Saving..." : "Assign meter route"}
            </Button>
          </form>
        </div>

        {!canManageRoutes ? (
          <p className="mt-5 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            This role can review route analytics but cannot change route coverage.
          </p>
        ) : null}

        {serverError ? (
          <p className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {serverError}
          </p>
        ) : null}
      </article>
    </section>
  );
}
