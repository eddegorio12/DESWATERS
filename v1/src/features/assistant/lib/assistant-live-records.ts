import {
  ComplaintStatus,
  PaymentStatus,
  type Role,
} from "@prisma/client";

import { canAccessAdminModule } from "@/features/auth/lib/authorization";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import {
  billDistributionStatusLabels,
  billingCycleStatusLabels,
} from "@/features/billing/lib/billing-governance";
import {
  buildOperationalExceptionAlerts,
  type ExceptionAlert,
} from "@/features/exceptions/lib/monitoring";
import {
  getDaysPastDue,
  getOperationalBillStatus,
  getOutstandingBalance,
} from "@/features/follow-up/lib/workflow";
import {
  clamp,
  getRecentMonthKeys,
  roundMetric,
} from "@/features/routes/lib/route-analytics";
import { prisma } from "@/lib/prisma";

export type AssistantCitationHit = {
  id: string;
  title: string;
  summary: string;
  sectionTitle: string | null;
  sourcePath: string;
  sourceType: "memory-bank" | "workflow-guide" | "live-record";
  href: string | null;
  matchingTerms: string[];
  score: number;
};

export type AssistantLiveRecordExplanation = {
  answer: string;
  basis: string;
  uncertainty: string | null;
  citations: AssistantCitationHit[];
  relatedModules: { href: string; label: string }[];
  disposition: "allowed" | "narrowed";
  fallbackPath: string[];
  lowConfidence?: boolean;
  failureState?:
    | "no-hits"
    | "low-confidence"
    | "governance-gated"
    | "policy-refused"
    | "policy-escalation"
    | "internal-error";
};

