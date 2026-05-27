// Verify the welcome promptCards against the offline /routes dump,
// using the SAME matching logic as lib/lifi/routes-cache.ts.
import fs from 'node:fs';

const KNOWN_TOKENS = {
	1: {
		usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(),
		usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(),
	},
	8453: {
		usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase(),
	},
	137: {
		usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase(),
		usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'.toLowerCase(),
	},
	42161: {
		usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase(),
		usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'.toLowerCase(),
	},
	10: {
		usdt: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'.toLowerCase(),
		usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'.toLowerCase(),
	},
	56: {
		usdt: '0x55d398326f99059fF775485246999027B3197955'.toLowerCase(),
		usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'.toLowerCase(),
	},
};

const SYMBOL_ALIASES = { 'BSC-USD': 'USDT', WETH: 'ETH' };
const norm = (s) => SYMBOL_ALIASES[(s ?? '').trim().toUpperCase()] ?? (s ?? '').trim().toUpperCase();

function tokenMatches(rec, req) {
	if (req.address && rec.address === req.address) return true;
	if (req.symbol && norm(req.symbol) === rec.symbol) return true;
	return false;
}

function check(args, routes) {
	const sameChain = routes.filter(
		(r) => r.fromChainId === String(args.fromChainId) && r.toChainId === String(args.toChainId),
	);
	if (sameChain.length === 0) return { supported: false, reason: 'no chain pair' };
	const fromAddr = args.fromAddress?.toLowerCase() ?? KNOWN_TOKENS[args.fromChainId]?.[args.fromSymbol.toLowerCase()];
	const toAddr = args.toAddress?.toLowerCase() ?? KNOWN_TOKENS[args.toChainId]?.[args.toSymbol.toLowerCase()];
	const matches = sameChain.filter(
		(r) =>
			tokenMatches({ address: r.fromAddress, symbol: r.fromSymbol }, { address: fromAddr, symbol: args.fromSymbol }) &&
			tokenMatches({ address: r.toAddress, symbol: r.toSymbol }, { address: toAddr, symbol: args.toSymbol }),
	);
	return { supported: matches.length > 0, matchCount: matches.length };
}

const raw = JSON.parse(fs.readFileSync('scripts/.routes-dump.json', 'utf8'));
const routes = raw.map((x) => ({
	fromChainId: String(x.fromChain?.chainId ?? ''),
	fromAddress: String(x.fromToken?.address ?? '').toLowerCase(),
	fromSymbol: norm(x.fromToken?.symbol),
	toChainId: String(x.toChain?.chainId ?? ''),
	toAddress: String(x.toToken?.address ?? '').toLowerCase(),
	toSymbol: norm(x.toToken?.symbol),
}));

const cards = [
	{ label: 'BSC USDT → Ethereum USDT',     a: { fromChainId: 56,    fromSymbol: 'USDT', toChainId: 1,     toSymbol: 'USDT' } },
	{ label: 'Polygon USDC → Ethereum USDC', a: { fromChainId: 137,   fromSymbol: 'USDC', toChainId: 1,     toSymbol: 'USDC' } },
	{ label: 'Arbitrum USDC → Optimism USDC',a: { fromChainId: 42161, fromSymbol: 'USDC', toChainId: 10,    toSymbol: 'USDC' } },
	{ label: 'Base USDC → Arbitrum USDC',    a: { fromChainId: 8453,  fromSymbol: 'USDC', toChainId: 42161, toSymbol: 'USDC' } },
];

for (const c of cards) {
	const r = check(c.a, routes);
	console.log(`${r.supported ? '✓' : '✗'} ${c.label.padEnd(40)} ${r.supported ? 'matched ' + r.matchCount + ' route(s)' : r.reason}`);
}
