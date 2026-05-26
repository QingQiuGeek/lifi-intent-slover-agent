/**
 * Chains & tokens configuration
 *
 * Supported scope:
 * - LI.FI Intents API (order-dev.li.fi / order.li.fi) confirmed supported chains
 * - Reown AppKit wagmi chain list (all major EVM mainnets)
 *
 * Native token sentinel: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
 * This is NOT a real contract — it's the industry-standard placeholder address
 * used by LI.FI, Uniswap, 1inch, etc. to identify the chain's native gas token
 * (ETH on Ethereum/Base/Arbitrum/Optimism, MATIC/POL on Polygon,
 * AVAX on Avalanche, BNB on BSC) without special-casing it in swap logic.
 */

export const NATIVE_SENTINEL = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;

// ── Supported chains ─────────────────────────────────────────────────────────
// Aligned with: LI.FI Intents API + Reown AppKit EVM chain list

export type SupportedChain = {
  chainId: number;
  name: string;
  shortName: string;
  nativeSymbol: string;
  nativeDecimals: 18;
  blockExplorer: string;
  /** Reown AppKit wagmi chain key (matches wagmi/chains export name) */
  wagmiKey: string;
  /** Whether LI.FI Intents testnet env (order-dev.li.fi) includes this chain */
  liifiIntentsTestnet: boolean;
};

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    chainId: 1,
    name: "Ethereum",
    shortName: "ETH",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    blockExplorer: "https://etherscan.io",
    wagmiKey: "mainnet",
    liifiIntentsTestnet: true,
  },
  {
    chainId: 8453,
    name: "Base",
    shortName: "Base",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    blockExplorer: "https://basescan.org",
    wagmiKey: "base",
    liifiIntentsTestnet: true,
  },
  {
    chainId: 137,
    name: "Polygon",
    shortName: "Polygon",
    nativeSymbol: "POL",
    nativeDecimals: 18,
    blockExplorer: "https://polygonscan.com",
    wagmiKey: "polygon",
    liifiIntentsTestnet: true,
  },
  {
    chainId: 42161,
    name: "Arbitrum",
    shortName: "ARB",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    blockExplorer: "https://arbiscan.io",
    wagmiKey: "arbitrum",
    liifiIntentsTestnet: true,
  },
  {
    chainId: 10,
    name: "Optimism",
    shortName: "OP",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    blockExplorer: "https://optimistic.etherscan.io",
    wagmiKey: "optimism",
    liifiIntentsTestnet: true,
  },
  {
    chainId: 43114,
    name: "Avalanche",
    shortName: "AVAX",
    nativeSymbol: "AVAX",
    nativeDecimals: 18,
    blockExplorer: "https://snowtrace.io",
    wagmiKey: "avalanche",
    liifiIntentsTestnet: false,
  },
  {
    chainId: 56,
    name: "BNB Chain",
    shortName: "BSC",
    nativeSymbol: "BNB",
    nativeDecimals: 18,
    blockExplorer: "https://bscscan.com",
    wagmiKey: "bsc",
    liifiIntentsTestnet: false,
  },
  {
    chainId: 100,
    name: "Gnosis",
    shortName: "GNO",
    nativeSymbol: "xDAI",
    nativeDecimals: 18,
    blockExplorer: "https://gnosisscan.io",
    wagmiKey: "gnosis",
    liifiIntentsTestnet: false,
  },
  // ── Testnets ──────────────────────────────────────────────────────────────
  {
    chainId: 11155111,
    name: "Sepolia",
    shortName: "Sepolia",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    blockExplorer: "https://sepolia.etherscan.io",
    wagmiKey: "sepolia",
    liifiIntentsTestnet: true,
  },
  {
    chainId: 84532,
    name: "Base Sepolia",
    shortName: "BaseSepolia",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    blockExplorer: "https://sepolia.basescan.org",
    wagmiKey: "baseSepolia",
    liifiIntentsTestnet: true,
  },
];

// ── Chain aliases (user-facing name → chainId) ───────────────────────────────

