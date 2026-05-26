import { InferAgentUIMessage, stepCountIs, ToolLoopAgent } from "ai";
import { getModel } from "@/lib/ai/model";
import { LIFI_AGENT_PROMPT } from "@/lib/agents/prompt";
import { extractIntentTool } from "@/lib/tools/extract-intent-tool";
import { lifiQuoteTool } from "@/lib/tools/lifi-quote-tool";
import { lifiPrepareOrderTool } from "@/lib/tools/lifi-prepare-order-tool";
import { lifiSubmitOrderTool } from "@/lib/tools/lifi-submit-order-tool";
import { lifiTrackOrderTool } from "@/lib/tools/lifi-track-order-tool";
import { walletActionTool } from "@/lib/tools/wallet-action-tool";

const TOOLS = {
  extractIntent: extractIntentTool,
  requestQuote: lifiQuoteTool,
  prepareOrder: lifiPrepareOrderTool,
  planWalletAction: walletActionTool,
  submitOrder: lifiSubmitOrderTool,
  trackOrder: lifiTrackOrderTool,
};

function buildInstructions(walletAddress?: string, chainId?: number): string {
  if (!walletAddress) return LIFI_AGENT_PROMPT;
  const chainInfo = chainId ? ` (connected chain ID: ${chainId})` : "";
  return (
    LIFI_AGENT_PROMPT +
    `\n\n## Connected Wallet\nThe user's wallet is already connected.\nAddress: ${walletAddress}${chainInfo}\nUse this as the default userAddress and receiver when calling requestQuote unless the user explicitly specifies a different address.`
  );
}

export function createRequestAgent(walletAddress?: string, chainId?: number) {
  return new ToolLoopAgent({
    id: "lifi-intent-agent",
    model: getModel(),
    instructions: buildInstructions(walletAddress, chainId),
    stopWhen: stepCountIs(8),
    tools: TOOLS,
  });
}

/** @deprecated prefer createRequestAgent — kept only for type inference */
export function getLifiAgent() {
  return createRequestAgent();
}

// Type inference helper
const _typeAgent = null as unknown as ReturnType<typeof createRequestAgent>;
export type LifiAgentUIMessage = InferAgentUIMessage<typeof _typeAgent>;
