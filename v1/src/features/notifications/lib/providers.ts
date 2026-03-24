type DeliverySuccess = {
  ok: true;
  providerMessageId: string | null;
};

type DeliveryFailure = {
  ok: false;
  errorMessage: string;
  skipped?: boolean;
};

export type DeliveryResult = DeliverySuccess | DeliveryFailure;

export async function sendEmailViaResend({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      errorMessage: "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.",
      skipped: true,
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!response.ok) {
      return {
        ok: false,
        errorMessage:
          payload?.message || payload?.name || `Resend request failed with ${response.status}.`,
      };
    }

    return {
      ok: true,
      providerMessageId: payload?.id ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : "Resend request failed before a response was received.",
    };
  }
}

export async function sendSmsViaSemaphore({
  number,
  message,
}: {
  number: string;
  message: string;
}): Promise<DeliveryResult> {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  const senderName = process.env.SEMAPHORE_SENDER_NAME || "DWDS";

  if (!apiKey) {
    return {
      ok: false,
      errorMessage: "Semaphore is not configured. Set SEMAPHORE_API_KEY.",
      skipped: true,
    };
  }

  try {
    const body = new URLSearchParams({
      apikey: apiKey,
      number,
      message,
      sendername: senderName,
    });

    const response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const payload = (await response.json().catch(() => null)) as
      | Array<{ message_id?: number | string; status?: string }>
      | { message?: string; error?: string }
      | null;

    if (!response.ok) {
      return {
        ok: false,
        errorMessage:
          (payload && !Array.isArray(payload) && (payload.message || payload.error)) ||
          `Semaphore request failed with ${response.status}.`,
      };
    }

    const firstResult = Array.isArray(payload) ? payload[0] : null;

    return {
      ok: true,
      providerMessageId:
        firstResult?.message_id !== undefined ? String(firstResult.message_id) : null,
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : "Semaphore request failed before a response was received.",
    };
  }
}
