import type { LifiIntentClient, PrepareOrderInput, QuoteRequestInput } from "@/lib/lifi/client";
import type { LifiQuoteSummary, PreparedOrder, SubmittedOrder } from "@/lib/lifi/types";
import { NATIVE_SENTINEL } from "@/lib/lifi/chains-config";
import { LifiApiError, MissingIntentFieldError, UnsupportedRouteError } from "@/lib/lifi/errors";
import {
  resolveChainId,
  resolveToken,
  toTokenUnits,
  fromTokenUnits,
  chainName,
  encodeInteropAddress,
} from "@/lib/lifi/token-resolver";

type RestClientOptions = {
  baseUrl: string;
  apiKey?: string;
};

function makeFetcher(apiKey?: string) {
  return async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "api-key": apiKey } : {}),
        ...(init?.headers ?? {}),
      },
    });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : String(body);
    throw new LifiApiError(res.status, message, body);
  }

    return res.json() as Promise<T>;
  };
}

export function createLifiRestClient(options: RestClientOptions): LifiIntentClient {
  const { baseUrl, apiKey } = options;
  const fetchJson = makeFetcher(apiKey);

  return {
    async getSupportedChains() {
      return fetchJson(`${baseUrl}/chains/supported`);
    },

    async getSupportedRoutes() {
      return fetchJson(`${baseUrl}/routes`);
    },

    async requestQuote(input: QuoteRequestInput): Promise<LifiQuoteSummary> {
      const { intent, userAddress, receiver } = input;

      // Validate required fields
      const missing: string[] = [];
      if (!intent.sourceChain?.chainId && !intent.sourceChain?.name) missing.push("sourceChain");
      if (!intent.sourceToken?.symbol && !intent.sourceToken?.address) missing.push("sourceToken");
      if (!intent.destinationChain?.chainId && !intent.destinationChain?.name) missing.push("destinationChain");
      if (!intent.destinationToken?.symbol && !intent.destinationToken?.address) missing.push("destinationToken");
      if (!intent.amount) missing.push("amount");
      if (missing.length > 0) throw new MissingIntentFieldError(missing);

      const srcChainId = resolveChainId(intent.sourceChain!.chainId ?? intent.sourceChain!.name!);
      const dstChainId = resolveChainId(intent.destinationChain!.chainId ?? intent.destinationChain!.name!);

      const srcToken = resolveToken(
        intent.sourceToken!.symbol ?? "",
        srcChainId,
        intent.sourceToken?.address
      );
      const dstToken = resolveToken(
        intent.destinationToken!.symbol ?? "",
        dstChainId,
        intent.destinationToken?.address
      );

      const swapMode = intent.swapMode ?? (intent.amountSide === "output" ? "exact-output" : "exact-input");
      const isExactOutput = swapMode === "exact-output";

      const amountRaw = toTokenUnits(
        intent.amount!,
        isExactOutput ? dstToken.decimals : srcToken.decimals
      );

      // Build ERC-7930 interoperable addresses
      const userInterop = encodeInteropAddress(srcChainId, userAddress as `0x${string}`);
      const receiverInterop = encodeInteropAddress(dstChainId, (receiver ?? userAddress) as `0x${string}`);
      const srcAssetInterop = encodeInteropAddress(srcChainId, srcToken.address);
      const dstAssetInterop = encodeInteropAddress(dstChainId, dstToken.address);

      const body = {
        user: userInterop,
        intent: {
          intentType: "oif-swap",
          inputs: [{
            user: userInterop,
            asset: srcAssetInterop,
            amount: isExactOutput ? null : amountRaw,
          }],
          outputs: [{
            receiver: receiverInterop,
            asset: dstAssetInterop,
            amount: isExactOutput ? amountRaw : null,
          }],
          swapType: isExactOutput ? "exact-output" : "exact-input",
        },
        supportedTypes: ["oif-escrow-v0"],
      };

      const data = await fetchJson<{ quotes?: unknown[] } & Record<string, unknown>>(
        `${baseUrl}/quote/request`,
        { method: "POST", body: JSON.stringify(body) }
      );

      const quotes = (data.quotes ?? []) as Record<string, unknown>[];
      if (quotes.length === 0) {
        throw new UnsupportedRouteError(
          `No quotes available for ${intent.sourceToken!.symbol} (${chainName(srcChainId)}) → ` +
          `${intent.destinationToken!.symbol} (${chainName(dstChainId)}). ` +
          `No solver is currently quoting this pair — it may be temporarily out of inventory. Try again shortly or adjust the amount.`
        );
      }

      const best = quotes[0];
      const quoteId = (best.quoteId as string | undefined) ?? "";
      const preview = best.preview as {
        inputs: { amount: string }[];
        outputs: { amount: string }[];
      } | undefined;

      const rawFromAmount = preview?.inputs?.[0]?.amount ?? amountRaw;
      const rawToAmount = preview?.outputs?.[0]?.amount ?? "0";

      return {
        quoteId,
        validUntil: typeof best.validUntil === "number"
          ? (best.validUntil < 1e12 ? best.validUntil * 1000 : best.validUntil)
          : Date.now() + 60_000,
        swapMode,
        input: {
          chainId: srcChainId,
          token: {
            symbol: intent.sourceToken!.symbol,
            address: srcToken.address,
            decimals: srcToken.decimals,
            chainId: srcChainId,
          },
          amount: fromTokenUnits(rawFromAmount, srcToken.decimals),
        },
        output: {
          chainId: dstChainId,
          token: {
            symbol: intent.destinationToken!.symbol,
            address: dstToken.address,
            decimals: dstToken.decimals,
            chainId: dstChainId,
          },
          amount: fromTokenUnits(rawToAmount, dstToken.decimals),
          receiver: (receiver ?? userAddress) as `0x${string}`,
        },
        raw: data,
      };
    },

    async prepareOrder(_input: PrepareOrderInput): Promise<PreparedOrder> {
      // The LI.FI Intents API has no /quote/prepare endpoint.
      // Order preparation is done entirely client-side via buildEscrowOpenTx() in contracts.ts.
      throw new LifiApiError(501, "prepareOrder should be handled client-side via lifi-prepare-order-tool, not via REST client.");
    },

    async submitOrder(input): Promise<SubmittedOrder> {
      const prepared = input.preparedOrder as PreparedOrder | undefined;
      const quoteId = prepared?.quoteId ?? (input as { quoteId?: string }).quoteId;
      if (!quoteId) throw new LifiApiError(400, "submitOrder: quoteId is required");
      if (!input.transactionHash) throw new LifiApiError(400, "submitOrder: transactionHash is required");

      const body: Record<string, unknown> = {
        quoteId,
        transactionHash: input.transactionHash,
      };

      const data = await fetchJson<Record<string, unknown>>(
        `${baseUrl}/orders/submit`,
        { method: "POST", body: JSON.stringify(body) }
      );

      return {
        catalystOrderId: (data.catalystOrderId as string | undefined),
        onChainOrderId: (data.onChainOrderId as string | undefined),
        status: (data.status as string | undefined) ?? "Signed",
        quoteId,
        createdAt: Date.now(),
        raw: data,
      };
    },

    async trackOrder(input): Promise<SubmittedOrder> {
      const { catalystOrderId, onChainOrderId } = input;
      const id = catalystOrderId ?? onChainOrderId;
      if (!id) throw new Error("Provide catalystOrderId or onChainOrderId");

      const params = new URLSearchParams();
      if (catalystOrderId) params.set("catalystOrderId", catalystOrderId);
      if (onChainOrderId) params.set("onChainOrderId", onChainOrderId);

      const data = await fetchJson<Record<string, unknown>>(
        `${baseUrl}/orders/status?${params.toString()}`
      );

      // LI.FI Intents API returns: { meta: { orderStatus, ... }, ... }
      const meta = data.meta as Record<string, unknown> | undefined;
      const status =
        (meta?.orderStatus as string | undefined) ??
        (data.status as string | undefined) ??
        "unknown";

      return {
        catalystOrderId: (data.catalystOrderId as string | undefined) ?? catalystOrderId,
        onChainOrderId: (data.onChainOrderId as string | undefined) ?? onChainOrderId,
        status,
        quoteId: data.quoteId as string | undefined,
        createdAt: Date.now(),
        raw: data,
      };
    },
  };
}
