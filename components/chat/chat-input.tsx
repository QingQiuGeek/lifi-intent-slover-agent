'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './icon';

interface ChatInputProps {
	value: string;
	isStreaming: boolean;
	isConnected: boolean;
	onChange: (v: string) => void;
	onSend: () => void;
	onStop: () => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
	focusTrigger?: number;
}

export function ChatInput({
	value,
	isStreaming,
	isConnected,
	onChange,
	onSend,
	onStop,
	onKeyDown,
	focusTrigger,
}: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const ta = textareaRef.current;
		if (!ta) return;
		ta.style.height = 'auto';
		ta.style.height = `${ta.scrollHeight}px`;
	}, [value]);

	useEffect(() => {
		if (focusTrigger !== undefined) {
			requestAnimationFrame(() => textareaRef.current?.focus());
		}
	}, [focusTrigger]);

	return (
		<footer className='shrink-0 bg-gradient-to-t from-(--c-bg) from-60% via-(--c-bg)/80 to-transparent px-4 pb-4 pt-8'>
			<div className='relative mx-auto max-w-2xl'>
				<div className='chat-glass-input flex items-end gap-2 rounded-2xl pl-4 pr-2 py-2.5'>
					<textarea
						className='max-h-36 flex-1 resize-none bg-transparent text-sm leading-relaxed text-(--c-text1) placeholder-(--c-text3) outline-none py-0.5'
						disabled={isStreaming}
						onChange={(e) => onChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								onSend();
							}
							onKeyDown?.(e);
						}}
						placeholder={isConnected ? '给 Agent 发送消息...' : '请先连接钱包，再发送消息'}
						ref={textareaRef}
						rows={1}
						value={value}
					/>
					<div className='shrink-0 pb-0.5'>
						{isStreaming ? (
							<button
								aria-label='停止生成'
								className='flex items-center justify-center rounded-lg bg-(--c-surface2) p-1.5 text-(--c-text2) transition hover:bg-(--c-border2) hover:text-(--c-text1)'
								onClick={onStop}
								type='button'
							>
								<Icon name='stop-circle' />
							</button>
						) : (
							<button
								aria-label={isConnected ? '发送消息' : '连接钱包'}
								className='flex items-center justify-center rounded-lg bg-(--c-text1) p-1.5 text-(--c-bg) shadow-sm transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-25'
								disabled={!value.trim() && isConnected}
								onClick={onSend}
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
			</div>
		</footer>
	);
}
