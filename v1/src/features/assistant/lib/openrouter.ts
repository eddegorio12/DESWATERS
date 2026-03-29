const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_PRIMARY_MODEL = "openrouter/free";
const DEFAULT_FALLBACK_MODELS = [
  "stepfun/step-3.5-flash:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
] as const;

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterResolvedConfig = {
  apiKey: string | null;
  apiUrl: string;
  primaryModel: string;
  fallbackModels: string[];
  allModels: string[];
};

function parseFallbackModels(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    return [...DEFAULT_FALLBACK_MODELS];
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getOpenRouterConfig(): OpenRouterResolvedConfig {
  const primaryModel =
    process.env.DWDS_ASSISTANT_PRIMARY_MODEL?.trim() || DEFAULT_PRIMARY_MODEL;
  const fallbackModels = parseFallbackModels(process.env.DWDS_ASSISTANT_FALLBACK_MODELS);
  const allModels = [primaryModel, ...fallbackModels].filter(
    (model, index, models) => models.indexOf(model) === index
  );

  return {
    apiKey: process.env.OPENROUTER_API_KEY?.trim() || null,
    apiUrl: OPENROUTER_API_URL,
    primaryModel,
    fallbackModels,
    allModels,
  };
}

export async function createOpenRouterChatCompletion(input: {
  messages: OpenRouterMessage[];
  preferredModel?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const config = getOpenRouterConfig();

  if (!config.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const attemptedModels = input.preferredModel
    ? [input.preferredModel, ...config.allModels.filter((model) => model !== input.preferredModel)]
    : config.allModels;

  let lastError: Error | null = null;

  for (const model of attemptedModels) {
    try {
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: input.messages,
          temperature: input.temperature ?? 0.2,
          max_tokens: input.maxTokens ?? 500,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter request failed for ${model}: ${response.status} ${errorText}`);
      }

      const payload = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
        usage?: {
          total_tokens?: number;
        };
      };
      const content = payload.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error(`OpenRouter returned no message content for ${model}.`);
      }

      return {
        model,
        content,
        usage: payload.usage ?? null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown OpenRouter failure.");
    }
  }

  throw lastError ?? new Error("OpenRouter completion failed with no specific error.");
}
