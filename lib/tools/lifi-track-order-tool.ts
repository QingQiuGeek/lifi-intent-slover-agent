import { tool } from "ai";
import { LifiTrackOrderInputSchema } from "@/lib/lifi/schemas";
import { createLifiIntentClient } from "@/lib/lifi/client";

export const lifiTrackOrderTool = tool({
  description:
    "Track the status of a submitted LI.FI order by its catalystOrderId or onChainOrderId. " +
    "Returns the current status and timeline.",
  inputSchema: LifiTrackOrderInputSchema,
  execute: async (input) => {
    if (!input.catalystOrderId && !input.onChainOrderId) {
      return {
        success: false,
        error: "Provide at least one of: catalystOrderId or onChainOrderId.",
      };
    }

    const client = createLifiIntentClient();

    try {
      const order = await client.trackOrder(input);
      return {
        success: true,
        order,
        displayId: order.catalystOrderId ?? order.onChainOrderId,
        status: order.status,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
