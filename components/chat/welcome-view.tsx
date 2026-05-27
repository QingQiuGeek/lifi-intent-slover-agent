'use client';

import { useEffect, useRef, useState } from 'react';

// Same-token cross-chain routes only — LI.FI Intents solvers do not stock
// cross-token cross-chain pairs. Each entry below is a route confirmed to
// exist in production solver inventory at the time of writing.
const promptCards = [
	{
		title: '1️⃣ BSC USDT → Ethereum USDT',
		description: '把 BSC 上的 5 USDT 跨链到 Ethereum',
		prompt: 'Swap 5 USDT on BSC to USDT on Ethereum',
	},
	{
		title: '2️⃣ Polygon USDC → Ethereum USDC',
		description: '把 Polygon 上的 10 USDC 跨链到 Ethereum',
		prompt: 'Swap 10 USDC on Polygon to USDC on Ethereum',
	},
	{
		title: '3️⃣ Arbitrum USDC → Optimism USDC',
		description: 'L2 → L2 跨链，把 Arbitrum 的 5 USDC 转到 Optimism',
		prompt: 'Swap 5 USDC on Arbitrum to USDC on Optimism',
	},
	{
		title: '4️⃣ Base USDC → Arbitrum USDC',
		description: '把 Base 上的 5 USDC 跨链到 Arbitrum',
		prompt: 'Swap 5 USDC on Base to USDC on Arbitrum',
	},
];

function TypewriterTitle({ text }: { text: string }) {
	const [displayed, setDisplayed] = useState('');
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const stateRef = useRef({ i: 0, erasing: false });

	useEffect(() => {
		stateRef.current = { i: 0, erasing: false };
		setDisplayed('');

		const tick = () => {
			const s = stateRef.current;
			if (!s.erasing) {
				s.i++;
				setDisplayed(text.slice(0, s.i));
				if (s.i >= text.length) {
					timerRef.current = setTimeout(() => {
						s.erasing = true;
						timerRef.current = setTimeout(tick, 35);
					}, 1800);
				} else {
					timerRef.current = setTimeout(tick, 65);
				}
			} else {
				s.i--;
				setDisplayed(text.slice(0, s.i));
				if (s.i <= 0) {
					s.erasing = false;
					timerRef.current = setTimeout(tick, 400);
				} else {
					timerRef.current = setTimeout(tick, 35);
				}
			}
		};

		timerRef.current = setTimeout(tick, 300);
		return () => { if (timerRef.current) clearTimeout(timerRef.current); };
	}, [text]);

	return (
		<h1 className='mb-2 font-bold tracking-tight'>
			<span className='bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-3xl text-transparent'>
				{displayed || '\u00a0'}
			</span>
			<span className='ml-0.5 inline-block h-7 w-0.5 align-middle bg-indigo-400 animate-[blink_1s_step-end_infinite]' />
		</h1>
	);
}

export function WelcomeView({
	onSelectPrompt,
}: {
	onSelectPrompt: (prompt: string) => void;
}) {
	return (
		<section className='flex h-full select-none flex-col items-center justify-center px-4 text-center'>
			<div className='mb-6'>
				<img alt='LI.FI Intent Agent' className='h-28 w-28 object-contain' src='/logo.png' />
			</div>
			<TypewriterTitle text='LI.FI Intent Agent' />
			<p className='mb-8 text-sm text-(--c-text3)'>
				🤖用自然语言描述你的跨链兑换需求
			</p>
			<div className='grid w-full max-w-xl grid-cols-1 gap-3 text-left md:grid-cols-2'>
				{promptCards.map((card) => (
					<button
						className='rounded-xl border border-(--c-border) p-3.5 text-left text-xs text-(--c-text2) transition hover:bg-(--c-surface)/50 hover:text-(--c-text1)'
						key={card.title}
						onClick={() => onSelectPrompt(card.prompt)}
						type='button'
					>
						<span className='mb-1 block font-semibold text-(--c-text1)'>{card.title}</span>
						{card.description}
					</button>
				))}
			</div>
		</section>
	);
}
