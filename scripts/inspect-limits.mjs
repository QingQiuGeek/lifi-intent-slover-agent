import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('scripts/.routes-dump.json', 'utf8'));

// USDC addresses on each chain (lowercase)
const USDC = {
	1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
	8453: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
	137: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
	42161: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
	10: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
	56: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
};

const cards = [
	['56', '1', 'BSC USDT → ETH USDT'],
	['137', '1', 'Polygon USDC → Ethereum USDC'],
	['42161', '10', 'Arbitrum USDC → Optimism USDC'],
	['8453', '42161', 'Base USDC → Arbitrum USDC'],
];

for (const [f, t, label] of cards) {
	console.log(`\n── ${label} ──`);
	const routes = d.filter((x) => x.fromChain?.chainId === f && x.toChain?.chainId === t);
	for (const r of routes) {
		const fa = (r.fromToken?.address ?? '').toLowerCase();
		const ta = (r.toToken?.address ?? '').toLowerCase();
		const fs_ = r.fromToken?.symbol || (Object.entries(USDC).find(([cid, a]) => cid === f && a === fa) ? 'USDC(addr)' : '(null)');
		const ts = r.toToken?.symbol || (Object.entries(USDC).find(([cid, a]) => cid === t && a === ta) ? 'USDC(addr)' : '(null)');
		const minA = BigInt(r.minAmount ?? 0);
		const maxA = BigInt(r.maxAmount ?? 0);
		const decimals = r.fromToken?.decimals ?? 18;
		const minHuman = Number(minA) / 10 ** decimals;
		const maxHuman = Number(maxA) / 10 ** decimals;
		console.log(`  ${fs_.padEnd(12)} → ${ts.padEnd(12)}  min=${minHuman.toFixed(4)}  max=${maxHuman.toFixed(2)}  active=${r.isActive}`);
	}
}
