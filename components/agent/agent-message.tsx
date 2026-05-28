"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LifiAgentUIMessage } from "@/lib/agents/lifi-agent";
import type { WalletAction } from "@/lib/lifi/types";
import { WalletActionCard } from "@/components/agent/wallet-action-card";

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
  onSendMessage?: (text: string) => void;
};

export function AgentMessage({ message, onSendMessage }: Props) {
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
          part.type === "tool-requestQuote" ||
          part.type === "tool-prepareOrder" ||
          part.type === "tool-planWalletAction" ||
          part.type === "tool-submitOrder" ||
          part.type === "tool-trackOrder"
        ) {
          return (
            <ToolCallCard
              key={idx}
              part={part as unknown as ToolPart}
              onSendMessage={onSendMessage}
            />
          );
        }

        return null;
      })}
    </>
  );
}

// ── Tool label map ─────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  "tool-requestQuote":   "获取报价",
  "tool-prepareOrder":   "准备订单",
  "tool-planWalletAction": "钱包操作",
  "tool-submitOrder":    "提交订单",
  "tool-trackOrder":     "跟踪状态",
};

// ── Collapsible tool-call card ─────────────────────────────────────────────────

interface ToolPart {
  type: string;
  state: "input-streaming" | "output-available" | "output-error";
  output?: Record<string, unknown>;
}

function ToolCallCard({
  part,
  onSendMessage,
}: {
  part: ToolPart;
  onSendMessage?: (text: string) => void;
}): React.ReactElement | null {
  const label = TOOL_LABELS[part.type] ?? part.type;
  const [open, setOpen] = useState(false);

  // ── loading state ──────────────────────────────────────────────────────────
  if (part.state === "input-streaming") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-(--c-border2) bg-(--c-surface) px-2.5 py-1 text-[11px] text-(--c-text3)">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-(--c-text4)" />
        {label}…
      </div>
    );
  }

  // ── hard error (tool threw unhandled exception) ───────────────────────────
  if (part.state === "output-error") {
    return (
      <div className="rounded-lg border border-[#5c2f2f] bg-[#2e1a1a] px-3 py-1.5 text-xs text-[#cf7e7e]">
        <span className="font-semibold">{label}</span>
        <span className="ml-1.5 opacity-70">执行失败（服务器错误）</span>
      </div>
    );
  }

  // ── output available ────────────────────────────────────────────────────────
  if (part.state === "output-available") {
    const output = part.output as Record<string, unknown> | undefined;
    const isSuccess = output?.success !== false;

    // Build the collapsed one-line summary
    let collapsedDetail: React.ReactNode = null;
    if (part.type === "tool-requestQuote" && isSuccess && output?.summary) {
      const s = output.summary as { from?: string; to?: string; expiresInSec?: number };
      collapsedDetail = (
        <span className="ml-1.5 truncate opacity-80">
          {s.from} → {s.to}
          {s.expiresInSec != null && (
            <span className="ml-1 opacity-60">（{s.expiresInSec}s 后过期）</span>
          )}
        </span>
      );
    } else if (part.type === "tool-trackOrder" && isSuccess && output?.order) {
      const status = String((output.order as Record<string, unknown>).status ?? "—");
      collapsedDetail = <span className="ml-1.5 opacity-80">状态: {status}</span>;
    } else if (part.type === "tool-prepareOrder" && isSuccess) {
      collapsedDetail = <span className="ml-1.5 opacity-70">已构建 escrow 交易</span>;
    } else if (!isSuccess && output?.error) {
      const errStr = String(output.error);
      collapsedDetail = (
        <span className="ml-1.5 max-w-[260px] truncate opacity-80" title={errStr}>
          {errStr}
        </span>
      );
    }

    // Expanded detail: JSON of output (minus large fields)
    const expandedJson = JSON.stringify(
      output,
      (key, val) => (key === "raw" || key === "quoteSummary" ? "[omitted]" : val),
      2,
    );

    return (
      <div className="overflow-hidden rounded-lg border border-(--c-border2)">
        {/* header row — always visible, click to toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs transition-colors hover:bg-(--c-surface2) ${
            isSuccess ? "bg-[#1a2e1a]" : "bg-[#2e1a1a]"
          }`}
        >
          <span className={`shrink-0 whitespace-nowrap font-semibold ${isSuccess ? "text-[#7ecf7e]" : "text-[#cf7e7e]"}`}>
            {label}
          </span>
          <span className={`min-w-0 truncate ${isSuccess ? "text-[#7ecf7e]" : "text-[#cf7e7e]"}`}>
            {collapsedDetail}
          </span>
          <span className={`ml-auto shrink-0 text-[10px] transition-transform duration-150 ${isSuccess ? "text-[#7ecf7e]" : "text-[#cf7e7e]"} ${open ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {open ? (
          <div className="border-t border-(--c-border2) bg-(--c-surface) px-3 py-2">
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all text-[11px] text-(--c-text3)">
              {expandedJson}
            </pre>
          </div>
        ) : null}

        {isSuccess && part.type === "tool-planWalletAction" && output?.action != null && onSendMessage != null && (
          <div className="border-t border-(--c-border2)">
            <WalletActionCard
              action={output.action as WalletAction}
              onSendMessage={onSendMessage}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
