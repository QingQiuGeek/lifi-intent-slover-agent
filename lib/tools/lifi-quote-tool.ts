import { tool } from "ai";
import { LifiQuoteInputSchema } from "@/lib/lifi/schemas";
import { createLifiIntentClient } from "@/lib/lifi/client";
import { chainName } from "@/lib/lifi/token-resolver";
import { checkRoute } from "@/lib/lifi/routes-cache";
import { UnsupportedRouteError } from "@/lib/lifi/errors";

export const lifiQuoteTool = tool({
  description:
    "Request a cross-chain swap quote from LI.FI Intents solvers. " +
    "Returns the best quote with input/output amounts, expiry, and a summary of the next wallet action required.",
  inputSchema: LifiQuoteInputSchema,
  execute: async (input) => {
    // Pre-validate against the cached /routes inventory.
    // LI.FI Intents solvers only ship same-token cross-chain pairs (e.g. USDT→USDT).
    // Fail fast with concrete alternatives instead of a vague "no quotes" response.
    const routeCheck = await checkRoute({
      fromChainId: input.sourceChainId,
      fromSymbol: input.sourceTokenSymbol,
      fromAddress: input.sourceTokenAddress,
      toChainId: input.destinationChainId,
      toSymbol: input.destinationTokenSymbol,
      toAddress: input.destinationTokenAddress,
    });
    if (!routeCheck.supported) {
      return {
        success: false,
        error: routeCheck.reason,
        chainPairExists: routeCheck.chainPairExists,
        alternatives: routeCheck.alternatives,
        suggestion: routeCheck.chainPairExists
          ? "LI.FI Intents only routes SAME-TOKEN cross-chain transfers. Pick one of the alternatives above, or first swap into a supported token before bridging."
          : "This chain pair has no solver routes. Pick a different source/destination chain.",
      };
    }

    const client = createLifiIntentClient();

    try {
      const quote = await client.requestQuote({
        intent: {
          sourceChain: { chainId: input.sourceChainId },
          sourceToken: {
            symbol: input.sourceTokenSymbol,
            address: input.sourceTokenAddress as `0x${string}` | undefined,
            chainId: input.sourceChainId,
          },
          destinationChain: { chainId: input.destinationChainId },
          destinationToken: {
            symbol: input.destinationTokenSymbol,
            address: input.destinationTokenAddress as `0x${string}` | undefined,
            chainId: input.destinationChainId,
          },
          amount: input.amount,
          amountSide: input.amountSide,
          swapMode: input.swapMode,
          receiver: input.receiver as `0x${string}` | undefined,
          userAddress: input.userAddress as `0x${string}`,
        },
        userAddress: input.userAddress as `0x${string}`,
        receiver: (input.receiver ?? input.userAddress) as `0x${string}`,
      });

      const expiresInSec = Math.round((quote.validUntil - Date.now()) / 1000);
      const srcChainLabel = chainName(quote.input.chainId);
      const dstChainLabel = chainName(quote.output.chainId);

      return {
        success: true,
        quote,
        summary: {
          from: `${quote.input.amount} ${quote.input.token.symbol} on ${srcChainLabel}`,
          to: `${quote.output.amount} ${quote.output.token.symbol} on ${dstChainLabel}`,
          receiver: quote.output.receiver,
          expiresInSec,
          quoteId: quote.quoteId,
          swapMode: quote.swapMode,
        },
        nextAction: "Call prepareOrder with this quoteId to get the wallet action.",
      };
    } catch (err) {
      const isNoQuote = err instanceof UnsupportedRouteError;
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        retryable: isNoQuote,
        suggestion: isNoQuote
          ? "No solver is filling this pair right now. The user can retry in a minute, try a different amount, or use an alternative route (e.g. via a different intermediate chain)."
          : undefined,
      };
    }
  },
});
