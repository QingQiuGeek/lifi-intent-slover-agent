import { createAgentUIStreamResponse } from "ai";
import { createRequestAgent } from "@/lib/agents/lifi-agent";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { messages?: unknown[]; sessionId?: string; walletAddress?: string; chainId?: number };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages = [], walletAddress, chainId } = body;

  try {
    return await createAgentUIStreamResponse({
      agent: createRequestAgent(walletAddress, chainId),
      uiMessages: messages,
      onStepFinish: async ({ stepNumber, finishReason, toolCalls }) => {
        console.log("[lifi-agent]", {
          stepNumber,
          finishReason,
          toolsUsed: toolCalls?.map((tc) => tc.toolName),
        });
      },
    });
  } catch (err) {
    console.error("[lifi-agent] fatal error", err);
    return new Response(
      JSON.stringify({ error: "Agent error. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
