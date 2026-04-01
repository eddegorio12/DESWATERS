import { NextResponse } from "next/server";

import { processApprovalDecision } from "@/features/automation/lib/approval-store";
import {
  processTelegramCashierUpdate,
} from "@/features/automation/lib/telegram-cashier";
import {
  getTelegramWebhookSecret,
  sendTelegramTextMessage,
} from "@/features/automation/lib/telegram-transport";

function renderHtml(title: string, body: string) {
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title><style>body{font-family:Arial,sans-serif;background:#f5f7f8;color:#112;padding:32px}main{max-width:720px;margin:0 auto;background:white;border:1px solid #d7dee2;border-radius:20px;padding:24px}h1{font-size:1.35rem;margin:0 0 12px}p{line-height:1.6;margin:0 0 10px}</style></head><body><main><h1>${title}</h1>${body}</main></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const decision = searchParams.get("decision")?.trim();
  const decidedByLabel = searchParams.get("by")?.trim() || "Telegram approval link";

  if (
    !requestId ||
    !token ||
    (decision !== "approve" && decision !== "reject")
  ) {
    return renderHtml(
      "Invalid DWDS approval link",
      "<p>This approval link is missing the required request, token, or decision values.</p>"
    );
  }

  try {
    const result = await processApprovalDecision({
      requestId,
      token,
      decision,
      decidedByLabel,
    });

    if (!result.ok) {
      if (result.reason === "missing" || result.reason === "invalid") {
        return renderHtml(
          "Approval rejected",
          "<p>This DWDS approval link is invalid or no longer available.</p>"
        );
      }

      if (result.reason === "expired") {
        return renderHtml(
          "Approval expired",
          "<p>This approval request already expired and no action was executed.</p>"
        );
      }

      if (result.reason === "replay") {
        return renderHtml(
          "Approval already used",
          "<p>This approval link already executed the DWDS action once. Replay was blocked.</p>"
        );
      }

      return renderHtml(
        "Approval already closed",
        "<p>This approval request was already closed and cannot be used again.</p>"
      );
    }

    if (result.outcome === "rejected") {
      return renderHtml(
        "DWDS approval rejected",
        "<p>The automation request was rejected. No DWDS workflow mutation was executed.</p>"
      );
    }

    return renderHtml(
      "DWDS approval executed",
      "<p>The request was approved and DWDS executed the bounded action through its normal server-side workflow.</p>"
    );
  } catch (error) {
    return renderHtml(
      "DWDS execution failed",
      `<p>${
        error instanceof Error
          ? error.message
          : "The approved action failed while DWDS was executing it."
      }</p>`
    );
  }
}

export async function POST(request: Request) {
  const configuredSecret = getTelegramWebhookSecret();
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token")?.trim() ?? "";

  if (configuredSecret && configuredSecret !== receivedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized Telegram webhook." }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as
    | {
        message?: {
          chat?: { id?: number | string };
        };
      }
    | null;

  if (!update) {
    return NextResponse.json({ ok: true });
  }

  try {
    const reply = await processTelegramCashierUpdate(update);
    const chatId = update.message?.chat?.id ? String(update.message.chat.id) : "";

    if (reply && chatId) {
      await sendTelegramTextMessage({
        chatId,
        text: reply,
      });
    }
  } catch (error) {
    const chatId = update.message?.chat?.id ? String(update.message.chat.id) : "";

    if (chatId) {
      await sendTelegramTextMessage({
        chatId,
        text:
          error instanceof Error
            ? `DWDS cashier assistant error: ${error.message}`
            : "DWDS cashier assistant could not process that message.",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
