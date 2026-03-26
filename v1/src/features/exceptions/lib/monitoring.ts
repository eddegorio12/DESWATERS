import {
  CustomerStatus,
  PaymentMethod,
  ReadingStatus,
  ReceivableFollowUpStatus,
} from "@prisma/client";

import { getDaysPastDue, getOutstandingBalance } from "@/features/follow-up/lib/workflow";

export type ExceptionSeverity = "critical" | "high" | "medium";

export type ExceptionCategory =
  | "missing_reading"
  | "possible_leak"
  | "abnormal_consumption"
  | "duplicate_payment"
  | "nearing_disconnection"
  | "service_status_mismatch";

export type ExceptionAlert = {
  id: string;
  severity: ExceptionSeverity;
  category: ExceptionCategory;
  title: string;
  summary: string;
  accountNumber?: string;
  customerName?: string;
  meterNumber?: string;
  href: string;
  metric: string;
};

export type ExceptionRuleCard = {
  id: ExceptionCategory;
  label: string;
  threshold: string;
  rationale: string;
};

type MeterExceptionInput = {
  id: string;
  meterNumber: string;
  installDate: Date;
  customer: {
    accountNumber: string;
    name: string;
    status: CustomerStatus;
  } | null;
  readings: {
    id: string;
    readingDate: Date;
    consumption: number;
    status: ReadingStatus;
  }[];
};

type DisconnectionRiskBillInput = {
  id: string;
  billingPeriod: string;
  dueDate: Date;
  totalCharges: number;
  followUpStatus: ReceivableFollowUpStatus;
  customer: {
    accountNumber: string;
    name: string;
  };
  reading: {
    meter: {
      meterNumber: string;
    };
  };
  payments: {
    amount: number;
  }[];
};

type PaymentExceptionInput = {
  id: string;
  amount: number;
  paymentDate: Date;
  method: PaymentMethod;
  referenceId: string | null;
  billId: string;
  bill: {
    billingPeriod: string;
    customer: {
      id: string;
      accountNumber: string;
      name: string;
      status: CustomerStatus;
    };
  };
};

type StatusMismatchReadingInput = {
  id: string;
  readingDate: Date;
  consumption: number;
  status: ReadingStatus;
  meter: {
    meterNumber: string;
    customer: {
      accountNumber: string;
      name: string;
      status: CustomerStatus;
    } | null;
  };
};

const DAY_IN_MS = 86_400_000;
const MISSING_READING_MEDIUM_DAYS = 45;
const MISSING_READING_HIGH_DAYS = 60;
const RECENT_ACTIVITY_DAYS = 45;

export const exceptionRuleCatalog: ExceptionRuleCard[] = [
  {
    id: "missing_reading",
    label: "Missing readings",
    threshold: "45 days without a meter reading raises medium severity; 60+ days raises high severity.",
    rationale: "Active service points should not miss a reading cycle because that delays billing and hides field issues.",
  },
  {
    id: "possible_leak",
    label: "Possible leaks",
    threshold: "Latest consumption at least 3x prior average and at least 25 cu.m triggers critical severity.",
    rationale: "Large sustained spikes usually need field validation before the next billing dispute or service failure.",
  },
  {
    id: "abnormal_consumption",
    label: "Abnormal consumption",
    threshold: "Large rises above 2x prior average or drops below 35% of prior average create review alerts.",
    rationale: "Unexpected shifts can indicate faulty readings, unauthorized use, or meter defects.",
  },
  {
    id: "duplicate_payment",
    label: "Duplicate payments",
    threshold: "Repeated completed payments with matching bill, amount, method, and same-day reference pattern are flagged.",
    rationale: "Cashiering should surface possible reposting before settlements and receipts are treated as final.",
  },
  {
    id: "nearing_disconnection",
    label: "Nearing disconnection",
    threshold: "Overdue balances already at final notice or disconnection review stay visible as high or critical alerts.",
    rationale: "Receivables enforcement should appear in the exceptions view before service action is missed.",
  },
  {
    id: "service_status_mismatch",
    label: "Service-status mismatches",
    threshold: "Disconnected or inactive accounts with fresh readings or payments are flagged for office review.",
    rationale: "Field and office records must agree before billing, reinstatement, or meter servicing continues.",
  },
];

function getDaysSince(date: Date, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_IN_MS));
}

function getCalendarDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function formatReadingStatus(status: ReadingStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

function formatFollowUpStatus(status: ReceivableFollowUpStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

export function buildOperationalExceptionAlerts(input: {
  meters: MeterExceptionInput[];
  disconnectionRiskBills: DisconnectionRiskBillInput[];
  recentPayments: PaymentExceptionInput[];
  statusMismatchReadings: StatusMismatchReadingInput[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const alerts: ExceptionAlert[] = [];

  for (const meter of input.meters) {
    const latestReading = meter.readings[0];
    const lastRelevantDate = latestReading?.readingDate ?? meter.installDate;
    const daysSinceLastReading = getDaysSince(lastRelevantDate, now);

    if (daysSinceLastReading >= MISSING_READING_MEDIUM_DAYS) {
      const hasAnyReading = Boolean(latestReading);
      alerts.push({
        id: `missing-reading-${meter.id}`,
        severity:
          daysSinceLastReading >= MISSING_READING_HIGH_DAYS ? "high" : "medium",
        category: "missing_reading",
        title: hasAnyReading ? "Reading gap on active meter" : "Active meter has no reading history",
        summary: hasAnyReading
          ? `Meter ${meter.meterNumber} has gone ${daysSinceLastReading} days since the last captured reading.`
          : `Meter ${meter.meterNumber} has been active for ${daysSinceLastReading} days without any recorded reading.`,
        accountNumber: meter.customer?.accountNumber,
        customerName: meter.customer?.name,
        meterNumber: meter.meterNumber,
        href: "/admin/readings",
        metric: `${daysSinceLastReading} day gap`,
      });
    }

    if (!latestReading || meter.readings.length < 3) {
      continue;
    }

    const baselineReadings = meter.readings.slice(1);
    const baselineAverage =
      baselineReadings.reduce((sum, reading) => sum + reading.consumption, 0) /
      baselineReadings.length;
    const latestConsumption = latestReading.consumption;

    if (
      latestConsumption >= 25 &&
      latestConsumption >= baselineAverage * 3 &&
      latestConsumption >= baselineAverage + 25
    ) {
      alerts.push({
        id: `possible-leak-${latestReading.id}`,
        severity: "critical",
        category: "possible_leak",
        title: "Possible leak or runaway usage",
        summary: `Meter ${meter.meterNumber} jumped from an average ${round(
          baselineAverage
        )} cu.m to ${round(latestConsumption)} cu.m on the latest ${formatReadingStatus(
          latestReading.status
        )} reading.`,
        accountNumber: meter.customer?.accountNumber,
        customerName: meter.customer?.name,
        meterNumber: meter.meterNumber,
        href: "/admin/readings",
        metric: `${round(latestConsumption)} cu.m`,
      });
      continue;
    }

    if (latestConsumption >= Math.max(baselineAverage * 2, baselineAverage + 15)) {
      alerts.push({
        id: `high-usage-${latestReading.id}`,
        severity: "high",
        category: "abnormal_consumption",
        title: "Abnormally high consumption",
        summary: `Meter ${meter.meterNumber} is materially above its recent average of ${round(
          baselineAverage
        )} cu.m.`,
        accountNumber: meter.customer?.accountNumber,
        customerName: meter.customer?.name,
        meterNumber: meter.meterNumber,
        href: "/admin/readings",
        metric: `${round(latestConsumption)} cu.m`,
      });
      continue;
    }

    if (baselineAverage >= 8 && latestConsumption <= baselineAverage * 0.35) {
      alerts.push({
        id: `low-usage-${latestReading.id}`,
        severity: "medium",
        category: "abnormal_consumption",
        title: "Abnormally low consumption",
        summary: `Meter ${meter.meterNumber} dropped well below its recent average of ${round(
          baselineAverage
        )} cu.m and may need validation.`,
        accountNumber: meter.customer?.accountNumber,
        customerName: meter.customer?.name,
        meterNumber: meter.meterNumber,
        href: "/admin/readings",
        metric: `${round(latestConsumption)} cu.m`,
      });
    }
  }

  for (const bill of input.disconnectionRiskBills) {
    const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

    if (outstandingBalance <= 0) {
      continue;
    }

    const daysPastDue = getDaysPastDue(bill.dueDate, now);

    alerts.push({
      id: `disconnection-risk-${bill.id}`,
      severity:
        bill.followUpStatus === ReceivableFollowUpStatus.DISCONNECTION_REVIEW
          ? "critical"
          : "high",
      category: "nearing_disconnection",
      title:
        bill.followUpStatus === ReceivableFollowUpStatus.DISCONNECTION_REVIEW
          ? "Account queued for disconnection review"
          : "Final-notice account nearing service action",
      summary: `${bill.customer.name} is ${daysPastDue} days past due with ${formatFollowUpStatus(
        bill.followUpStatus
      )} already recorded on ${bill.billingPeriod}.`,
      accountNumber: bill.customer.accountNumber,
      customerName: bill.customer.name,
      meterNumber: bill.reading.meter.meterNumber,
      href: "/admin/follow-up",
      metric: `PHP ${outstandingBalance.toFixed(2)}`,
    });
  }

  const duplicateBuckets = new Map<string, PaymentExceptionInput[]>();

  for (const payment of input.recentPayments) {
    const key = [
      payment.billId,
      payment.amount.toFixed(2),
      payment.method,
      getCalendarDayKey(payment.paymentDate),
      payment.referenceId?.trim().toLowerCase() || "no-ref",
    ].join("|");

    const bucket = duplicateBuckets.get(key) ?? [];
    bucket.push(payment);
    duplicateBuckets.set(key, bucket);
  }

  for (const bucket of duplicateBuckets.values()) {
    if (bucket.length < 2) {
      continue;
    }

    const first = bucket[0];
    const exactReferenceMatch = Boolean(first.referenceId);

    alerts.push({
      id: `duplicate-payment-${first.id}`,
      severity: exactReferenceMatch ? "high" : "medium",
      category: "duplicate_payment",
      title: "Possible duplicate payment posting",
      summary: `${bucket.length} completed payments match the same bill, amount, method, and day pattern for ${first.bill.customer.name}.`,
      accountNumber: first.bill.customer.accountNumber,
      customerName: first.bill.customer.name,
      href: "/admin/payments",
      metric: `PHP ${first.amount.toFixed(2)} x ${bucket.length}`,
    });
  }

  const disconnectedPaymentBuckets = new Map<string, PaymentExceptionInput[]>();

  for (const payment of input.recentPayments) {
    if (payment.bill.customer.status !== CustomerStatus.DISCONNECTED) {
      continue;
    }

    const bucket = disconnectedPaymentBuckets.get(payment.bill.customer.id) ?? [];
    bucket.push(payment);
    disconnectedPaymentBuckets.set(payment.bill.customer.id, bucket);
  }

  for (const bucket of disconnectedPaymentBuckets.values()) {
    const first = bucket[0];

    alerts.push({
      id: `disconnected-payment-${first.bill.customer.id}`,
      severity: "high",
      category: "service_status_mismatch",
      title: "Disconnected account received a recent payment",
      summary: `${first.bill.customer.name} is still marked disconnected even though ${bucket.length} completed payment${bucket.length === 1 ? "" : "s"} were posted in the recent activity window.`,
      accountNumber: first.bill.customer.accountNumber,
      customerName: first.bill.customer.name,
      href: "/admin/follow-up",
      metric: `${bucket.length} recent payment${bucket.length === 1 ? "" : "s"}`,
    });
  }

  const latestMismatchByMeter = new Map<string, StatusMismatchReadingInput>();

  for (const reading of input.statusMismatchReadings) {
    if (!reading.meter.customer || latestMismatchByMeter.has(reading.meter.meterNumber)) {
      continue;
    }

    latestMismatchByMeter.set(reading.meter.meterNumber, reading);
  }

  for (const reading of latestMismatchByMeter.values()) {
    const customer = reading.meter.customer;

    if (!customer) {
      continue;
    }

    alerts.push({
      id: `status-mismatch-${reading.id}`,
      severity: customer.status === CustomerStatus.DISCONNECTED ? "critical" : "medium",
      category: "service_status_mismatch",
      title:
        customer.status === CustomerStatus.DISCONNECTED
          ? "Disconnected account has a new reading"
          : "Inactive account has a new reading",
      summary: `${customer.name} is marked ${customer.status.toLowerCase()} but meter ${
        reading.meter.meterNumber
      } still received a ${formatReadingStatus(reading.status)} reading within the last ${RECENT_ACTIVITY_DAYS} days.`,
      accountNumber: customer.accountNumber,
      customerName: customer.name,
      meterNumber: reading.meter.meterNumber,
      href: "/admin/meters",
      metric: `${round(reading.consumption)} cu.m`,
    });
  }

  const severityWeight: Record<ExceptionSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
  };

  return alerts.sort((left, right) => {
    const severityDifference = severityWeight[left.severity] - severityWeight[right.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return left.title.localeCompare(right.title);
  });
}
