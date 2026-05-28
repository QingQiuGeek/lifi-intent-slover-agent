# LI.FI Intent Agent 实施计划

> **For Hermes:** 使用 `subagent-driven-development` skill 按任务逐步实现本计划。

**目标：** 构建一个基于 Next.js 的全栈 Agent，能够理解自然语言形式的 LI.FI Intent 请求，获取 solver 报价，准备并提交 OIF 订单，引导用户完成钱包授权/签名，并跟踪订单状态。

**架构：** 服务端使用 AI SDK v6 的 `ToolLoopAgent`，通过类型化工具完成意图提取、LI.FI 报价/下单/状态查询，以及钱包动作规划。将模型提供方、LI.FI 传输层、钱包和存储都封装在小接口后面，使 MCP、直接 REST、浏览器存储和未来数据库存储都可以互换。

**技术栈：** Next.js 16 App Router、React 19、Tailwind CSS 4、AI SDK v6、兼容 OpenAI 协议的模型提供方、Zod、Reown AppKit、wagmi、viem、LI.FI Intents REST API，以及可选的 LI.FI Intents MCP。

---

## 参考事实

- LI.FI Intents integrator API 基础地址：
  - 生产环境：`https://order.li.fi`
  - 开发/测试网环境：`https://order-dev.li.fi`
- LI.FI Intents API 端点：
  - `POST /quote/request`
  - `POST /orders/submit`
  - `GET /orders/status`
  - `GET /chains/supported`
  - `GET /routes`
- `exact-output` 表示 `intent.swapType = "exact-output"`，目标输出数量固定，报价前输入数量为 `null`。
- 报价响应会包含 `quoteId`；后续 prepare/submit 流程中应保留并继续传递它。
- 最优报价位于 `quotes[0]`。
- 订单通常会经历 `Signed -> Delivered -> Settled`，同时也可能包含提交中、索引中等过渡状态。
- LI.FI Intents MCP 暴露了一条高层工作流：`get-supported-routes -> request-quote -> prepare-order -> submit-order -> track-order`。
- AI SDK v6 应使用：
  - `ToolLoopAgent`
  - `tool({ inputSchema })`，不要使用已弃用的 `parameters`
  - `createAgentUIStreamResponse({ agent, uiMessages })`
  - `useChat` 搭配 `DefaultChatTransport`

文档来源：
- `README.md`
- `node_modules/ai/docs/03-agents/02-building-agents.mdx`
- `node_modules/ai/docs/04-ai-sdk-ui/02-chatbot.mdx`
- `node_modules/ai/docs/07-reference/01-ai-sdk-core/16-tool-loop-agent.mdx`
- `node_modules/ai/docs/07-reference/01-ai-sdk-core/18-create-agent-ui-stream-response.mdx`
- https://docs.li.fi/lifi-intents/intents-api/api-overview
- https://docs.li.fi/lifi-intents/intents-api/request-quote
- https://docs.li.fi/lifi-intents/for-developers/status
- https://docs.li.fi/lifi-intents/mcp-server/examples

---

## 目标用户流程

1. 用户连接钱包。
2. 用户输入自然语言，例如：`Swap Base ETH to Ethereum USDT`。
3. Agent 识别出：
   - 源链：Base
   - 源资产：ETH
   - 目标链：Ethereum
   - 目标资产：USDT
   - 兑换模式：如果目标收到的数量固定，或者用户明确要求目标到账数量固定，则为 `exact-output`
   - 数量：如果缺失，则继续追问
   - 接收地址：默认使用已连接钱包地址，除非用户明确指定其他接收地址
4. Agent 调用 LI.FI 报价工具。
5. Agent 返回报价摘要以及下一步需要用户执行的动作：
   - 如果需要 ERC-20 allowance：展示授权交易请求
   - 如果需要支付原生 ETH：展示支付信息
   - 如果需要 EIP-712 订单签名：展示签名请求
   - 如果订单已经可提交：要求用户确认提交
6. 用户在钱包中确认/签名。
7. Agent 提交订单。
8. Agent 将订单/会话存储到本地。
9. Agent 跟踪订单，并展示 `Order ID`、状态时间线、输入/输出数量、链、代币和相关链接（如有）。

---

## 环境变量

创建 `.env.local.example`，并写明以下配置：

```bash
AI_PROVIDER_BASE_URL=
AI_PROVIDER_API_KEY=
AI_PROVIDER_MODEL=

LIFI_INTENTS_ENV=development
LIFI_INTENTS_BASE_URL=https://order-dev.li.fi
LIFI_INTENTS_TRANSPORT=rest
LIFI_INTENTS_MCP_URL=
LIFI_INTENTS_MCP_COMMAND=

NEXT_PUBLIC_REOWN_PROJECT_ID=
NEXT_PUBLIC_DEFAULT_CHAIN_ID=8453
```

