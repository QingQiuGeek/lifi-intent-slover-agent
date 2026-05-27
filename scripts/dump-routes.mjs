// Dump full routes list to a local JSON for offline analysis.
// Run sparingly — /routes is rate-limited; subsequent calls return empty.
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
const r = await fetch(baseUrl + '/routes', {
	headers: apiKey ? { 'api-key': apiKey } : {},
});
const j = await r.json();
const arr = j.routes ?? [];
console.log('Got', arr.length, 'routes');
if (arr.length === 0) {
	console.log('⚠ Empty (rate-limited?). Try again in a few minutes.');
	process.exit(1);
}

fs.writeFileSync('scripts/.routes-dump.json', JSON.stringify(arr, null, 2));
console.log('Wrote scripts/.routes-dump.json');

// Also print a summary by chain pair
const aliases = { 'BSC-USD': 'USDT' };
const norm = (s) => aliases[(s ?? '').toUpperCase()] ?? (s ?? '').toUpperCase() ?? '';
const pairsByChain = {};
for (const x of arr) {
	const k = `${x.fromChain?.chainId}→${x.toChain?.chainId}`;
	pairsByChain[k] ??= [];
	const pair = `${norm(x.fromToken?.symbol) || '(native)'}→${norm(x.toToken?.symbol) || '(native)'}`;
	if (!pairsByChain[k].includes(pair)) pairsByChain[k].push(pair);
}

console.log('\n── All cross-chain pairs (excluding same-chain swaps) ──');
for (const [k, ps] of Object.entries(pairsByChain)) {
	const [from, to] = k.split('→');
	if (from === to) continue;
	console.log(`  ${k}:  ${ps.join(', ')}`);
}
