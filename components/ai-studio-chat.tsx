'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Sender = 'user' | 'agent';

type Message = {
	sender: Sender;
	text: string;
};

type Session = {
	id: string;
	title: string;
	messages: Message[];
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
	| 'trash'
	| 'trash-2';

const initialSessions: Session[] = [
	{
		id: '1',
		title: '关于极简设计美学',
		messages: [
			{
				sender: 'user',
				text: '为什么 ChatGPT 的界面设计得这么简单？',
			},
			{
				sender: 'agent',
				text: 'ChatGPT 采用极简设计的核心原因在于减少用户的认知负担。克制的黑、白、灰色调和充足留白，把视觉焦点交给内容与对话。工具本身应该尽量隐形，让用户专注于思考与交互。',
			},
		],
	},
];

const promptCards = [
	{
		title: '制定计划',
		description: '规划一个高效率、低内耗的日常作息表',
		prompt: '帮我制定一个极简主义的日常作息表',
	},
	{
		title: '探索概念',
		description: '用通俗语言解释奥卡姆剃刀',
		prompt: '解释什么是“奥卡姆剃刀原理”？',
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
			<rect
				width='16'
				height='12'
				x='4'
				y='8'
				rx='3'
			/>
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
			<rect
				width='18'
				height='18'
				x='3'
				y='3'
				rx='2'
			/>
			<path d='M9 3v18' />
			<path d='m16 15-3-3 3-3' />
		</>
	),
	'panel-left-open': (
		<>
			<rect
				width='18'
				height='18'
				x='3'
				y='3'
				rx='2'
			/>
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
			<circle
				cx='12'
				cy='12'
				r='3'
			/>
		</>
	),
	terminal: (
		<>
			<path d='m7 11 3-3-3-3' />
			<path d='M11 13h6' />
			<rect
				width='18'
				height='18'
				x='3'
				y='3'
				rx='2'
			/>
		</>
	),
	trash: (
		<>
			<path d='M3 6h18' />
			<path d='M8 6V4h8v2' />
			<path d='M19 6l-1 14H6L5 6' />
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
	};
}

function getShortTitle(text: string, limit: number) {
	return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

export function AiStudioChat() {
	const [sessions, setSessions] = useState<Session[]>(initialSessions);
	const [currentSessionId, setCurrentSessionId] = useState('1');
	const [input, setInput] = useState('');
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	const currentSession = useMemo(
		() => sessions.find((session) => session.id === currentSessionId) ?? null,
		[currentSessionId, sessions],
	);

	const hasMessages = Boolean(currentSession?.messages.length);

	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}, [input]);

	useEffect(() => {
		const chatContainer = chatContainerRef.current;
		if (!chatContainer) return;
		chatContainer.scrollTop = chatContainer.scrollHeight;
	}, [sessions, currentSessionId]);

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
		const newSession = createSession();
		setSessions((previous) => [newSession, ...previous]);
		setCurrentSessionId(newSession.id);
		requestAnimationFrame(() => textareaRef.current?.focus());
	}

	function deleteSession(id: string) {
		setSessions((previous) => {
			const nextSessions = previous.filter((session) => session.id !== id);
			if (id === currentSessionId) {
				setCurrentSessionId(nextSessions[0]?.id ?? '');
			}
			return nextSessions;
		});
	}

	function renameSession(id: string) {
		const session = sessions.find((item) => item.id === id);
		if (!session) return;

		const title = window.prompt('重命名此对话', session.title)?.trim();
		if (!title) return;

		setSessions((previous) =>
			previous.map((item) => (item.id === id ? { ...item, title } : item)),
		);
	}

	function clearCurrentMessages() {
		if (!currentSessionId) return;
		setSessions((previous) =>
			previous.map((session) =>
				session.id === currentSessionId
					? { ...session, messages: [] }
					: session,
			),
		);
	}

	function sendMessage(text = input.trim()) {
		const messageText = text.trim();
		if (!messageText) return;

		let targetSessionId = currentSessionId;

		setSessions((previous) => {
			let nextSessions = previous;

			if (!targetSessionId) {
				const newSession = createSession(getShortTitle(messageText, 12));
				targetSessionId = newSession.id;
				nextSessions = [newSession, ...previous];
				setCurrentSessionId(newSession.id);
			}

			return nextSessions.map((session) => {
				if (session.id !== targetSessionId) return session;

				const shouldRename = session.messages.length === 0;
				return {
					...session,
					title: shouldRename ? getShortTitle(messageText, 12) : session.title,
					messages: [
						...session.messages,
						{ sender: 'user', text: messageText },
					],
				};
			});
		});

		setInput('');

		window.setTimeout(() => {
			setSessions((previous) =>
				previous.map((session) =>
					session.id === targetSessionId
						? {
								...session,
								messages: [
									...session.messages,
									{
										sender: 'agent',
										text: `这是一个模拟回复。我已经收到你发送的信息：\n\n“${messageText}”\n\n当前界面已拆分为 Next.js 客户端组件，后续可以在这个结构里接入真实的大语言模型接口。`,
									},
								],
							}
						: session,
				),
			);
		}, 600);
	}

	return (
		<main className='flex h-dvh overflow-hidden bg-[#212121] text-[#ececec]'>
			<aside
				className={`z-20 flex h-full shrink-0 flex-col border-r border-[#2f2f2f] bg-[#171717] transition-all duration-300 ${
					isSidebarOpen
						? 'w-64 opacity-100'
						: 'w-0 overflow-hidden opacity-0 pointer-events-none'
				}`}
				aria-label='对话历史'
			>
				<section className='flex items-center justify-between p-3.5'>
					<button
						className='group flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-sm font-normal text-white transition hover:bg-[#212121]'
						onClick={startNewSession}
						type='button'
					>
						<span className='flex items-center gap-2'>
							<Icon
								className='h-4 w-4 text-[#b4b4b4] transition group-hover:text-white'
								name='plus'
							/>
							新对话
						</span>
						<kbd className='rounded border border-[#2f2f2f] px-1.5 py-0.5 text-[10px] text-[#5f5f5f] transition group-hover:text-[#b4b4b4]'>
							Ctrl K
						</kbd>
					</button>

					<button
						aria-label='收起侧边栏'
						className='ml-1 rounded-lg p-2 text-[#b4b4b4] transition hover:bg-[#212121] hover:text-white'
						onClick={() => setIsSidebarOpen(false)}
						type='button'
					>
						<Icon name='panel-left-close' />
					</button>
				</section>

				<nav className='flex-1 space-y-0.5 overflow-y-auto px-2 py-2'>
					{sessions.map((session) => {
						const isActive = session.id === currentSessionId;
						return (
							<div
								className={`group flex items-center rounded-lg text-xs transition ${
									isActive
										? 'bg-[#212121] font-medium text-white'
										: 'text-[#b4b4b4] hover:bg-[#212121]/60 hover:text-[#ececec]'
								}`}
								key={session.id}
							>
								<button
									className='flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left'
									onClick={() => setCurrentSessionId(session.id)}
									type='button'
								>
									<Icon
										className='h-3.5 w-3.5 shrink-0 opacity-80'
										name='message-square'
									/>
									<span
										className='truncate'
										onDoubleClick={(event) => {
											event.stopPropagation();
											renameSession(session.id);
										}}
									>
										{session.title}
									</span>
								</button>
								<button
									aria-label='删除对话'
									className='mr-2 rounded p-1 opacity-0 transition hover:text-white group-hover:opacity-100'
									onClick={() => deleteSession(session.id)}
									type='button'
								>
									<Icon
										className='h-3.5 w-3.5'
										name='trash-2'
									/>
								</button>
							</div>
						);
					})}
				</nav>

				<section className='flex items-center justify-between border-t border-[#2f2f2f] p-3 text-sm text-[#b4b4b4]'>
					<button
						className='flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#212121]'
						type='button'
					>
						<span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2f2f2f] text-[11px] font-bold text-white'>
							U
						</span>
						<span className='truncate text-xs'>Premium User</span>
					</button>
					<button
						aria-label='设置'
						className='rounded-lg p-2 transition hover:bg-[#212121] hover:text-white'
						type='button'
					>
						<Icon name='settings' />
					</button>
				</section>
			</aside>

			{!isSidebarOpen ? (
				<button
					aria-label='展开侧边栏'
					className='fixed left-4 top-4 z-30 rounded-lg border border-[#2f2f2f] bg-[#212121] p-2 text-[#b4b4b4] transition hover:bg-[#2f2f2f] hover:text-white'
					onClick={() => setIsSidebarOpen(true)}
					type='button'
				>
					<Icon name='panel-left-open' />
				</button>
			) : null}

			<section className='relative flex h-full min-w-0 flex-1 flex-col bg-[#212121]'>
				<header className='flex h-14 shrink-0 items-center justify-between border-b border-[#2f2f2f]/30 px-4 sm:px-6'>
					<div className='flex min-w-0 items-center gap-3'>
						<span className={`${isSidebarOpen ? 'w-8' : 'w-10'} shrink-0`} />
						<span className='truncate text-sm font-medium text-[#ececec]'>
							{hasMessages ? currentSession?.title : 'ChatGPT'}
						</span>
					</div>
					<button
						aria-label='清空对话'
						className='rounded-lg p-2 text-[#b4b4b4] transition hover:bg-[#2f2f2f]/50 hover:text-white'
						onClick={clearCurrentMessages}
						type='button'
					>
						<Icon name='trash' />
					</button>
				</header>

				<section
					className='flex-1 overflow-y-auto'
					ref={chatContainerRef}
				>
					{!hasMessages ? (
						<WelcomeView onSelectPrompt={sendMessage} />
					) : (
						<MessageList messages={currentSession?.messages ?? []} />
					)}
				</section>

				<footer className='shrink-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent p-4'>
					<section className='relative mx-auto max-w-2xl'>
						<div className='flex flex-col gap-2 rounded-2xl border border-[#3c3c3c] bg-[#2f2f2f] px-4 py-3 transition focus-within:border-[#5c5c5c]'>
							<textarea
								className='max-h-36 w-full resize-none bg-transparent text-sm leading-relaxed text-[#ececec] placeholder-[#8e8e8e] outline-none'
								onChange={(event) => setInput(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' && !event.shiftKey) {
										event.preventDefault();
										sendMessage();
									}
								}}
								placeholder='给 Agent 发送消息...'
								ref={textareaRef}
								rows={1}
								value={input}
							/>

							<div className='flex items-center justify-between pt-1'>
								<button
									aria-label='添加附件'
									className='rounded-lg p-1.5 text-[#b4b4b4] transition hover:bg-[#3c3c3c] hover:text-white'
									type='button'
								>
									<Icon name='paperclip' />
								</button>
								<button
									aria-label='发送消息'
									className='flex items-center justify-center rounded-lg bg-white p-1.5 text-black transition hover:bg-[#e2e2e2] disabled:cursor-not-allowed disabled:opacity-30'
									disabled={!input.trim()}
									onClick={() => sendMessage()}
									type='button'
								>
									<Icon name='arrow-up' />
								</button>
							</div>
						</div>
						<p className='mt-2 text-center text-[11px] text-[#8e8e8e]'>
							Agent 可能会犯错。请核对重要信息。
						</p>
					</section>
				</footer>
			</section>
		</main>
	);
}

