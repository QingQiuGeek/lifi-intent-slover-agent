import { z } from "zod";

export const ChainRefSchema = z.object({
  chainId: z.number().optional(),
  name: z.string().optional(),
});

export const TokenRefSchema = z.object({
  chainId: z.number().optional(),
  symbol: z.string().optional(),
  address: z.string().optional(),
  decimals: z.number().optional(),
});

export const NaturalLanguageIntentSchema = z.object({
  sourceChain: ChainRefSchema.optional(),
  sourceToken: TokenRefSchema.optional(),
  destinationChain: ChainRefSchema.optional(),
  destinationToken: TokenRefSchema.optional(),
  amount: z.string().optional(),
  amountSide: z.enum(["input", "output"]).optional(),
  swapMode: z.enum(["exact-input", "exact-output"]).optional(),
  receiver: z.string().optional(),
  userAddress: z.string().optional(),
});

export const ExtractIntentInputSchema = z.object({
  text: z.string().describe("The natural language text describing the swap intent"),
  walletAddress: z.string().optional().describe("The connected wallet address"),
  connectedChainId: z.number().optional().describe("The currently connected chain ID"),
  knownReceiver: z.string().optional().describe("A known receiver address if specified by the user"),
});

export const LifiQuoteInputSchema = z.object({
  sourceChainId: z.number().describe("Source chain ID"),
  sourceTokenSymbol: z.string().describe("Source token symbol (e.g. ETH, USDT)"),
  sourceTokenAddress: z.string().optional().describe("Source token contract address"),
  destinationChainId: z.number().describe("Destination chain ID"),
  destinationTokenSymbol: z.string().describe("Destination token symbol"),
  destinationTokenAddress: z.string().optional().describe("Destination token contract address"),
  amount: z.string().describe("Amount as a decimal string (e.g. '0.05')"),
  amountSide: z.enum(["input", "output"]).describe("Whether the amount is for input or output"),
  swapMode: z.enum(["exact-input", "exact-output"]).describe("Swap mode"),
  userAddress: z.string().describe("User wallet address (0x...)"),
  receiver: z.string().optional().describe("Receiver address, defaults to userAddress"),
});

export const LifiPrepareOrderInputSchema = z.object({
  quoteId: z.string().describe("The quote ID from requestQuote"),
  userAddress: z.string().describe("User wallet address"),
  quoteSummary: z.unknown().describe("The quote summary object from requestQuote"),
});

export const LifiSubmitOrderInputSchema = z.object({
  preparedOrder: z.unknown().describe("The prepared order object from prepareOrder"),
  signature: z.string().optional().describe("EIP-712 signature (0x...)"),
  transactionHash: z.string().optional().describe("On-chain transaction hash (0x...)"),
  quoteId: z.string().optional().describe("Quote ID for reference"),
});

export const LifiTrackOrderInputSchema = z.object({
  catalystOrderId: z.string().optional().describe("The catalyst order ID"),
  onChainOrderId: z.string().optional().describe("The on-chain order ID"),
});

export const WalletActionInputSchema = z.object({
  type: z.enum(["connect-wallet", "approve-erc20", "send-transaction", "sign-typed-data", "confirm-submit"]),
  chainId: z.number().optional(),
  token: z.string().optional(),
  spender: z.string().optional(),
  amount: z.string().optional(),
  to: z.string().optional(),
  value: z.string().optional(),
  data: z.string().optional(),
  typedData: z.unknown().optional(),
  quoteId: z.string().optional(),
  orderPreview: z.unknown().optional(),
  reason: z.string().describe("Human-readable reason for this wallet action"),
});
