'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import type { LifiAgentUIMessage } from '@/lib/agents/lifi-agent';
import { createBrowserStore } from '@/lib/storage/browser-store';
import { AgentMessage } from '@/components/agent/agent-message';

type Session = {
	id: string;
	title: string;
	messages: LifiAgentUIMessage[];
	createdAt?: number;
};

type IconName =
	| 'arrow-up'
	| 'bot'
	| 'message-square'
	| 'paperclip'
	| 'panel-left-close'
	| 'panel-left-open'
	| 'plus'
	| 'settings'
	| 'terminal'
	| 'trash-2'
	| 'stop-circle'
	| 'sun'
	| 'moon';

const promptCards = [
	{
		title: '1️⃣ Base ETH → Arbitrum USDC',
		description: '用 Base 上的 0.00001 ETH 换 Arbitrum 上的 USDC',
		prompt: 'Swap 0.00001 ETH on Base to USDC on Arbitrum',
	},
	{
		title: '2️⃣ BSC USDT → Ethereum USDC',
		description: '把 BSC 上的 5 USDT 转为 Ethereum 上的 USDC',
		prompt: 'Swap 5 USDT on BSC to USDC on Ethereum',
	},
	{
		title: '3️⃣ Base USDC → Arbitrum ETH',
		description: '想在 Base 收到 0.001 USDC，用 Arbitrum 的 ETH 支付',
		prompt: 'I want to receive 0.001 USDC on Base, pay with ETH on Arbitrum',
	},
	{
		title: '4️⃣ BSC BNB → BSC USDT',
		description: '用 BSC 上的 0.00001 BNB 换 BSC 上的 USDT',
		prompt: 'Swap 0.00001 BNB on BSC to USDT on BSC',
	},
];

const iconPaths: Record<IconName, React.ReactNode> = {
	'arrow-up': (
		<>
			<path d='m5 12 7-7 7 7' />
			<path d='M12 19V5' />
		</>
	),
	bot: (
		<>
			<path d='M12 8V4H8' />
			<rect width='16' height='12' x='4' y='8' rx='3' />
			<path d='M2 14h2' />
			<path d='M20 14h2' />
			<path d='M9 13v2' />
			<path d='M15 13v2' />
		</>
	),
	'message-square': (
		<>
			<path d='M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z' />
		</>
	),
	paperclip: (
		<>
			<path d='m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48' />
		</>
	),
	'panel-left-close': (
		<>
			<rect width='18' height='18' x='3' y='3' rx='2' />
			<path d='M9 3v18' />
			<path d='m16 15-3-3 3-3' />
		</>
	),
	'panel-left-open': (
		<>
			<rect width='18' height='18' x='3' y='3' rx='2' />
			<path d='M9 3v18' />
			<path d='m14 9 3 3-3 3' />
		</>
	),
	plus: (
		<>
			<path d='M5 12h14' />
			<path d='M12 5v14' />
		</>
	),
	settings: (
		<>
			<path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.73l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
			<circle cx='12' cy='12' r='3' />
		</>
	),
	terminal: (
		<>
			<path d='m7 11 3-3-3-3' />
			<path d='M11 13h6' />
			<rect width='18' height='18' x='3' y='3' rx='2' />
		</>
	),
	'trash-2': (
		<>
			<path d='M3 6h18' />
			<path d='M8 6V4h8v2' />
			<path d='M19 6l-1 14H6L5 6' />
			<path d='M10 11v6' />
			<path d='M14 11v6' />
		</>
	),
	'stop-circle': (
		<>
			<circle cx='12' cy='12' r='10' />
			<rect x='9' y='9' width='6' height='6' rx='1' />
		</>
	),
	sun: (
		<>
			<circle cx='12' cy='12' r='4' />
			<path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41' />
		</>
	),
	moon: (
		<path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
	),
};

function Icon({
	name,
	className = 'h-4 w-4',
}: {
	name: IconName;
	className?: string;
}) {
	return (
		<svg
			aria-hidden='true'
			className={className}
			fill='none'
			stroke='currentColor'
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth='2'
			viewBox='0 0 24 24'
		>
			{iconPaths[name]}
		</svg>
	);
}

