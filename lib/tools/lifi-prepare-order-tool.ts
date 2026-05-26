import { tool } from "ai";
import { LifiPrepareOrderInputSchema } from "@/lib/lifi/schemas";

export const lifiPrepareOrderTool = tool({
  description:
    "Prepare a LI.FI order for wallet execution. " +
    "Returns the transaction data, EIP-712 typed data, or allowance requirements. " +
    "NOTE: Not yet implemented — will be completed in task 14.",
  inputSchema: LifiPrepareOrderInputSchema,
  execute: async () => {
    return {
      success: false,
      error: "prepareOrder is not yet implemented (coming in task 14). " +
        "Once implemented, this tool will return the wallet action required to execute your order.",
    };
  },
});