规则：
- 绝不能将 `AI_PROVIDER_API_KEY` 暴露到浏览器。
- 默认使用 `order-dev.li.fi`，除非明确启用生产环境真实资产行为。
- 第一版优先实现直接 REST 传输。
- MCP 传输也通过同一个接口接入，后续通过配置启用。

---

## 建议目录结构

```text
app/
  api/
    chat/
      route.ts
  layout.tsx
  page.tsx
components/
  ai-studio-chat.tsx
  agent/
    agent-message.tsx
    intent-summary-card.tsx
    order-status-card.tsx
    quote-card.tsx
    wallet-action-card.tsx
  wallet/
    wallet-provider.tsx
    wallet-connect-button.tsx
lib/
  agents/
    lifi-agent.ts
    prompt.ts
  ai/
    model.ts
  lifi/
    client.ts
    errors.ts
    mcp-client.ts
    rest-client.ts
    schemas.ts
    token-resolver.ts
    types.ts
  storage/
    browser-store.ts
    index.ts
    memory-store.ts
    types.ts
  tools/
    extract-intent-tool.ts
    lifi-quote-tool.ts
    lifi-prepare-order-tool.ts
    lifi-submit-order-tool.ts
    lifi-track-order-tool.ts
    wallet-action-tool.ts
  wallet/
    chains.ts
    erc20.ts
    types.ts
    wagmi-config.ts
```

---

## 领域类型

在 `lib/lifi/types.ts` 中定义归一化后的应用层类型。它们应独立于 REST/MCP 的原始响应结构。

```ts
export type SwapMode = "exact-input" | "exact-output";

export type ChainRef = {
  chainId?: number;
  name?: string;
};

export type TokenRef = {
  chainId?: number;
  symbol?: string;
  address?: `0x${string}`;
  decimals?: number;
};

export type NaturalLanguageIntent = {
  sourceChain?: ChainRef;
  sourceToken?: TokenRef;
  destinationChain?: ChainRef;
  destinationToken?: TokenRef;
  amount?: string;
  amountSide?: "input" | "output";
  swapMode?: SwapMode;
  receiver?: `0x${string}`;
  userAddress?: `0x${string}`;
};

export type LifiQuoteSummary = {
  quoteId: string;
  validUntil: number;
  swapMode: SwapMode;
  input: {
    chainId: number;
    token: TokenRef;
    amount: string;
  };
  output: {
    chainId: number;
    token: TokenRef;
    amount: string;
    receiver: `0x${string}`;
  };
  raw: unknown;
};

export type WalletAction =
  | {
      type: "connect-wallet";
      reason: string;
    }
  | {
      type: "approve-erc20";
      chainId: number;
      token: `0x${string}`;
      spender: `0x${string}`;
      amount: string;
      reason: string;
    }
  | {
      type: "send-transaction";
      chainId: number;
      to: `0x${string}`;
      value?: string;
      data?: `0x${string}`;
      reason: string;
    }
  | {
      type: "sign-typed-data";
      chainId: number;
      typedData: unknown;
      reason: string;
    }
  | {
      type: "confirm-submit";
      quoteId?: string;
      orderPreview: unknown;
      reason: string;
    };

export type SubmittedOrder = {
  catalystOrderId?: string;
  onChainOrderId?: string;
  status?: string;
  quoteId?: string;
  createdAt: number;
  raw: unknown;
};
```

---

## 存储设计

在 `lib/storage/types.ts` 中定义存储接口：

```ts
import type { SubmittedOrder } from "@/lib/lifi/types";
import type { UIMessage } from "ai";

export type StoredSession = {
  id: string;
  title: string;
  messages: UIMessage[];
  orderIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type AgentStore = {
  listSessions(): Promise<StoredSession[]>;
  getSession(id: string): Promise<StoredSession | null>;
  saveSession(session: StoredSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
  listOrders(): Promise<SubmittedOrder[]>;
  getOrder(id: string): Promise<SubmittedOrder | null>;
  saveOrder(order: SubmittedOrder): Promise<void>;
};
```

实现：
- `browser-store.ts`：基于 `localStorage` 的客户端存储实现
- `memory-store.ts`：服务端/测试环境的回退实现
- `index.ts`：导出工厂函数。未来数据库存储也应满足同一接口

关键边界：
- 浏览器存储负责 UI 会话和订单缓存
- 服务端路由从客户端请求中接收当前 `messages` 和钱包上下文，不要在生产中依赖服务端内存状态

---

## LI.FI Client 设计

创建 `lib/lifi/client.ts`：

