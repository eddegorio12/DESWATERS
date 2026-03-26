import type { NotificationTemplate } from "@prisma/client";

type NotificationTemplateContext = {
  customerName: string;
  accountNumber: string;
  billingPeriod?: string;
  dueDateLabel?: string;
  outstandingBalanceLabel?: string;
  noticeDateLabel?: string;
};

type PrintableNoticeContent = {
  title: string;
  eyebrow: string;
  summary: string;
  paragraphs: string[];
  callouts: string[];
};

export type BuiltNotificationTemplate = {
  subject: string;
  text: string;
  html: string;
  smsText: string;
  printable: PrintableNoticeContent;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildNotificationTemplate(
  template: NotificationTemplate,
  context: NotificationTemplateContext
): BuiltNotificationTemplate {
  const greeting = `Dear ${context.customerName},`;
  const billContext =
    context.billingPeriod && context.outstandingBalanceLabel
      ? ` Account ${context.accountNumber} still has an outstanding balance of ${context.outstandingBalanceLabel} for ${context.billingPeriod}.`
      : ` Account ${context.accountNumber} still requires follow-up.`;
  const noticeDateLabel = context.noticeDateLabel ?? "today";

  if (template === "BILLING_REMINDER") {
    const subject = `DWDS billing reminder for ${context.accountNumber}`;
    const text = `${greeting} This is a billing reminder for account ${context.accountNumber}. ${context.billingPeriod ? `The current billing period is ${context.billingPeriod}. ` : ""}${context.outstandingBalanceLabel ? `The amount due is ${context.outstandingBalanceLabel}. ` : ""}Please settle on or before ${context.dueDateLabel ?? "the due date"} to keep the account current.`;

    return {
      subject,
      text,
      html: `<p>${escapeHtml(greeting)}</p><p>This is a billing reminder for account ${escapeHtml(
        context.accountNumber
      )}. ${
        context.billingPeriod
          ? `The current billing period is ${escapeHtml(context.billingPeriod)}. `
          : ""
      }${
        context.outstandingBalanceLabel
          ? `The amount due is ${escapeHtml(context.outstandingBalanceLabel)}. `
          : ""
      }Please settle on or before ${escapeHtml(
        context.dueDateLabel ?? "the due date"
      )} to keep the account current.</p><p>DEGORIO WATER DISTRIBUTION SERVICES (DWDS)</p>`,
      smsText: `DWDS billing reminder: Acct ${context.accountNumber} has ${context.outstandingBalanceLabel ?? "an unpaid balance"}${context.billingPeriod ? ` for ${context.billingPeriod}` : ""}. Please settle by ${context.dueDateLabel ?? "the due date"}.`,
      printable: {
        title: "Billing Reminder Notice",
        eyebrow: "Consumer Communication",
        summary:
          "Reminder issued before service escalation so the account can be settled against the current billing record.",
        paragraphs: [
          `This billing reminder was prepared on ${noticeDateLabel} for account ${context.accountNumber}.`,
          context.billingPeriod && context.outstandingBalanceLabel
            ? `Our records show an amount due of ${context.outstandingBalanceLabel} for ${context.billingPeriod}.`
            : `Our records show that this account still requires payment attention.`,
          `Please present this notice at the DWDS office and settle on or before ${context.dueDateLabel ?? "the due date"} to avoid overdue follow-up.`,
        ],
        callouts: [
          `Account: ${context.accountNumber}`,
          context.billingPeriod ? `Billing period: ${context.billingPeriod}` : "Billing period: Current bill",
          context.outstandingBalanceLabel
            ? `Amount due: ${context.outstandingBalanceLabel}`
            : "Amount due: Verify with billing staff",
        ],
      },
    };
  }

  if (template === "FOLLOW_UP_REMINDER") {
    const subject = `DWDS payment reminder for ${context.accountNumber}`;
    const text = `${greeting}${billContext} Please settle on or before ${context.dueDateLabel ?? "the due date"} to avoid escalation.`;

    return {
      subject,
      text,
      html: `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(
        billContext
      )} Please settle on or before ${escapeHtml(
        context.dueDateLabel ?? "the due date"
      )} to avoid escalation.</p><p>DEGORIO WATER DISTRIBUTION SERVICES (DWDS)</p>`,
      smsText: `DWDS reminder: Acct ${context.accountNumber} has ${context.outstandingBalanceLabel ?? "an unpaid balance"} for ${context.billingPeriod ?? "the current bill"}. Settle by ${context.dueDateLabel ?? "the due date"}.`,
      printable: {
        title: "Overdue Reminder Notice",
        eyebrow: "Receivables Follow-up",
        summary:
          "First-stage overdue reminder prepared from the active receivables workflow.",
        paragraphs: [
          `This reminder was issued on ${noticeDateLabel} for account ${context.accountNumber}.`,
          context.billingPeriod && context.outstandingBalanceLabel
            ? `DWDS records show an overdue balance of ${context.outstandingBalanceLabel} for ${context.billingPeriod}.`
            : `DWDS records show that this account requires overdue follow-up.`,
          `Please settle on or before ${context.dueDateLabel ?? "the due date"} to avoid escalation into final notice and possible service action.`,
        ],
        callouts: [
          `Account: ${context.accountNumber}`,
          context.billingPeriod ? `Billing period: ${context.billingPeriod}` : "Billing period: Current bill",
          context.outstandingBalanceLabel
            ? `Outstanding balance: ${context.outstandingBalanceLabel}`
            : "Outstanding balance: Verify with billing staff",
        ],
      },
    };
  }

  if (template === "FINAL_NOTICE") {
    const subject = `DWDS final notice for ${context.accountNumber}`;
    const text = `${greeting}${billContext} This is a final notice. Immediate settlement is required to avoid service disconnection.`;

    return {
      subject,
      text,
      html: `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(
        billContext
      )} This is a final notice. Immediate settlement is required to avoid service disconnection.</p><p>DEGORIO WATER DISTRIBUTION SERVICES (DWDS)</p>`,
      smsText: `DWDS final notice: Acct ${context.accountNumber} has ${context.outstandingBalanceLabel ?? "an overdue balance"} for ${context.billingPeriod ?? "the current bill"}. Immediate payment is required to avoid disconnection.`,
      printable: {
        title: "Final Demand Notice",
        eyebrow: "Receivables Follow-up",
        summary:
          "Escalated overdue notice prepared before disconnection review or service hold.",
        paragraphs: [
          `This final notice was issued on ${noticeDateLabel} for account ${context.accountNumber}.`,
          context.billingPeriod && context.outstandingBalanceLabel
            ? `The account still carries an overdue balance of ${context.outstandingBalanceLabel} for ${context.billingPeriod}.`
            : `The account still carries an overdue balance that requires immediate settlement.`,
          "Immediate payment is required to avoid disconnection review and further service enforcement.",
        ],
        callouts: [
          `Account: ${context.accountNumber}`,
          context.billingPeriod ? `Billing period: ${context.billingPeriod}` : "Billing period: Current bill",
          context.outstandingBalanceLabel
            ? `Urgent amount due: ${context.outstandingBalanceLabel}`
            : "Urgent amount due: Verify with billing staff",
        ],
      },
    };
  }

  if (template === "DISCONNECTION") {
    const subject = `DWDS service disconnection notice for ${context.accountNumber}`;
    const text = `${greeting} Service for account ${context.accountNumber} has been marked disconnected because the overdue balance was not cleared. Please contact DWDS to arrange settlement and reinstatement.`;

    return {
      subject,
      text,
      html: `<p>${escapeHtml(greeting)}</p><p>Service for account ${escapeHtml(
        context.accountNumber
      )} has been marked disconnected because the overdue balance was not cleared. Please contact DWDS to arrange settlement and reinstatement.</p><p>DEGORIO WATER DISTRIBUTION SERVICES (DWDS)</p>`,
      smsText: `DWDS notice: Service for acct ${context.accountNumber} is now disconnected due to unpaid overdue balance. Contact DWDS for settlement and reinstatement.`,
      printable: {
        title: "Service Disconnection Notice",
        eyebrow: "Service Status Update",
        summary:
          "Formal record that service has been placed under disconnection because overdue balances remained unresolved.",
        paragraphs: [
          `This disconnection notice was prepared on ${noticeDateLabel} for account ${context.accountNumber}.`,
          "Service has been marked disconnected because the overdue balance was not cleared within the required receivables workflow.",
          "Please contact DWDS to confirm the settlement requirement and reinstatement steps before service can be restored.",
        ],
        callouts: [
          `Account: ${context.accountNumber}`,
          "Service status: Disconnected",
          context.outstandingBalanceLabel
            ? `Overdue balance at action time: ${context.outstandingBalanceLabel}`
            : "Overdue balance: Verify with billing staff",
        ],
      },
    };
  }

  if (template === "REINSTATEMENT") {
    const subject = `DWDS service reinstatement for ${context.accountNumber}`;
    const text = `${greeting} Service for account ${context.accountNumber} has been reinstated. Thank you for settling the overdue follow-up requirements.`;

    return {
      subject,
      text,
      html: `<p>${escapeHtml(greeting)}</p><p>Service for account ${escapeHtml(
        context.accountNumber
      )} has been reinstated. Thank you for settling the overdue follow-up requirements.</p><p>DEGORIO WATER DISTRIBUTION SERVICES (DWDS)</p>`,
      smsText: `DWDS update: Service for acct ${context.accountNumber} has been reinstated. Thank you.`,
      printable: {
        title: "Service Reinstatement Confirmation",
        eyebrow: "Service Status Update",
        summary:
          "Confirmation that the service hold has been cleared and the account was returned to active service.",
        paragraphs: [
          `This reinstatement confirmation was prepared on ${noticeDateLabel} for account ${context.accountNumber}.`,
          "DWDS has restored service after the receivables hold was cleared.",
          "Please keep this notice together with the latest bill or official receipt for account reference.",
        ],
        callouts: [
          `Account: ${context.accountNumber}`,
          "Service status: Active",
          "Reference: Keep with your latest payment records",
        ],
      },
    };
  }

  const subject = `DWDS service interruption advisory for ${context.accountNumber}`;
  const text = `${greeting} This is to inform you that DWDS has prepared a service interruption advisory for account ${context.accountNumber}. Please monitor posted office instructions for the interruption schedule and restoration guidance.`;

  return {
    subject,
    text,
    html: `<p>${escapeHtml(greeting)}</p><p>This is to inform you that DWDS has prepared a service interruption advisory for account ${escapeHtml(
      context.accountNumber
    )}. Please monitor posted office instructions for the interruption schedule and restoration guidance.</p><p>DEGORIO WATER DISTRIBUTION SERVICES (DWDS)</p>`,
    smsText: `DWDS advisory: A service interruption notice is on file for acct ${context.accountNumber}. Please check the DWDS office for the schedule and restoration guidance.`,
    printable: {
      title: "Service Interruption Advisory",
      eyebrow: "Consumer Communication",
      summary:
        "Prepared advisory for planned or confirmed service interruption affecting the account.",
      paragraphs: [
        `This interruption advisory was prepared on ${noticeDateLabel} for account ${context.accountNumber}.`,
        "Water service may be temporarily unavailable because of operational work, repairs, or related field conditions.",
        "Please watch for posted DWDS updates regarding the interruption schedule, affected area, and restoration timing.",
      ],
      callouts: [
        `Account: ${context.accountNumber}`,
        "Notice type: Service interruption advisory",
        "Restoration guidance: Follow DWDS field and office updates",
      ],
    },
  };
}
