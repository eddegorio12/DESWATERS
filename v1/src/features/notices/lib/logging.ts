import {
  NotificationChannel,
  NotificationStatus,
  NotificationTemplate,
} from "@prisma/client";

import { buildNotificationTemplate } from "@/features/notifications/lib/templates";
import { prisma } from "@/lib/prisma";

type CreatePrintedNoticeLogInput = {
  customer: {
    id: string;
    name: string;
    accountNumber: string;
  };
  template: NotificationTemplate;
  triggeredById?: string;
  bill?: {
    id: string;
    billingPeriod: string;
    dueDate: Date;
    outstandingBalance: number;
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export async function createPrintedNoticeLog(input: CreatePrintedNoticeLogInput) {
  const renderedTemplate = buildNotificationTemplate(input.template, {
    customerName: input.customer.name,
    accountNumber: input.customer.accountNumber,
    billingPeriod: input.bill?.billingPeriod,
    dueDateLabel: input.bill?.dueDate.toLocaleDateString("en-PH"),
    outstandingBalanceLabel:
      input.bill !== undefined ? formatCurrency(input.bill.outstandingBalance) : undefined,
    noticeDateLabel: new Date().toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  });

  return prisma.notificationLog.create({
    data: {
      customerId: input.customer.id,
      billId: input.bill?.id,
      triggeredById: input.triggeredById,
      channel: NotificationChannel.PRINT,
      template: input.template,
      provider: "dwds-print",
      destination: "Printable customer notice",
      subject: renderedTemplate.subject,
      message: renderedTemplate.text,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    },
    select: {
      id: true,
    },
  });
}
