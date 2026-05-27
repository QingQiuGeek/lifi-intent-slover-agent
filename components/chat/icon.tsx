export type IconName =
	| 'arrow-up'
	| 'bot'
	| 'message-square'
	| 'panel-left-close'
	| 'panel-left-open'
	| 'plus'
	| 'settings'
	| 'terminal'
	| 'trash-2'
	| 'stop-circle'
	| 'sun'
	| 'moon'
	| 'copy'
	| 'check';

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
	copy: (
		<>
			<rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
			<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
		</>
	),
	check: <path d='M20 6 9 17l-5-5' />,
};

export function Icon({
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