const uuidPattern =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: Date) {
  return value.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function uniqueModules(modules: Array<{ href: string; label: string }>) {
  const seen = new Set<string>();

  return modules.filter((module) => {
    if (seen.has(module.href)) {
      return false;
    }

    seen.add(module.href);
    return true;
  });
}

function createCitation(input: {
  id: string;
  title: string;
  summary: string;
  sourcePath: string;
  href: string | null;
}) {
  return {
    id: input.id,
    title: input.title,
    summary: input.summary,
    sectionTitle: null,
    sourcePath: input.sourcePath,
    sourceType: "live-record" as const,
    href: input.href,
    matchingTerms: [],
    score: 100,
  } satisfies AssistantCitationHit;
}

function canAccessAnyModule(
  role: Role,
  modules: Array<"billing" | "payments" | "collections" | "followUp" | "billPrint" | "routeOperations" | "exceptions">
) {
  return modules.some((module) => canAccessAdminModule(role, module));
}

function unauthorizedExplanation(input: {
  modules: Array<"billing" | "payments" | "collections" | "followUp" | "billPrint" | "routeOperations" | "exceptions">;
  label: string;
}) {
  return {
    answer: `Your current role does not include ${input.label.toLowerCase()} access, so I cannot explain that live record here.`,
    basis:
      "EH15.5 keeps live-record explainers inside the same server-side module boundaries already enforced in DWDS.",
    uncertainty:
      "Ask an authorized staff member to review the record directly in the protected module.",
    citations: [],
    relatedModules: [],
    disposition: "narrowed" as const,
    fallbackPath: [`live-record:forbidden:${input.modules.join(",")}`],
    failureState: "policy-escalation" as const,
  };
}

function missingRecordExplanation(input: {
  summary: string;
  relatedModules: { href: string; label: string }[];
  fallbackPath: string[];
}) {
  return {
    answer: input.summary,
    basis:
      "EH15.5 explainers only work when one visible DWDS record can be matched from the identifier in the question.",
    uncertainty:
      "Use the exact bill ID, receipt number, route code, meter number, or account number shown in DWDS.",
    citations: [],
    relatedModules: input.relatedModules,
    disposition: "narrowed" as const,
    fallbackPath: input.fallbackPath,
    lowConfidence: true,
    failureState: "low-confidence" as const,
  };
}

function extractBillId(query: string) {
  const explicitMatch = query.match(
    /\bbill(?:\s+(?:id|number))?\s*[:#-]?\s*([0-9a-f-]{8,})\b/i
  );

  if (explicitMatch) {
    return explicitMatch[1];
  }

  if (/\b(bill|billing|follow[- ]?up|receivable|overdue|disconnection)\b/i.test(query)) {
    return query.match(uuidPattern)?.[0] ?? null;
  }

  return null;
}

function extractReceiptNumber(query: string) {
  return (
    query.match(/\breceipt(?:\s+(?:no\.?|number|id))?\s*[:#-]?\s*([A-Z0-9-]{4,})\b/i)?.[1] ??
    null
  );
}

function extractRouteCode(query: string) {
  const explicitCode = query.match(/\broute\s+code\s*[:#-]?\s*([A-Z0-9-]{2,})\b/i)?.[1];

  if (explicitCode) {
    return explicitCode;
  }

  return query.match(/\broute\s*[:#-]?\s*((?=[A-Z0-9-]*[\d-])[A-Z0-9-]{2,})\b/i)?.[1] ?? null;
}

function extractMeterNumber(query: string) {
  return (
    query.match(/\bmeter(?:\s+(?:no\.?|number|id))?\s*[:#-]?\s*([A-Z0-9-]{3,})\b/i)?.[1] ??
    null
  );
}

function extractAccountNumber(query: string) {
  return (
    query.match(/\baccount(?:\s+(?:no\.?|number))?\s*[:#-]?\s*([A-Z0-9-]{3,})\b/i)?.[1] ?? null
  );
}

function buildBillRelatedModules(status: string, followUpStatus: string) {
  const modules = [{ href: "/admin/billing", label: "Billing controls" }];

  if (status !== "PAID") {
    modules.push({ href: "/admin/payments", label: "Payments" });
  }

  if (
    ["OVERDUE", "PARTIALLY_PAID", "UNPAID"].includes(status) ||
    followUpStatus !== "CURRENT"
  ) {
    modules.push({ href: "/admin/follow-up", label: "Follow-up" });
  }

  return uniqueModules(modules);
}

function getFollowUpNextStep(status: string, outstandingBalance: number) {
  if (outstandingBalance <= 0 || status === "RESOLVED") {
    return "No further receivables action is due unless a billing correction is needed.";
  }

  switch (status) {
    case "CURRENT":
      return "If the bill is already overdue, the next receivables step is to record a reminder from Follow-up.";
    case "REMINDER_SENT":
      return "The next receivables step is to record a final notice if the balance remains open.";
    case "FINAL_NOTICE_SENT":
      return "The next receivables step is to move the bill into disconnection review if the balance still stays unpaid.";
    case "DISCONNECTION_REVIEW":
      return "This bill is waiting for admin or billing review before any service action is recorded.";
    case "DISCONNECTED":
      return "The balance must be cleared before the account can move into reinstatement review.";
    default:
      return "Review the Follow-up queue for the next allowed receivables action.";
  }
}

async function explainBillRecord(query: string, role: Role) {
  if (!canAccessAnyModule(role, ["billing", "payments", "collections", "followUp", "billPrint"])) {
    return unauthorizedExplanation({
      modules: ["billing", "payments", "collections", "followUp", "billPrint"],
      label: "billing, cashier, or follow-up",
    });
  }

  const billId = extractBillId(query);

  if (!billId) {
    return null;
  }

  const bill = await prisma.bill.findUnique({
    where: {
      id: billId,
    },
    select: {
      id: true,
      billingPeriod: true,
      dueDate: true,
      totalCharges: true,
      status: true,
      lifecycleStatus: true,
      distributionStatus: true,
      followUpStatus: true,
      billingCycle: {
        select: {
          status: true,
        },
      },
      customer: {
        select: {
          accountNumber: true,
          name: true,
        },
      },
      reading: {
        select: {
          meter: {
            select: {
              meterNumber: true,
            },
          },
        },
      },
      payments: {
        where: {
          status: PaymentStatus.COMPLETED,
        },
        select: {
          amount: true,
        },
      },
    },
  });

  if (!bill) {
    return missingRecordExplanation({
      summary: "I could not find a bill with that ID in DWDS.",
      relatedModules: [{ href: "/admin/billing", label: "Billing controls" }],
      fallbackPath: ["live-record:bill", "bill:not-found"],
    });
  }

  const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);
  const operationalStatus = getOperationalBillStatus({
    dueDate: bill.dueDate,
    totalCharges: bill.totalCharges,
    payments: bill.payments,
  });
  const daysPastDue = getDaysPastDue(bill.dueDate);
  const paidAmount = roundMetric(
    bill.payments.reduce((sum, payment) => sum + payment.amount, 0)
  );

  const statusReason =
    operationalStatus === "PAID"
      ? "the full billed amount is already covered by completed payments"
      : operationalStatus === "OVERDUE"
        ? `the due date passed on ${formatDate(bill.dueDate)} and ${formatCurrency(outstandingBalance)} is still open`
        : operationalStatus === "PARTIALLY_PAID"
          ? `${formatCurrency(paidAmount)} has already been posted, but ${formatCurrency(outstandingBalance)} still remains open before the due date`
          : `no completed settlement is posted yet and the due date is still ${formatDate(bill.dueDate)}`;

  const cycleSummary = bill.billingCycle?.status
    ? `${billingCycleStatusLabels[bill.billingCycle.status]} cycle`
    : `${formatLabel(bill.lifecycleStatus)} bill state`;

  return {
    answer: `Bill ${bill.id} for ${bill.customer.name} (${bill.customer.accountNumber}) is ${formatLabel(operationalStatus)} because ${statusReason}. It sits in a ${cycleSummary.toLowerCase()} with ${billDistributionStatusLabels[bill.distributionStatus].toLowerCase()} distribution status, and the current follow-up stage is ${formatLabel(bill.followUpStatus).toLowerCase()}.`,
    basis: `Total charges are ${formatCurrency(bill.totalCharges)} on meter ${bill.reading.meter.meterNumber}. Completed payments cover ${formatCurrency(paidAmount)}, leaving ${formatCurrency(outstandingBalance)} outstanding${operationalStatus === "OVERDUE" ? ` and ${daysPastDue} day${daysPastDue === 1 ? "" : "s"} past due` : ""}.`,
    uncertainty: null,
    citations: [
      createCitation({
        id: `bill-${bill.id}`,
        title: `Live bill ${bill.id}`,
        summary: `Billing period ${bill.billingPeriod}; account ${bill.customer.accountNumber}; status ${formatLabel(operationalStatus)}; follow-up ${formatLabel(bill.followUpStatus)}; outstanding ${formatCurrency(outstandingBalance)}.`,
        sourcePath: `live-record/bill/${bill.id}`,
        href: "/admin/billing",
      }),
    ],
    relatedModules: buildBillRelatedModules(operationalStatus, bill.followUpStatus),
    disposition: "allowed" as const,
    fallbackPath: ["live-record:bill"],
  };
}

async function explainPaymentRecord(query: string, role: Role) {
  if (!canAccessAnyModule(role, ["payments", "collections"])) {
    return unauthorizedExplanation({
      modules: ["payments", "collections"],
      label: "payments or collections",
    });
  }

  const receiptNumber = extractReceiptNumber(query);

  if (!receiptNumber) {
    return null;
  }

  const payment = await prisma.payment.findUnique({
    where: {
      receiptNumber,
    },
    select: {
      id: true,
      receiptNumber: true,
      amount: true,
      paymentDate: true,
      method: true,
      referenceId: true,
      balanceBefore: true,
      balanceAfter: true,
      status: true,
      bill: {
        select: {
          id: true,
          billingPeriod: true,
          status: true,
          customer: {
            select: {
              accountNumber: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    return missingRecordExplanation({
      summary: "I could not find a payment with that receipt number in DWDS.",
      relatedModules: [{ href: "/admin/payments", label: "Payments" }],
      fallbackPath: ["live-record:payment", "payment:not-found"],
    });
  }

  const fullySettled = payment.balanceAfter <= 0.000001;
  const methodLabel = formatLabel(payment.method);

  return {
    answer: `Receipt ${payment.receiptNumber} shows a ${formatLabel(payment.status).toLowerCase()} ${methodLabel.toLowerCase()} settlement of ${formatCurrency(payment.amount)} for ${payment.bill.customer.name} (${payment.bill.customer.accountNumber}). The bill balance moved from ${formatCurrency(payment.balanceBefore)} to ${formatCurrency(payment.balanceAfter)}, so the linked bill now reads ${formatLabel(payment.bill.status).toLowerCase()}.`,
    basis: fullySettled
      ? `This receipt fully settled the remaining balance on bill ${payment.bill.id} for ${payment.bill.billingPeriod}.`
      : `This receipt only settled part of bill ${payment.bill.id} for ${payment.bill.billingPeriod}, so an open balance still remains after posting.`,
    uncertainty: null,
    citations: [
      createCitation({
        id: `payment-${payment.id}`,
        title: `Live receipt ${payment.receiptNumber}`,
        summary: `Payment ${formatCurrency(payment.amount)} on ${formatDateTime(payment.paymentDate)}; balance before ${formatCurrency(payment.balanceBefore)}; balance after ${formatCurrency(payment.balanceAfter)}; linked bill ${payment.bill.id}.`,
        sourcePath: `live-record/payment/${payment.receiptNumber}`,
        href: "/admin/payments",
      }),
    ],
    relatedModules: uniqueModules(
      [
        { href: "/admin/payments", label: "Payments" },
        payment.balanceAfter > 0.000001
          ? { href: "/admin/follow-up", label: "Follow-up" }
          : null,
      ].filter(Boolean) as { href: string; label: string }[]
    ),
    disposition: "allowed" as const,
    fallbackPath: ["live-record:payment"],
  };
}

async function explainFollowUpRecord(query: string, role: Role) {
  if (!canAccessAnyModule(role, ["followUp", "billing"])) {
    return unauthorizedExplanation({
      modules: ["followUp", "billing"],
      label: "follow-up or billing",
    });
  }

  const billId = extractBillId(query);

  if (!billId) {
    return null;
  }

  const bill = await prisma.bill.findUnique({
    where: {
      id: billId,
    },
    select: {
      id: true,
      billingPeriod: true,
      dueDate: true,
      totalCharges: true,
      status: true,
      followUpStatus: true,
      followUpNote: true,
      customer: {
        select: {
          accountNumber: true,
          name: true,
          status: true,
        },
      },
      payments: {
        where: {
          status: PaymentStatus.COMPLETED,
        },
        select: {
          amount: true,
        },
      },
    },
  });

  if (!bill) {
    return missingRecordExplanation({
      summary: "I could not find a bill with that ID for follow-up review.",
      relatedModules: [{ href: "/admin/follow-up", label: "Follow-up" }],
      fallbackPath: ["live-record:follow-up", "bill:not-found"],
    });
  }

  const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);
  const operationalStatus = getOperationalBillStatus({
    dueDate: bill.dueDate,
    totalCharges: bill.totalCharges,
    payments: bill.payments,
  });
  const daysPastDue = getDaysPastDue(bill.dueDate);
  const nextStep = getFollowUpNextStep(bill.followUpStatus, outstandingBalance);

  return {
    answer: `Bill ${bill.id} is at the ${formatLabel(bill.followUpStatus).toLowerCase()} follow-up stage because ${formatCurrency(outstandingBalance)} remains open${operationalStatus === "OVERDUE" ? ` and the bill is ${daysPastDue} day${daysPastDue === 1 ? "" : "s"} overdue` : ""}. ${nextStep}`,
    basis: bill.followUpNote
      ? `The latest follow-up note says: ${bill.followUpNote}`
      : `The linked account ${bill.customer.accountNumber} remains ${formatLabel(bill.customer.status).toLowerCase()}, and the bill itself currently reads ${formatLabel(operationalStatus).toLowerCase()}.`,
    uncertainty: null,
    citations: [
      createCitation({
        id: `follow-up-${bill.id}`,
        title: `Live follow-up for bill ${bill.id}`,
        summary: `Bill ${bill.id}; follow-up ${formatLabel(bill.followUpStatus)}; outstanding ${formatCurrency(outstandingBalance)}; due ${formatDate(bill.dueDate)}.`,
        sourcePath: `live-record/follow-up/${bill.id}`,
        href: "/admin/follow-up",
      }),
    ],
    relatedModules: uniqueModules(
      [
        { href: "/admin/follow-up", label: "Follow-up" },
        outstandingBalance > 0.000001
          ? { href: "/admin/payments", label: "Payments" }
          : null,
      ].filter(Boolean) as { href: string; label: string }[]
    ),
    disposition: "allowed" as const,
    fallbackPath: ["live-record:follow-up"],
  };
}

async function explainRoutePressureRecord(query: string, role: Role) {
  if (!canAccessAdminModule(role, "routeOperations")) {
    return unauthorizedExplanation({
      modules: ["routeOperations"],
      label: "route operations",
    });
  }

  const routeCode = extractRouteCode(query);

  if (!routeCode || !/\b(route|pressure|complaint|gap|overdue)\b/i.test(query)) {
    return null;
  }

  const route = await prisma.serviceRoute.findFirst({
    where: {
      code: {
        equals: routeCode,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      zone: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!route) {
    return missingRecordExplanation({
      summary: "I could not find a service route with that route code in DWDS.",
      relatedModules: [{ href: "/admin/routes", label: "Routes" }],
      fallbackPath: ["live-record:route", "route:not-found"],
    });
  }

  const bills = await prisma.bill.findMany({
    where: {
      reading: {
        meter: {
          serviceRouteId: route.id,
        },
      },
    },
    select: {
      id: true,
      dueDate: true,
      totalCharges: true,
      billingCycle: {
        select: {
          periodKey: true,
        },
      },
      payments: {
        where: {
          status: PaymentStatus.COMPLETED,
        },
        select: {
          amount: true,
        },
      },
    },
  });

  const complaints = await prisma.complaint.findMany({
    where: {
      serviceRouteId: route.id,
    },
    orderBy: {
      reportedAt: "desc",
    },
    select: {
      id: true,
      status: true,
      category: true,
      reportedAt: true,
    },
  });

  const recentLossWindow = new Set(getRecentMonthKeys(3));
  const recentBills = bills.filter((bill) => {
    const billPeriodKey =
      bill.billingCycle?.periodKey ??
      `${bill.dueDate.getFullYear()}-${`${bill.dueDate.getMonth() + 1}`.padStart(2, "0")}`;

    return recentLossWindow.has(billPeriodKey);
  });

  const recentBilledAmount = roundMetric(
    recentBills.reduce((sum, bill) => sum + bill.totalCharges, 0)
  );
  const recentCollectedAmount = roundMetric(
    recentBills.reduce(
      (sum, bill) =>
        sum + bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
      0
    )
  );
  const recentGapAmount = roundMetric(Math.max(0, recentBilledAmount - recentCollectedAmount));
  const openOutstandingBalance = roundMetric(
    bills.reduce(
      (sum, bill) => sum + getOutstandingBalance(bill.totalCharges, bill.payments),
      0
    )
  );
  const overdueBills = bills.filter((bill) => {
    const outstanding = getOutstandingBalance(bill.totalCharges, bill.payments);
    return outstanding > 0 && getDaysPastDue(bill.dueDate) > 0;
  });
  const openComplaints = complaints.filter((complaint) => complaint.status === ComplaintStatus.OPEN);
  const routeRiskScore = roundMetric(
    clamp(
      (recentBilledAmount > 0 ? recentGapAmount / recentBilledAmount : 0) * 55 +
        Math.min(overdueBills.length, 8) * 4.5,
      0,
      100
    )
  );
  const complaintRiskScore = roundMetric(
    clamp(openComplaints.length * 20 + complaints.length * 5, 0, 100)
  );

  return {
    answer: `Route ${route.code} (${route.name}) is carrying a ${routeRiskScore >= 60 ? "high" : routeRiskScore >= 30 ? "moderate" : "lower"} revenue-pressure signal because the last three billing months billed ${formatCurrency(recentBilledAmount)} and collected ${formatCurrency(recentCollectedAmount)}, leaving a ${formatCurrency(recentGapAmount)} gap. It also has ${overdueBills.length} overdue bill${overdueBills.length === 1 ? "" : "s"} with ${formatCurrency(openOutstandingBalance)} still open and ${openComplaints.length} open complaint${openComplaints.length === 1 ? "" : "s"}.`,
    basis: `DWDS route pressure uses the same gap-plus-overdue formula as the route watchlist, while complaint pressure currently scores ${complaintRiskScore.toFixed(0)} from ${complaints.length} total complaint record${complaints.length === 1 ? "" : "s"} on this route.`,
    uncertainty:
      recentBilledAmount <= 0 && complaints.length <= 0
        ? "This route does not have enough recent billing or complaint activity to show strong pressure yet."
        : null,
    citations: [
      createCitation({
        id: `route-${route.id}`,
        title: `Live route ${route.code}`,
        summary: `Three-month billed ${formatCurrency(recentBilledAmount)}; collected ${formatCurrency(recentCollectedAmount)}; gap ${formatCurrency(recentGapAmount)}; overdue bills ${overdueBills.length}; open complaints ${openComplaints.length}.`,
        sourcePath: `live-record/route/${route.code}`,
        href: "/admin/routes",
      }),
    ],
    relatedModules: [{ href: "/admin/routes", label: "Routes" }],
    disposition: "allowed" as const,
    fallbackPath: ["live-record:route"],
  };
}

function summarizeExceptionAlerts(alerts: ExceptionAlert[]) {
  if (!alerts.length) {
    return {
      answer:
        "This record is not carrying any active exception alert right now under the current DWDS monitoring rules.",
      basis:
        "No missing-reading, abnormal-consumption, duplicate-payment, disconnection-risk, or status-mismatch alert is currently active for the requested record.",
    };
  }

  const [topAlert, secondAlert] = alerts;
  const topSeverity = formatLabel(topAlert.severity);

  return {
    answer: `This record is currently flagged ${topSeverity.toLowerCase()} in Exceptions because ${topAlert.summary}${secondAlert ? ` A second active alert also exists for ${secondAlert.summary.toLowerCase()}` : ""}.`,
    basis: `The highest-priority live alert is ${topAlert.title.toLowerCase()} with metric ${topAlert.metric}.`,
  };
}

async function explainExceptionRecord(query: string, role: Role) {
  if (!canAccessAdminModule(role, "exceptions")) {
    return unauthorizedExplanation({
      modules: ["exceptions"],
      label: "exceptions",
    });
  }

  const meterNumber = extractMeterNumber(query);
  const accountNumber = extractAccountNumber(query);

  if (!/\b(exception|exceptions|alert|flagged|severity|leak|duplicate|mismatch)\b/i.test(query)) {
    return null;
  }

  if (!meterNumber && !accountNumber) {
    return null;
  }

  const targetMeter = meterNumber
    ? await prisma.meter.findFirst({
        where: {
          meterNumber: {
            equals: meterNumber,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          meterNumber: true,
          installDate: true,
          customer: {
            select: {
              id: true,
              accountNumber: true,
              name: true,
              status: true,
            },
          },
          readings: {
            orderBy: {
              readingDate: "desc",
            },
            take: 4,
            select: {
              id: true,
              readingDate: true,
              consumption: true,
              status: true,
            },
          },
        },
      })
    : null;

  const targetCustomer = accountNumber
    ? await prisma.customer.findFirst({
        where: {
          accountNumber: {
            equals: accountNumber,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          accountNumber: true,
          name: true,
          meters: {
            select: {
              id: true,
              meterNumber: true,
              installDate: true,
              readings: {
                orderBy: {
                  readingDate: "desc",
                },
                take: 4,
                select: {
                  id: true,
                  readingDate: true,
                  consumption: true,
                  status: true,
                },
              },
            },
          },
        },
      })
    : null;

  if (!targetMeter && !targetCustomer) {
    return missingRecordExplanation({
      summary: "I could not find that meter number or account number in DWDS.",
      relatedModules: [{ href: "/admin/exceptions", label: "Exceptions" }],
      fallbackPath: ["live-record:exceptions", "record:not-found"],
    });
  }

  const customerId = targetMeter?.customer?.id ?? targetCustomer?.id ?? null;
  const meterIds = targetMeter
    ? [targetMeter.id]
    : targetCustomer?.meters.map((meter) => meter.id) ?? [];
  const now = new Date();
  const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 86_400_000);

  const [disconnectionRiskBills, recentPayments, statusMismatchReadings] = await Promise.all([
    prisma.bill.findMany({
      where: {
        status: {
          in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"],
        },
        followUpStatus: {
          in: ["FINAL_NOTICE_SENT", "DISCONNECTION_REVIEW"],
        },
        OR: [
          customerId ? { customerId } : undefined,
          meterIds.length ? { reading: { meterId: { in: meterIds } } } : undefined,
        ].filter(Boolean) as object[],
      },
      orderBy: {
        dueDate: "asc",
      },
      select: {
        id: true,
        billingPeriod: true,
        dueDate: true,
        totalCharges: true,
        followUpStatus: true,
        customer: {
          select: {
            accountNumber: true,
            name: true,
          },
        },
        reading: {
          select: {
            meter: {
              select: {
                meterNumber: true,
              },
            },
          },
        },
        payments: {
          where: {
            status: PaymentStatus.COMPLETED,
          },
          select: {
            amount: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        paymentDate: {
          gte: fortyFiveDaysAgo,
        },
        bill: customerId
          ? {
              customerId,
            }
          : {
              reading: {
                meterId: {
                  in: meterIds,
                },
              },
            },
      },
      orderBy: {
        paymentDate: "desc",
      },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        method: true,
        referenceId: true,
        billId: true,
        bill: {
          select: {
            billingPeriod: true,
            customer: {
              select: {
                id: true,
                accountNumber: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    }),
    prisma.reading.findMany({
      where: {
        readingDate: {
          gte: fortyFiveDaysAgo,
        },
        meterId: {
          in: meterIds,
        },
        meter: {
          customer: {
            status: {
              in: ["INACTIVE", "DISCONNECTED"],
            },
          },
        },
      },
      orderBy: {
        readingDate: "desc",
      },
      select: {
        id: true,
        readingDate: true,
        consumption: true,
        status: true,
        meter: {
          select: {
            meterNumber: true,
            customer: {
              select: {
                accountNumber: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const meters = targetMeter
    ? [targetMeter]
    : (targetCustomer?.meters.map((meter) => ({
        ...meter,
        customer: {
          accountNumber: targetCustomer.accountNumber,
          name: targetCustomer.name,
          status: recentPayments[0]?.bill.customer.status ?? "ACTIVE",
        },
      })) ?? []);

  const alerts = buildOperationalExceptionAlerts({
    meters,
    disconnectionRiskBills,
    recentPayments,
    statusMismatchReadings,
    now,
  }).filter((alert) =>
    meterNumber
      ? alert.meterNumber?.toLowerCase() === meterNumber.toLowerCase()
      : alert.accountNumber?.toLowerCase() === accountNumber?.toLowerCase()
  );

  const summary = summarizeExceptionAlerts(alerts);

  return {
    answer: summary.answer,
    basis: summary.basis,
    uncertainty: alerts.length
      ? null
      : "If the operator just resolved or created related records, refresh the Exceptions page because alert severity only reflects the current live data snapshot.",
    citations: alerts.length
      ? alerts.slice(0, 2).map((alert) =>
          createCitation({
            id: alert.id,
            title: `Live exception alert ${alert.title}`,
            summary: `${formatLabel(alert.severity)} ${formatLabel(alert.category)} alert for ${alert.accountNumber ?? alert.meterNumber ?? "record"} with metric ${alert.metric}.`,
            sourcePath: `live-record/exceptions/${alert.id}`,
            href: alert.href,
          })
        )
      : [
          createCitation({
            id: `exceptions-clear-${meterNumber ?? accountNumber}`,
            title: `Live exception snapshot ${meterNumber ?? accountNumber}`,
            summary: "No active exception alert currently matches this targeted record under the live DWDS monitoring rules.",
            sourcePath: `live-record/exceptions/${meterNumber ?? accountNumber}`,
            href: "/admin/exceptions",
          }),
        ],
    relatedModules: uniqueModules(
      [
        { href: "/admin/exceptions", label: "Exceptions" },
        ...alerts.map((alert) => ({
          href: alert.href,
          label:
            alert.href === "/admin/payments"
              ? "Payments"
              : alert.href === "/admin/follow-up"
                ? "Follow-up"
                : alert.href === "/admin/readings"
                  ? "Readings"
                  : alert.href === "/admin/meters"
                    ? "Meters"
                    : "Exceptions",
        })),
      ]
    ),
    disposition: "allowed" as const,
    fallbackPath: ["live-record:exceptions"],
  };
}

export async function explainAssistantLiveRecordQuery(input: {
  query: string;
  role: Role;
}): Promise<AssistantLiveRecordExplanation | null> {
  const normalizedQuery = input.query.trim();

  if (!normalizedQuery) {
    return null;
  }

  if (/\b(receipt|payment|settlement)\b/i.test(normalizedQuery)) {
    return explainPaymentRecord(normalizedQuery, input.role);
  }

  if (/\b(route|pressure|complaint)\b/i.test(normalizedQuery)) {
    const routeExplanation = await explainRoutePressureRecord(normalizedQuery, input.role);

    if (routeExplanation) {
      return routeExplanation;
    }
  }

  if (
    /\b(exception|exceptions|alert|severity|flagged|leak|duplicate|mismatch)\b/i.test(
      normalizedQuery
    )
  ) {
    const exceptionExplanation = await explainExceptionRecord(normalizedQuery, input.role);

    if (exceptionExplanation) {
      return exceptionExplanation;
    }
  }

  if (
    /\b(follow[- ]?up|overdue|reminder|final notice|disconnection|reinstatement)\b/i.test(
      normalizedQuery
    )
  ) {
    const followUpExplanation = await explainFollowUpRecord(normalizedQuery, input.role);

    if (followUpExplanation) {
      return followUpExplanation;
    }
  }

  if (/\b(bill|billing|distribution|finalized|printed|draft|lifecycle)\b/i.test(normalizedQuery)) {
    return explainBillRecord(normalizedQuery, input.role);
  }

  return null;
}
