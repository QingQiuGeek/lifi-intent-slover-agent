import type { LifiAgentUIMessage } from '@/lib/agents/lifi-agent';

export type Session = {
	id: string;
	title: string;
	messages: LifiAgentUIMessage[];
	createdAt?: number;
};

export function createSession(title = '新的对话'): Session {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		title,
		messages: [],
		createdAt: Date.now(),
	};
}

export function formatDateTime(ts?: number): string {
	if (!ts) return '';
	const d = new Date(ts);
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function getShortTitle(text: string, limit = 30) {
	return text.length > limit ? `${text.slice(0, limit)}…` : text;
}
