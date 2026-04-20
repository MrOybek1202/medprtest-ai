import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface MarqueeProps {
	children: ReactNode
	reverse?: boolean
	slow?: boolean
	className?: string
}

export default function Marquee({
	children,
	reverse,
	slow,
	className,
}: MarqueeProps) {
	return (
		<div className={cn('ticker-mask overflow-hidden', className)}>
			<div
				className={cn(
					'marquee mb-2',
					slow && 'marquee-slow',
					reverse && 'marquee-reverse',
				)}
			>
				<div className='flex shrink-0 items-center gap-12'>{children}</div>
				<div className='flex shrink-0 items-center gap-12' aria-hidden>
					{children}
				</div>
			</div>
		</div>
	)
}
