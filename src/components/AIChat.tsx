import { generateMedicalChatReply } from '@/src/lib/ai'
import { chatService } from '@/src/services/chat'
import {
	Brain,
	ChevronLeft,
	History,
	MessageSquare,
	Plus,
	Send,
	Trash2,
	User,
	X,
} from 'lucide-react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import React, { useState } from 'react'
import { toast } from 'sonner'

interface AIChatProps {
	userId?: string | null
	context?: {
		question?: string
		explanation?: string
	}
}

type ChatRole = 'user' | 'assistant'

interface ThreadSummary {
	id: string
	title: string
	updated_at: string
}

export default function AIChat({ userId, context }: AIChatProps) {
	const [isChatOpen, setIsChatOpen] = useState(false)
	const [chatThreads, setChatThreads] = useState<ThreadSummary[]>([])
	const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
	const [chatMessages, setChatMessages] = useState<
		{ role: ChatRole; content: string }[]
	>([])
	const [chatInput, setChatInput] = useState('')
	const [isChatLoading, setIsChatLoading] = useState(false)
	const [isThreadsLoading, setIsThreadsLoading] = useState(false)
	const [showHistory, setShowHistory] = useState(false)
	const [chatSize, setChatSize] = useState({ width: 500, height: 600 })
	const [isMobile, setIsMobile] = useState(false)
	const dragControls = useDragControls()

	React.useEffect(() => {
		const checkMobile = () => {
			const mobile = window.innerWidth < 768
			setIsMobile(mobile)
			if (mobile) {
				setChatSize({ width: window.innerWidth, height: window.innerHeight })
			} else {
				setChatSize({ width: 500, height: 600 })
			}
		}

		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	React.useEffect(() => {
		if (isChatOpen && userId) {
			void loadThreads()
		}
	}, [isChatOpen, userId])

	React.useEffect(() => {
		if (activeThreadId) {
			void loadMessages(activeThreadId)
		} else {
			setChatMessages([])
		}
	}, [activeThreadId])

	const loadThreads = async () => {
		if (!userId) {
			return
		}

		setIsThreadsLoading(true)
		try {
			const threads = await chatService.getThreads(userId)
			setChatThreads(threads)

			if (!activeThreadId && threads.length > 0) {
				setActiveThreadId(threads[0].id)
			}
		} catch (error) {
			console.error('Error loading threads:', error)
			toast.error('Suhbatlar tarixini yuklashda xatolik')
		} finally {
			setIsThreadsLoading(false)
		}
	}

	const loadMessages = async (threadId: string) => {
		try {
			const messages = await chatService.getMessages(threadId)
			setChatMessages(
				messages.map(message => ({
					role: message.role,
					content: message.content,
				})),
			)
		} catch (error) {
			console.error('Error loading messages:', error)
			toast.error('Xabarlarni yuklashda xatolik')
		}
	}

	const handleCreateThread = async () => {
		if (!userId) {
			return
		}

		try {
			const newThread = await chatService.createThread(
				userId,
				`Suhbat ${new Date().toLocaleDateString()}`,
			)
			setChatThreads(prev => [newThread, ...prev])
			setActiveThreadId(newThread.id)
			setChatMessages([])
			setShowHistory(false)
		} catch (error) {
			console.error('Error creating thread:', error)
			toast.error('Yangi suhbat yaratishda xatolik')
		}
	}

	const handleDeleteThread = async (
		event: React.MouseEvent,
		threadId: string,
	) => {
		event.stopPropagation()

		try {
			await chatService.deleteThread(threadId)
			setChatThreads(prev => prev.filter(thread => thread.id !== threadId))

			if (activeThreadId === threadId) {
				setActiveThreadId(null)
				setChatMessages([])
			}

			toast.success("Suhbat o'chirildi")
		} catch (error) {
			console.error('Error deleting thread:', error)
			toast.error("Suhbatni o'chirishda xatolik")
		}
	}

	const handleResize = (event: React.MouseEvent) => {
		if (isMobile) {
			return
		}

		const startX = event.clientX
		const startY = event.clientY
		const startWidth = chatSize.width
		const startHeight = chatSize.height

		const onMouseMove = (moveEvent: MouseEvent) => {
			const newWidth = Math.max(400, startWidth + (moveEvent.clientX - startX))
			const newHeight = Math.max(
				400,
				startHeight + (moveEvent.clientY - startY),
			)
			setChatSize({ width: newWidth, height: newHeight })
		}

		const onMouseUp = () => {
			document.removeEventListener('mousemove', onMouseMove)
			document.removeEventListener('mouseup', onMouseUp)
		}

		document.addEventListener('mousemove', onMouseMove)
		document.addEventListener('mouseup', onMouseUp)
	}

	const handleSendMessage = async () => {
		if (!chatInput.trim() || isChatLoading || !userId) {
			return
		}

		let threadId = activeThreadId
		const userMessage = chatInput.trim()

		if (!threadId) {
			try {
				const newThread = await chatService.createThread(
					userId,
					`${userMessage.slice(0, 30)}${userMessage.length > 30 ? '...' : ''}`,
				)
				setChatThreads(prev => [newThread, ...prev])
				setActiveThreadId(newThread.id)
				threadId = newThread.id
			} catch (error) {
				console.error('Error creating thread on send:', error)
				toast.error('Suhbat yaratishda xatolik')
				return
			}
		}

		const nextMessages = [
			...chatMessages,
			{ role: 'user' as const, content: userMessage },
		]
		setChatInput('')
		setChatMessages(nextMessages)
		setIsChatLoading(true)

		try {
			await chatService.saveMessage(threadId, 'user', userMessage)

			const assistantMessage = await generateMedicalChatReply(
				nextMessages,
				context,
			)

			await chatService.saveMessage(threadId, 'assistant', assistantMessage)

			setChatMessages(prev => [
				...prev,
				{ role: 'assistant', content: assistantMessage },
			])
			await loadThreads()
		} catch (error: any) {
			console.error('Chat error:', error)
			const message =
				error?.message || 'Kechirasiz, javob olishda xatolik yuz berdi.'
			setChatMessages(prev => [
				...prev,
				{ role: 'assistant', content: message },
			])
		} finally {
			setIsChatLoading(false)
		}
	}

	return (
		<>
			<motion.button
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				onClick={() => setIsChatOpen(!isChatOpen)}
				className='fixed bottom-28 right-4 md:bottom-32 md:right-8 lg:bottom-8 lg:right-8 z-[110] w-14 h-14 md:w-16 md:h-16 bg-[#102347] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#153a2f] transition-colors border-1 border-white'
			>
				{isChatOpen ? (
					<X size={24} className='md:w-7 md:h-7' />
				) : (
					<MessageSquare size={24} className='md:w-7 md:h-7' />
				)}
				{!isChatOpen && (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className='absolute top-0 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white'
					/>
				)}
			</motion.button>

			<AnimatePresence>
				{isChatOpen && (
					<div
						className={`fixed inset-0 z-[100] ${isMobile ? 'pointer-events-auto' : 'pointer-events-none flex items-center justify-center'}`}
					>
						<motion.div
							drag={!isMobile}
							dragControls={dragControls}
							dragListener={false}
							dragMomentum={false}
							initial={
								isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }
							}
							animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
							exit={
								isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }
							}
							style={
								isMobile
									? { width: '100%', height: '100%' }
									: { width: chatSize.width, height: chatSize.height }
							}
							className={`bg-[#0F172A] ${isMobile ? 'rounded-none' : 'rounded-[32px] border border-slate-800 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]'} flex flex-col overflow-hidden pointer-events-auto relative`}
						>
							<div
								onPointerDown={event => !isMobile && dragControls.start(event)}
								className={`p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md ${isMobile ? '' : 'cursor-move'} select-none touch-none`}
							>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 rounded-xl bg-[#102347]/20 flex items-center justify-center border border-[#102347]/30'>
										<Brain className='text-[#102347]' size={20} />
									</div>
									<div>
										<h3 className='font-bold text-white text-sm'>
											AI Tibbiy Yordamchi
										</h3>
										<div className='flex items-center gap-1.5'>
											<div className='w-1.5 h-1.5 rounded-full bg-[#2c5ff2] animate-pulse' />
											<p className='text-slate-400 text-[10px] font-medium uppercase tracking-wider'>
												Groq Online
											</p>
										</div>
									</div>
								</div>
								<div className='flex items-center gap-2'>
									<button
										onClick={() => setShowHistory(!showHistory)}
										className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
											showHistory
												? 'bg-[#102347] text-white'
												: 'bg-slate-800 text-slate-400 hover:text-white'
										}`}
										title='Suhbatlar tarixi'
									>
										<History size={18} />
									</button>
									<button
										onClick={() => setIsChatOpen(false)}
										className='w-8 h-8 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-all'
									>
										<X size={18} />
									</button>
								</div>
							</div>

							<AnimatePresence>
								{showHistory && (
									<motion.div
										initial={{ x: '-100%' }}
										animate={{ x: 0 }}
										exit={{ x: '-100%' }}
										className='absolute inset-0 z-50 bg-[#0F172A] flex flex-col'
									>
										<div className='p-5 border-b border-slate-800 flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<button
													onClick={() => setShowHistory(false)}
													className='p-2 hover:bg-slate-800 rounded-lg text-slate-400'
												>
													<ChevronLeft size={20} />
												</button>
												<h3 className='font-bold text-white'>
													Suhbatlar tarixi
												</h3>
											</div>
											<button
												onClick={handleCreateThread}
												className='p-2 bg-[#102347] text-white rounded-lg hover:bg-[#153a2f] transition-all'
												title='Yangi suhbat'
											>
												<Plus size={20} />
											</button>
										</div>

										<div className='flex-1 overflow-y-auto p-4 space-y-2'>
											{isThreadsLoading ? (
												<div className='flex justify-center p-8'>
													<div className='w-6 h-6 border-2 border-[#102347] border-t-transparent rounded-full animate-spin' />
												</div>
											) : chatThreads.length === 0 ? (
												<div className='text-center p-8 text-slate-500 text-sm'>
													Hozircha suhbatlar yo&apos;q
												</div>
											) : (
												chatThreads.map(thread => (
													<div
														key={thread.id}
														onClick={() => {
															setActiveThreadId(thread.id)
															setShowHistory(false)
														}}
														className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${
															activeThreadId === thread.id
																? 'bg-[#102347]/20 border border-[#102347]/30'
																: 'bg-slate-800/30 border border-transparent hover:border-slate-700'
														}`}
													>
														<div className='flex items-center gap-3 min-w-0'>
															<MessageSquare
																size={18}
																className={
																	activeThreadId === thread.id
																		? 'text-[#102347]'
																		: 'text-slate-500'
																}
															/>
															<div className='min-w-0'>
																<p className='text-sm font-medium text-white truncate'>
																	{thread.title}
																</p>
																<p className='text-[10px] text-slate-500'>
																	{new Date(
																		thread.updated_at,
																	).toLocaleDateString()}
																</p>
															</div>
														</div>
														<button
															onClick={event =>
																handleDeleteThread(event, thread.id)
															}
															className='p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all'
														>
															<Trash2 size={16} />
														</button>
													</div>
												))
											)}
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							<div className='flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800'>
								{chatMessages.length === 0 && (
									<div className='h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40'>
										<div className='w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center'>
											<MessageSquare size={32} className='text-slate-600' />
										</div>
										<p className='text-slate-400 text-sm max-w-[250px] font-medium'>
											Mavzu yuzasidan istalgan savolingizni bering. AI sizga
											batafsil tushuntirib beradi.
										</p>
									</div>
								)}

								{chatMessages.map((message, index) => (
									<motion.div
										key={`${message.role}-${index}`}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
									>
										<div
											className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
										>
											<div
												className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
													message.role === 'user'
														? 'bg-blue-600 text-white'
														: 'bg-[#102347] text-white'
												}`}
											>
												{message.role === 'user' ? (
													<User size={14} />
												) : (
													<Brain size={14} />
												)}
											</div>
											<div
												className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
													message.role === 'user'
														? 'bg-blue-600/10 text-blue-100 border border-blue-500/20 rounded-tr-none'
														: 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none'
												}`}
											>
												{message.content}
											</div>
										</div>
									</motion.div>
								))}

								{isChatLoading && (
									<div className='flex justify-start'>
										<div className='flex gap-3'>
											<div className='w-7 h-7 rounded-lg bg-[#102347] text-white flex items-center justify-center shadow-sm'>
												<Brain size={14} className='animate-pulse' />
											</div>
											<div className='bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center'>
												<div className='w-1.5 h-1.5 rounded-full bg-[#102347] animate-bounce' />
												<div className='w-1.5 h-1.5 rounded-full bg-[#102347] animate-bounce [animation-delay:0.2s]' />
												<div className='w-1.5 h-1.5 rounded-full bg-[#102347] animate-bounce [animation-delay:0.4s]' />
											</div>
										</div>
									</div>
								)}
							</div>

							<div
								className={`${isMobile ? 'p-3 pb-safe' : 'p-5'} bg-slate-900/80 backdrop-blur-md border-t border-slate-800`}
							>
								<div className='relative'>
									<input
										type='text'
										value={chatInput}
										onChange={event => setChatInput(event.target.value)}
										onKeyDown={event =>
											event.key === 'Enter' && void handleSendMessage()
										}
										placeholder='Savolingizni yozing...'
										className='w-full bg-slate-800/50 border border-slate-700 text-white rounded-2xl py-3.5 pl-5 pr-14 focus:outline-none focus:border-[#102347] focus:ring-1 focus:ring-[#102347]/30 transition-all text-sm'
									/>
									<button
										onClick={() => void handleSendMessage()}
										disabled={!chatInput.trim() || isChatLoading}
										className='absolute right-1.5 top-1.5 bottom-1.5 w-11 rounded-xl bg-[#102347] text-white flex items-center justify-center hover:bg-[#153a2f] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#102347]/20'
									>
										<Send size={16} />
									</button>
								</div>
							</div>

							{!isMobile && (
								<div
									onMouseDown={handleResize}
									className='absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1.5 group z-50'
								>
									<div className='w-3 h-3 border-r-2 border-b-2 border-slate-600 group-hover:border-[#102347] transition-colors rounded-br-sm' />
								</div>
							)}
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	)
}