```ts
import type {
  LifiQuoteSummary,
  NaturalLanguageIntent,
  SubmittedOrder,
} from "@/lib/lifi/types";

export type QuoteRequestInput = {
  intent: NaturalLanguageIntent;
  userAddress: `0x${string}`;
  receiver: `0x${string}`;
};

export type PrepareOrderInput = {
  quoteId: string;
  userAddress: `0x${string}`;
};

export type SubmitOrderInput = {
  preparedOrder: unknown;
  signature?: `0x${string}`;
  transactionHash?: `0x${string}`;
};

export type TrackOrderInput = {
  catalystOrderId?: string;
  onChainOrderId?: string;
};

export type LifiIntentClient = {
  getSupportedChains(): Promise<unknown>;
  getSupportedRoutes(): Promise<unknown>;
  requestQuote(input: QuoteRequestInput): Promise<LifiQuoteSummary>;
  prepareOrder(input: PrepareOrderInput): Promise<unknown>;
  submitOrder(input: SubmitOrderInput): Promise<SubmittedOrder>;
  trackOrder(input: TrackOrderInput): Promise<SubmittedOrder>;
};
```

创建两个实现：
- `rest-client.ts`：直接通过 `fetch` 请求 `LIFI_INTENTS_BASE_URL`
- `mcp-client.ts`：对 `request-quote`、`prepare-order`、`submit-order`、`track-order` 的 AI SDK MCP 包装

传输层工厂：

```ts
export function createLifiIntentClient(): LifiIntentClient {
  if (process.env.LIFI_INTENTS_TRANSPORT === "mcp") {
    return createLifiMcpClient();
  }

  return createLifiRestClient({
    baseUrl:
      process.env.LIFI_INTENTS_BASE_URL ??
      "https://order-dev.li.fi",
  });
}
```

REST client 职责：
- 将标准化 intent 编码成 LI.FI Intents API 所需的请求
- 将链/代币/用户字段转换为 EIP-7930 interoperable address
- 使用缓存的 `/chains/supported` 和 `/routes` 数据解析链名和代币符号
- 根据代币精度将数量标准化为最小单位
- 将原始响应归一化为 `LifiQuoteSummary` 和 `SubmittedOrder`
- 对缺少路由、过期报价、非法数量、不支持的代币、信息不足和 API 失败返回类型化错误

MCP client 职责：
- 通过同样的应用层输入/输出类型包装 MCP 工具
- 允许 MCP 服务端内部完成链名/代币名解析与 EIP-7930 处理
- 将 MCP 结果中的引导性 `message` 字段透传给 agent 作为工具输出

---

## Agent Prompt

创建 `lib/agents/prompt.ts`：

```ts
export const LIFI_AGENT_PROMPT = `
You are a LI.FI Intents execution agent for EVM users.

Your job:
- Understand natural-language swap/payment requests.
- Extract source chain, source asset, destination chain, destination asset, amount, amount side, receiver, and user wallet.
- Decide exact-input vs exact-output:
  - exact-input: input amount is fixed, output amount is quoted.
  - exact-output: destination amount is fixed, required input amount is quoted.
- Use tools to request quotes, prepare orders, submit orders, and track orders.
- Explain wallet actions clearly before the user signs or sends anything.

Safety rules:
- Never submit an order unless the user has confirmed the current quote/order.
- Never invent chain IDs, token addresses, amounts, quote IDs, order IDs, approvals, or transaction hashes.
- If amount, wallet, receiver, source chain/token, or destination chain/token is missing, ask a concise follow-up question before quoting.
- Treat native ETH and ERC-20 approvals differently.
- If quote validity has expired, request a fresh quote.
- If an operation can move funds, summarize chain, token, amount, receiver, spender/contract, and order ID before asking for confirmation.
- Keep responses concise and action-oriented.
- Use Chinese when the user writes Chinese.

Output expectations:
- For quote results, show input amount, output amount, chains, tokens, quote expiry, and next action.
- For wallet actions, say exactly what the user needs to approve/sign/submit.
- For order tracking, show catalystOrderId/onChainOrderId and status timeline.
`;
```

---

## Agent 与工具设计

创建 `lib/agents/lifi-agent.ts`：

```ts
import { InferAgentUIMessage, stepCountIs, ToolLoopAgent } from "ai";
import { getModel } from "@/lib/ai/model";
import { LIFI_AGENT_PROMPT } from "@/lib/agents/prompt";
import { extractIntentTool } from "@/lib/tools/extract-intent-tool";
import { lifiQuoteTool } from "@/lib/tools/lifi-quote-tool";
import { lifiPrepareOrderTool } from "@/lib/tools/lifi-prepare-order-tool";
import { lifiSubmitOrderTool } from "@/lib/tools/lifi-submit-order-tool";
import { lifiTrackOrderTool } from "@/lib/tools/lifi-track-order-tool";
import { walletActionTool } from "@/lib/tools/wallet-action-tool";

export const lifiAgent = new ToolLoopAgent({
  id: "lifi-intent-agent",
  model: getModel(),
  instructions: LIFI_AGENT_PROMPT,
  stopWhen: stepCountIs(8),
  tools: {
    extractIntent: extractIntentTool,
    requestQuote: lifiQuoteTool,
    prepareOrder: lifiPrepareOrderTool,
    planWalletAction: walletActionTool,
    submitOrder: lifiSubmitOrderTool,
    trackOrder: lifiTrackOrderTool,
  },
});

export type LifiAgentUIMessage = InferAgentUIMessage<typeof lifiAgent>;
```

