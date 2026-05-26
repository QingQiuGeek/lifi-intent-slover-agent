import { LifiApiError, UnsupportedRouteError } from "@/lib/lifi/errors";
import {
  CHAIN_ALIASES,
  CHAIN_ID_TO_NAME,
  NATIVE_TOKEN_SYMBOLS,
  NATIVE_SENTINEL,
  KNOWN_TOKENS,
  SUPPORTED_CHAIN_IDS,
} from "@/lib/lifi/chains-config";

export function resolveChainId(nameOrId: string | number): number {
  if (typeof nameOrId === "number") return nameOrId;
  const n = Number(nameOrId);
  if (!isNaN(n)) return n;
  const key = nameOrId.toLowerCase().trim();
  const id = CHAIN_ALIASES[key];
  if (!id) throw new UnsupportedRouteError(`Unknown chain: "${nameOrId}". Supported: ${[...SUPPORTED_CHAIN_IDS].join(", ")}`);
  return id;
}

export function chainName(chainId: number): string {
  return CHAIN_ID_TO_NAME[chainId] ?? String(chainId);
}

export function resolveToken(
  symbol: string,
  chainId: number,
  knownAddress?: string
): { address: `0x${string}`; decimals: number; isNative: boolean } {
  const sym = symbol.toLowerCase().trim();

  if (knownAddress) {
    const isNative = NATIVE_TOKEN_SYMBOLS.has(sym);
    return {
      address: knownAddress as `0x${string}`,
      decimals: isNative ? 18 : 6,
      isNative,
    };
  }

  if (NATIVE_TOKEN_SYMBOLS.has(sym)) {
    if (!SUPPORTED_CHAIN_IDS.has(chainId)) {
      throw new UnsupportedRouteError(`Chain ${chainId} is not supported`);
    }
    return { address: NATIVE_SENTINEL, decimals: 18, isNative: true };
  }

  const chainTokens = KNOWN_TOKENS[chainId];
  if (chainTokens?.[sym]) {
    return { ...chainTokens[sym], isNative: false };
  }

  throw new UnsupportedRouteError(
    `Token "${symbol}" is not recognized on chain ${chainId}. ` +
      `Please provide the token contract address.`
  );
}

// ── Amount conversion ────────────────────────────────────────────────────────

export function toTokenUnits(amountDecimal: string, decimals: number): string {
  const [intPart, fracPart = ""] = amountDecimal.split(".");
  const padded = fracPart.padEnd(decimals, "0").slice(0, decimals);
  const raw = BigInt(intPart + padded);
  return raw.toString();
}

export function fromTokenUnits(amountRaw: string, decimals: number): string {
  const raw = BigInt(amountRaw);
  const divisor = BigInt(10 ** decimals);
  const int = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${int}.${fracStr}` : `${int}`;
}

// ── EIP-7930 interoperable address encoding ──────────────────────────────────
// Layout: version(2 bytes) | chainType(2 bytes) | chainRefLen(1 byte) |
//         chainRef(variable) | addrLen(1 byte) | address(20 bytes)
// Example (Base 8453, USDC): 0x0001000002210514833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
//                              ^^^^ ^^^^ ^^ ^^^^ ^^ ----------------------------------------
//                              ver  type len chain len  address

export function encodeInteropAddress(chainId: number, address: `0x${string}`): string {
  const VERSION = "0001";       // ERC-7930 version 1
  const CHAIN_TYPE_EVM = "0000"; // EVM chain type

  // Minimum bytes needed for chainId (variable length)
  let chainHex = chainId.toString(16);
  if (chainHex.length % 2 !== 0) chainHex = "0" + chainHex;
  const chainRefLen = (chainHex.length / 2).toString(16).padStart(2, "0");

  const ADDR_LEN = "14"; // 20 bytes = 0x14
  const addrHex = address.slice(2); // preserve original casing

  return `0x${VERSION}${CHAIN_TYPE_EVM}${chainRefLen}${chainHex}${ADDR_LEN}${addrHex}`;
}

export async function fetchSupportedChains(baseUrl: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${baseUrl}/chains/supported`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new LifiApiError(res.status, await res.text());
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.chains ?? []);
  } catch (err) {
    if (err instanceof LifiApiError) throw err;
    return [];
  }
}
