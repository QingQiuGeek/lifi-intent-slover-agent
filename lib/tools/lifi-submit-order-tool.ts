import { tool } from "ai";
import { LifiSubmitOrderInputSchema } from "@/lib/lifi/schemas";

export const lifiSubmitOrderTool = tool({
  description:
    "Submit a signed/prepared LI.FI order to the solver network. " +
    "Requires the user to have explicitly confirmed the order and provided a wallet signature or transaction hash. " +
    "NOTE: Not yet implemented — will be completed in task 15.",
  inputSchema: LifiSubmitOrderInputSchema,
  execute: async () => {
    return {
      success: false,
      error: "submitOrder is not yet implemented (coming in task 15). " +
        "Once implemented, this tool will submit the signed order and return an order ID for tracking.",
    };
  },
});