工具行为：

### `extractIntentTool`

用途：
- 将自然语言转换为 `NaturalLanguageIntent`
- 可以通过模型辅助结构化提取，也可以在模型选定字段后做确定性归一化

输入 schema：
- `text`
- 可选 `walletAddress`
- 可选 `connectedChainId`
- 可选 `knownReceiver`

输出：
- 归一化后的 intent
- 缺失字段列表
- 置信度
- 推荐追问语句

### `lifiQuoteTool`

用途：
- 请求 solver 报价

输入 schema：
- 源链/源代币
- 目标链/目标代币
- 数量
- 数量侧 `amount side`
- `swap mode`
- 用户地址
- 接收地址

输出：
- `LifiQuoteSummary`
- 报价过期时间
- 最优报价摘要
- 下一步最可能的钱包动作

### `lifiPrepareOrderTool`

用途：
- 将报价/订单准备成可供钱包签名或交易的格式

输入 schema：
- `quote ID`
- 用户地址
- 已选择的报价摘要

输出：
- prepared order
- 如果需要 EIP-712 签名，则返回 typed data
- 如果需要链上交易，则返回 transaction request
- 如果需要代币授权，则返回 allowance 要求

### `walletActionTool`

用途：
- 将 prepared order / allowance 数据转换为 UI 可展示的钱包动作卡片

输入 schema：
- 动作类型
- 链 ID
- token/spender/amount 或 tx request 或 typed data
- 原因说明

输出：
- `WalletAction`
- 人类可读的确认文本
- 客户端钱包执行所需的机器可读 payload

### `lifiSubmitOrderTool`

用途：
- 向 LI.FI 提交已签名订单或绑定了交易结果的订单

输入 schema：
- prepared order
- signature 或 transaction hash
- quote ID

输出：
- `SubmittedOrder`

### `lifiTrackOrderTool`

用途：
- 按 `catalystOrderId` 或 `onChainOrderId` 跟踪订单

输入 schema：
- `catalystOrderId`
- `onChainOrderId`

输出：
- 状态
- 时间线
- 原始 LI.FI 响应

---

## 模型提供方

创建 `lib/ai/model.ts`。

优先实现：
- 安装 `@ai-sdk/openai-compatible`
- 使用 `createOpenAICompatible`，通过 `AI_PROVIDER_BASE_URL`、`AI_PROVIDER_API_KEY`、`AI_PROVIDER_MODEL` 完成接入

预期实现：

```ts
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function getModel() {
  const baseURL = process.env.AI_PROVIDER_BASE_URL;
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const model = process.env.AI_PROVIDER_MODEL;

  if (!baseURL || !apiKey || !model) {
    throw new Error("Missing AI provider configuration");
  }

  const provider = createOpenAICompatible({
    name: "custom-openai-compatible",
    baseURL,
    apiKey,
  });

  return provider.chatModel(model);
}
```

安装命令：

```bash
npm install @ai-sdk/openai-compatible
```

如果实现 MCP 传输：

```bash
npm install @ai-sdk/mcp
```

---

## API 路由

创建 `app/api/chat/route.ts`：

```ts
import { createAgentUIStreamResponse } from "ai";
import { lifiAgent } from "@/lib/agents/lifi-agent";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const { messages, wallet, sessionId } = body;

  return createAgentUIStreamResponse({
    agent: lifiAgent,
    uiMessages: messages,
    options: {
      wallet,
      sessionId,
    },
    onStepFinish: async ({ stepNumber, finishReason, toolCalls }) => {
      console.log("lifi-agent-step", {
        stepNumber,
        finishReason,
        toolsUsed: toolCalls?.map((toolCall) => toolCall.toolName),
      });
    },
  });
}
```

如果最终类型定义不接受 `options`，则在 `ToolLoopAgent` 上使用 `callOptionsSchema`，并对应调整路由实现。

---

## 钱包集成

安装：

```bash
npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem
```

创建：
- `lib/wallet/chains.ts`
- `lib/wallet/wagmi-config.ts`
- `components/wallet/wallet-provider.tsx`
- `components/wallet/wallet-connect-button.tsx`

钱包层职责：
- 连接/断开钱包
- 暴露 `address`、`chainId`、连接状态
- 在授权/签名/交易前切链
- 通过 `writeContract` 执行 ERC-20 授权
- 通过 `sendTransaction` 执行交易
- 通过 `signTypedData` 执行 typed data 签名
- 将 transaction hash / signature 返回给聊天流程

