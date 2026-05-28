import { tool } from "ai";
import { LifiSubmitOrderInputSchema } from "@/lib/lifi/schemas";
import { createLifiIntentClient } from "@/lib/lifi/client";

export const lifiSubmitOrderTool = tool({
  description:
    "Submit a prepared LI.FI order to the solver network after the deposit transaction has been sent. " +
    "Requires the deposit transactionHash from the user's wallet action. " +
    "Returns a catalystOrderId or onChainOrderId for subsequent order tracking.",
  inputSchema: LifiSubmitOrderInputSchema,
  execute: async (input) => {
    if (!input.transactionHash) {
      return {
        success: false,
        error: "transactionHash is required. Wait for the user to complete the deposit wallet action before calling submitOrder.",
      };
    }

    const client = createLifiIntentClient();

    try {
      const order = await client.submitOrder({
        preparedOrder: input.preparedOrder,
        transactionHash: input.transactionHash as `0x${string}`,
        signature: input.signature as `0x${string}` | undefined,
      });

      return {
        success: true,
        catalystOrderId: order.catalystOrderId,
        onChainOrderId: order.onChainOrderId,
        status: order.status,
        quoteId: order.quoteId,
        message: `Order submitted. ID: ${order.catalystOrderId ?? order.onChainOrderId ?? "pending"}. Call trackOrder to monitor status.`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