function WelcomeView({
	onSelectPrompt,
}: {
	onSelectPrompt: (prompt: string) => void;
}) {
	return (
		<section className='flex h-full select-none flex-col items-center justify-center px-4 text-center'>
			<div className='mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#2f2f2f] bg-[#171717]'>
				<Icon
					className='h-6 w-6 text-white'
					name='terminal'
				/>
			</div>
			<h1 className='mb-8 text-2xl font-semibold tracking-tight text-white'>
				今天想聊点什么？
			</h1>
			<div className='grid w-full max-w-xl grid-cols-1 gap-3 text-left md:grid-cols-2'>
				{promptCards.map((card) => (
					<button
						className='rounded-xl border border-[#2f2f2f] p-3.5 text-left text-xs text-[#b4b4b4] transition hover:bg-[#2f2f2f]/30 hover:text-white'
						key={card.title}
						onClick={() => onSelectPrompt(card.prompt)}
						type='button'
					>
						<span className='mb-1 block font-medium text-white'>
							{card.title}
						</span>
						{card.description}
					</button>
				))}
			</div>
		</section>
	);
}

function MessageList({ messages }: { messages: Message[] }) {
	return (
		<section className='mx-auto max-w-2xl space-y-8 px-4 py-8'>
			{messages.map((message, index) => {
				const isUser = message.sender === 'user';

				return (
					<article
						className={`flex animate-fade-in gap-4 ${
							isUser ? 'justify-end' : 'justify-start'
						}`}
						key={`${message.sender}-${index}-${message.text.slice(0, 12)}`}
					>
						{isUser ? (
							<div className='flex max-w-[85%] flex-col items-end'>
								<p className='rounded-2xl border border-[#3c3c3c] bg-[#2f2f2f] px-4 py-2.5 text-sm leading-relaxed text-[#ececec]'>
									{message.text}
								</p>
							</div>
						) : (
							<div className='flex max-w-[90%] items-start gap-4'>
								<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2f2f2f] bg-[#171717] text-xs text-white'>
									<Icon name='bot' />
								</div>
								<div className='flex-1 space-y-1.5 pt-0.5'>
									<div className='text-[11px] font-semibold tracking-wider text-[#8e8e8e]'>
										AGENT
									</div>
									<p className='whitespace-pre-line text-sm leading-relaxed text-[#ececec]'>
										{message.text}
									</p>
								</div>
							</div>
						)}
					</article>
				);
			})}
		</section>
	);
}
