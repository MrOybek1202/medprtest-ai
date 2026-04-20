import { motion, useScroll, useSpring } from 'motion/react'

export default function ScrollProgress() {
	const { scrollYProgress } = useScroll()
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 120,
		damping: 24,
		mass: 0.3,
	})

	return (
		<motion.div
			style={{ scaleX, transformOrigin: '0% 50%' }}
			className='fixed left-0 right-0 top-0 z-[60] h-[3px] bg-gradient-editorial'
		/>
	)
}
