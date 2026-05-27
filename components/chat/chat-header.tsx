'use client';

import { useTheme } from 'next-themes';
import { Icon } from './icon';

interface ChatHeaderProps {
	title: string;
	isConnected: boolean;
	address?: string;
	caipNetworkName?: string;
	onOpenWallet: () => void;
}

export function ChatHeader({
	title,
	isConnected,
	address,
	caipNetworkName,
	onOpenWallet,
}: ChatHeaderProps) {
	const { resolvedTheme, setTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	return (
		<header className='flex h-14 shrink-0 items-center gap-3 border-b border-(--c-border)/30 px-4 sm:px-6'>
			<div className='w-32 shrink-0' />

			<div className='flex flex-1 justify-center min-w-0'>
				<span className='truncate text-sm font-medium text-(--c-text1)' title={title}>
					{title}
				</span>
			</div>

			<div className='flex shrink-0 items-center gap-2'>
				<button
					aria-label='切换主题'
					className='rounded-lg border border-(--c-border) bg-(--c-surface) p-1.5 text-(--c-text2) transition hover:bg-(--c-surface2) hover:text-(--c-text1)'
					onClick={() => setTheme(isDark ? 'light' : 'dark')}
					type='button'
				>
					<Icon name={isDark ? 'sun' : 'moon'} />
				</button>

				<button
					className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
						isConnected
							? 'border-(--c-border2) bg-(--c-surface) text-(--c-text1) hover:bg-(--c-surface2)'
							: 'border-[#4a6cf7]/40 bg-[#4a6cf7]/10 text-[#7c9fff] hover:bg-[#4a6cf7]/20'
					}`}
					onClick={onOpenWallet}
					type='button'
				>
					<span
						className={`h-1.5 w-1.5 rounded-full ${
							isConnected ? 'bg-emerald-400' : 'bg-[#7c9fff] animate-pulse'
						}`}
					/>
					{isConnected
						? `${address?.slice(0, 6)}…${address?.slice(-4)}${caipNetworkName ? ` · ${caipNetworkName}` : ''}`
						: '连接钱包'}
				</button>
			</div>
		</header>
	);
}
