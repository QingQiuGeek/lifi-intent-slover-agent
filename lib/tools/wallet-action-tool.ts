import { tool } from "ai";
import { WalletActionInputSchema } from "@/lib/lifi/schemas";
import type { WalletAction } from "@/lib/lifi/types";

export const walletActionTool = tool({
  description:
    "Plan a wallet action to be shown to the user in the UI. " +
    "Use this to request token approval, EIP-712 signature, send-transaction, or explicit order confirmation. " +
    "The UI will render a card with a button the user must click — never assume the action has been taken.",
  inputSchema: WalletActionInputSchema,
  execute: async (input) => {
    let action: WalletAction;

    switch (input.type) {
      case "connect-wallet":
        action = { type: "connect-wallet", reason: input.reason };
        break;

      case "approve-erc20":
        if (!input.chainId || !input.token || !input.spender || !input.amount) {
          return { success: false, error: "approve-erc20 requires chainId, token, spender, amount" };
        }
        action = {
          type: "approve-erc20",
          chainId: input.chainId,
          token: input.token as `0x${string}`,
          spender: input.spender as `0x${string}`,
          amount: input.amount,
          reason: input.reason,
        };
        break;

      case "send-transaction":
        if (!input.chainId || !input.to) {
          return { success: false, error: "send-transaction requires chainId and to" };
        }
        action = {
          type: "send-transaction",
          chainId: input.chainId,
          to: input.to as `0x${string}`,
          value: input.value,
          data: input.data as `0x${string}` | undefined,
          reason: input.reason,
        };
        break;

      case "sign-typed-data":
        if (!input.chainId || !input.typedData) {
          return { success: false, error: "sign-typed-data requires chainId and typedData" };
        }
        action = {
          type: "sign-typed-data",
          chainId: input.chainId,
          typedData: input.typedData,
          reason: input.reason,
        };
        break;

      case "confirm-submit":
        action = {
          type: "confirm-submit",
          quoteId: input.quoteId,
          orderPreview: input.orderPreview,
          reason: input.reason,
        };
        break;

      default:
        return { success: false, error: `Unknown action type: ${(input as { type: string }).type}` };
    }

    return {
      success: true,
      action,
      confirmationText: buildConfirmationText(action),
    };
  },
});

function buildConfirmationText(action: WalletAction): string {
  switch (action.type) {
    case "connect-wallet":
      return "Please connect your wallet to continue.";
    case "approve-erc20":
      return `Approve spending of ${action.amount} tokens at ${action.token} for spender ${action.spender} on chain ${action.chainId}.`;
    case "send-transaction":
      return `Send transaction to ${action.to} on chain ${action.chainId}${action.value ? ` with value ${action.value} wei` : ""}.`;
    case "sign-typed-data":
      return `Sign the EIP-712 typed data on chain ${action.chainId} to authorise this order.`;
    case "confirm-submit":
      return `Confirm submission of order${action.quoteId ? ` (quote: ${action.quoteId})` : ""}.`;
  }
}
