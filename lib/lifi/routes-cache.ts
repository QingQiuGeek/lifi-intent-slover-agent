/**
 * In-memory cache of LI.FI Intents `/routes` endpoint.
 *
 * Why: solver inventory only contains a small fixed set of (chain, token) pairs
 * (mostly same-token cross-chain). Calling `/quote/request` for an unsupported
 * pair returns an opaque "no quotes available" error after a network round-trip.
 * Pre-validating against the cached route list gives instant, actionable
 * feedback ("here are the supported pairs for this chain combination").
 */

import { KNOWN_TOKENS, NATIVE_SENTINEL } from "@/lib/lifi/chains-config";

type RawRoute = {
	fromChain?: { chainId?: string };
	toChain?: { chainId?: string };
	fromToken?: { symbol?: string | null; address?: string };
	toToken?: { symbol?: string | null; address?: string };
	isActive?: boolean;
};

type RouteRecord = {
	fromChainId: string;
	fromAddress: string;
	fromSymbol: string;
	toChainId: string;
	toAddress: string;
	toSymbol: string;
};

const TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache: { routes: RouteRecord[]; loadedAt: number } | null = null;
let inflight: Promise<RouteRecord[]> | null = null;

// Solver registry sometimes labels tokens oddly (e.g. BSC USDT shows up as
// "BSC-USD"). And native ETH/WETH are interchangeable for routing purposes.
const SYMBOL_ALIASES: Record<string, string> = {
	"BSC-USD": "USDT",
	WETH: "ETH",
};

function normalizeSymbol(s: string | null | undefined): string {
	const u = (s ?? "").trim().toUpperCase();
	return SYMBOL_ALIASES[u] ?? u;
}

async function fetchRoutes(): Promise<RouteRecord[]> {
	const baseUrl = process.env.LIFI_INTENTS_BASE_URL ?? "https://order-dev.li.fi";
	const apiKey = process.env.LIFI_SOLVER_API_KEY;
	const r = await fetch(`${baseUrl}/routes`, {
		headers: apiKey ? { "api-key": apiKey } : {},
	});
	if (!r.ok) throw new Error(`/routes returned ${r.status}`);
	const j = (await r.json()) as { routes?: RawRoute[] };
	const raw = j.routes ?? [];
	return raw
		.filter((x) => x.isActive !== false)
		.map<RouteRecord>((x) => ({
			fromChainId: String(x.fromChain?.chainId ?? ""),
			fromAddress: String(x.fromToken?.address ?? "").toLowerCase(),
			fromSymbol: normalizeSymbol(x.fromToken?.symbol),
			toChainId: String(x.toChain?.chainId ?? ""),
			toAddress: String(x.toToken?.address ?? "").toLowerCase(),
			toSymbol: normalizeSymbol(x.toToken?.symbol),
		}))
		.filter((r) => r.fromChainId && r.toChainId);
}

export async function getRoutes(): Promise<RouteRecord[]> {
	if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache.routes;
	if (inflight) return inflight;
	inflight = (async () => {
		const routes = await fetchRoutes();
		// Don't cache empty results — order.li.fi /routes is rate-limited per IP
		// and silently returns `routes: []` on subsequent rapid calls. Caching that
		// would block every quote for 5 minutes. Treat empty as transient.
		if (routes.length > 0) {
			cache = { routes, loadedAt: Date.now() };
		}
		return routes;
	})();
	try {
		return await inflight;
	} finally {
		inflight = null;
	}
}

/** Try to resolve a symbol to its known address on a chain (best-effort). */
function resolveKnownAddress(symbol: string | undefined, chainId: number): string | undefined {
	if (!symbol) return undefined;
	const sym = symbol.toLowerCase();
	const t = KNOWN_TOKENS[chainId]?.[sym];
	return t?.address.toLowerCase();
}

function tokenMatches(
	rec: { address: string; symbol: string },
	req: { address?: string; symbol?: string },
): boolean {
	const reqAddr = (req.address ?? "").toLowerCase();
	if (reqAddr && reqAddr !== NATIVE_SENTINEL.toLowerCase() && rec.address === reqAddr) return true;
	if (req.symbol && normalizeSymbol(req.symbol) === rec.symbol) return true;
	return false;
}

export type RouteCheckArgs = {
	fromChainId: number;
	fromSymbol?: string;
	fromAddress?: string;
	toChainId: number;
	toSymbol?: string;
	toAddress?: string;
};

export type RouteAlternative = {
	fromSymbol: string;
	fromAddress: string;
	toSymbol: string;
	toAddress: string;
};

export type RouteCheckResult = {
	supported: boolean;
	reason?: string;
	alternatives: RouteAlternative[];
	chainPairExists: boolean;
};

/**
 * Verify the requested route exists in solver inventory.
 *
 * Failure modes return alternatives so the LLM can suggest a working pair.
 * On network failure the check fails *open* (returns supported:true) so we
 * never block a quote request just because the cache fetch errored.
 */
export async function checkRoute(args: RouteCheckArgs): Promise<RouteCheckResult> {
	const fromChain = String(args.fromChainId);
	const toChain = String(args.toChainId);

	let routes: RouteRecord[];
	try {
		routes = await getRoutes();
	} catch {
		return { supported: true, alternatives: [], chainPairExists: true };
	}

	// Empty list usually means we got rate-limited by /routes. Don't pretend
	// nothing is supported — defer to the actual /quote/request call.
	if (routes.length === 0) {
		return { supported: true, alternatives: [], chainPairExists: true };
	}

	const sameChainPair = routes.filter(
		(r) => r.fromChainId === fromChain && r.toChainId === toChain,
	);

	if (sameChainPair.length === 0) {
		return {
			supported: false,
			chainPairExists: false,
			reason: `No solver routes between chain ${fromChain} → chain ${toChain}.`,
			alternatives: [],
		};
	}

	// Best-effort: also try the user's symbol resolved against KNOWN_TOKENS.
	const fromAddrResolved =
		args.fromAddress?.toLowerCase() ??
		resolveKnownAddress(args.fromSymbol, args.fromChainId);
	const toAddrResolved =
		args.toAddress?.toLowerCase() ??
		resolveKnownAddress(args.toSymbol, args.toChainId);

	const matches = sameChainPair.filter(
		(r) =>
			tokenMatches(
				{ address: r.fromAddress, symbol: r.fromSymbol },
				{ address: fromAddrResolved, symbol: args.fromSymbol },
			) &&
			tokenMatches(
				{ address: r.toAddress, symbol: r.toSymbol },
				{ address: toAddrResolved, symbol: args.toSymbol },
			),
	);

	if (matches.length > 0) {
		return { supported: true, chainPairExists: true, alternatives: [] };
	}

	const seen = new Set<string>();
	const alternatives: RouteAlternative[] = [];
	for (const r of sameChainPair) {
		const k = `${r.fromAddress}|${r.toAddress}`;
		if (seen.has(k)) continue;
		seen.add(k);
		alternatives.push({
			fromSymbol: r.fromSymbol || "(native)",
			fromAddress: r.fromAddress,
			toSymbol: r.toSymbol || "(native)",
			toAddress: r.toAddress,
		});
		if (alternatives.length >= 8) break;
	}

	return {
		supported: false,
		chainPairExists: true,
		reason: `No direct route for ${args.fromSymbol ?? args.fromAddress ?? "?"} (chain ${fromChain}) → ${args.toSymbol ?? args.toAddress ?? "?"} (chain ${toChain}). Solver only ships same-token pairs on this lane.`,
		alternatives,
	};
}
