<div align="center">

<img src="./public/logo.png" alt="LI.FI Intent Agent Logo" width="96" />

# LI.FI Intent Agent

**🏆 Hackathon Project — An AI agent that turns plain-language cross-chain swap requests into executable intents via the LI.FI Solver Marketplace.**

[![Hackathon](https://img.shields.io/badge/🏆-Hackathon%20Project-f59e0b)](https://docs.li.fi/lifi-intents/introduction)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://lifi-intent-slover-agent-nbt95rhaa-3343759238-qqcoms-projects.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-6.x-black?logo=vercel)](https://ai-sdk.dev/)
[![LI.FI](https://img.shields.io/badge/LI.FI-Intents%20API-6c4de6)](https://docs.li.fi/lifi-intents/introduction)
[![wagmi](https://img.shields.io/badge/wagmi-v3-blue)](https://wagmi.sh/)

[English](#english) · [中文](#中文)

</div>

---

## English

### Overview

**LI.FI Intent Agent** is a hackathon project that bridges natural language and on-chain cross-chain transfers. Built with the [Vercel AI SDK](https://ai-sdk.dev/) tool-loop agent pattern, it lets you describe a swap in plain English or Chinese — the agent parses your intent, routes it through the [LI.FI Intent/Solver Marketplace](https://docs.li.fi/lifi-intents/introduction), fetches a live quote, and (when complete) guides you through the single on-chain wallet step needed to settle the transfer.

The AI SDK's `ToolLoopAgent` drives the entire reasoning loop: each turn the model decides which tool to call next (`extractIntent → requestQuote → prepareOrder → submitOrder → trackOrder`), with structured Zod schemas enforcing type safety at every boundary.

> **Note:** Order preparation and on-chain submission (tasks 14 & 15) are under active development. The agent currently covers intent parsing, quote fetching, and order tracking.

---

### Screenshots

| Home — welcome cards | Chat — fallback suggestions |
|---|---|
| ![Home](./asset/首页.png) | ![Session 1](./asset/会话1.png) |

| Chat — multi-hop quote plan | Chat — two-step route table |
|---|---|
| ![Session 2](./asset/会话2.png) | ![Session 3](./asset/会话3.png) |

---

### Features

- **Natural language interface** — describe swaps like "Swap 5 USDC on Base to Arbitrum" and the agent handles the rest
- **Smart quote routing** — fetches live quotes from LI.FI Intents solvers; surfaces multi-hop alternatives (e.g. Polygon → Arbitrum → Ethereum) when a direct route has no solver inventory
- **Markdown-rendered results** — quote summaries are displayed as formatted tables with input/output amounts, bridge fees, and quote expiry
- **Session history** — sidebar lists all past conversations with auto-generated titles; click the logo to start a new session
- **Wallet connection** — connect any EVM wallet via Reown AppKit (MetaMask, WalletConnect, Coinbase Wallet, etc.)
- **Dark / Light theme** — system-aware, toggle in header
- **Copy to clipboard** — one-click copy on every message bubble

---

### Supported Routes (Solver Inventory)

LI.FI Intents solvers support **same-token cross-chain transfers** only. Most reliable pairs:

| From | To | Max Liquidity | Recommended |
|---|---|---|---|
| Base USDC | Arbitrum USDC | ~71,265 USDC | ⭐ Best |
| Polygon USDC | Ethereum USDC | ~47,500 USDC | ⭐ Good |
| Arbitrum USDC | Optimism USDC | ~1,978 USDC | ✓ |
| BSC USDT | Ethereum USDT | ~3.4 USDT | Small |

> Cross-token cross-chain swaps (e.g. USDT → USDC) are not directly supported. The agent will propose two-step workarounds automatically.

---

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI Agent | [Vercel AI SDK](https://ai-sdk.dev/) v6 — `ToolLoopAgent`, streaming, Zod tool schemas |
| LLM | OpenAI-compatible providers — Alibaba Qwen, OpenAI, or any compatible model |
| Cross-chain | LI.FI Intents API (`order.li.fi`) |
| Wallet | Reown AppKit + wagmi v3 + viem |
| Styling | TailwindCSS v4 |
| Markdown | react-markdown + remark-gfm |
| Storage | localStorage (session history) |

---

### Quick Start

#### 1. Clone & Install

```bash
git clone <repo-url>
cd lifi-intent-slover
npm install
```

#### 2. Configure Environment

Copy the example env file and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Description | Example |
|---|---|---|
| `AI_PROVIDER_BASE_URL` | OpenAI-compatible API base URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `AI_PROVIDER_API_KEY` | LLM API key (server-side only, never expose to browser) | `sk-xxx` |
| `AI_PROVIDER_MODEL` | Model name | `qwen-plus` |
| `LIFI_INTENTS_BASE_URL` | LI.FI Intents API base URL | `https://order.li.fi` (production) |
| `LIFI_SOLVER_API_KEY` | LI.FI solver API key (optional) | — |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Reown AppKit project ID (get from [cloud.reown.com](https://cloud.reown.com)) | `abc123...` |

> **Security:** `AI_PROVIDER_API_KEY` is used server-side only. Never prefix it with `NEXT_PUBLIC_`.

> **Environment:** Omit `LIFI_INTENTS_BASE_URL` to default to the dev environment (`order-dev.li.fi`). Set it to `https://order.li.fi` for production.

#### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

### Project Structure

```
app/                    # Next.js App Router
  api/chat/             # Streaming chat API route (AI agent)
components/
  agent/                # AgentMessage — markdown-rendered AI responses
  chat/                 # ChatSidebar, MessageList, WelcomeView, Header
lib/
  agents/               # Agent definition, system prompt
  lifi/                 # LI.FI REST client, token resolver, route cache
  tools/                # AI SDK tools: extractIntent, requestQuote, trackOrder
  web3/                 # wagmi config, wallet hooks
  storage/              # localStorage session persistence
```

---

### Reference

- [LI.FI Intents Introduction](https://docs.li.fi/lifi-intents/introduction)
- [LI.FI Intents MCP Server](https://docs.li.fi/lifi-intents/mcp-server/overview)
- [AI SDK Agents](https://ai-sdk.dev/docs/agents/overview)
- [Next.js Docs](https://nextjs.org/docs)
- [Reown AppKit](https://docs.reown.com/)
- [wagmi](https://docs.wagmi.com/wagmi)
- [viem](https://viem.sh/docs/getting-started)

---

## 中文

### 项目简介

**LI.FI Intent Agent** 是一个黑客松项目，将自然语言与链上跨链转账打通。基于 [Vercel AI SDK](https://ai-sdk.dev/) 的工具循环 Agent 模式构建：你只需用中文或英文描述兑换需求，Agent 自动解析意图、通过 [LI.FI Intent/Solver 市场](https://docs.li.fi/lifi-intents/introduction)获取实时报价，并（完成后）引导你完成唯一一笔链上钱包操作。

AI SDK 的 `ToolLoopAgent` 驱动整个推理循环：每一轮模型自主决定调用哪个工具（`extractIntent → requestQuote → prepareOrder → submitOrder → trackOrder`），Zod schema 在每个边界强制类型安全。

> **说明：** 订单准备和链上提交（任务 14 & 15）正在开发中。当前已支持意图解析、报价获取和订单追踪。

---

### 截图预览

| 首页 — 快捷操作卡片 | 对话 — 智能替代方案 |
|---|---|
| ![首页](./asset/首页.png) | ![会话1](./asset/会话1.png) |

| 对话 — 多跳报价方案 | 对话 — 两步路由表格 |
|---|---|
| ![会话2](./asset/会话2.png) | ![会话3](./asset/会话3.png) |

---

### 主要功能

- **自然语言输入** — 用对话描述需求，如"把 Base 上的 5 USDC 换到 Arbitrum"
- **智能报价路由** — 实时从 LI.FI Intents solver 网络获取报价；当直接路由暂无 solver 时，自动规划多跳替代路线（如 Polygon → Arbitrum → Ethereum）
- **Markdown 渲染** — 报价结果以格式化表格展示，含输入/输出金额、桥接费率、报价过期时间
- **会话历史** — 侧边栏列出所有历史对话，自动生成标题；点击 logo 开启新会话
- **钱包连接** — 支持通过 Reown AppKit 连接任意 EVM 钱包（MetaMask、WalletConnect、Coinbase 等）
- **明暗主题** — 跟随系统偏好，可在顶栏手动切换
- **一键复制** — 每条消息气泡下方有复制按钮

---

### 支持路由（Solver 库存）

LI.FI Intents solver 网络仅支持**相同代币的跨链转账**。最可靠路由：

| 源链 | 目标链 | Solver 最大库存 | 推荐度 |
|---|---|---|---|
| Base USDC | Arbitrum USDC | ~71,265 USDC | ⭐ 最佳 |
| Polygon USDC | Ethereum USDC | ~47,500 USDC | ⭐ 良好 |
| Arbitrum USDC | Optimism USDC | ~1,978 USDC | ✓ |
| BSC USDT | Ethereum USDT | ~3.4 USDT | 库存较浅 |

> 跨代币跨链（如 USDT → USDC）不被直接支持，Agent 会自动提出两步替代方案。

---

### 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16（App Router） |
| AI Agent | [Vercel AI SDK](https://ai-sdk.dev/) v6 — `ToolLoopAgent`、流式输出、Zod 工具 schema |
| LLM | OpenAI 兼容接口 — 阿里云 Qwen、OpenAI 或任意兼容模型 |
| 跨链协议 | LI.FI Intents API（`order.li.fi`） |
| 钱包 | Reown AppKit + wagmi v3 + viem |
| 样式 | TailwindCSS v4 |
| Markdown | react-markdown + remark-gfm |
| 存储 | localStorage（会话持久化） |

---

### 快速开始

#### 1. 克隆项目 & 安装依赖

```bash
git clone <repo-url>
cd lifi-intent-slover
npm install
```

#### 2. 配置环境变量

复制示例文件并填写配置：

```bash
cp .env.local.example .env.local
```

| 变量 | 说明 | 示例 |
|---|---|---|
| `AI_PROVIDER_BASE_URL` | OpenAI 兼容接口地址 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `AI_PROVIDER_API_KEY` | LLM API 密钥（仅服务端，不可暴露到浏览器） | `sk-xxx` |
| `AI_PROVIDER_MODEL` | 模型名称 | `qwen-plus` |
| `LIFI_INTENTS_BASE_URL` | LI.FI Intents API 地址 | `https://order.li.fi`（生产环境） |
| `LIFI_SOLVER_API_KEY` | LI.FI Solver API 密钥（可选） | — |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Reown AppKit 项目 ID（在 [cloud.reown.com](https://cloud.reown.com) 注册获取） | `abc123...` |

> **安全提示：** `AI_PROVIDER_API_KEY` 仅用于服务端，**绝不能**加 `NEXT_PUBLIC_` 前缀。

> **环境切换：** 不设置 `LIFI_INTENTS_BASE_URL` 默认使用开发环境（`order-dev.li.fi`），设为 `https://order.li.fi` 使用生产环境。

#### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

---

### 目录结构

```
app/                    # Next.js App Router
  api/chat/             # 流式聊天 API 路由（AI Agent 后端）
components/
  agent/                # AgentMessage — Markdown 渲染的 AI 回复
  chat/                 # ChatSidebar、MessageList、WelcomeView、Header
lib/
  agents/               # Agent 定义、系统提示词
  lifi/                 # LI.FI REST 客户端、代币解析、路由缓存
  tools/                # AI SDK 工具：extractIntent、requestQuote、trackOrder
  web3/                 # wagmi 配置、钱包 hooks
  storage/              # localStorage 会话持久化
```

---

### 参考资料

- [LI.FI Intents 介绍](https://docs.li.fi/lifi-intents/introduction)
- [LI.FI Intents MCP Server](https://docs.li.fi/lifi-intents/mcp-server/overview)
- [AI SDK Agents 文档](https://ai-sdk.dev/docs/agents/overview)
- [Next.js 文档](https://nextjs.org/docs)
- [Reown AppKit 文档](https://docs.reown.com/)
- [wagmi 文档](https://docs.wagmi.com/wagmi)
- [viem 文档](https://viem.sh/docs/getting-started)
