import {
  NotificationChannel,
  NotificationStatus,
  NotificationTemplate,
} from "@prisma/client";

import { buildNotificationTemplate } from "@/features/notifications/lib/templates";
import { normalizePhilippineMobileNumber } from "@/features/notifications/lib/phone";
import {
  sendEmailViaResend,
  sendSmsViaSemaphore,
} from "@/features/notifications/lib/providers";
import { prisma } from "@/lib/prisma";

function getEnabledSmsTemplates() {
  const raw = process.env.DWDS_NOTIFICATION_SMS_TEMPLATES?.trim();

  if (raw && ["OFF", "NONE", "DISABLED"].includes(raw.toUpperCase())) {
    return new Set<NotificationTemplate>();
  }

  if (!raw) {
    return new Set<NotificationTemplate>([
      NotificationTemplate.FINAL_NOTICE,
      NotificationTemplate.DISCONNECTION,
      NotificationTemplate.REINSTATEMENT,
    ]);
  }

  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is NotificationTemplate =>
        Object.values(NotificationTemplate).includes(value as NotificationTemplate)
      )
  );
}

async function createNotificationLog(input: {
  customerId: string;
  billId?: string;
  triggeredById?: string;
  channel: NotificationChannel;
  template: NotificationTemplate;
  provider: string;
  destination: string;
  subject?: string;
  message: string;
  status: NotificationStatus;
  providerMessageId?: string | null;
  errorMessage?: string;
}) {
  await prisma.notificationLog.create({
    data: {
      customerId: input.customerId,
      billId: input.billId,
      triggeredById: input.triggeredById,
      channel: input.channel,
      template: input.template,
      provider: input.provider,
      destination: input.destination,
      subject: input.subject,
      message: input.message,
      status: input.status,
      providerMessageId: input.providerMessageId ?? null,
      errorMessage: input.errorMessage,
      sentAt: input.status === NotificationStatus.SENT ? new Date() : null,
    },
  });
}

export async function dispatchFollowUpNotifications(input: {
  customer: {
    id: string;
    name: string;
    accountNumber: string;
    email: string | null;
    contactNumber: string | null;
  };
  bill?: {
    id: string;
    billingPeriod: string;
    dueDate: Date;
    outstandingBalance: number;
  };
  template: NotificationTemplate;
  triggeredById?: string;
}) {
  const template = buildNotificationTemplate(input.template, {
    customerName: input.customer.name,
    accountNumber: input.customer.accountNumber,
    billingPeriod: input.bill?.billingPeriod,
    dueDateLabel: input.bill?.dueDate.toLocaleDateString("en-PH"),
    outstandingBalanceLabel:
      input.bill !== undefined
        ? new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(input.bill.outstandingBalance)
        : undefined,
  });

  if (input.customer.email) {
    const result = await sendEmailViaResend({
      to: input.customer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    await createNotificationLog({
      customerId: input.customer.id,
      billId: input.bill?.id,
      triggeredById: input.triggeredById,
      channel: NotificationChannel.EMAIL,
      template: input.template,
      provider: "resend",
      destination: input.customer.email,
      subject: template.subject,
      message: template.text,
      status: result.ok
        ? NotificationStatus.SENT
        : result.skipped
          ? NotificationStatus.SKIPPED
          : NotificationStatus.FAILED,
      providerMessageId: result.ok ? result.providerMessageId : null,
      errorMessage: result.ok ? undefined : result.errorMessage,
    });
  } else {
    await createNotificationLog({
      customerId: input.customer.id,
      billId: input.bill?.id,
      triggeredById: input.triggeredById,
      channel: NotificationChannel.EMAIL,
      template: input.template,
      provider: "resend",
      destination: "(missing email)",
      subject: template.subject,
      message: template.text,
      status: NotificationStatus.SKIPPED,
      errorMessage: "Customer email address is missing.",
    });
  }

  if (!getEnabledSmsTemplates().has(input.template)) {
    await createNotificationLog({
      customerId: input.customer.id,
      billId: input.bill?.id,
      triggeredById: input.triggeredById,
      channel: NotificationChannel.SMS,
      template: input.template,
      provider: "semaphore",
      destination: input.customer.contactNumber || "(missing number)",
      message: template.smsText,
      status: NotificationStatus.SKIPPED,
      errorMessage: "SMS is disabled for this notification template by current policy.",
    });

    return;
  }

  const normalizedNumber = normalizePhilippineMobileNumber(input.customer.contactNumber);

  if (!normalizedNumber) {
    await createNotificationLog({
      customerId: input.customer.id,
      billId: input.bill?.id,
      triggeredById: input.triggeredById,
      channel: NotificationChannel.SMS,
      template: input.template,
      provider: "semaphore",
      destination: input.customer.contactNumber || "(missing number)",
      message: template.smsText,
      status: NotificationStatus.SKIPPED,
      errorMessage:
        "Customer mobile number is missing or not in a supported Philippine mobile format.",
    });

    return;
  }

  const smsResult = await sendSmsViaSemaphore({
    number: normalizedNumber,
    message: template.smsText,
  });

  await createNotificationLog({
    customerId: input.customer.id,
    billId: input.bill?.id,
    triggeredById: input.triggeredById,
    channel: NotificationChannel.SMS,
    template: input.template,
    provider: "semaphore",
    destination: normalizedNumber,
    message: template.smsText,
    status: smsResult.ok
      ? NotificationStatus.SENT
      : smsResult.skipped
        ? NotificationStatus.SKIPPED
        : NotificationStatus.FAILED,
    providerMessageId: smsResult.ok ? smsResult.providerMessageId : null,
    errorMessage: smsResult.ok ? undefined : smsResult.errorMessage,
  });
}
