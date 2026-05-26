import type { LifiQuoteSummary, NaturalLanguageIntent, SubmittedOrder } from "@/lib/lifi/types";
import { createLifiRestClient } from "@/lib/lifi/rest-client";

export type QuoteRequestInput = {
  intent: NaturalLanguageIntent;
  userAddress: `0x${string}`;
  receiver: `0x${string}`;
};

export type PrepareOrderInput = {
  quoteId: string;
  userAddress: `0x${string}`;
};

export type SubmitOrderInput = {
  preparedOrder: unknown;
  signature?: `0x${string}`;
  transactionHash?: `0x${string}`;
};

export type TrackOrderInput = {
  catalystOrderId?: string;
  onChainOrderId?: string;
};

export type LifiIntentClient = {
  getSupportedChains(): Promise<unknown>;
  getSupportedRoutes(): Promise<unknown>;
  requestQuote(input: QuoteRequestInput): Promise<LifiQuoteSummary>;
  prepareOrder(input: PrepareOrderInput): Promise<unknown>;
  submitOrder(input: SubmitOrderInput): Promise<SubmittedOrder>;
  trackOrder(input: TrackOrderInput): Promise<SubmittedOrder>;
};

export function createLifiIntentClient(): LifiIntentClient {
  if (process.env.LIFI_INTENTS_TRANSPORT === "mcp") {
    throw new Error("MCP transport is not yet implemented (task 17)");
  }

  return createLifiRestClient({
    baseUrl: process.env.LIFI_INTENTS_BASE_URL ?? "https://order-dev.li.fi",
    apiKey: process.env.LIFI_SOLVER_API_KEY,
  });
}
