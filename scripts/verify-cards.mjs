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
const routes = j.routes ?? [];

const cards = [
	{ from: '56', fromSym: 'USDT',     to: '1',     toSym: 'USDT' },
	{ from: '137', fromSym: 'USDC',    to: '1',     toSym: 'USDC' },
	{ from: '42161', fromSym: 'USDC',  to: '10',    toSym: 'USDC' },
	{ from: '8453', fromSym: 'USDC',   to: '42161', toSym: 'USDC' },
];

const aliases = { 'BSC-USD': 'USDT' };
const norm = (s) => aliases[(s ?? '').toUpperCase()] ?? (s ?? '').toUpperCase();

for (const c of cards) {
	const matches = routes.filter(
		(r) =>
			r.fromChain?.chainId === c.from &&
			r.toChain?.chainId === c.to &&
			norm(r.fromToken?.symbol) === c.fromSym &&
			norm(r.toToken?.symbol) === c.toSym,
	);
	console.log(
		`${c.from}/${c.fromSym} → ${c.to}/${c.toSym}: ${matches.length > 0 ? '✓ ' + matches.length : '✗ MISSING'}`,
	);
}
