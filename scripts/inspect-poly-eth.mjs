import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('scripts/.routes-dump.json', 'utf8'));
const r = d.filter((x) => x.fromChain?.chainId === '137' && x.toChain?.chainId === '1');
for (const x of r) {
	console.log(JSON.stringify({
		fromSym: x.fromToken?.symbol,
		fromAddr: x.fromToken?.address,
		fromDec: x.fromToken?.decimals,
		toSym: x.toToken?.symbol,
		toAddr: x.toToken?.address,
		toDec: x.toToken?.decimals,
		minAmount: x.minAmount,
		maxAmount: x.maxAmount,
		isActive: x.isActive,
	}, null, 2));
	console.log('---');
}

console.log('\nOur KNOWN_TOKENS sends:');
console.log('  Polygon USDC: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 (decimals 6)');
console.log('  Ethereum USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (decimals 6)');
