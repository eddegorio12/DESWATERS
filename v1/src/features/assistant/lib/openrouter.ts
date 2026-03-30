const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_EMBEDDINGS_API_URL = "https://openrouter.ai/api/v1/embeddings";
const DEFAULT_PRIMARY_MODEL = "openrouter/free";
const DEFAULT_FALLBACK_MODELS = [
  "stepfun/step-3.5-flash:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
] as const;
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";
const DEFAULT_EMBEDDING_DIMENSIONS = 1536;

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterResolvedConfig = {
  apiKey: string | null;
  apiUrl: string;
  embeddingsApiUrl: string;
  primaryModel: string;
  fallbackModels: string[];
  allModels: string[];
  embeddingModel: string;
  embeddingDimensions: number;
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
  const parsedEmbeddingDimensions = Number.parseInt(
    process.env.DWDS_ASSISTANT_EMBEDDING_DIMENSIONS?.trim() ?? "",
    10
  );
  const allModels = [primaryModel, ...fallbackModels].filter(
    (model, index, models) => models.indexOf(model) === index
  );

  return {
    apiKey: process.env.OPENROUTER_API_KEY?.trim() || null,
    apiUrl: OPENROUTER_API_URL,
    embeddingsApiUrl: OPENROUTER_EMBEDDINGS_API_URL,
    primaryModel,
    fallbackModels,
    allModels,
    embeddingModel:
      process.env.DWDS_ASSISTANT_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL,
    embeddingDimensions:
      Number.isFinite(parsedEmbeddingDimensions) && parsedEmbeddingDimensions > 0
        ? parsedEmbeddingDimensions
        : DEFAULT_EMBEDDING_DIMENSIONS,
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
        attemptedModels: attemptedModels.slice(0, attemptedModels.indexOf(model) + 1),
        content,
        usage: payload.usage ?? null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown OpenRouter failure.");
    }
  }

  throw lastError ?? new Error("OpenRouter completion failed with no specific error.");
}

export async function createOpenRouterEmbeddings(input: {
  values: string[];
  preferredModel?: string;
  dimensions?: number;
  inputType?: "query" | "document";
}) {
  const config = getOpenRouterConfig();

  if (!config.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  if (!input.values.length) {
    return {
      model: input.preferredModel ?? config.embeddingModel,
      dimensions: input.dimensions ?? config.embeddingDimensions,
      embeddings: [] as number[][],
      usage: null as { prompt_tokens?: number; total_tokens?: number; cost?: number } | null,
    };
  }

  const response = await fetch(config.embeddingsApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.preferredModel ?? config.embeddingModel,
      input: input.values,
      encoding_format: "float",
      dimensions: input.dimensions ?? config.embeddingDimensions,
      input_type: input.inputType,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter embeddings request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{
      embedding?: number[];
      index?: number;
    }>;
    model?: string;
    usage?: {
      prompt_tokens?: number;
      total_tokens?: number;
      cost?: number;
    };
  };

  const embeddings = (payload.data ?? [])
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
    .map((entry) => entry.embedding ?? []);

  if (embeddings.length !== input.values.length || embeddings.some((entry) => !entry.length)) {
    throw new Error("OpenRouter embeddings response was incomplete.");
  }

  return {
    model: payload.model ?? input.preferredModel ?? config.embeddingModel,
    dimensions: input.dimensions ?? config.embeddingDimensions,
    embeddings,
    usage: payload.usage ?? null,
  };
}