UI 行为：
- 工具输出的 `WalletAction` 通过 `wallet-action-card.tsx` 渲染
- 卡片上有明确用户动作按钮：
  - `Connect wallet`
  - `Approve token`
  - `Sign order`
  - `Send transaction`
  - `Confirm submit`
- 钱包动作成功后，向 `/api/chat` 发送一条带结构化结果的追踪消息：

```ts
sendMessage({
  text: `Wallet action completed: ${action.type}`,
}, {
  body: {
    wallet,
    walletActionResult: {
      actionId,
      signature,
      transactionHash,
    },
  },
});
```

不要让 agent 假装钱包动作已经发生。钱包动作必须在浏览器中真实执行，并将真实的 hash/signature 回传。

---

## 前端聊天迁移

当前文件：
- `components/ai-studio-chat.tsx`

从本地模拟回复改为 AI SDK 流式对话：
- 从 `@ai-sdk/react` 引入 `useChat`
- 从 `ai` 引入 `DefaultChatTransport`
- 使用应用自己的类型 `LifiAgentUIMessage`
- 保持现有深色聊天布局
- 渲染消息的 `parts`，不要使用已弃用的 `content`
- 渲染类型化工具 part：
  - `tool-extractIntent`
  - `tool-requestQuote`
  - `tool-prepareOrder`
  - `tool-planWalletAction`
  - `tool-submitOrder`
  - `tool-trackOrder`

示例骨架：

```tsx
const { messages, sendMessage, status, stop, regenerate, error } =
  useChat<LifiAgentUIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        sessionId: activeSessionId,
        wallet: walletSnapshot,
      }),
    }),
    onFinish: ({ messages }) => {
      store.saveSession({
        ...session,
        messages,
        updatedAt: Date.now(),
      });
    },
  });
```

输入框状态仍由前端手动管理：

```tsx
const [input, setInput] = useState("");
```

提交时：

```tsx
sendMessage(
  { text: input },
  { body: { sessionId: activeSessionId, wallet: walletSnapshot } },
);
setInput("");
```

---

## UI 组件

### `quote-card.tsx`

展示：
- quote ID
- swap mode
- 输入链/代币/数量
- 输出链/代币/数量
- 报价过期倒计时
- solver / exclusive 等元数据（如果 API 提供）
- 按钮：`Prepare order`

### `wallet-action-card.tsx`

展示：
- 动作类型
- 链
- token/spender/value
- 原因
- 主操作按钮
- 结果状态：idle、awaiting wallet、pending transaction、completed、failed

### `order-status-card.tsx`

展示：
- `catalystOrderId`
- `onChainOrderId`
- 状态徽标
- 时间线：submitted/open/signed/delivered/settled/refunded/failed（以实际返回为准）
- 按钮：`Refresh status`

### `intent-summary-card.tsx`

展示：
- 识别出的链/代币
- exact-input / exact-output
- 缺失字段
- receiver
- 置信度 / 推荐追问

---

## 实施任务

### 任务 1：补充环境变量模板

**目标：** 记录运行时所需配置。

**文件：**
- 新建：`.env.local.example`
- 修改：`README.md`

**步骤：**
1. 添加上文列出的环境变量。
2. 在 README 中新增 `Local configuration` 章节。
3. 明确说明默认使用 `order-dev.li.fi`，只有显式开启时才使用生产环境。

**验证：**

```bash
npm run lint
```

期望：通过。

---

### 任务 2：增加 AI Provider 依赖和模型工厂

**目标：** 支持兼容 OpenAI 协议的模型提供方。

**文件：**
- 修改：`package.json`
- 新建：`lib/ai/model.ts`

**步骤：**
1. 执行 `npm install @ai-sdk/openai-compatible`。
2. 实现 `getModel()`。
3. 对缺失环境变量抛出清晰错误。

**验证：**

```bash
npm run build
```

期望：至少完成 Next 编译阶段。如果环境变量在 import 时就被强制读取，应重构 `getModel()`，让它只在 API 路由真正调用时才抛错。

---

### 任务 3：定义 LI.FI 领域 Schema

**目标：** 在编写工具之前先建立类型化内部契约。

**文件：**
- 新建：`lib/lifi/types.ts`
- 新建：`lib/lifi/schemas.ts`
- 新建：`lib/lifi/errors.ts`

**步骤：**
1. 补充“领域类型”部分中的 TypeScript 类型。
2. 补充工具输入所需的 Zod schema。
3. 增加错误类：
   - `MissingIntentFieldError`
   - `UnsupportedRouteError`
   - `QuoteExpiredError`
   - `LifiApiError`

**验证：**

```bash
npm run lint
npm run build
```

