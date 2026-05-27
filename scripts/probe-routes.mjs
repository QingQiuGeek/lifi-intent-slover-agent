// Probe LI.FI Intents API to discover supported chains + routes.
// Usage: node scripts/probe-routes.mjs
import fs from 'node:fs';

// Load .env.local manually (dotenv only reads .env by default)
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

console.log(`▶ Base URL: ${baseUrl}`);
console.log(`▶ API key: ${apiKey ? 'present' : 'NONE'}\n`);

async function get(path) {
	const r = await fetch(baseUrl + path, { headers });
	const t = await r.text();
	let body;
	try { body = JSON.parse(t); } catch { body = t; }
	return { status: r.status, body };
}

const chains = await get('/chains/supported');
console.log(`── /chains/supported  ${chains.status}`);
if (Array.isArray(chains.body)) {
	chains.body.forEach((c) =>
		console.log(`  ${c.chainId.padEnd(20)} ${c.name}  [${c.chainType}]  active=${c.isActive}`),
	);
}

console.log('');
const routes = await get('/routes');
console.log(`── /routes  ${routes.status}`);
const arr = routes.body?.routes ?? routes.body?.data ?? routes.body ?? [];
if (Array.isArray(arr)) {
	console.log(`  total routes: ${arr.length}`);
	if (arr.length === 0) {
		console.log('  ⚠ empty list — solver inventory may be empty right now');
	} else {
		console.log('  sample[0]:', JSON.stringify(arr[0], null, 2).slice(0, 1000));
		const pairs = new Set();
		arr.forEach((r) => {
			const i = r.input || r.from || r.source || {};
			const o = r.output || r.to || r.destination || {};
			pairs.add(
				`${i.chainId ?? '?'}/${i.tokenAddress ?? i.token ?? i.symbol ?? '?'} -> ${o.chainId ?? '?'}/${o.tokenAddress ?? o.token ?? o.symbol ?? '?'}`,
			);
		});
		console.log('  unique pairs:');
		[...pairs].slice(0, 30).forEach((p) => console.log('   ', p));
	}
} else {
	console.log('  raw:', JSON.stringify(routes.body, null, 2).slice(0, 800));
}
