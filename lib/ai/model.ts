import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function getModel() {
  const baseURL = process.env.AI_PROVIDER_BASE_URL;
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const model = process.env.AI_PROVIDER_MODEL;

  if (!baseURL || !apiKey || !model) {
    throw new Error(
      "Missing AI provider env vars: AI_PROVIDER_BASE_URL, AI_PROVIDER_API_KEY, AI_PROVIDER_MODEL"
    );
  }

  const provider = createOpenAICompatible({
    name: "custom-openai-compatible",
    baseURL,
    apiKey,
  });

  return provider.chatModel(model);
}
