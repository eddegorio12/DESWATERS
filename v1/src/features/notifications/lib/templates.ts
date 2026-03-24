import type { NotificationTemplate } from "@prisma/client";

type NotificationTemplateContext = {
  customerName: string;
  accountNumber: string;
  billingPeriod?: string;
  dueDateLabel?: string;
  outstandingBalanceLabel?: string;
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
) {
  const greeting = `Dear ${context.customerName},`;
  const billContext =
    context.billingPeriod && context.outstandingBalanceLabel
      ? ` Account ${context.accountNumber} still has an outstanding balance of ${context.outstandingBalanceLabel} for ${context.billingPeriod}.`
      : ` Account ${context.accountNumber} still requires follow-up.`;

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
    };
  }

  const subject = `DWDS service reinstatement for ${context.accountNumber}`;
  const text = `${greeting} Service for account ${context.accountNumber} has been reinstated. Thank you for settling the overdue follow-up requirements.`;

  return {
    subject,
    text,
    html: `<p>${escapeHtml(greeting)}</p><p>Service for account ${escapeHtml(
      context.accountNumber
    )} has been reinstated. Thank you for settling the overdue follow-up requirements.</p><p>DEGORIO WATER DISTRIBUTION SERVICES (DWDS)</p>`,
    smsText: `DWDS update: Service for acct ${context.accountNumber} has been reinstated. Thank you.`,
  };
}
