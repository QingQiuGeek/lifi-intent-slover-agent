"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LifiAgentUIMessage } from "@/lib/agents/lifi-agent";

const mdComponents = {
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-(--c-border)">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-(--c-surface) text-(--c-text2)" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-3 py-2 text-left text-xs font-semibold tracking-wide" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border-t border-(--c-border) px-3 py-2 text-(--c-text1)" {...props} />
  ),
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <pre className="my-2 overflow-x-auto rounded-lg bg-(--c-surface) p-3 text-[13px] text-(--c-text1)">
        <code className={className} {...props}>{children}</code>
      </pre>
    ) : (
      <code className="rounded bg-(--c-surface) px-1 py-0.5 text-[13px]" {...props}>{children}</code>
    );
  },
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="leading-relaxed" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-(--c-text1)" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noreferrer" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-1 list-inside list-disc space-y-0.5 pl-2" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="my-1 list-inside list-decimal space-y-0.5 pl-2" {...props} />
  ),
};

type Props = {
  message: LifiAgentUIMessage;
};

export function AgentMessage({ message }: Props) {
  return (
    <>
      {message.parts.map((part, idx) => {
        if (part.type === "text") {
          return (
            <div key={idx} className="space-y-2 text-[15px] leading-relaxed text-(--c-text1)">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{part.text}</ReactMarkdown>
            </div>
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
                className="inline-flex items-center gap-1.5 rounded-full border border-(--c-border2) bg-(--c-surface) px-2.5 py-1 text-[11px] text-(--c-text3)"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-(--c-text4)" />
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