期望：通过。

---

### 任务 4：实现存储接口

**目标：** 让浏览器存储可替换。

**文件：**
- 新建：`lib/storage/types.ts`
- 新建：`lib/storage/browser-store.ts`
- 新建：`lib/storage/memory-store.ts`
- 新建：`lib/storage/index.ts`

**步骤：**
1. 实现 `AgentStore`。
2. 使用带版本号的 localStorage key：
   - `lifi-agent:v1:sessions`
   - `lifi-agent:v1:orders`
3. 处理 JSON 解析失败，返回空状态而不是让 UI 崩溃。

**验证：**

```bash
npm run build
```

期望：通过。

---

### 任务 5：实现 LI.FI REST Client 骨架

**目标：** 建立直接 API 接入边界。

**文件：**
- 新建：`lib/lifi/client.ts`
- 新建：`lib/lifi/rest-client.ts`

**步骤：**
1. 实现 `createLifiIntentClient()`。
2. 实现带类型错误处理的 `fetchJson()` 辅助函数。
3. 实现 `getSupportedChains()`、`getSupportedRoutes()`、`trackOrder()`。
4. 对 `requestQuote`、`prepareOrder`、`submitOrder` 先保留明确的 `throw new Error("Not implemented")`，直到后续任务完成。

**验证：**

```bash
npm run build
```

期望：通过。

---

### 任务 6：实现链和代币解析

**目标：** 将用户友好的链名/代币名解析为 API 可用值。

**文件：**
- 新建：`lib/lifi/token-resolver.ts`
- 修改：`lib/lifi/rest-client.ts`

**步骤：**
1. 添加链别名：
   - `ethereum`、`eth mainnet`、`mainnet` -> `1`
   - `base` -> `8453`
   - 开发模式下增加测试网别名
2. 尽量从 LI.FI route 数据中解析代币符号。
3. 只有在 route 数据无法提供时，才为常见代币增加 fallback 配置。
4. 增加从十进制字符串转换到最小单位的数量转换函数。
5. 增加 EIP-7930 interoperable address 编码器。

**验证：**

```bash
npm run build
```

手动检查：
- `Base ETH -> Ethereum USDT`
- `Ethereum USDC -> Base USDC`
- 未知代币应返回可操作的不支持错误，而不是直接失败。

---

### 任务 7：实现报价请求

**目标：** 将归一化 intent 转换为 LI.FI `/quote/request` 请求。

**文件：**
- 修改：`lib/lifi/rest-client.ts`
- 修改：`lib/lifi/schemas.ts`

**步骤：**
1. 校验必填字段。
2. 对于 `exact-input`：
   - 设置输入数量
   - 输出数量设为 `null`
3. 对于 `exact-output`：
   - 输入数量设为 `null`
   - 设置输出数量
4. 发送 `supportedTypes: ["oif-escrow-v0"]`
5. 将 `quotes[0]` 归一化成 `LifiQuoteSummary`
6. 保留原始响应，便于调试

**验证：**

```bash
npm run build
```

使用开发环境 API 做手动测试；如果不存在路由，错误信息应清晰，且不应导致 agent 崩溃。

---

### 任务 8：补充工具定义

**目标：** 将类型化工具暴露给 AI SDK agent。

**文件：**
- 新建：`lib/tools/extract-intent-tool.ts`
- 新建：`lib/tools/lifi-quote-tool.ts`
- 新建：`lib/tools/lifi-prepare-order-tool.ts`
- 新建：`lib/tools/lifi-submit-order-tool.ts`
- 新建：`lib/tools/lifi-track-order-tool.ts`
- 新建：`lib/tools/wallet-action-tool.ts`

**步骤：**
1. 使用 `tool({ description, inputSchema, execute })`。
2. 绝不使用已弃用的 `parameters`。
3. 工具输出必须可序列化。
4. `extractIntentTool` 在信息不足时应返回缺失字段，而不是胡乱猜测。
5. `lifiQuoteTool` 调用 `createLifiIntentClient().requestQuote`。
6. `lifiTrackOrderTool` 调用 `trackOrder`。
7. 在任务 11 之前，prepare/submit 工具可以先返回清晰的 `not implemented` 结果。

**验证：**

```bash
npm run lint
npm run build
```

期望：通过。

---

### 任务 9：构建 Agent

**目标：** 创建服务端 `ToolLoopAgent`。

**文件：**
- 新建：`lib/agents/prompt.ts`
- 新建：`lib/agents/lifi-agent.ts`

**步骤：**
1. 添加上文定义的 prompt。
2. 实例化 `ToolLoopAgent`。
3. 导出 `LifiAgentUIMessage`。
4. 使用 `stepCountIs(8)` 限制循环步数。

**验证：**

```bash
npm run build
```

期望：通过。

---

### 任务 10：增加流式聊天 API 路由

