import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('scripts/.routes-dump.json', 'utf8'));
const pairs = [
	['56', '1'],
	['42161', '10'],
	['56', '8453'],
	['10', '1'],
	['10', '8453'],
	['56', '42161'],
];
for (const [f, t] of pairs) {
	console.log(`\n== ${f} -> ${t} ==`);
	d.filter((x) => x.fromChain?.chainId === f && x.toChain?.chainId === t).forEach(
		(r) =>
			console.log(
				`  ${(r.fromToken?.symbol || '(null)').padEnd(10)} ${r.fromToken?.address}  =>  ${(r.toToken?.symbol || '(null)').padEnd(10)} ${r.toToken?.address}`,
			),
	);
}