function createSession(title = '新的对话'): Session {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		title,
		messages: [],
		createdAt: Date.now(),
	};
}

function formatDateTime(ts?: number): string {
	if (!ts) return '';
	const d = new Date(ts);
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function getShortTitle(text: string, limit: number) {
	return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

const store = createBrowserStore();

export function AiStudioChat() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState('');
	const [input, setInput] = useState('');
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [theme, setTheme] = useState<'dark' | 'light'>('dark');
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	const { open: openAppKit } = useAppKit();
	const { isConnected, address } = useAppKitAccount();
	const { chainId: connectedChainId, caipNetwork } = useAppKitNetwork();

	const currentSession = sessions.find((s) => s.id === currentSessionId) ?? null;
	const hasMessages = Boolean(currentSession?.messages.length);

	useEffect(() => {
		store.listSessions().then((stored) => {
			if (stored.length > 0) {
				const typed = stored.map((s) => ({
					...s,
					messages: (s.messages ?? []) as LifiAgentUIMessage[],
				}));
				setSessions(typed);
				setCurrentSessionId(typed[0].id);
			}
		});
	}, []);

	useEffect(() => {
		const saved = localStorage.getItem('lifi-theme') as 'dark' | 'light' | null;
		if (saved) setTheme(saved);
	}, []);

	function toggleTheme() {
		setTheme((prev) => {
			const next = prev === 'dark' ? 'light' : 'dark';
			localStorage.setItem('lifi-theme', next);
			return next;
		});
	}

	const { messages, sendMessage, status, stop } = useChat<LifiAgentUIMessage>({
		transport: new DefaultChatTransport({
			api: '/api/chat',
			body: () => ({
				sessionId: currentSessionId,
				walletAddress: address ?? undefined,
				chainId: connectedChainId ?? undefined,
			}),
		}),
		id: currentSessionId || undefined,
		initialMessages: currentSession?.messages ?? [],
		onFinish: ({ messages: finished }) => {
			if (!currentSessionId) return;
			const session = sessions.find((s) => s.id === currentSessionId);
			if (!session) return;
			const updated: Session = {
				...session,
				messages: finished as LifiAgentUIMessage[],
				updatedAt: Date.now(),
			} as Session & { updatedAt: number };
			setSessions((prev) =>
				prev.map((s) => (s.id === currentSessionId ? updated : s)),
			);
			store.saveSession({
				...updated,
				orderIds: [],
				createdAt: (updated as unknown as { createdAt?: number }).createdAt ?? Date.now(),
				updatedAt: Date.now(),
			});
		},
	} as Parameters<typeof useChat<LifiAgentUIMessage>>[0]);

	const isStreaming = status === 'streaming' || status === 'submitted';

	useEffect(() => {
		const el = chatContainerRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages]);

	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}, [input]);

	useEffect(() => {
		const handleShortcut = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				startNewSession();
			}
		};
		window.addEventListener('keydown', handleShortcut);
		return () => window.removeEventListener('keydown', handleShortcut);
	});

	function startNewSession() {
		setCurrentSessionId('');
		setInput('');
		requestAnimationFrame(() => textareaRef.current?.focus());
	}

	function deleteSession(id: string) {
		setDeletingId(null);
		setSessions((prev) => {
			const next = prev.filter((s) => s.id !== id);
			if (id === currentSessionId) {
				setCurrentSessionId(next[0]?.id ?? '');
			}
			return next;
		});
		store.deleteSession(id);
	}

	function renameSession(id: string) {
		const session = sessions.find((s) => s.id === id);
		if (!session) return;
		const title = window.prompt('重命名此对话', session.title)?.trim();
		if (!title) return;
		setSessions((prev) =>
			prev.map((s) => (s.id === id ? { ...s, title } : s)),
		);
	}

	const handleSend = useCallback(
		(text = input.trim()) => {
			const messageText = text.trim();
			if (!messageText || isStreaming) return;

			if (!isConnected) {
				openAppKit();
				return;
			}

			let targetId = currentSessionId;

			if (!targetId) {
				const newSession = createSession(getShortTitle(messageText, 12));
				setSessions((prev) => [newSession, ...prev]);
				setCurrentSessionId(newSession.id);
				targetId = newSession.id;
			} else {
				setSessions((prev) =>
					prev.map((s) => {
						if (s.id !== targetId) return s;
						return s.messages.length === 0
							? { ...s, title: getShortTitle(messageText, 12) }
							: s;
					}),
				);
			}

			sendMessage({ text: messageText });
			setInput('');
		},
		[input, currentSessionId, isStreaming, sendMessage, isConnected, openAppKit],
	);

	// When streaming, show live useChat messages. Otherwise show persisted session messages.
	// This fixes the bug where switching sessions clears the message history.
	const displayMessages: LifiAgentUIMessage[] = isStreaming
		? (messages as LifiAgentUIMessage[])
		: (currentSession?.messages ?? []);

	return (
		<main className='flex h-dvh overflow-hidden bg-(--c-bg) text-(--c-text1)' data-theme={theme}>
			<aside
			className={`z-20 flex h-full shrink-0 flex-col border-r border-(--c-border) bg-(--c-sidebar) transition-all duration-300 ${
				isSidebarOpen ? 'w-64' : 'w-14'
			}`}
			aria-label='对话历史'
		>
			<header className='flex items-center justify-between border-b border-(--c-border) px-3 py-3'>
				<div className='flex min-w-0 items-center gap-2.5'>
					<img
						alt='LI.FI'
						className='h-8 w-8 shrink-0 rounded-lg object-contain'
						src='/logo.png'
					/>
					{isSidebarOpen && (
						<span className='whitespace-nowrap text-sm font-semibold text-white'>
							LI.FI Intent Agent
						</span>
					)}
				</div>
				<button
					aria-label={isSidebarOpen ? '收起侧边栏' : '展开侧边栏'}
					className='ml-1 shrink-0 rounded-lg p-1.5 text-(--c-text2) transition hover:bg-(--c-bg) hover:text-white'
					onClick={() => setIsSidebarOpen(!isSidebarOpen)}
					type='button'
				>
					<Icon name={isSidebarOpen ? 'panel-left-close' : 'panel-left-open'} />
				</button>
			</header>

			{isSidebarOpen && (
				<>
					<div className='px-3 pb-2 pt-3'>
						<button
							className='group flex w-full items-center justify-between rounded-lg border border-(--c-border) px-3 py-2.5 text-sm text-(--c-text2) transition hover:border-[#3f3f3f] hover:bg-(--c-bg) hover:text-white'
							onClick={startNewSession}
							type='button'
						>
							<span className='flex items-center gap-2'>
								<Icon className='h-4 w-4' name='plus' />
								新对话
							</span>
							<kbd className='rounded border border-(--c-border) px-1.5 py-0.5 text-[10px] transition group-hover:border-[#3f3f3f] group-hover:text-(--c-text2)'>
								Ctrl K
							</kbd>
						</button>
					</div>

					<nav className='flex-1 space-y-0.5 overflow-y-auto px-2 pb-2'>
						{sessions.map((session) => {
							const isActive = session.id === currentSessionId;
							const isDeleting = deletingId === session.id;
							return (
								<div
									className={`group flex cursor-pointer items-center rounded-lg px-3 py-2.5 transition ${
										isActive
											? 'bg-(--c-bg) text-white'
											: 'text-(--c-text2) hover:bg-(--c-bg)/60 hover:text-(--c-text1)'
									}`}
									key={session.id}
									onClick={() => { setDeletingId(null); setCurrentSessionId(session.id); }}
								>
									<Icon className='mr-2.5 h-3.5 w-3.5 shrink-0' name='message-square' />
									<div className='min-w-0 flex-1'>
										<p
											className='truncate text-xs font-medium leading-snug'
											onDoubleClick={(e) => { e.stopPropagation(); renameSession(session.id); }}
										>
											{session.title}
										</p>
										{session.createdAt && (
											<p className='mt-0.5 text-[10px] text-(--c-text4)'>
												{formatDateTime(session.createdAt)}
											</p>
										)}
									</div>
									<div
										className={`ml-1 flex shrink-0 items-center gap-0.5 transition ${
											isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
										}`}
									>
										{isDeleting ? (
											<>
												<button
													className='rounded px-1.5 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-400/10'
													onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
													type='button'
												>
													确认
												</button>
												<button
													className='rounded px-1 py-0.5 text-[10px] text-(--c-text2) hover:text-white'
													onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
													type='button'
												>
													✕
												</button>
											</>
										) : (
											<button
												aria-label='删除对话'
												className='rounded p-1 text-(--c-text2) transition hover:text-red-400'
												onClick={(e) => { e.stopPropagation(); setDeletingId(session.id); }}
												type='button'
											>
												<Icon className='h-3.5 w-3.5' name='trash-2' />
											</button>
										)}
									</div>
								</div>
							);
						})}
					</nav>

				</>
			)}
		</aside>

			<section className='relative flex h-full min-w-0 flex-1 flex-col bg-(--c-bg)'>
				<header className='flex h-14 shrink-0 items-center justify-between border-b border-(--c-border)/30 px-4 sm:px-6'>
					<div className='flex min-w-0 items-center gap-3'>
						<span className={`${isSidebarOpen ? 'w-8' : 'w-10'} shrink-0`} />
						<span className='truncate text-sm font-medium text-(--c-text1)'>
							{hasMessages ? currentSession?.title : 'LI.FI Intent Agent'}
						</span>
					</div>
					<div className='flex items-center gap-2'>
						<button
							aria-label='切换主题'
							className='rounded-lg border border-(--c-border) bg-(--c-surface) p-1.5 text-(--c-text2) transition hover:bg-(--c-surface2) hover:text-(--c-text1)'
							onClick={toggleTheme}
							type='button'
						>
							<Icon name={theme === 'dark' ? 'sun' : 'moon'} />
						</button>
						<button
							className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
								isConnected
									? 'border-(--c-border2) bg-(--c-surface) text-(--c-text1) hover:bg-(--c-surface2)'
									: 'border-[#4a6cf7]/40 bg-[#4a6cf7]/10 text-[#7c9fff] hover:bg-[#4a6cf7]/20'
							}`}
							onClick={() => openAppKit()}
							type='button'
						>
							<span
								className={`h-1.5 w-1.5 rounded-full ${
									isConnected ? 'bg-emerald-400' : 'bg-[#7c9fff] animate-pulse'
								}`}
							/>
							{isConnected
								? `${address?.slice(0, 6)}…${address?.slice(-4)}${caipNetwork?.name ? ` · ${caipNetwork.name}` : ''}`
								: '连接钱包'}
						</button>
					</div>
				</header>

				<section className='flex-1 overflow-y-auto' ref={chatContainerRef}>
					{!hasMessages && displayMessages.length === 0 ? (
						<WelcomeView onSelectPrompt={handleSend} />
					) : (
						<MessageList messages={displayMessages} />
					)}
				</section>

				<footer className='shrink-0 bg-gradient-to-t from-(--c-bg) via-(--c-bg) to-transparent p-4'>
					<section className='relative mx-auto max-w-2xl'>
						<div className='flex flex-col gap-2 rounded-2xl border border-(--c-border2) bg-(--c-surface) px-4 py-3 transition focus-within:border-[#5c5c5c]'>
							<textarea
								className='max-h-36 w-full resize-none bg-transparent text-sm leading-relaxed text-(--c-text1) placeholder-(--c-text3) outline-none'
								disabled={isStreaming}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										handleSend();
									}
								}}
								placeholder={
									isConnected
										? '给 Agent 发送消息...'
										: '请先连接钱包，再发送消息'
								}
								ref={textareaRef}
								rows={1}
								value={input}
							/>

							<div className='flex items-center justify-end pt-1'>
								{isStreaming ? (
									<button
										aria-label='停止生成'
										className='flex items-center justify-center rounded-lg bg-(--c-surface2) p-1.5 text-(--c-text2) transition hover:bg-[#4c4c4c] hover:text-white'
										onClick={stop}
										type='button'
									>
										<Icon name='stop-circle' />
									</button>
								) : (
									<button
										aria-label={isConnected ? '发送消息' : '连接钱包'}
										className='flex items-center justify-center rounded-lg bg-white p-1.5 text-black transition hover:bg-[#e2e2e2] disabled:cursor-not-allowed disabled:opacity-30'
										disabled={!input.trim() && isConnected}
										onClick={() => handleSend()}
										type='button'
									>
										<Icon name='arrow-up' />
									</button>
								)}
							</div>
						</div>
						<p className='mt-2 text-center text-[11px] text-(--c-text3)'>
							Agent 可能会犯错，请核对重要信息。
						</p>
					</section>
				</footer>
			</section>
		</main>
	);
}

function TypewriterTitle({ text }: { text: string }) {
	const [displayed, setDisplayed] = useState('');
	const [done, setDone] = useState(false);

	useEffect(() => {
		setDisplayed('');
		setDone(false);
		let i = 0;
		const id = setInterval(() => {
			i += 1;
			setDisplayed(text.slice(0, i));
			if (i >= text.length) {
				clearInterval(id);
				setDone(true);
			}
		}, 60);
		return () => clearInterval(id);
	}, [text]);

	return (
		<h1 className='mb-2 font-bold tracking-tight'>
			<span className='bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-3xl text-transparent'>
				{displayed}
			</span>
			<span
				className={`ml-0.5 inline-block h-7 w-0.5 align-middle bg-indigo-400 ${
					done ? 'animate-[blink_1s_step-end_infinite]' : ''
				}`}
				style={done ? {} : { opacity: 1 }}
			/>
		</h1>
	);
}

function WelcomeView({
	onSelectPrompt,
}: {
	onSelectPrompt: (prompt: string) => void;
}) {
	return (
		<section className='flex h-full select-none flex-col items-center justify-center px-4 text-center'>
			<div className='mb-6'>
				<img alt='LI.FI Intent Agent' className='h-30 w-30 object-contain' src='/logo.png' />
			</div>
			<TypewriterTitle text='LI.FI Intent Agent' />
			<p className='mb-8 text-sm text-(--c-text3)'>
				🤖用自然语言描述你的跨链兑换需求
			</p>
			<div className='grid w-full max-w-xl grid-cols-1 gap-3 text-left md:grid-cols-2'>
				{promptCards.map((card) => (
					<button
						className='rounded-xl border border-(--c-border) p-3.5 text-left text-xs text-(--c-text2) transition hover:bg-(--c-surface)/30 hover:text-white'
						key={card.title}
						onClick={() => onSelectPrompt(card.prompt)}
						type='button'
					>
						<span className='mb-1 block font-medium text-white'>{card.title}</span>
						{card.description}
					</button>
				))}
			</div>
		</section>
	);
}

function MessageList({ messages }: { messages: LifiAgentUIMessage[] }) {
	return (
		<section className='mx-auto max-w-2xl space-y-8 px-4 py-8'>
			{messages.map((message, index) => {
				const isUser = message.role === 'user';

				return (
					<article
						className={`flex animate-fade-in gap-4 ${
							isUser ? 'justify-end' : 'justify-start'
						}`}
						key={message.id ?? index}
					>
						{isUser ? (
							<div className='flex max-w-[85%] flex-col items-end'>
								<p className='rounded-2xl border border-(--c-border2) bg-(--c-surface) px-4 py-2.5 text-sm leading-relaxed text-(--c-text1)'>
									{message.parts
										.filter((p) => p.type === 'text')
										.map((p, i) => (
											<span key={i}>{(p as { type: 'text'; text: string }).text}</span>
										))}
								</p>
							</div>
						) : (
							<div className='flex max-w-[90%] items-start gap-4'>
								<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-(--c-border) bg-(--c-sidebar) text-xs text-white'>
									<Icon name='bot' />
								</div>
								<div className='flex-1 space-y-2 pt-0.5'>
									<div className='text-[11px] font-semibold tracking-wider text-(--c-text3)'>
										AGENT
									</div>
									<AgentMessage message={message} />
								</div>
							</div>
						)}
					</article>
				);
			})}
		</section>
	);
}