**目标：** 将 agent 响应以流的形式发送到浏览器。

**文件：**
- 新建：`app/api/chat/route.ts`

**步骤：**
1. 解析 `{ messages, wallet, sessionId }`。
2. 调用 `createAgentUIStreamResponse({ agent: lifiAgent, uiMessages: messages })`。
3. 增加 `onStepFinish` 日志。
4. 对用户屏蔽内部错误细节，同时在服务端保留可排查日志。

**验证：**

```bash
npm run build
```

手动验证：
- 空请求或非法请求应返回受控错误
- 正常聊天请求应返回 UI message stream

---

### 任务 11：增加钱包依赖与 Provider

**目标：** 将钱包状态接入聊天链路。

**文件：**
- 修改：`package.json`
- 新建：`lib/wallet/chains.ts`
- 新建：`lib/wallet/wagmi-config.ts`
- 新建：`components/wallet/wallet-provider.tsx`
- 新建：`components/wallet/wallet-connect-button.tsx`
- 修改：`app/layout.tsx`

**步骤：**
1. 执行 `npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem`。
2. 配置支持的 EVM 链。
3. 用钱包 provider 包住整个应用。
4. 在聊天头部加入钱包连接按钮。
5. 向聊天请求暴露 `walletSnapshot`。

**验证：**

```bash
npm run build
```

手动验证：
- 连接钱包
- 断开钱包
- 地址和链 ID 能出现在请求体中

---

### 任务 12：将聊天 UI 切换到 AI SDK 流式模式

**目标：** 用真实 agent 流式回复替换本地模拟消息。

**文件：**
- 修改：`components/ai-studio-chat.tsx`
- 新建：`components/agent/agent-message.tsx`

**步骤：**
1. 将本地 `messages` 模拟逻辑替换为 `useChat<LifiAgentUIMessage>`。
2. 保留会话列表，并通过 browser store 维护。
3. 渲染消息 `parts`。
4. 增加 stop / regenerate / error 控件。
5. 在完成时持久化消息。

**验证：**

```bash
npm run lint
npm run build
```

手动验证：
- 发送一条消息
- 能看到流式回复
- 刷新页面后会话可从 localStorage 恢复

---

### 任务 13：渲染工具结果

**目标：** 让工具调用结果对用户可理解。

**文件：**
- 新建：`components/agent/intent-summary-card.tsx`
- 新建：`components/agent/quote-card.tsx`
- 新建：`components/agent/order-status-card.tsx`
- 新建：`components/agent/wallet-action-card.tsx`
- 修改：`components/agent/agent-message.tsx`

**步骤：**
1. 根据类型化 part 名称分支，例如 `tool-requestQuote`。
2. 读取 `part.input` 或 `part.output` 前先检查状态。
3. 分别渲染 pending、output 和 error 状态。
4. 对钱包动作，只在浏览器端渲染可执行按钮。

**验证：**

```bash
npm run build
```

手动验证：
- quote 工具输出能渲染 quote 卡片
- track status 工具输出能渲染 order 卡片
- 缺失字段时应显示追问，而不是渲染坏掉的卡片

---

### 任务 14：实现 Prepare Order 和钱包动作

**目标：** 将报价转成钱包可执行的动作。

**文件：**
- 修改：`lib/lifi/rest-client.ts`
- 修改：`lib/tools/lifi-prepare-order-tool.ts`
- 修改：`lib/tools/wallet-action-tool.ts`
- 修改：`components/agent/wallet-action-card.tsx`
- 新建：`lib/wallet/erc20.ts`

**步骤：**
1. 针对选定的 LI.FI API 响应实现 prepare order 路径。
2. 判断当前需要的是 allowance、typed-data 签名还是交易发送。
3. 生成 `WalletAction`。
4. 在浏览器中使用 wagmi/viem 执行钱包动作。
5. 通过 `sendMessage` 和请求体元数据，将钱包动作结果返回给 agent。

**验证：**

```bash
npm run build
```

在测试网手动验证：
- ERC-20 授权请求会拉起钱包
- typed data 签名会拉起钱包
- transaction request 会拉起钱包

---

### 任务 15：实现 Submit Order

**目标：** 将已签名/已准备好的 intent 订单提交给 LI.FI。

**文件：**
- 修改：`lib/lifi/rest-client.ts`
- 修改：`lib/tools/lifi-submit-order-tool.ts`
- 修改：`components/agent/wallet-action-card.tsx`

**步骤：**
1. 只有在钱包动作结果已存在时才允许提交。
2. 调用 `/orders/submit` 。
3. 将响应归一化成 `SubmittedOrder`。
4. 将订单持久化到 browser store。
5. 立即触发一次 `trackOrder`。

**验证：**

```bash
npm run build
```

手动验证：
- 在 development/testnet 上提交订单
- UI 能显示 `catalystOrderId` 或 `onChainOrderId`

