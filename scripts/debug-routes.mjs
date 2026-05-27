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
const headers = apiKey ? { 'api-key': apiKey } : {};

console.log('Hitting /routes 5 times in a row...');
for (let i = 0; i < 5; i++) {
	const r = await fetch(baseUrl + '/routes', { headers });
	const j = await r.json();
	const total = (j.routes ?? []).length;
	console.log(`  attempt ${i+1}: status=${r.status}  routes=${total}`);
	if (total > 0 && i === 0) {
		// dump some shape info on first hit
		const sample = j.routes[0];
		console.log('  sample keys:', Object.keys(sample));
	}
	await new Promise((r) => setTimeout(r, 200));
}

console.log('\nWith query params (limit=1000):');
const r = await fetch(baseUrl + '/routes?limit=1000', { headers });
const j = await r.json();
console.log('  status=' + r.status + '  routes=' + (j.routes ?? []).length);

console.log('\nResponse headers (last call):');
console.log('  ' + JSON.stringify(Object.fromEntries(r.headers), null, 2));
