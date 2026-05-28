import { tool } from "ai";
import { LifiPrepareOrderInputSchema } from "@/lib/lifi/schemas";
import type { LifiQuoteSummary } from "@/lib/lifi/types";
import { NATIVE_SENTINEL } from "@/lib/lifi/chains-config";
import { chainName } from "@/lib/lifi/token-resolver";
import { buildEscrowOpenTx } from "@/lib/lifi/contracts";

export const lifiPrepareOrderTool = tool({
  description:
    "Prepare a LI.FI order for wallet execution. " +
    "Constructs the InputSettlerEscrow.open() transaction from the quote data (no extra API call). " +
    "Returns the escrow deposit tx, ERC-20 approval requirements, and suggested wallet action steps. " +
    "Must be called AFTER requestQuote and explicit user confirmation.",
  inputSchema: LifiPrepareOrderInputSchema,
  execute: async (input) => {
    try {
      // Normalize: LLM sometimes passes quoteSummary as a JSON string
      const rawInput = input.quoteSummary;
      const parsedInput: unknown =
        typeof rawInput === "string" ? JSON.parse(rawInput) : rawInput;

      const quoteSummary = parsedInput as LifiQuoteSummary | undefined;

      if (!quoteSummary) {
        return {
          success: false,
          error: "quoteSummary is required. Pass the quoteSummary field from requestQuote result.",
        };
      }

      // Handle the case where the LLM accidentally wraps in { success, quoteSummary, ... }
      const resolvedSummary: LifiQuoteSummary =
        (quoteSummary as Record<string, unknown>).quoteSummary != null
          ? ((quoteSummary as Record<string, unknown>).quoteSummary as LifiQuoteSummary)
          : (quoteSummary as Record<string, unknown>).quote != null
          ? ((quoteSummary as Record<string, unknown>).quote as LifiQuoteSummary)
          : quoteSummary;

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
