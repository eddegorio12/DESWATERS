import { buildAbsoluteUrl } from "@/features/marketing/lib/site-config";

export type TelegramApprovalDeliveryResult =
  | {
      ok: true;
      messageId: string | null;
      deliveredAt: Date;
    }
  | {
      ok: false;
      errorMessage: string;
      skipped?: boolean;
    };

function getTelegramConfig() {
  return {
    botToken: process.env.DWDS_TELEGRAM_BOT_TOKEN?.trim() ?? "",
    chatId: process.env.DWDS_TELEGRAM_APPROVAL_CHAT_ID?.trim() ?? "",
    webhookSecret: process.env.DWDS_TELEGRAM_WEBHOOK_SECRET?.trim() ?? "",
  };
}

function buildDecisionUrl(requestId: string, token: string, decision: "approve" | "reject") {
  const searchParams = new URLSearchParams({
    requestId,
    token,
    decision,
  });

  return buildAbsoluteUrl(`/api/automation/telegram?${searchParams.toString()}`);
}

export function buildTelegramApprovalMessage(input: {
  requestId: string;
  token: string;
  summary: string;
  expiresAt: Date;
  requestedByName: string;
  actionLabel: string;
  targetLabel: string;
}) {
  const approveUrl = buildDecisionUrl(input.requestId, input.token, "approve");
  const rejectUrl = buildDecisionUrl(input.requestId, input.token, "reject");

  return {
    text: [
      `DWDS approval request`,
      ``,
      `Action: ${input.actionLabel}`,
      `Target: ${input.targetLabel}`,
      `Summary: ${input.summary}`,
      `Requested by: ${input.requestedByName}`,
      `Expires: ${input.expiresAt.toLocaleString("en-PH")}`,
      ``,
      `Approve: ${approveUrl}`,
      `Reject: ${rejectUrl}`,
    ].join("\n"),
    approveUrl,
    rejectUrl,
  };
}

export async function sendTelegramApprovalMessage(input: {
  requestId: string;
  token: string;
  summary: string;
  expiresAt: Date;
  requestedByName: string;
  actionLabel: string;
  targetLabel: string;
}): Promise<TelegramApprovalDeliveryResult> {
  const config = getTelegramConfig();

  if (!config.botToken || !config.chatId) {
    return {
      ok: false,
      skipped: true,
      errorMessage:
        "Telegram approval transport is not configured. Set DWDS_TELEGRAM_BOT_TOKEN and DWDS_TELEGRAM_APPROVAL_CHAT_ID.",
    };
  }

  const message = buildTelegramApprovalMessage(input);

  return sendTelegramTextMessage({
    chatId: config.chatId,
    text: message.text,
  });
}

export async function sendTelegramTextMessage(input: {
  chatId: string;
  text: string;
}): Promise<TelegramApprovalDeliveryResult> {
  const config = getTelegramConfig();

  if (!config.botToken || !input.chatId.trim()) {
    return {
      ok: false,
      skipped: true,
      errorMessage: "Telegram messaging is not configured for this chat.",
    };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: input.chatId,
          text: input.text,
          disable_web_page_preview: true,
        }),
      }
    );

    const payload = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          result?: { message_id?: number | string };
          description?: string;
        }
      | null;

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        errorMessage:
          payload?.description ??
          `Telegram approval delivery failed with status ${response.status}.`,
      };
    }

    return {
      ok: true,
      messageId:
        payload.result?.message_id !== undefined ? String(payload.result.message_id) : null,
      deliveredAt: new Date(),
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : "Telegram approval delivery failed before a response was received.",
    };
  }
}

export function getTelegramWebhookSecret() {
  return getTelegramConfig().webhookSecret;
}
