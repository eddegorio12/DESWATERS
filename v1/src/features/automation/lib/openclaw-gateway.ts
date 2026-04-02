import type { ZodType } from "zod";

export type OpenClawChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenClawGatewayConfig = {
  apiUrl: string | null;
  apiKey: string | null;
  agentId: string;
  agentModel: string;
  backendModel: string | null;
  timeoutMs: number;
  scopes: string | null;
};

function getConfiguredApiUrl() {
  const baseUrl =
    process.env.DWDS_OPENCLAW_GATEWAY_URL?.trim() ||
    process.env.OPENCLAW_GATEWAY_URL?.trim() ||
    "";

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/+$/, "")}/v1/responses`;
}

function getConfiguredApiKey() {
  return (
    process.env.DWDS_OPENCLAW_GATEWAY_TOKEN?.trim() ||
    process.env.OPENCLAW_GATEWAY_TOKEN?.trim() ||
    process.env.OPENCLAW_GATEWAY_PASSWORD?.trim() ||
    null
  );
}

function getConfiguredTimeoutMs() {
  const parsed = Number.parseInt(
    process.env.DWDS_OPENCLAW_TIMEOUT_MS?.trim() ||
      process.env.OPENCLAW_TIMEOUT_MS?.trim() ||
      "",
    10
  );

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90_000;
}

function getConfiguredScopes() {
  return (
    process.env.DWDS_OPENCLAW_SCOPES?.trim() ||
    process.env.OPENCLAW_SCOPES?.trim() ||
    "operator.write"
  );
}

export function getOpenClawGatewayConfig(): OpenClawGatewayConfig {
  const explicitAgentId =
    process.env.DWDS_OPENCLAW_AGENT_ID?.trim() ||
    process.env.OPENCLAW_AGENT_ID?.trim() ||
    "";
  const agentId = explicitAgentId || "main";
  const configuredModel =
    process.env.DWDS_OPENCLAW_MODEL?.trim() ||
    process.env.OPENCLAW_MODEL?.trim() ||
    "";
  const explicitBackendModel =
    process.env.DWDS_OPENCLAW_BACKEND_MODEL?.trim() ||
    process.env.OPENCLAW_BACKEND_MODEL?.trim() ||
    "";
  const agentModel = configuredModel.startsWith("openclaw/")
    ? configuredModel
    : `openclaw/${agentId}`;
  const backendModel =
    explicitAgentId && !configuredModel
      ? null
      : explicitBackendModel
    ? explicitBackendModel
    : configuredModel && !configuredModel.startsWith("openclaw/")
      ? configuredModel
      : null;

  return {
    apiUrl: getConfiguredApiUrl(),
    apiKey: getConfiguredApiKey(),
    agentId,
    agentModel,
    backendModel,
    timeoutMs: getConfiguredTimeoutMs(),
    scopes: getConfiguredScopes(),
  };
}

export function isOpenClawGatewayConfigured() {
  const config = getOpenClawGatewayConfig();
  return Boolean(config.apiUrl && config.apiKey);
}

function extractJsonContent(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("```")) {
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

    if (fenced?.[1]) {
      return fenced[1].trim();
    }
  }

  return trimmed;
}

export async function createOpenClawChatCompletion(input: {
  messages: OpenClawChatMessage[];
  temperature?: number;
  maxTokens?: number;
  user?: string;
}) {
  const config = getOpenClawGatewayConfig();

  if (!config.apiUrl || !config.apiKey) {
    throw new Error(
      "OpenClaw gateway is not configured. Set DWDS_OPENCLAW_GATEWAY_URL and DWDS_OPENCLAW_GATEWAY_TOKEN."
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "x-openclaw-agent-id": config.agentId,
        ...(config.backendModel ? { "x-openclaw-model": config.backendModel } : {}),
        ...(config.scopes ? { "x-openclaw-scopes": config.scopes } : {}),
      },
      body: JSON.stringify({
        model: config.agentModel,
        input: input.messages.map((message) => ({
          type: "message",
          role: message.role,
          content: [{ type: "input_text", text: message.content }],
        })),
        max_output_tokens: input.maxTokens ?? 900,
        user: input.user,
        reasoning: {
          effort: input.temperature !== undefined && input.temperature > 0.2 ? "medium" : "low",
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          output?: Array<{
            type?: string;
            content?: Array<{
              type?: string;
              text?: string;
            }>;
          }>;
          usage?: {
            total_tokens?: number;
          };
          error?: {
            message?: string;
          };
        }
      | null;

    if (!response.ok) {
      throw new Error(
        payload?.error?.message ||
          `OpenClaw request failed with status ${response.status}.`
      );
    }

    const content = (payload?.output ?? [])
      .flatMap((item) => item.content ?? [])
      .filter((part) => part.type === "output_text" && typeof part.text === "string")
      .map((part) => part.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!content) {
      throw new Error("OpenClaw returned no message content.");
    }

    return {
      model: config.backendModel ?? config.agentModel,
      content,
      usage: payload?.usage ?? null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createOpenClawStructuredCompletion<T>(input: {
  schema: ZodType<T>;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  user?: string;
}) {
  const completion = await createOpenClawChatCompletion({
    messages: [
      {
        role: "system",
        content: input.systemPrompt,
      },
      {
        role: "user",
        content: input.userPrompt,
      },
    ],
    maxTokens: input.maxTokens,
    temperature: input.temperature,
    user: input.user,
  });

  const parsed = input.schema.safeParse(
    JSON.parse(extractJsonContent(completion.content)) as unknown
  );

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "OpenClaw returned invalid JSON.");
  }

  return {
    model: completion.model,
    usage: completion.usage,
    data: parsed.data,
  };
}
