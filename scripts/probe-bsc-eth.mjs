import fs from 'node:fs';

const envPath = '.env.local';
if (fs.existsSync(envPath)) {
	fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
		const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
		if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
	});
}

const baseUrl = process.env.LIFI_INTENTS_BASE_URL || 'https://order.li.fi';
const apiKey = process.env.LIFI_SOLVER_API_KEY;
const headers = apiKey
	? { 'X-API-Key': apiKey, Authorization: `Bearer ${apiKey}` }
	: {};

const r = await fetch(baseUrl + '/routes', { headers });
const j = await r.json();
const all = j.routes ?? [];

console.log(`Total routes: ${all.length}\n`);

// 1. Chain-pair matrix
const chainPairs = new Map();
for (const x of all) {
	const k = `${x.fromChain?.chainId} (${x.fromChain?.name}) → ${x.toChain?.chainId} (${x.toChain?.name})`;
	chainPairs.set(k, (chainPairs.get(k) ?? 0) + 1);
}
console.log('── Chain pair × route count');
[...chainPairs.entries()]
	.sort((a, b) => b[1] - a[1])
	.forEach(([k, n]) => console.log(`  ${String(n).padStart(4)}  ${k}`));

// 2. BSC → Ethereum specific
console.log('\n── BSC (56) → Ethereum (1) routes');
const bscEth = all.filter(
	(x) => x.fromChain?.chainId === '56' && x.toChain?.chainId === '1',
);
console.log(`  found: ${bscEth.length}`);
bscEth.slice(0, 20).forEach((x) => {
	const ft = x.fromToken;
	const tt = x.toToken;
	console.log(
		`  ${(ft?.symbol ?? 'NATIVE').padEnd(10)} ${(ft?.address ?? '-').slice(0, 12)}…  →  ${(tt?.symbol ?? 'NATIVE').padEnd(10)} ${(tt?.address ?? '-').slice(0, 12)}…  active=${x.isActive}`,
	);
});

// 3. Working pairs from your welcome cards
console.log('\n── Welcome-card route checks');
const checks = [
	['8453', 'ETH', '42161', 'USDC'],
	['56', 'USDT', '1', 'USDC'],
	['8453', 'USDC', '42161', 'ETH'],
	['56', 'BNB', '56', 'USDT'],
];
for (const [fc, fs_, tc, ts] of checks) {
	const matches = all.filter(
		(x) =>
			x.fromChain?.chainId === fc &&
			x.toChain?.chainId === tc &&
			(x.fromToken?.symbol?.toUpperCase() === fs_ || (fs_ === 'ETH' || fs_ === 'BNB') && !x.fromToken?.symbol) &&
			(x.toToken?.symbol?.toUpperCase() === ts || (ts === 'ETH' || ts === 'BNB') && !x.toToken?.symbol),
	);
	console.log(
		`  ${fc}/${fs_} → ${tc}/${ts}: ${matches.length > 0 ? '✓ ' + matches.length + ' route(s)' : '✗ NOT AVAILABLE'}`,
	);
}
