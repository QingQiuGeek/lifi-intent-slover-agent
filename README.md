## Local configuration

复制 `.env.local.example` 为 `.env.local` 并填写：

- **AI 模型（OpenAI 兼容）**：阿里云百炼示例
  - `AI_PROVIDER_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1`
  - `AI_PROVIDER_API_KEY=sk-xxx`（百炼控制台获取）
  - `AI_PROVIDER_MODEL=qwen-plus`
- **LI.FI Intents**：默认指向 `order-dev.li.fi`（开发/测试网）。**仅在显式确认后**才切换到 `https://order.li.fi` 生产环境。
- **传输层**：当前仅实现 `rest`；`mcp` 等任务 17 完成后再启用。
- **Reown AppKit**：钱包接入需要 `NEXT_PUBLIC_REOWN_PROJECT_ID`（在 https://cloud.reown.com 注册）。

`AI_PROVIDER_API_KEY` 仅用于服务端，**绝不能**以 `NEXT_PUBLIC_` 前缀暴露到浏览器。

## reference

[lifi-intents mcp](https://docs.li.fi/lifi-intents/mcp-server/overview)

[Intent / Solver Marketplace](https://docs.li.fi/lifi-intents/introduction)

[ai sdk](https://ai-sdk.dev/docs/introduction)

[ai sdk agents](https://ai-sdk.dev/docs/agents/overview)

[nextjs docs](https://nextjs.org/docs)

[reown](https://docs.reown.com/)

[wagmi](https://docs.wagmi.com/wagmi)

[viem](https://viem.sh/docs/getting-started)

##