---

### 任务 16：实现订单跟踪 UX

**目标：** 让用户在订单提交后持续查看状态。

**文件：**
- 修改：`lib/lifi/rest-client.ts`
- 修改：`components/agent/order-status-card.tsx`
- 修改：`components/ai-studio-chat.tsx`

**步骤：**
1. 实现 `GET /orders/status`。
2. 增加刷新按钮。
3. 在状态未终态时可选启用轮询。
4. 存储最新状态。
5. 到达终态后停止轮询。

**验证：**

```bash
npm run build
```

手动验证：
- 刷新页面后仍可刷新状态
- 未知订单 ID 返回受控错误

---

### 任务 17：增加 MCP 传输

**目标：** 支持通过配置在 REST 和 MCP 之间切换。

**文件：**
- 修改：`package.json`
- 新建：`lib/lifi/mcp-client.ts`
- 修改：`lib/lifi/client.ts`

**步骤：**
1. 安装 `@ai-sdk/mcp`。
2. 支持远程 MCP URL。
3. 支持通过配置启动 stdio MCP command。
4. 将 MCP 工具映射为 `LifiIntentClient`。
5. 在合适时机关闭 MCP client 连接。

**验证：**

```bash
LIFI_INTENTS_TRANSPORT=mcp npm run build
```

手动验证：
- 通过 MCP 进行 route discovery
- 通过 MCP 发起 quote

---

### 任务 18：增加风控与错误恢复

**目标：** 防止错误金融动作。

**文件：**
- 修改：`lib/agents/prompt.ts`
- 修改：`lib/tools/*.ts`
- 修改：`components/agent/*.tsx`

**步骤：**
1. 提交订单前必须要求显式确认。
2. 对过期 quote 自动重新报价。
3. 拒绝缺失 amount / receiver / source / destination 的请求直接进入资金流程。
4. 如果 route 数据可用，则在不支持路由时给出替代建议。
5. 明确区分原生 token 支付和 ERC-20 allowance。
6. 除非用户显式开启 one-click execution，否则钱包签名后不要自动提交订单。

**验证：**

```bash
npm run lint
npm run build
```

手动验证：
- 缺少 amount 的 prompt 会触发追问
- 不支持路由的 prompt 会给出明确解释
- 过期 quote 会触发重新报价

---

### 任务 19：端到端测试矩阵

**目标：** 在接近生产前验证核心行为。

手动场景：

1. 缺少数量：
   - 输入：`Swap Base ETH to Ethereum USDT`
   - 期望：agent 追问数量，或者追问是否固定目标到账数量

2. `exact-output`：
   - 输入：`I want to receive 100 USDT on Ethereum and pay with ETH on Base`
   - 期望：`swapType = exact-output`；quote 固定输出数量并返回所需输入数量

3. `exact-input`：
   - 输入：`Swap 0.05 ETH on Base to USDT on Ethereum`
   - 期望：`swapType = exact-input`；quote 固定输入数量并返回预估输出数量

4. 自定义 receiver：
   - 输入中包含接收地址
   - 期望：receiver 不会被静默替换成当前连接钱包地址

5. 未连接钱包：
   - 期望：在 quote/prepare 前出现 wallet connect 动作

6. quote 过期：
   - 期望：过期 quote 不能提交，必须重新 quote

7. 订单跟踪：
   - 给定 `catalystOrderId`
   - 期望：agent 调用状态查询并渲染时间线

命令：

```bash
npm run lint
npm run build
npm run dev
```

期望：
- lint 通过
- 生产构建通过
- 应用可打开且聊天能正常流式工作
- 浏览器 bundle 中不包含服务端 API key

---

## 生产就绪检查清单

- [ ] 已显式选择生产 LI.FI base URL
- [ ] 已先在测试网完整验证流程，再进入主网
- [ ] 钱包确认文案已审查
- [ ] 已展示 API 提供的 slippage / quote validity / fees 信息
- [ ] 已处理订单终态
- [ ] 用户可以导出/复制 order ID
- [ ] 清空浏览器存储不会导致应用损坏
- [ ] API key 仅存在于服务端
- [ ] 工具错误对用户可读
- [ ] MCP 与 REST 传输暴露相同的应用层行为
- [ ] 最终 UI 在桌面和移动端宽度下都可用

---

## 待决策项

这些问题不会阻塞实施，因为它们都已抽象成配置或适配器：

- 最终使用哪个兼容 OpenAI 协议的模型提供方和模型 ID
- 第一阶段接入 LI.FI development 还是 production
- LI.FI MCP 是主传输还是备用传输
- 订单提交是在签名后 one-click 自动继续，还是必须二次显式确认-----采用自动继续
- 后续持久化存储应使用 IndexedDB、Supabase、Postgres 还是其他后端
