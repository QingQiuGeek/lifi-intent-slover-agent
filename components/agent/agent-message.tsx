"use client";

import type { LifiAgentUIMessage } from "@/lib/agents/lifi-agent";

type Props = {
  message: LifiAgentUIMessage;
};

export function AgentMessage({ message }: Props) {
  return (
    <>
      {message.parts.map((part, idx) => {
        if (part.type === "text") {
          return (
            <p
              key={idx}
              className="whitespace-pre-line text-sm leading-relaxed text-[#ececec]"
            >
              {part.text}
            </p>
          );
        }

        if (
          part.type === "tool-extractIntent" ||
          part.type === "tool-requestQuote" ||
          part.type === "tool-prepareOrder" ||
          part.type === "tool-planWalletAction" ||
          part.type === "tool-submitOrder" ||
          part.type === "tool-trackOrder"
        ) {
          const toolLabel: Record<string, string> = {
            "tool-extractIntent": "解析意图",
            "tool-requestQuote": "获取报价",
            "tool-prepareOrder": "准备订单",
            "tool-planWalletAction": "钱包操作",
            "tool-submitOrder": "提交订单",
            "tool-trackOrder": "跟踪状态",
          };

          if (part.state === "input-streaming") {
            return (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#3c3c3c] bg-[#2a2a2a] px-2.5 py-1 text-[11px] text-[#8e8e8e]"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5c5c5c]" />
                {toolLabel[part.type] ?? part.type}…
              </div>
            );
          }

          if (part.state === "output-available") {
            const output = part.output as Record<string, unknown> | undefined;
            const isSuccess = output?.success !== false;

            return (
              <div
                key={idx}
                className={`rounded-lg border px-3 py-2 text-xs ${
                  isSuccess
                    ? "border-[#2f5c2f] bg-[#1a2e1a] text-[#7ecf7e]"
                    : "border-[#5c2f2f] bg-[#2e1a1a] text-[#cf7e7e]"
                }`}
              >
                <span className="font-semibold">{toolLabel[part.type] ?? part.type}</span>
                {!isSuccess && output?.error ? (
                  <span className="ml-2 opacity-80">{String(output.error)}</span>
                ) : null}
                {isSuccess && part.type === "tool-requestQuote" && output?.summary ? (
                  <QuoteSummaryInline summary={output.summary as QuoteSummaryData} />
                ) : null}
                {isSuccess && part.type === "tool-trackOrder" && output?.order ? (
                  <span className="ml-2 opacity-80">
                    状态: {String((output.order as Record<string, unknown>).status ?? "—")}
                  </span>
                ) : null}
              </div>
            );
          }

          if (part.state === "output-error") {
            return (
              <div
                key={idx}
                className="rounded-lg border border-[#5c2f2f] bg-[#2e1a1a] px-3 py-2 text-xs text-[#cf7e7e]"
              >
                {toolLabel[part.type] ?? part.type} 出错
              </div>
            );
          }
        }

        return null;
      })}
    </>
  );
}

type QuoteSummaryData = {
  from?: string;
  to?: string;
  expiresInSec?: number;
  quoteId?: string;
  swapMode?: string;
};

function QuoteSummaryInline({ summary }: { summary: QuoteSummaryData }) {
  return (
    <span className="ml-2 opacity-90">
      {summary.from} → {summary.to}
      {summary.expiresInSec != null ? (
        <span className="ml-1 opacity-60">（{summary.expiresInSec}s 后过期）</span>
      ) : null}
    </span>
  );
}
