import {
  BillDistributionStatus,
  BillPrintGrouping,
  BillPrintBatchStatus,
  BillingCycleStatus,
} from "@prisma/client";

type BillingChecklistSnapshot = {
  checklistReviewCompleted: boolean;
  checklistReceivablesVerified: boolean;
  checklistPrintReady: boolean;
  checklistDistributionReady: boolean;
  checklistMonthEndLocked: boolean;
};

export const billingCycleStatusLabels: Record<BillingCycleStatus, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  FINALIZED: "Finalized",
};

export const billDistributionStatusLabels: Record<BillDistributionStatus, string> = {
  PENDING_PRINT: "Pending print",
  PRINTED: "Printed",
  DISTRIBUTED: "Distributed",
  RETURNED: "Returned",
  FAILED_DELIVERY: "Failed delivery",
};

export const billPrintBatchStatusLabels: Record<BillPrintBatchStatus, string> = {
  DRAFT: "Draft",
  PRINTED: "Printed",
  DISTRIBUTED: "Distributed",
  RETURNED: "Returned",
  FAILED_DELIVERY: "Failed delivery",
};

export const billPrintGroupingLabels: Record<BillPrintGrouping, string> = {
  ALL: "All bills",
  ZONE: "Zone",
  ROUTE: "Route",
  PUROK: "Purok",
  MANUAL: "Manual selection",
};

export function getBillingCyclePeriodKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export function getBillingChecklistItems(cycle: BillingChecklistSnapshot) {
  return [
    {
      key: "checklistReviewCompleted",
      label: "Approved readings reviewed",
      completed: cycle.checklistReviewCompleted,
    },
    {
      key: "checklistReceivablesVerified",
      label: "Receivables verified before lock",
      completed: cycle.checklistReceivablesVerified,
    },
    {
      key: "checklistPrintReady",
      label: "Print batch prepared",
      completed: cycle.checklistPrintReady,
    },
    {
      key: "checklistDistributionReady",
      label: "Distribution assignment confirmed",
      completed: cycle.checklistDistributionReady,
    },
    {
      key: "checklistMonthEndLocked",
      label: "Month-end closeout reviewed",
      completed: cycle.checklistMonthEndLocked,
    },
  ] as const;
}

export function isBillingChecklistComplete(cycle: BillingChecklistSnapshot) {
  return getBillingChecklistItems(cycle).every((item) => item.completed);
}

export function mapBatchStatusToBillDistributionStatus(status: BillPrintBatchStatus) {
  switch (status) {
    case BillPrintBatchStatus.PRINTED:
      return BillDistributionStatus.PRINTED;
    case BillPrintBatchStatus.DISTRIBUTED:
      return BillDistributionStatus.DISTRIBUTED;
    case BillPrintBatchStatus.RETURNED:
      return BillDistributionStatus.RETURNED;
    case BillPrintBatchStatus.FAILED_DELIVERY:
      return BillDistributionStatus.FAILED_DELIVERY;
    default:
      return BillDistributionStatus.PENDING_PRINT;
  }
}
