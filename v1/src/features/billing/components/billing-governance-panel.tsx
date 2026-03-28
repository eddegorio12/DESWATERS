"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  BillDistributionStatus,
  BillLifecycleStatus,
  BillPrintBatchStatus,
  BillPrintGrouping,
  BillingCycleStatus,
  type Role,
} from "@prisma/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import {
  closeBillingCycle,
  createBillPrintBatch,
  finalizeBillingCycle,
  regenerateBillingCycleBills,
  reopenBillingCycle,
  updateBillingCycleChecklist,
  updateBillPrintBatchStatus,
} from "@/features/billing/actions";
import {
  billDistributionStatusLabels,
  billPrintBatchStatusLabels,
  billPrintGroupingLabels,
  billingCycleStatusLabels,
  getBillingChecklistItems,
  isBillingChecklistComplete,
} from "@/features/billing/lib/billing-governance";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { cn } from "@/lib/utils";

type BillingGovernancePanelProps = {
  cycles: {
    id: string;
    billingPeriodLabel: string;
    status: BillingCycleStatus;
    billCount: number;
    printBatchCount: number;
  }[];
  selectedCycle: {
    id: string;
    billingPeriodLabel: string;
    status: BillingCycleStatus;
    checklistReviewCompleted: boolean;
    checklistReceivablesVerified: boolean;
    checklistPrintReady: boolean;
    checklistDistributionReady: boolean;
    checklistMonthEndLocked: boolean;
    closedAt: Date | null;
    reopenedAt: Date | null;
    finalizedAt: Date | null;
    bills: {
      id: string;
      billingPeriod: string;
      totalCharges: number;
      lifecycleStatus: BillLifecycleStatus;
      distributionStatus: BillDistributionStatus;
      reprintCount: number;
      customer: {
        accountNumber: string;
        address: string;
        name: string;
      };
      reading: {
        meter: {
          meterNumber: string;
          serviceZone: {
            name: string;
          } | null;
          serviceRoute: {
            id: string;
            code: string;
            name: string;
            assignments: {
              user: {
                id: string;
                name: string;
              };
            }[];
          } | null;
        };
      };
    }[];
    printBatches: {
      id: string;
      label: string;
      grouping: BillPrintGrouping;
      groupingValue: string | null;
      status: BillPrintBatchStatus;
      notes: string | null;
      assignedTo: {
        id: string;
        name: string;
      } | null;
      serviceZone: {
        name: string;
      } | null;
      serviceRoute: {
        code: string;
        name: string;
      } | null;
      createdAt: Date;
      printedAt: Date | null;
      distributedAt: Date | null;
      returnedAt: Date | null;
      failedDeliveryAt: Date | null;
      bills: {
        id: string;
      }[];
    }[];
    events: {
      id: string;
      type: string;
      note: string | null;
      occurredAt: Date;
      actor: {
        name: string;
        role: Role;
      };
    }[];
  } | null;
  staffOptions: {
    id: string;
    name: string;
    role: Role;
  }[];
  capabilities: {
    canFinalizeCycle: boolean;
    canReopenCycle: boolean;
    canRegenerateCycle: boolean;
    canManagePrintBatches: boolean;
    canTrackDistribution: boolean;
  };
};

type ChecklistState = {
  checklistReviewCompleted: boolean;
  checklistReceivablesVerified: boolean;
  checklistPrintReady: boolean;
  checklistDistributionReady: boolean;
  checklistMonthEndLocked: boolean;
};

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Not yet";
  }

  return value.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getCycleStatusClasses(status: BillingCycleStatus) {
  if (status === BillingCycleStatus.FINALIZED) {
    return "bg-[#dff3eb] text-[#145c3b]";
  }

  if (status === BillingCycleStatus.CLOSED) {
    return "bg-[#fff1d9] text-[#8c5a03]";
  }

  return "bg-[#e4f0f5] text-[#194b5f]";
}