export const CHAIN_ALIASES: Record<string, number> = Object.fromEntries([
  ...SUPPORTED_CHAINS.flatMap((c) => [
    [c.name.toLowerCase(), c.chainId],
    [c.shortName.toLowerCase(), c.chainId],
    [String(c.chainId), c.chainId],
  ]),
  // Extra aliases
  ["eth", 1],
  ["ethereum mainnet", 1],
  ["mainnet", 1],
  ["matic", 137],
  ["pol", 137],
  ["arb", 42161],
  ["arbitrum one", 42161],
  ["op", 10],
  ["avax", 43114],
  ["bnb", 56],
  ["bnb chain", 56],
  ["binance", 56],
  ["gnosis chain", 100],
  ["xdai", 100],
  // testnet aliases
  ["sepolia", 11155111],
  ["eth sepolia", 11155111],
  ["ethereum sepolia", 11155111],
  ["base sepolia", 84532],
  ["base-sepolia", 84532],
]);

// ── chainId → name lookup ─────────────────────────────────────────────────────

export const CHAIN_ID_TO_NAME: Record<number, string> = Object.fromEntries(
  SUPPORTED_CHAINS.map((c) => [c.chainId, c.name])
);

// ── Native token symbols (for sentinel detection) ─────────────────────────────

export const NATIVE_TOKEN_SYMBOLS = new Set(
  SUPPORTED_CHAINS.map((c) => c.nativeSymbol.toLowerCase())
);

// ── Known ERC-20 tokens per chain ─────────────────────────────────────────────
// Only mainstream tokens. The resolver falls back to LI.FI token lookup for others.
// Addresses are checksummed; decimals are exact.

export type TokenConfig = {
  address: `0x${string}`;
  decimals: number;
};

export const KNOWN_TOKENS: Record<number, Record<string, TokenConfig>> = {
  // Ethereum Mainnet (1)
  1: {
    usdt: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    usdc: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    dai:  { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
    weth: { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    wbtc: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
    link: { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18 },
    uni:  { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18 },
  },

  // Base (8453)
  8453: {
    usdc: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    usdt: { address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6 },
    dai:  { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
    weth: { address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    cbbtc:{ address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
  },

  // Polygon (137)
  137: {
    usdt: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
    usdc: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
    dai:  { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", decimals: 18 },
    weth: { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18 },
    wbtc: { address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8 },
  },

  // Arbitrum One (42161)
  42161: {
    usdt: { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
    usdc: { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    dai:  { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18 },
    weth: { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
    wbtc: { address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8 },
    arb:  { address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18 },
    link: { address: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4", decimals: 18 },
  },

  // Optimism (10)
  10: {
    usdt: { address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6 },
    usdc: { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
    dai:  { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18 },
    weth: { address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    wbtc: { address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095", decimals: 8 },
    op:   { address: "0x4200000000000000000000000000000000000042", decimals: 18 },
    link: { address: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6", decimals: 18 },
  },

  // Avalanche C-Chain (43114)
  43114: {
    usdt: { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
    usdc: { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    dai:  { address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", decimals: 18 },
    weth: { address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", decimals: 18 },
    wbtc: { address: "0x50b7545627a5162F82A992c33b87aDc75187B218", decimals: 8 },
  },

  // BNB Chain (56)
  56: {
    usdt: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
    usdc: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
    dai:  { address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", decimals: 18 },
    weth: { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", decimals: 18 },
    btcb: { address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", decimals: 18 },
  },

  // Gnosis (100)
  100: {
    usdt: { address: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6", decimals: 6 },
    usdc: { address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", decimals: 6 },
    weth: { address: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1", decimals: 18 },
    wbtc: { address: "0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252", decimals: 8 },
  },

  // Sepolia testnet (11155111) — Circle & community test tokens
  11155111: {
    usdc: { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6 },
    weth: { address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", decimals: 18 },
    link: { address: "0x779877A7B0D9E8603169DdbD7836e478b4624789", decimals: 18 },
  },

  // Base Sepolia testnet (84532) — Circle USDC + canonical WETH
  84532: {
    usdc: { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", decimals: 6 },
    weth: { address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  },
};

// ── Helper: list all supported chain IDs ─────────────────────────────────────

export const SUPPORTED_CHAIN_IDS = new Set(SUPPORTED_CHAINS.map((c) => c.chainId));

export function getChainConfig(chainId: number): SupportedChain | undefined {
  return SUPPORTED_CHAINS.find((c) => c.chainId === chainId);
}

export function listSupportedTokenSymbols(chainId: number): string[] {
  return Object.keys(KNOWN_TOKENS[chainId] ?? {});
}
