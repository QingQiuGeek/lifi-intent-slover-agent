import { tool } from "ai";
import { ExtractIntentInputSchema } from "@/lib/lifi/schemas";
import type { NaturalLanguageIntent } from "@/lib/lifi/types";

export const extractIntentTool = tool({
  description:
    "Parse a natural-language swap/payment request into a structured intent. " +
    "Returns the intent, any missing fields, and a suggested follow-up question if information is incomplete.",
  inputSchema: ExtractIntentInputSchema,
  execute: async ({ text, walletAddress, knownReceiver }) => {
    // Deterministic extraction: the model fills in what it can from the text.
    // This tool normalises the output rather than doing its own LLM call.
    const intent: NaturalLanguageIntent = {};
    const missing: string[] = [];

    const lower = text.toLowerCase();

    // ── Swap mode detection ──────────────────────────────────────────────────
    const wantsExactOutput =
      /\breceive\b|\bget\b.*\bexactly\b|\bexact.?output\b|\bfixed.?output\b/i.test(text);
    intent.swapMode = wantsExactOutput ? "exact-output" : "exact-input";
    intent.amountSide = wantsExactOutput ? "output" : "input";

    // ── Chain detection ──────────────────────────────────────────────────────
    const chainMap: Record<string, { chainId: number; name: string }> = {
      ethereum: { chainId: 1, name: "Ethereum" },
      "eth mainnet": { chainId: 1, name: "Ethereum" },
      mainnet: { chainId: 1, name: "Ethereum" },
      base: { chainId: 8453, name: "Base" },
      polygon: { chainId: 137, name: "Polygon" },
      arbitrum: { chainId: 42161, name: "Arbitrum" },
      optimism: { chainId: 10, name: "Optimism" },
      avalanche: { chainId: 43114, name: "Avalanche" },
      bsc: { chainId: 56, name: "BSC" },
    };

    // Try to detect "on <chain>" patterns for source/dest
    const onChain = [...text.matchAll(/on\s+(\w+(?:\s+\w+)?)/gi)].map((m) =>
      m[1].toLowerCase()
    );
    const fromChain = [...text.matchAll(/from\s+(\w+(?:\s+\w+)?)/gi)].map((m) =>
      m[1].toLowerCase()
    );

    // Look for explicit chain mentions
    const allChainMentions: Array<{ chain: { chainId: number; name: string }; pos: number }> = [];
    for (const [alias, chain] of Object.entries(chainMap)) {
      let idx = lower.indexOf(alias);
      while (idx !== -1) {
        allChainMentions.push({ chain, pos: idx });
        idx = lower.indexOf(alias, idx + 1);
      }
    }
    allChainMentions.sort((a, b) => a.pos - b.pos);

    if (allChainMentions.length >= 2) {
      intent.sourceChain = allChainMentions[0].chain;
      intent.destinationChain = allChainMentions[1].chain;
    } else if (allChainMentions.length === 1) {
      // Single chain mention: ambiguous, leave other blank
      intent.sourceChain = allChainMentions[0].chain;
    }

    if (!intent.sourceChain) missing.push("sourceChain");
    if (!intent.destinationChain) missing.push("destinationChain");

    // ── Token detection ──────────────────────────────────────────────────────
    const tokenPattern = /\b(ETH|USDT|USDC|DAI|WETH|WBTC|BTC|BNB|MATIC|POL|AVAX)\b/gi;
    const tokens = [...text.matchAll(tokenPattern)].map((m) => m[1].toUpperCase());

    if (tokens.length >= 2) {
      intent.sourceToken = { symbol: tokens[0] };
      intent.destinationToken = { symbol: tokens[1] };
    } else if (tokens.length === 1) {
      intent.sourceToken = { symbol: tokens[0] };
    }

    if (!intent.sourceToken) missing.push("sourceToken");
    if (!intent.destinationToken) missing.push("destinationToken");

    // ── Amount detection ─────────────────────────────────────────────────────
    const amountMatch = text.match(/[\d]+(?:[.,]\d+)?/);
    if (amountMatch) {
      intent.amount = amountMatch[0].replace(",", ".");
    } else {
      missing.push("amount");
    }

    // ── Addresses ────────────────────────────────────────────────────────────
    const addrMatch = text.match(/0x[0-9a-fA-F]{40}/);
    if (addrMatch) {
      intent.receiver = addrMatch[0] as `0x${string}`;
    } else if (knownReceiver) {
      intent.receiver = knownReceiver as `0x${string}`;
    }

    if (walletAddress) {
      intent.userAddress = walletAddress as `0x${string}`;
      if (!intent.receiver) intent.receiver = walletAddress as `0x${string}`;
    }

    if (!intent.userAddress) missing.push("userAddress (wallet not connected)");

    // ── Confidence and follow-up ─────────────────────────────────────────────
    const confidence = missing.length === 0 ? "high" : missing.length <= 2 ? "medium" : "low";

    let followUp: string | undefined;
    if (missing.includes("amount")) {
      followUp = wantsExactOutput
        ? "How much do you want to receive exactly?"
        : "How much do you want to swap?";
    } else if (missing.includes("sourceChain") || missing.includes("destinationChain")) {
      followUp = "Which chains are involved? (e.g. from Base to Ethereum)";
    } else if (missing.includes("userAddress (wallet not connected)")) {
      followUp = "Please connect your wallet first.";
    }

    // Merge chain context into tokens
    if (intent.sourceToken && intent.sourceChain?.chainId) {
      intent.sourceToken.chainId = intent.sourceChain.chainId;
    }
    if (intent.destinationToken && intent.destinationChain?.chainId) {
      intent.destinationToken.chainId = intent.destinationChain.chainId;
    }

    return {
      intent,
      missingFields: missing,
      confidence,
      followUp,
    };
  },
});
