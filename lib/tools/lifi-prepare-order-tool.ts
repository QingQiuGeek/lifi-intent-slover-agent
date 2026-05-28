import { tool } from "ai";
import { LifiPrepareOrderInputSchema } from "@/lib/lifi/schemas";
import type { LifiQuoteSummary } from "@/lib/lifi/types";
import { NATIVE_SENTINEL } from "@/lib/lifi/chains-config";
import { chainName } from "@/lib/lifi/token-resolver";
import { buildEscrowOpenTx } from "@/lib/lifi/contracts";

function normalizeQuoteSummary(raw: unknown): LifiQuoteSummary | undefined {
  if (!raw) return undefined;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "[omitted]") return undefined;
    try {
      return normalizeQuoteSummary(JSON.parse(trimmed));
    } catch {
      return undefined;
    }
  }

  if (typeof raw !== "object") return undefined;

  const obj = raw as Record<string, unknown>;

  const candidate =
    (obj.quoteSummary != null ? obj.quoteSummary :
     obj.quote       != null ? obj.quote       :
     obj) as Partial<LifiQuoteSummary>;

  if (
    typeof candidate.quoteId    === "string" &&
    typeof candidate.validUntil === "number" &&
    candidate.input  != null &&
    candidate.output != null
  ) {
    return candidate as LifiQuoteSummary;
  }

  return undefined;
}

export const lifiPrepareOrderTool = tool({
  description:
    "Prepare a LI.FI order for wallet execution. " +
    "Constructs the InputSettlerEscrow.open() transaction from the quote data (no extra API call). " +
    "Returns the escrow deposit tx, ERC-20 approval requirements, and suggested wallet action steps. " +
    "Must be called AFTER requestQuote and explicit user confirmation.",
  inputSchema: LifiPrepareOrderInputSchema,
  execute: async (input) => {
    try {
      const resolvedSummary = normalizeQuoteSummary(input.quoteSummary);

      if (!resolvedSummary) {
        return {
          success: false,
          error:
            "quoteSummary could not be parsed. Call requestQuote again and pass the quoteSummary object from its result.",
        };
      }

      // Guard: reject if the quote has already expired
      if (resolvedSummary.validUntil != null && resolvedSummary.validUntil < Date.now()) {
        const agoSec = Math.round((Date.now() - resolvedSummary.validUntil) / 1000);
        return {
          success: false,
          expired: true,
          error: `Quote expired ${agoSec}s ago. Call requestQuote again to get a fresh quote before calling prepareOrder.`,
        };
      }

      const srcToken = resolvedSummary.input?.token;
      const isNative =
        !srcToken?.address ||
        srcToken.address.toLowerCase() === NATIVE_SENTINEL.toLowerCase();
      const tx = buildEscrowOpenTx(
        resolvedSummary,
        input.userAddress as `0x${string}`,
        isNative,
      );

      const srcChainId = resolvedSummary.input.chainId;
      const chain = chainName(srcChainId);
      const needsApproval = !!tx.approval;

      return {
        success: true,
        quoteId: input.quoteId,
        escrowAddress: tx.escrowAddress,
        chainId: srcChainId,
        needsApproval,
        ...(needsApproval && {
          approvalAction: {
            type: "approve-erc20" as const,
            chainId: srcChainId,
            token: tx.approval!.token,
            spender: tx.approval!.spender,
            amount: tx.approval!.amount,
            reason: `Approve ${srcToken?.symbol ?? "token"} spending by the LI.FI InputSettlerEscrow on ${chain}`,
          },
        }),
        depositAction: {
          type: "send-transaction" as const,
          chainId: srcChainId,
          to: tx.escrowAddress,
          data: tx.data,
          value: tx.value,
          quoteId: input.quoteId,
          reason: `Open escrow order: deposit ${resolvedSummary.input.amount} ${srcToken?.symbol ?? ""} on ${chain} → receiver gets ${resolvedSummary.output.amount} ${resolvedSummary.output.token.symbol ?? ""} on destination chain`,
        },
        nextStep: needsApproval
          ? "ERC-20 approval required first. Call planWalletAction with approvalAction. After the user confirms, call planWalletAction with depositAction."
          : "No approval needed (native token). Call planWalletAction with depositAction to open the escrow order.",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
