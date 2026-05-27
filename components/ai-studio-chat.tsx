'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import type { LifiAgentUIMessage } from '@/lib/agents/lifi-agent';
import { createBrowserStore } from '@/lib/storage/browser-store';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatInput } from '@/components/chat/chat-input';
import { WelcomeView } from '@/components/chat/welcome-view';
import { MessageList } from '@/components/chat/message-list';
import { createSession, getShortTitle } from '@/components/chat/types';
import type { Session } from '@/components/chat/types';

const store = createBrowserStore();

export function AiStudioChat() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState('');
	const [input, setInput] = useState('');
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [focusTrigger, setFocusTrigger] = useState(0);
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
			};
			setSessions((prev) =>
				prev.map((s) => (s.id === currentSessionId ? updated : s)),
			);
			store.saveSession({
				...updated,
				orderIds: [],
				createdAt: updated.createdAt ?? Date.now(),
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
		const handleShortcut = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				startNewSession();
			}
		};
		window.addEventListener('keydown', handleShortcut);
		return () => window.removeEventListener('keydown', handleShortcut);
	});

	function startNewSession() {
		setCurrentSessionId('');
		setInput('');
		setFocusTrigger((n) => n + 1);
	}

	function deleteSession(id: string) {
		setDeletingId(null);
		setSessions((prev) => {
			const next = prev.filter((s) => s.id !== id);
			if (id === currentSessionId) setCurrentSessionId(next[0]?.id ?? '');
			return next;
		});
		store.deleteSession(id);
	}

	function renameSession(id: string) {
		const session = sessions.find((s) => s.id === id);
		if (!session) return;
		const title = window.prompt('重命名此对话', session.title)?.trim();
		if (!title) return;
		setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
	}

	const handleSend = useCallback(
		(text = input.trim()) => {
			const messageText = text.trim();
			if (!messageText || isStreaming) return;

			if (!isConnected) { openAppKit(); return; }

			let targetId = currentSessionId;
			if (!targetId) {
				const newSession = createSession(getShortTitle(messageText, 30));
				setSessions((prev) => [newSession, ...prev]);
				setCurrentSessionId(newSession.id);
				targetId = newSession.id;
			} else {
				setSessions((prev) =>
					prev.map((s) => {
						if (s.id !== targetId) return s;
						return s.messages.length === 0
							? { ...s, title: getShortTitle(messageText, 30) }
							: s;
					}),
				);
			}

			sendMessage({ text: messageText });
			setInput('');
		},
		[input, currentSessionId, isStreaming, sendMessage, isConnected, openAppKit],
	);

	const displayMessages: LifiAgentUIMessage[] = isStreaming
		? (messages as LifiAgentUIMessage[])
		: (currentSession?.messages ?? []);

	const headerTitle = hasMessages ? (currentSession?.title ?? '') : 'LI.FI Intent Agent';

	return (
		<main className='flex h-dvh overflow-hidden bg-(--c-bg) text-(--c-text1)'>
			<ChatSidebar
				sessions={sessions}
				currentSessionId={currentSessionId}
				deletingId={deletingId}
				isSidebarOpen={isSidebarOpen}
				onSelectSession={setCurrentSessionId}
				onStartNewSession={startNewSession}
				onDeleteSession={deleteSession}
				onRenameSession={renameSession}
				onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
				onSetDeletingId={setDeletingId}
			/>

			<section className='relative flex h-full min-w-0 flex-1 flex-col bg-(--c-bg)'>
				<ChatHeader
					title={headerTitle}
					isConnected={isConnected}
					address={address}
					caipNetworkName={caipNetwork?.name}
					onOpenWallet={() => openAppKit()}
				/>

				<div className='flex-1 overflow-y-auto' ref={chatContainerRef}>
					{!hasMessages && displayMessages.length === 0 ? (
						<WelcomeView onSelectPrompt={handleSend} />
					) : (
						<MessageList messages={displayMessages} />
					)}
				</div>

				<ChatInput
					value={input}
					isStreaming={isStreaming}
					isConnected={isConnected}
					onChange={setInput}
					onSend={handleSend}
					onStop={stop}
					focusTrigger={focusTrigger}
				/>
			</section>
		</main>
	);
}
