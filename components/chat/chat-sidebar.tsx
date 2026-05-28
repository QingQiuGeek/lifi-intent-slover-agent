'use client';

import { Icon } from './icon';
import { formatDateTime } from './types';
import type { Session } from './types';

interface ChatSidebarProps {
	sessions: Session[];
	currentSessionId: string;
	deletingId: string | null;
	isSidebarOpen: boolean;
	onSelectSession: (id: string) => void;
	onStartNewSession: () => void;
	onDeleteSession: (id: string) => void;
	onRenameSession: (id: string) => void;
	onToggleSidebar: () => void;
	onSetDeletingId: (id: string | null) => void;
}

export function ChatSidebar({
	sessions,
	currentSessionId,
	deletingId,
	isSidebarOpen,
	onSelectSession,
	onStartNewSession,
	onDeleteSession,
	onRenameSession,
	onToggleSidebar,
	onSetDeletingId,
}: ChatSidebarProps) {
	return (
		<aside
			className={[
				'flex h-full flex-col border-r border-(--c-border) bg-(--c-sidebar)',
				'transition-all duration-300',
				// Mobile: fixed overlay, slides in/out
				'fixed inset-y-0 left-0 z-30 shrink-0',
				// Desktop: inline in flex layout
				'md:relative md:inset-auto md:z-20',
				isSidebarOpen
					? 'w-64 translate-x-0 shadow-2xl md:shadow-none'
					: '-translate-x-full md:translate-x-0 w-64 md:w-14',
			].join(' ')}
			aria-label='对话历史'
		>
			<header className='flex items-center justify-between border-b border-(--c-border) px-3 py-3'>
				<button
					className='flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg p-0 transition hover:opacity-80'
					onClick={onStartNewSession}
					title='回到首页'
					type='button'
				>
					<img
						alt='LI.FI'
						className='h-8 w-8 shrink-0 rounded-lg object-contain'
						src='/logo.png'
					/>
					{isSidebarOpen && (
						<span className='whitespace-nowrap text-sm font-semibold text-(--c-text1)'>
							LI.FI Intent Agent
						</span>
					)}
				</button>
				<button
					aria-label={isSidebarOpen ? '收起侧边栏' : '展开侧边栏'}
					className='ml-1 shrink-0 rounded-lg p-1.5 text-(--c-text2) transition hover:bg-(--c-bg) hover:text-(--c-text1)'
					onClick={onToggleSidebar}
					type='button'
				>
					<Icon name={isSidebarOpen ? 'panel-left-close' : 'panel-left-open'} />
				</button>
			</header>

			{isSidebarOpen && (
				<>
					<div className='px-3 pb-2 pt-3'>
						<button
							className='group flex w-full items-center justify-between rounded-lg border border-(--c-border) px-3 py-2.5 text-sm text-(--c-text2) transition hover:border-(--c-border2) hover:bg-(--c-bg) hover:text-(--c-text1)'
							onClick={onStartNewSession}
							type='button'
						>
							<span className='flex items-center gap-2'>
								<Icon className='h-4 w-4' name='plus' />
								新对话
							</span>
							<kbd className='rounded border border-(--c-border) px-1.5 py-0.5 text-[10px] transition group-hover:border-(--c-border2) group-hover:text-(--c-text2)'>
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
											? 'bg-(--c-bg) text-(--c-text1)'
											: 'text-(--c-text2) hover:bg-(--c-bg)/60 hover:text-(--c-text1)'
									}`}
									key={session.id}
									onClick={() => { onSetDeletingId(null); onSelectSession(session.id); }}
								>
									<Icon className='mr-2.5 h-3.5 w-3.5 shrink-0' name='message-square' />
									<div className='min-w-0 flex-1'>
										<p
											className='truncate text-sm font-medium leading-snug'
											onDoubleClick={(e) => { e.stopPropagation(); onRenameSession(session.id); }}
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
													onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
													type='button'
												>
													确认
												</button>
												<button
													className='rounded px-1 py-0.5 text-[10px] text-(--c-text2) hover:text-(--c-text1)'
													onClick={(e) => { e.stopPropagation(); onSetDeletingId(null); }}
													type='button'
												>
													✕
												</button>
											</>
										) : (
											<button
												aria-label='删除对话'
												className='rounded p-1 text-(--c-text2) transition hover:text-red-400'
												onClick={(e) => { e.stopPropagation(); onSetDeletingId(session.id); }}
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
	);
}
