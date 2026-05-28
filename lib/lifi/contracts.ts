/**
 * LI.FI Intents on-chain contract constants.
 * Source: https://docs.li.fi/lifi-intents/quickstart
 *
 * The escrow flow uses InputSettlerEscrow.open(bytes order) to lock funds on-chain.
 * No off-chain /quote/prepare endpoint exists — the StandardOrder is constructed client-side.
 */

import { encodeAbiParameters, encodeFunctionData, padHex } from "viem";
import type { LifiQuoteSummary } from "@/lib/lifi/types";
import { toTokenUnits } from "@/lib/lifi/token-resolver";

// ── Protocol-wide constants ────────────────────────────────────────────────────

/** Polymer cross-chain oracle — same address on all supported chains */
export const POLYMER_ORACLE = "0x0000003E06000007A224AeE90052fA6bb46d43C9" as const;

/** Output settlement contract — same address on all supported chains */
export const OUTPUT_SETTLER = "0x0000000000eC36B683C2E6AC89e9A75989C22a2e" as const;

/**
 * InputSettlerEscrow per-chain deployment addresses.
 * The single known address from the official quickstart (Base).
 * All other chains use the same address — deterministic cross-chain deployment.
 */
export const INPUT_SETTLER_ESCROW: Record<number, `0x${string}`> = {
  1:       "0x000025c3226C00B2Cdc200005a1600509f4e00C0",
  137:     "0x000025c3226C00B2Cdc200005a1600509f4e00C0",
  8453:    "0x000025c3226C00B2Cdc200005a1600509f4e00C0",
  42161:   "0x000025c3226C00B2Cdc200005a1600509f4e00C0",
  10:      "0x000025c3226C00B2Cdc200005a1600509f4e00C0",
  56:      "0x000025c3226C00B2Cdc200005a1600509f4e00C0",
  43114:   "0x000025c3226C00B2Cdc200005a1600509f4e00C0",
  100:     "0x000025c3226C00B2Cdc200005a1600509f4e00C0",
  11155111:"0x000025c3226C00B2Cdc200005a1600509f4e00C0",
  84532:   "0x000025c3226C00B2Cdc200005a1600509f4e00C0",
};

/** ABI for InputSettlerEscrow.open(bytes order) */
export const ESCROW_OPEN_ABI = [
  {
    name: "open",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "order", type: "bytes" }],
    outputs: [],
  },
] as const;

// ── StandardOrder ABI components ──────────────────────────────────────────────

const OUTPUT_DESCRIPTION_COMPONENTS = [
  { name: "oracle",    type: "bytes32" },
  { name: "settler",   type: "bytes32" },
  { name: "chainId",   type: "uint256" },
  { name: "token",     type: "bytes32" },
  { name: "amount",    type: "uint256" },
  { name: "recipient", type: "bytes32" },
  { name: "call",      type: "bytes"   },
  { name: "context",   type: "bytes"   },
] as const;

const STANDARD_ORDER_ABI_COMPONENTS = [
  { name: "user",          type: "address"  },
  { name: "nonce",         type: "uint256"  },
  { name: "originChainId", type: "uint256"  },
  { name: "expires",       type: "uint32"   },
  { name: "fillDeadline",  type: "uint32"   },
  { name: "inputOracle",   type: "address"  },
  { name: "inputs",        type: "uint256[2][]" },
  {
    name: "outputs",
    type: "tuple[]",
    components: OUTPUT_DESCRIPTION_COMPONENTS,
  },
] as const;

// ── Helper: pad a 20-byte address to bytes32 (left-padded) ───────────────────

function addrToBytes32(addr: `0x${string}`): `0x${string}` {
  return padHex(addr, { dir: "left", size: 32 });
}

// ── Build open() calldata from a quote summary ─────────────────────────────────

export type BuildEscrowTxResult = {
  escrowAddress: `0x${string}`;
  data: `0x${string}`;
  /** "0" for ERC-20, raw wei string for native */
  value: string;
  approval?: {
    token: `0x${string}`;
    spender: `0x${string}`;
    amount: string;
  };
};

export function buildEscrowOpenTx(
  quoteSummary: LifiQuoteSummary,
  userAddress: `0x${string}`,
  isNative: boolean,
): BuildEscrowTxResult {
  const { input, output } = quoteSummary;

  if (!input || input.chainId == null) {
    throw new Error(
      `buildEscrowOpenTx: quoteSummary.input is missing or incomplete. ` +
      `Received: ${JSON.stringify(quoteSummary).slice(0, 200)}`
    );
  }
  if (!output || output.chainId == null) {
    throw new Error(
      `buildEscrowOpenTx: quoteSummary.output is missing or incomplete. ` +
      `Received: ${JSON.stringify(quoteSummary).slice(0, 200)}`
    );
  }

  const srcChainId = input.chainId;
  const dstChainId = output.chainId;

  const escrowAddress =
    INPUT_SETTLER_ESCROW[srcChainId] ??
    ("0x000025c3226C00B2Cdc200005a1600509f4e00C0" as `0x${string}`);

  const srcDecimals = input.token.decimals ?? 18;
  const dstDecimals = output.token.decimals ?? 18;

  const srcAmountRaw = toTokenUnits(input.amount, srcDecimals);
  const dstAmountRaw = toTokenUnits(output.amount, dstDecimals);

  const srcTokenAddr = input.token.address as `0x${string}`;
  const dstTokenAddr = output.token.address as `0x${string}`;
  const receiverAddr = output.receiver;

  const nowSec = Math.floor(Date.now() / 1000);

  // ABI-encode the StandardOrder struct
  const encodedOrder = encodeAbiParameters(
    [
      {
        name: "order",
        type: "tuple",
        components: STANDARD_ORDER_ABI_COMPONENTS as never,
      },
    ],
    [
      {
        user:          userAddress,
        nonce:         BigInt(Date.now()),
        originChainId: BigInt(srcChainId),
        expires:       nowSec + 3600,
        fillDeadline:  nowSec + 1800,
        inputOracle:   POLYMER_ORACLE,
        inputs: [
          [BigInt(srcTokenAddr), BigInt(srcAmountRaw)] as [bigint, bigint],
        ],
        outputs: [
          {
            oracle:    addrToBytes32(POLYMER_ORACLE),
            settler:   addrToBytes32(OUTPUT_SETTLER),
            chainId:   BigInt(dstChainId),
            token:     addrToBytes32(dstTokenAddr),
            amount:    BigInt(dstAmountRaw),
            recipient: addrToBytes32(receiverAddr),
            call:      "0x",
            context:   "0x",
          },
        ],
      } as never,
    ]
  );

  const data = encodeFunctionData({
    abi: ESCROW_OPEN_ABI,
    functionName: "open",
    args: [encodedOrder],
  });

  return {
    escrowAddress,
    data,
    value: isNative ? srcAmountRaw : "0",
    approval: isNative
      ? undefined
      : {
          token:   srcTokenAddr,
          spender: escrowAddress,
          amount:  srcAmountRaw,
        },
  };
}