function getDistributionStatusClasses(status: BillDistributionStatus) {
  if (status === BillDistributionStatus.DISTRIBUTED) {
    return "bg-[#dff3eb] text-[#145c3b]";
  }

  if (
    status === BillDistributionStatus.RETURNED ||
    status === BillDistributionStatus.FAILED_DELIVERY
  ) {
    return "bg-[#ffe4e1] text-[#8d2a21]";
  }

  if (status === BillDistributionStatus.PRINTED) {
    return "bg-[#eef3ff] text-[#294b8f]";
  }

  return "bg-secondary text-secondary-foreground";
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getDefaultPrintBatchLabel(
  billingPeriodLabel: string,
  grouping: BillPrintGrouping,
  groupingValue: string
) {
  const trimmedGroupingValue = groupingValue.trim();

  if (grouping === BillPrintGrouping.ROUTE && trimmedGroupingValue) {
    return `${trimmedGroupingValue} - ${billingPeriodLabel} Batch`;
  }

  if (grouping === BillPrintGrouping.ZONE && trimmedGroupingValue) {
    return `${trimmedGroupingValue} - ${billingPeriodLabel} Batch`;
  }

  if (grouping === BillPrintGrouping.PUROK && trimmedGroupingValue) {
    return `${trimmedGroupingValue} - ${billingPeriodLabel} Batch`;
  }

  if (grouping === BillPrintGrouping.MANUAL) {
    return `${billingPeriodLabel} Manual Batch`;
  }

  return `${billingPeriodLabel} Master Batch`;
}

export function BillingGovernancePanel({
  cycles,
  selectedCycle,
  staffOptions,
  capabilities,
}: BillingGovernancePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [regenerateReason, setRegenerateReason] = useState("");
  const [manualPrintBatchLabel, setManualPrintBatchLabel] = useState(
    selectedCycle
      ? getDefaultPrintBatchLabel(
          selectedCycle.billingPeriodLabel,
          BillPrintGrouping.ALL,
          ""
        )
      : ""
  );
  const [isPrintBatchLabelDirty, setIsPrintBatchLabelDirty] = useState(false);
  const [printBatchGrouping, setPrintBatchGrouping] = useState<BillPrintGrouping>(
    BillPrintGrouping.ALL
  );
  const [printBatchGroupingValue, setPrintBatchGroupingValue] = useState("");
  const [printBatchNotes, setPrintBatchNotes] = useState("");
  const [manualAssignedToId, setManualAssignedToId] = useState("");
  const [isAssignedToDirty, setIsAssignedToDirty] = useState(false);
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>(
    selectedCycle ? selectedCycle.bills.map((bill) => bill.id) : []
  );
  const [checklistState, setChecklistState] = useState<ChecklistState>({
    checklistReviewCompleted: selectedCycle?.checklistReviewCompleted ?? false,
    checklistReceivablesVerified: selectedCycle?.checklistReceivablesVerified ?? false,
    checklistPrintReady: selectedCycle?.checklistPrintReady ?? false,
    checklistDistributionReady: selectedCycle?.checklistDistributionReady ?? false,
    checklistMonthEndLocked: selectedCycle?.checklistMonthEndLocked ?? false,
  });
  const [batchNotes, setBatchNotes] = useState<Record<string, string>>({});

  const checklistItems = useMemo(
    () => getBillingChecklistItems(checklistState),
    [checklistState]
  );
  const cycleBills = useMemo(() => selectedCycle?.bills ?? [], [selectedCycle]);
  const isManualSelection = printBatchGrouping === BillPrintGrouping.MANUAL;
  const routeOptions = useMemo(() => {
    const options = new Map<
      string,
      {
        value: string;
        label: string;
        assignedTo: {
          id: string;
          name: string;
        } | null;
      }
    >();

    for (const bill of cycleBills) {
      const route = bill.reading.meter.serviceRoute;

      if (!route) {
        continue;
      }

      if (!options.has(route.code)) {
        options.set(route.code, {
          value: route.code,
          label: `${route.code} - ${route.name}`,
          assignedTo: route.assignments[0]?.user ?? null,
        });
      }
    }

    return [...options.values()];
  }, [cycleBills]);
  const zoneOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();

    for (const bill of cycleBills) {
      const zone = bill.reading.meter.serviceZone;

      if (!zone) {
        continue;
      }

      if (!options.has(zone.name)) {
        options.set(zone.name, {
          value: zone.name,
          label: zone.name,
        });
      }
    }

    return [...options.values()];
  }, [cycleBills]);
  const effectiveGroupingValue = useMemo(() => {
    if (printBatchGrouping === BillPrintGrouping.ROUTE) {
      return routeOptions.some((option) => option.value === printBatchGroupingValue)
        ? printBatchGroupingValue
        : (routeOptions[0]?.value ?? "");
    }

    if (printBatchGrouping === BillPrintGrouping.ZONE) {
      return zoneOptions.some((option) => option.value === printBatchGroupingValue)
        ? printBatchGroupingValue
        : (zoneOptions[0]?.value ?? "");
    }

    return printBatchGroupingValue;
  }, [printBatchGrouping, printBatchGroupingValue, routeOptions, zoneOptions]);
  const visibleBills = useMemo(() => {
    if (printBatchGrouping === BillPrintGrouping.ROUTE) {
      return cycleBills.filter(
        (bill) => bill.reading.meter.serviceRoute?.code === effectiveGroupingValue
      );
    }

    if (printBatchGrouping === BillPrintGrouping.ZONE) {
      return cycleBills.filter(
        (bill) => bill.reading.meter.serviceZone?.name === effectiveGroupingValue
      );
    }

    if (printBatchGrouping === BillPrintGrouping.PUROK) {
      const normalizedGroupingValue = normalizeText(effectiveGroupingValue);

      if (!normalizedGroupingValue) {
        return [];
      }

      return cycleBills.filter((bill) =>
        normalizeText(bill.customer.address).includes(normalizedGroupingValue)
      );
    }

    return cycleBills;
  }, [cycleBills, effectiveGroupingValue, printBatchGrouping]);
  const effectiveSelectedBillIds = useMemo(() => {
    if (isManualSelection) {
      return selectedBillIds;
    }

    return visibleBills.map((bill) => bill.id);
  }, [isManualSelection, selectedBillIds, visibleBills]);
  const selectionModeLabel = isManualSelection ? "manual selection" : "automatic selection";
  const defaultPrintBatchLabel = useMemo(
    () =>
      selectedCycle
        ? getDefaultPrintBatchLabel(
            selectedCycle.billingPeriodLabel,
            printBatchGrouping,
            effectiveGroupingValue
          )
        : "",
    [effectiveGroupingValue, printBatchGrouping, selectedCycle]
  );
  const autoAssignedStaff = useMemo(() => {
    if (printBatchGrouping !== BillPrintGrouping.ROUTE || !effectiveGroupingValue) {
      return null;
    }

    return (
      routeOptions.find((option) => option.value === effectiveGroupingValue)?.assignedTo ?? null
    );
  }, [effectiveGroupingValue, printBatchGrouping, routeOptions]);
  const printBatchLabel = isPrintBatchLabelDirty
    ? manualPrintBatchLabel
    : defaultPrintBatchLabel;
  const assignedToId = isAssignedToDirty
    ? manualAssignedToId
    : (autoAssignedStaff?.id ?? "");

  function runAction(action: () => Promise<unknown>) {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : "The billing action failed.");
      }
    });
  }

  function toggleBillSelection(billId: string, checked: boolean) {
    setSelectedBillIds((current) => {
      if (checked) {
        return current.includes(billId) ? current : [...current, billId];
      }

      return current.filter((value) => value !== billId);
    });
  }

  if (!selectedCycle) {
    return (
      <AdminSurfacePanel>
        <AdminSurfaceHeader
          eyebrow="Billing Governance"
          title="No billing cycle has been created yet"
          description="Generate the first bill for a month to create its billing cycle, then return here to close, finalize, regenerate, and track print distribution for that cycle."
        />
      </AdminSurfacePanel>
    );
  }

  return (
    <AdminSurfacePanel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Billing Governance
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {selectedCycle.billingPeriodLabel} cycle controls
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Close the cycle for review, complete the month-end checklist, finalize bill locks,
            reopen only with SUPER_ADMIN approval, and track print/distribution handling as an
            auditable workflow.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.1rem] border border-border/65 bg-secondary/24 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
              Status
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCycleStatusClasses(
                selectedCycle.status
              )}`}
            >
              {billingCycleStatusLabels[selectedCycle.status]}
            </span>
          </div>
          <div className="rounded-[1.1rem] border border-border/65 bg-background/85 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
              Bills
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">
              {selectedCycle.bills.length}
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-border/65 bg-background/85 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
              Print Batches
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">
              {selectedCycle.printBatches.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[1.25rem] border border-border/65 bg-white/76 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Month-end Checklist
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                  Finalization guardrails
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isBillingChecklistComplete(checklistState) ? "Ready to finalize" : "Incomplete"}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {checklistItems.map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 rounded-[1rem] border border-border/65 bg-background/90 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={checklistState[item.key]}
                    disabled={selectedCycle.status === BillingCycleStatus.FINALIZED}
                    onChange={(event) =>
                      setChecklistState((current) => ({
                        ...current,
                        [item.key]: event.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-foreground">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={isPending || !capabilities.canFinalizeCycle}
                onClick={() =>
                  runAction(() =>
                    updateBillingCycleChecklist({
                      billingCycleId: selectedCycle.id,
                      ...checklistState,
                    })
                  )
                }
              >
                Save checklist
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  isPending ||
                  !capabilities.canFinalizeCycle ||
                  selectedCycle.status !== BillingCycleStatus.OPEN
                }
                onClick={() => runAction(() => closeBillingCycle(selectedCycle.id))}
              >
                Close cycle
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  isPending ||
                  !capabilities.canFinalizeCycle ||
                  selectedCycle.status !== BillingCycleStatus.CLOSED ||
                  !isBillingChecklistComplete(checklistState)
                }
                onClick={() => runAction(() => finalizeBillingCycle(selectedCycle.id))}
              >
                Finalize cycle
              </Button>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-border/65 bg-white/76 p-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Reopen Control
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Reopening is restricted to SUPER_ADMIN and remains blocked once posted payments
                  exist for the cycle.
                </p>
                <textarea
                  value={reopenReason}
                  disabled={isPending || !capabilities.canReopenCycle}
                  onChange={(event) => setReopenReason(event.target.value)}
                  className="mt-4 min-h-28 w-full rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#86a09b]"
                  placeholder="Audit reason for reopening this billing cycle"
                />
                <Button
                  type="button"
                  className="mt-3"
                  disabled={
                    isPending ||
                    !capabilities.canReopenCycle ||
                    selectedCycle.status === BillingCycleStatus.OPEN
                  }
                  onClick={() => runAction(() => reopenBillingCycle(selectedCycle.id, reopenReason))}
                >
                  Reopen cycle
                </Button>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Regenerate Batch
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Regeneration is only allowed while the cycle is open and no completed payments
                  have been posted against its bills.
                </p>
                <textarea
                  value={regenerateReason}
                  disabled={isPending || !capabilities.canRegenerateCycle}
                  onChange={(event) => setRegenerateReason(event.target.value)}
                  className="mt-4 min-h-28 w-full rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#86a09b]"
                  placeholder="Required reason for regenerating the bill batch"
                />
                <Button
                  type="button"
                  className="mt-3"
                  variant="outline"
                  disabled={
                    isPending ||
                    !capabilities.canRegenerateCycle ||
                    selectedCycle.status !== BillingCycleStatus.OPEN
                  }
                  onClick={() =>
                    runAction(() => regenerateBillingCycleBills(selectedCycle.id, regenerateReason))
                  }
                >
                  Regenerate bills
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-border/65 bg-white/76 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Bill Selection
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                  Print and distribution tracking
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {effectiveSelectedBillIds.length} of {selectedCycle.bills.length} bill
                {selectedCycle.bills.length === 1 ? "" : "s"} selected via {selectionModeLabel}
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-[#dbe9e5]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-secondary/55">
                    <tr className="text-sm text-muted-foreground">
                      {isManualSelection ? (
                        <th className="px-4 py-3 font-medium">Use</th>
                      ) : null}
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Meter</th>
                      <th className="px-4 py-3 font-medium">Route</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Bill lock</th>
                      <th className="px-4 py-3 font-medium">Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {visibleBills.length ? (
                      visibleBills.map((bill) => (
                      <tr key={bill.id} className="text-sm">
                        {isManualSelection ? (
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={effectiveSelectedBillIds.includes(bill.id)}
                              disabled={isPending || !capabilities.canManagePrintBatches}
                              onChange={(event) =>
                                toggleBillSelection(bill.id, event.target.checked)
                              }
                            />
                          </td>
                        ) : null}
                        <td className="px-4 py-4">
                          <div className="font-medium text-foreground">{bill.customer.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {bill.customer.accountNumber}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                          {bill.reading.meter.meterNumber}
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">
                          {bill.reading.meter.serviceRoute ? (
                            <div>
                              <div>{bill.reading.meter.serviceRoute.code}</div>
                              <div className="mt-1">
                                {bill.reading.meter.serviceZone?.name ?? "No zone"}
                              </div>
                            </div>
                          ) : (
                            "Not routed"
                          )}
                        </td>
                        <td className="px-4 py-4 font-medium text-foreground">
                          {formatCurrency(bill.totalCharges)}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {bill.lifecycleStatus}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getDistributionStatusClasses(
                              bill.distributionStatus
                            )}`}
                          >
                            {billDistributionStatusLabels[bill.distributionStatus]}
                          </span>
                          {bill.reprintCount > 0 ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Reprints logged: {bill.reprintCount}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={isManualSelection ? 7 : 6}
                          className="px-4 py-10 text-center text-sm text-muted-foreground"
                        >
                          No bills match the current grouping filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <input
                  value={printBatchLabel}
                  disabled={isPending || !capabilities.canManagePrintBatches}
                  onChange={(event) => {
                    setManualPrintBatchLabel(event.target.value);
                    setIsPrintBatchLabelDirty(true);
                  }}
                  className="w-full rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#86a09b]"
                  placeholder="Print-batch label"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={printBatchGrouping}
                    disabled={isPending || !capabilities.canManagePrintBatches}
                    onChange={(event) => {
                      const nextGrouping = event.target.value as BillPrintGrouping;
                      setPrintBatchGrouping(nextGrouping);
                      setIsPrintBatchLabelDirty(false);
                      setIsAssignedToDirty(false);

                      if (nextGrouping === BillPrintGrouping.ROUTE) {
                        setPrintBatchGroupingValue(routeOptions[0]?.value ?? "");
                        return;
                      }

                      if (nextGrouping === BillPrintGrouping.ZONE) {
                        setPrintBatchGroupingValue(zoneOptions[0]?.value ?? "");
                        return;
                      }

                      if (nextGrouping === BillPrintGrouping.ALL) {
                        setPrintBatchGroupingValue("");
                      }
                    }}
                    className="rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none"
                  >
                    {Object.entries(billPrintGroupingLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {printBatchGrouping === BillPrintGrouping.ROUTE ? (
                    <select
                      value={effectiveGroupingValue}
                      disabled={isPending || !capabilities.canManagePrintBatches || routeOptions.length === 0}
                      onChange={(event) => {
                        setPrintBatchGroupingValue(event.target.value);
                        setIsPrintBatchLabelDirty(false);
                        setIsAssignedToDirty(false);
                      }}
                      className="rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none"
                    >
                      {routeOptions.length ? (
                        routeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))
                      ) : (
                        <option value="">No routed bills available</option>
                      )}
                    </select>
                  ) : null}
                  {printBatchGrouping === BillPrintGrouping.ZONE ? (
                    <select
                      value={effectiveGroupingValue}
                      disabled={isPending || !capabilities.canManagePrintBatches || zoneOptions.length === 0}
                      onChange={(event) => {
                        setPrintBatchGroupingValue(event.target.value);
                        setIsPrintBatchLabelDirty(false);
                      }}
                      className="rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none"
                    >
                      {zoneOptions.length ? (
                        zoneOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))
                      ) : (
                        <option value="">No zoned bills available</option>
                      )}
                    </select>
                  ) : null}
                  {printBatchGrouping !== BillPrintGrouping.ROUTE &&
                  printBatchGrouping !== BillPrintGrouping.ZONE ? (
                    <input
                      value={effectiveGroupingValue}
                      disabled={isPending || !capabilities.canManagePrintBatches}
                      onChange={(event) => {
                        setPrintBatchGroupingValue(event.target.value);
                        setIsPrintBatchLabelDirty(false);
                        setIsAssignedToDirty(false);
                      }}
                      className="rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#86a09b]"
                      placeholder={
                        printBatchGrouping === BillPrintGrouping.PUROK
                          ? "Purok text from customer address"
                          : "Zone / route / purok"
                      }
                    />
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <select
                  value={assignedToId}
                  disabled={isPending || !capabilities.canManagePrintBatches}
                  onChange={(event) => {
                    setManualAssignedToId(event.target.value);
                    setIsAssignedToDirty(true);
                  }}
                  className="w-full rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">Unassigned</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role.replaceAll("_", " ")})
                    </option>
                  ))}
                </select>
                {printBatchGrouping === BillPrintGrouping.ROUTE && autoAssignedStaff ? (
                  <p className="text-xs text-muted-foreground">
                    Defaulted from route distributor owner: {autoAssignedStaff.name}
                  </p>
                ) : null}
                {printBatchGrouping === BillPrintGrouping.ROUTE && !autoAssignedStaff ? (
                  <p className="text-xs text-muted-foreground">
                    No active bill distributor is assigned to this route yet.
                  </p>
                ) : null}
                <textarea
                  value={printBatchNotes}
                  disabled={isPending || !capabilities.canManagePrintBatches}
                  onChange={(event) => setPrintBatchNotes(event.target.value)}
                  className="min-h-24 w-full rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#86a09b]"
                  placeholder="Optional print or distribution notes"
                />
              </div>
            </div>

            <Button
              type="button"
              className="mt-4"
                disabled={
                  isPending ||
                  !capabilities.canManagePrintBatches ||
                  effectiveSelectedBillIds.length === 0 ||
                  selectedCycle.status === BillingCycleStatus.OPEN
                }
              onClick={() =>
                runAction(() =>
                  createBillPrintBatch({
                    billingCycleId: selectedCycle.id,
                    billIds: effectiveSelectedBillIds,
                    label: printBatchLabel,
                    grouping: printBatchGrouping,
                    groupingValue: effectiveGroupingValue,
                    assignedToId,
                    notes: printBatchNotes,
                  })
                )
              }
            >
              Create print batch
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.25rem] border border-border/65 bg-white/76 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Cycle History
            </p>
            <div className="mt-4 space-y-3">
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className={`rounded-[1rem] border px-4 py-3 ${
                    cycle.id === selectedCycle.id
                      ? "border-[#b9d7d0] bg-[#eef7f4]"
                      : "border-[#dbe9e5] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#16373b]">{cycle.billingPeriodLabel}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {cycle.billCount} bills, {cycle.printBatchCount} print batches
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCycleStatusClasses(
                        cycle.status
                      )}`}
                    >
                      {billingCycleStatusLabels[cycle.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-border/65 bg-white/76 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Print Batches
            </p>
            <div className="mt-4 space-y-4">
              {selectedCycle.printBatches.length ? (
                selectedCycle.printBatches.map((batch) => (
                  <div key={batch.id} className="rounded-[1rem] border border-border/65 bg-background/90 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-[#16373b]">{batch.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {billPrintGroupingLabels[batch.grouping]}
                          {batch.groupingValue ? `: ${batch.groupingValue}` : ""}
                        </p>
                        {batch.serviceRoute ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {batch.serviceRoute.code} • {batch.serviceRoute.name}
                          </p>
                        ) : null}
                        {!batch.serviceRoute && batch.serviceZone ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Zone • {batch.serviceZone.name}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#294b8f]">
                        {billPrintBatchStatusLabels[batch.status]}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                      <p>Assigned: {batch.assignedTo?.name || "Unassigned"}</p>
                      <p>Bills: {batch.bills.length}</p>
                      <p>Created: {formatDateTime(batch.createdAt)}</p>
                      <p>Printed: {formatDateTime(batch.printedAt)}</p>
                      <p>Distributed: {formatDateTime(batch.distributedAt)}</p>
                      <p>Returned: {formatDateTime(batch.returnedAt)}</p>
                      <p>Failed delivery: {formatDateTime(batch.failedDeliveryAt)}</p>
                    </div>
                    {batch.notes ? (
                      <p className="mt-3 rounded-[0.9rem] bg-[#f7faf9] px-3 py-2 text-sm text-[#45615d]">
                        {batch.notes}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/billing/batches/${batch.id}/print`}
                        className={cn(
                          buttonVariants({
                            size: "sm",
                            className: "rounded-xl px-3",
                          })
                        )}
                      >
                        Open print view
                      </Link>
                    </div>

                    <textarea
                      value={batchNotes[batch.id] || ""}
                      disabled={isPending || !capabilities.canTrackDistribution}
                      onChange={(event) =>
                        setBatchNotes((current) => ({
                          ...current,
                          [batch.id]: event.target.value,
                        }))
                      }
                      className="mt-3 min-h-20 w-full rounded-[1rem] border border-[#cfe0dc] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#86a09b]"
                      placeholder="Optional status note"
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending || !capabilities.canTrackDistribution}
                        onClick={() =>
                          runAction(() =>
                            updateBillPrintBatchStatus({
                              billPrintBatchId: batch.id,
                              status: BillPrintBatchStatus.PRINTED,
                              note: batchNotes[batch.id],
                            })
                          )
                        }
                      >
                        Mark printed
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending || !capabilities.canTrackDistribution}
                        onClick={() =>
                          runAction(() =>
                            updateBillPrintBatchStatus({
                              billPrintBatchId: batch.id,
                              status: BillPrintBatchStatus.DISTRIBUTED,
                              note: batchNotes[batch.id],
                            })
                          )
                        }
                      >
                        Mark distributed
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending || !capabilities.canTrackDistribution}
                        onClick={() =>
                          runAction(() =>
                            updateBillPrintBatchStatus({
                              billPrintBatchId: batch.id,
                              status: BillPrintBatchStatus.RETURNED,
                              note: batchNotes[batch.id],
                            })
                          )
                        }
                      >
                        Mark returned
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending || !capabilities.canTrackDistribution}
                        onClick={() =>
                          runAction(() =>
                            updateBillPrintBatchStatus({
                              billPrintBatchId: batch.id,
                              status: BillPrintBatchStatus.FAILED_DELIVERY,
                              note: batchNotes[batch.id],
                            })
                          )
                        }
                      >
                        Mark failed delivery
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No print batches recorded for this cycle yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-border/65 bg-white/76 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Audit Trail
            </p>
            <div className="mt-4 space-y-3">
              {selectedCycle.events.length ? (
                selectedCycle.events.map((event) => (
                  <div key={event.id} className="rounded-[1rem] border border-border/65 bg-background/90 px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-[#16373b]">
                        {event.type.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.occurredAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.actor.name} ({event.actor.role.replaceAll("_", " ")})
                    </p>
                    {event.note ? (
                      <p className="mt-2 text-sm leading-6 text-[#45615d]">{event.note}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No billing governance events have been recorded for this cycle yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-[1.1rem] border border-border/65 bg-secondary/24 px-4 py-4 text-sm text-muted-foreground sm:grid-cols-3">
        <div>
          <span className="font-medium text-[#17373b]">Closed at:</span>{" "}
          {formatDateTime(selectedCycle.closedAt)}
        </div>
        <div>
          <span className="font-medium text-[#17373b]">Reopened at:</span>{" "}
          {formatDateTime(selectedCycle.reopenedAt)}
        </div>
        <div>
          <span className="font-medium text-[#17373b]">Finalized at:</span>{" "}
          {formatDateTime(selectedCycle.finalizedAt)}
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-[1rem] border border-[#f1c9c2] bg-[#fff4f2] px-4 py-3 text-sm text-[#922c1f]">
          {errorMessage}
        </p>
      ) : null}
    </AdminSurfacePanel>
  );
}
