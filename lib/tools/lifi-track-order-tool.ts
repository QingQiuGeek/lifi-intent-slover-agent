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

      const TERMINAL_STATUSES = ["Settled", "Refunded", "Expired", "Failed"];
      const isTerminal = TERMINAL_STATUSES.includes(order.status ?? "");

      const STATUS_MEANING: Record<string, string> = {
        Signed:    "Order accepted by the order server; waiting for a solver to fill it.",
        Delivered: "Solver has delivered assets on destination chain; awaiting final settlement.",
        Settled:   "Settlement complete — the receiver has the funds.",
        Refunded:  "Order was not filled; funds returned to sender.",
        Expired:   "Fill deadline passed without settlement.",
        Failed:    "Order failed.",
      };

      return {
        success: true,
        order,
        displayId: order.catalystOrderId ?? order.onChainOrderId,
        status: order.status,
        isTerminal,
        meaning: STATUS_MEANING[order.status ?? ""] ?? "Status unknown.",
        nextStep: isTerminal
          ? order.status === "Settled"
            ? "Show success summary with both chain explorer links."
            : "Order ended in a non-success state. Explain to the user and offer next steps."
          : "Order still in progress. Poll again in 15–20 seconds by calling trackOrder again.",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
