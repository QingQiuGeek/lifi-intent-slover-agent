'use client';

import { useState } from 'react';
import type { LifiAgentUIMessage } from '@/lib/agents/lifi-agent';
import { AgentMessage } from '@/components/agent/agent-message';
import { Icon } from './icon';

function extractText(message: LifiAgentUIMessage) {
	return message.parts
		.filter((p) => p.type === 'text')
		.map((p) => (p as { type: 'text'; text: string }).text)
		.join('\n');
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			/* ignore */
		}
	};

	return (
		<button
			aria-label={copied ? '已复制' : '复制'}
			className='inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-(--c-text3) transition hover:bg-(--c-surface) hover:text-(--c-text1)'
			onClick={handleCopy}
			type='button'
		>
			<Icon className='h-3.5 w-3.5' name={copied ? 'check' : 'copy'} />
			{copied ? '已复制' : '复制'}
		</button>
	);
}

export function MessageList({
	messages,
	onSendMessage,
}: {
	messages: LifiAgentUIMessage[];
	onSendMessage?: (text: string) => void;
}) {
	return (
		<section className='mx-auto max-w-2xl space-y-8 px-4 py-8'>
			{messages.map((message, index) => {
				const isUser = message.role === 'user';
				const text = extractText(message);
				return (
					<article
						className={`flex animate-fade-in gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
						key={message.id ?? index}
					>
						{isUser ? (
							<div className='flex max-w-[85%] flex-col items-end gap-1'>
								<p className='whitespace-pre-line rounded-2xl border border-(--c-border2) bg-(--c-surface) px-4 py-2.5 text-[15px] leading-relaxed text-(--c-text1)'>
									{text}
								</p>
								<CopyButton text={text} />
							</div>
						) : (
							<div className='flex max-w-[90%] items-start gap-3'>
								<img
									alt='LI.FI Intent Agent'
									className='h-8 w-8 shrink-0 rounded-full border border-(--c-border) bg-(--c-sidebar) object-contain p-0.5'
									src='/logo.png'
								/>
								<div className='min-w-0 flex-1 space-y-2 pt-0.5'>
									<div className='text-xs font-semibold tracking-wide text-(--c-text2)'>
										LI.FI Intent Agent
									</div>
									<AgentMessage message={message} onSendMessage={onSendMessage} />
									{text && (
										<div className='pt-1'>
											<CopyButton text={text} />
										</div>
									)}
								</div>
							</div>
						)}
					</article>
				);
			})}
		</section>
	);
}
