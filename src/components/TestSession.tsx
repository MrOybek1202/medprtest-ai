import { generateExplanation } from '@/src/lib/ai'
import { supabase } from '@/src/lib/supabase'
import {
	attemptService,
	questionService,
	sessionService,
	statsService,
} from '@/src/services/api'
import { Question, Session } from '@/src/types'
import {
	AlertTriangle,
	ArrowRight,
	BookMarked,
	Brain,
	CheckCircle2,
	ChevronLeft,
	Clock,
	ExternalLink,
	GraduationCap,
	Lightbulb,
	Settings,
	Target,
	Video,
	XCircle,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

interface AIExplanation {
	explanation: string
	keyPoints: string[]
	typicalMistakes: string[]
	imageDescription?: string
	videoQuery?: string
	sources?: string[]
}

interface TestSessionProps {
	userId: string
	topic?: string | null
	onComplete: () => void
}

export default function TestSession({
	userId,
	topic,
	onComplete,
}: TestSessionProps) {
	const [questions, setQuestions] = useState<Question[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [session, setSession] = useState<Session | null>(null)
	const [selectedOption, setSelectedOption] = useState<string | null>(null)
	const [isSubmitted, setIsSubmitted] = useState(false)
	const [mobileView, setMobileView] = useState<'question' | 'explanation'>(
		'question',
	)
	const [loading, setLoading] = useState(true)
	const [aiData, setAiData] = useState<AIExplanation | null>(null)
	const [aiLoading, setAiLoading] = useState(false)
	const [aiCache, setAiCache] = useState<Record<string, AIExplanation>>(() => {
		try {
			const saved = localStorage.getItem('medtest_ai_cache')
			return saved ? JSON.parse(saved) : {}
		} catch {
			return {}
		}
	})
	const [startTime, setStartTime] = useState<number>(Date.now())
	const [timeSpent, setTimeSpent] = useState<number>(0)
	const [answersMap, setAnswersMap] = useState<Record<string, string>>({})
	const initKeyRef = useRef<string | null>(null)

	useEffect(() => {
		localStorage.setItem('medtest_resume_test', '1')
		if (topic) {
			localStorage.setItem('medtest_test_topic', topic)
			localStorage.setItem('selectedTopic', topic)
		}
	}, [topic])

	const validSources = useMemo(() => {
		return (aiData?.sources || []).filter(source =>
			/https?:\/\/[^\s)]+/.test(source),
		)
	}, [aiData])

	const fetchAIData = async (question: Question, answer: string) => {
		const cacheKey = `${question.id}:${answer}`
		if (aiCache[cacheKey]) {
			setAiData(aiCache[cacheKey])
			return
		}

		setAiLoading(true)

		try {
			const data = await generateExplanation({
				question: question.stem,
				selectedAnswer: answer,
				correctAnswer: question.correct_option,
				topic: question.topic,
			})
			setAiData(data)
			const newCache = { ...aiCache, [cacheKey]: data }
			setAiCache(newCache)
			try {
				localStorage.setItem('medtest_ai_cache', JSON.stringify(newCache))
			} catch (e) {
				console.warn('Failed to save AI cache to localStorage:', e)
			}
		} catch (error: any) {
			console.error('Failed to fetch AI data:', error)
			setAiData({
				explanation: `Kechirasiz, AI tushuntirishini yuklashda xatolik yuz berdi: ${error.message}. Iltimos, birozdan so'ng qayta urinib ko'ring.`,
				keyPoints: [],
				typicalMistakes: [],
				sources: [],
			})
		} finally {
			setAiLoading(false)
		}
	}

	useEffect(() => {
		const initSession = async () => {
			const initKey = `${userId}:${topic || 'all'}`
			if (initKeyRef.current === initKey) {
				return
			}
			initKeyRef.current = initKey

			try {
				// Check for active session to resume
				const activeSession = await sessionService.getActiveSession(
					userId,
					topic,
				)

				if (
					activeSession &&
					activeSession.question_ids &&
					activeSession.question_ids.length > 0
				) {
					const qs = await questionService.getQuestionsByIds(
						activeSession.question_ids,
					)
					setQuestions(qs)
					setSession(activeSession)

					const savedIndex = activeSession.current_question_index || 0
					setCurrentIndex(savedIndex)

					// Check if questions were already answered in this session
					const { data: allAttempts } = await supabase
						.from('question_attempts')
						.select('question_id, selected_option')
						.eq('session_id', activeSession.id)

					if (allAttempts) {
						const map: Record<string, string> = {}
						allAttempts.forEach(a => {
							map[a.question_id] = a.selected_option
						})
						setAnswersMap(map)

						const currentQ = qs[savedIndex]
						if (currentQ && map[currentQ.id]) {
							setSelectedOption(map[currentQ.id])
							setIsSubmitted(true)
							fetchAIData(currentQ, map[currentQ.id])
						}
					}
				} else {
					// Create new session or resume topic progress
					let qs: Question[] = []
					let startIndex = 0

					if (topic) {
						// Fetch ALL questions for the topic to keep counter consistent (e.g. 10/194)
						// This ensures the user sees their overall progress in the topic
						qs = await questionService.getQuestionsByTopic(topic)
					} else {
						// For random practice, use adaptive difficulty
						const recommendedDifficulty =
							await questionService.getRecommendedDifficulty(userId)

						qs = await questionService.getQuestions(20, recommendedDifficulty)
						if (!qs || qs.length < 5) {
							qs = await questionService.getQuestions(20)
						}
					}

					if (qs && qs.length > 0) {
						// Filter out meaningless questions
						const validQs = qs.filter(q => q.stem && q.stem.trim().length > 10)

						if (validQs.length === 0) {
							setQuestions([])
						} else {
							setQuestions(validQs)
							const qIds = validQs.map(q => q.id)

							// Recalculate startIndex based on validQs
							if (topic) {
								const { data: answeredData } = await supabase
									.from('question_attempts')
									.select('question_id')
									.eq('user_id', userId)
									.eq('question_topic', topic)

								const answeredIds = new Set(
									answeredData?.map(a => a.question_id) || [],
								)
								startIndex = validQs.findIndex(q => !answeredIds.has(q.id))
								if (startIndex === -1) startIndex = 0
							}

							const sess = await sessionService.createSession(
								userId,
								validQs.length,
								topic,
								qIds,
							)

							// If we are resuming topic progress, update the session's current index
							if (topic && startIndex > 0) {
								await sessionService.updateSession(sess.id, {
									current_question_index: startIndex,
								})
							}

							setSession(sess)
							setCurrentIndex(startIndex)
						}
					}
				}
			} catch (error: any) {
				console.error('Failed to init session:', error)
				toast.error(
					'Testni boshlashda xatolik yuz berdi: ' +
						(error.message || "Noma'lum xatolik"),
				)
			} finally {
				setLoading(false)
				setStartTime(Date.now())
			}
		}
		initSession()
	}, [userId, topic])

	useEffect(() => {
		if (!isSubmitted && !loading) {
			const interval = setInterval(() => {
				setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
			}, 1000)
			return () => clearInterval(interval)
		}
	}, [startTime, isSubmitted, loading])

	const handleSubmit = async () => {
		if (!selectedOption || !session || isSubmitted) return

		const currentQuestion = questions[currentIndex]
		const isCorrect = selectedOption === currentQuestion.correct_option

		setIsSubmitted(true)
		setMobileView('explanation')
		setAiLoading(true)

		try {
			await attemptService.recordAttempt({
				user_id: userId,
				session_id: session.id,
				question_id: currentQuestion.id,
				question_topic: currentQuestion.topic,
				level: currentQuestion.difficulty_level,
				selected_option: selectedOption,
				correct_option: currentQuestion.correct_option,
				is_correct: isCorrect,
			})

			setAnswersMap(prev => ({ ...prev, [currentQuestion.id]: selectedOption }))
		} catch (error: any) {
			console.error('Failed to submit attempt:', error)
			toast.error('Natijani saqlashda xatolik yuz berdi')
		}

		await fetchAIData(currentQuestion, selectedOption)
	}

	const cleanText = (text: string) => {
		if (!text) return ''
		return text.replace(/\.-/g, '.').replace(/\s+/g, ' ').trim()
	}

	const goToQuestion = (index: number) => {
		const question = questions[index]
		setCurrentIndex(index)

		if (answersMap[question.id]) {
			setSelectedOption(answersMap[question.id])
			setIsSubmitted(true)
			fetchAIData(question, answersMap[question.id])
		} else {
			setSelectedOption(null)
			setIsSubmitted(false)
			setAiData(null)
		}

		setMobileView('question')
		setStartTime(Date.now())
		setTimeSpent(0)
	}

	const handleNext = async () => {
		if (currentIndex + 1 >= questions.length) {
			await sessionService.updateSession(session!.id, {
				status: 'completed',
				completed_at: new Date().toISOString(),
				current_question_index: questions.length,
			})
			await statsService.updateUserStats(userId)
			onComplete()
		} else {
			const nextIndex = currentIndex + 1
			await sessionService.updateSession(session!.id, {
				current_question_index: nextIndex,
			})
			goToQuestion(nextIndex)
		}
	}

	const handlePrevious = async () => {
		if (currentIndex > 0) {
			const prevIndex = currentIndex - 1
			await sessionService.updateSession(session!.id, {
				current_question_index: prevIndex,
			})
			goToQuestion(prevIndex)
		}
	}

	const currentQuestion = questions[currentIndex]
	const cleanedStem = useMemo(
		() => cleanText(currentQuestion?.stem),
		[currentQuestion],
	)

	if (loading)
		return (
			<div className='min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0F172A] gap-4'>
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
					className='w-12 h-12 border-4 border-[#2c5ff2] border-t-transparent rounded-full'
				/>
				<p className='text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs'>
					Savollar yuklanmoqda...
				</p>
			</div>
		)

	if (questions.length === 0)
		return (
			<div className='min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0F172A] gap-6 p-8 text-center'>
				<div className='w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center text-slate-400 dark:text-slate-500'>
					<AlertTriangle size={40} />
				</div>
				<div className='space-y-2'>
					<h3 className='text-xl font-bold text-slate-900 dark:text-white'>
						Savollar topilmadi
					</h3>
					<p className='text-slate-500 dark:text-slate-400 max-w-xs mx-auto'>
						Hozircha bazada savollar mavjud emas. Iltimos, keyinroq qayta urinib
						ko'ring.
					</p>
				</div>
				<button
					onClick={onComplete}
					className='bg-[#2c5ff2] text-white font-bold px-8 py-3 rounded-2xl hover:bg-[#214fd7] transition-all'
				>
					Bosh sahifaga qaytish
				</button>
			</div>
		)

	return (
		<div className='h-full bg-[#0F172A] flex flex-col overflow-hidden text-slate-200 safe-area-top'>
			{/* Header */}
			<header className='bg-[#1E293B] border-b border-slate-700 px-4 md:px-6 py-3 flex justify-between items-center shrink-0'>
				<div className='flex items-center gap-2 md:gap-4'>
					<button
						onClick={onComplete}
						className='hover:bg-slate-700 p-2 rounded-lg transition-colors'
					>
						<ChevronLeft size={20} />
					</button>
					<div className='h-6 w-px bg-slate-700 hidden sm:block' />
					<div className='flex items-center gap-2 md:gap-3'>
						<span className='text-[10px] md:text-sm font-bold text-slate-400 whitespace-nowrap'>
							{currentIndex + 1} / {questions.length}
						</span>
						<div className='w-16 md:w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden'>
							<div
								className='h-full bg-[#2c5ff2] transition-all duration-500'
								style={{
									width: `${((currentIndex + 1) / questions.length) * 100}%`,
								}}
							/>
						</div>
					</div>
				</div>

				<div className='flex items-center gap-3 md:gap-6'>
					<div className='flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-slate-800 rounded-lg border border-slate-700'>
						<Clock size={14} className='text-slate-400' />
						<span className='font-mono font-bold text-[10px] md:text-sm'>
							{Math.floor(timeSpent / 60)
								.toString()
								.padStart(2, '0')}
							:{(timeSpent % 60).toString().padStart(2, '0')}
						</span>
					</div>
					<div className='hidden xs:flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-slate-800 rounded-lg border border-slate-700'>
						<Target size={14} className='text-slate-400' />
						<span className='font-bold text-[10px] md:text-sm'>84%</span>
					</div>
					<div className='flex items-center gap-1'>
						<button className='p-1.5 hover:bg-slate-700 rounded-lg text-slate-400'>
							<Settings size={20} />
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
				{/* Left Panel: Question */}
				<div
					className={`w-full lg:w-[45%] overflow-y-auto scrolling-touch bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 ${isSubmitted && mobileView === 'explanation' && 'hidden lg:block'}`}
				>
					<div className='max-w-3xl space-y-6 md:space-y-8 min-h-full flex flex-col p-4 md:p-8'>
						<div className='space-y-4'>
							<div className='flex items-center gap-2 text-[#2c5ff2] font-bold text-[11px] uppercase tracking-[0.18em]'>
								<div className='w-1.5 h-1.5 rounded-full bg-[#2c5ff2]' />
								Klinik holat
							</div>
							<h3
								id='question-stem-container'
								className='text-[1.15rem] font-medium leading-8 select-text text-slate-900 dark:text-white md:text-[1.3rem]'
							>
								{cleanedStem}
							</h3>
						</div>

						<div className='space-y-4'>
							{['A', 'B', 'C', 'D'].map(key => {
								const optionText = cleanText(
									currentQuestion[
										`option_${key.toLowerCase()}` as keyof Question
									] as string,
								)
								const isSelected = selectedOption === key
								const isCorrect = currentQuestion.correct_option === key

								let style =
									'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
								let iconStyle =
									'border-slate-200 dark:border-slate-700 text-transparent'

								if (isSelected) {
									style =
										'border-[#2c5ff2]/20 bg-[#2c5ff2]/5 dark:bg-[#2c5ff2]/10'
									iconStyle = 'border-[#2c5ff2] bg-[#2c5ff2] text-white'
								}

								if (isSubmitted) {
									if (isCorrect) {
										style =
											'border-[#b3d1ff] dark:border-[#2c5ff2]/30 bg-[#e6f0ff]/50 dark:bg-[#2c5ff2]/20'
										iconStyle = 'border-[#2c5ff2] bg-[#2c5ff2] text-white'
									} else if (isSelected) {
										style =
											'border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/20'
										iconStyle = 'border-red-500 bg-red-500 text-white'
									} else {
										style = 'border-slate-50 dark:border-slate-800 opacity-40'
									}
								}

								return (
									<button
										key={key}
										disabled={isSubmitted}
										onClick={() => setSelectedOption(key)}
										className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-5 group ${style}`}
									>
										<div
											className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${iconStyle}`}
										>
											{isSubmitted && isCorrect ? (
												<CheckCircle2 size={14} />
											) : isSubmitted && isSelected ? (
												<XCircle size={14} />
											) : (
												<div className='w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-20' />
											)}
										</div>
										<span className='flex-1 text-slate-600 dark:text-slate-300 font-medium text-[15px] leading-7 group-hover:text-slate-900 dark:group-hover:text-white transition-colors md:text-base'>
											{optionText}
										</span>
									</button>
								)
							})}
						</div>
					</div>
				</div>

				{/* Right Panel: AI Explanation */}
				<div
					className={`w-full lg:w-[55%] bg-[#0F172A] flex flex-col overflow-hidden border-l border-slate-800 ${(!isSubmitted || mobileView === 'question') && 'hidden lg:flex'}`}
				>
					<AnimatePresence mode='wait'>
						{isSubmitted ? (
							<motion.div
								key='explanation'
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								className='flex-1 flex flex-col overflow-hidden'
							>
								<div className='p-4 bg-[#1E293B]/50 border-b border-slate-800 flex items-center justify-between'>
									<div className='flex items-center gap-4'>
										<div className='w-10 h-10 bg-[#2c5ff2] rounded-xl flex items-center justify-center shadow-lg shadow-[#2c5ff2]/20'>
											<Brain className='text-white' size={20} />
										</div>
										<h4 className='font-bold text-white text-base tracking-tight'>
											AI Explanation
										</h4>
									</div>
									<button
										onClick={() => setMobileView('question')}
										className='lg:hidden text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest'
									>
										Savolga qaytish
									</button>
								</div>

								<div className='flex-1 overflow-y-auto scrolling-touch p-4 md:p-6 space-y-6 md:space-y-8'>
									{aiLoading ? (
										<div className='flex flex-col items-center justify-center h-full text-slate-500 gap-6'>
											<motion.div
												animate={{
													scale: [1, 1.1, 1],
													rotate: [0, 5, -5, 0],
												}}
												transition={{ repeat: Infinity, duration: 3 }}
												className='w-20 h-20 bg-[#2c5ff2]/10 rounded-[32px] flex items-center justify-center border border-[#2c5ff2]/20'
											>
												<Brain size={32} className='text-[#2c5ff2]' />
											</motion.div>
											<div className='space-y-2 text-center'>
												<p className='text-xs font-bold uppercase tracking-[0.4em] text-slate-400'>
													Tahlil qilinmoqda
												</p>
												<div className='flex justify-center gap-1'>
													{[0, 1, 2].map(i => (
														<motion.div
															key={i}
															animate={{ opacity: [0.3, 1, 0.3] }}
															transition={{
																repeat: Infinity,
																duration: 1.5,
																delay: i * 0.2,
															}}
															className='w-1.5 h-1.5 rounded-full bg-[#2c5ff2]'
														/>
													))}
												</div>
											</div>
										</div>
									) : (
										<>
											{aiData?.imageDescription && (
												<section className='space-y-4'>
													<div className='relative group'>
														<div className='bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl relative'>
															<img
																src={`https://picsum.photos/seed/medical-${encodeURIComponent(aiData.imageDescription)}/1200/800`}
																alt={aiData.imageDescription}
																className='w-full h-auto object-cover opacity-100 transition-transform duration-700 group-hover:scale-105'
																referrerPolicy='no-referrer'
															/>
															<div className='absolute bottom-6 left-6 right-6'>
																<p className='text-xs font-bold text-white/90 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 inline-block'>
																	{aiData.imageDescription}
																</p>
															</div>
														</div>
													</div>
												</section>
											)}

											<section className='space-y-4'>
												<div className='flex items-center gap-3 text-blue-400'>
													<div className='w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center'>
														<Lightbulb size={18} />
													</div>
													<h4 className='font-bold uppercase text-[11px] tracking-[0.2em]'>
														Explanation
													</h4>
												</div>
												<div className='bg-[#1E293B]/50 p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-800 shadow-xl backdrop-blur-sm'>
													<p className='text-slate-100 text-lg md:text-[16px] leading-relaxed whitespace-pre-wrap font-semibold'>
														{aiData?.explanation ||
															currentQuestion.explanation_body}
													</p>
												</div>
											</section>

											{(aiData?.keyPoints || currentQuestion.key_points) && (
												<section className='space-y-4'>
													<div className='flex items-center gap-3 text-[#2c5ff2]'>
														<div className='w-8 h-8 rounded-lg bg-[#2c5ff2]/10 flex items-center justify-center'>
															<CheckCircle2 size={18} />
														</div>
														<h4 className='font-bold uppercase text-[11px] tracking-[0.2em]'>
															Key Points
														</h4>
													</div>
													<div className='bg-[#1E293B]/50 p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-800 shadow-xl backdrop-blur-sm space-y-4 md:space-y-4'>
														{(
															aiData?.keyPoints ||
															currentQuestion.key_points ||
															[]
														).map((point, i) => (
															<div
																key={i}
																className='flex gap-4 text-slate-100 text-base md:text-[16px] leading-relaxed font-semibold'
															>
																<div className='w-3 h-3 rounded-full bg-[#2c5ff2] mt-2 md:mt-2.5 shrink-0 shadow-[0_0_15px_rgba(44,95,242,0.35)]' />
																{point}
															</div>
														))}
													</div>
												</section>
											)}

											{aiData?.videoQuery && (
												<section className='space-y-2'>
													<div className='flex items-center gap-2 text-red-600'>
														<Video size={16} />
														<h4 className='font-bold uppercase text-[9px] tracking-widest'>
															Video darslik
														</h4>
													</div>
													<a
														href={`https://www.youtube.com/results?search_query=${encodeURIComponent(aiData.videoQuery)}`}
														target='_blank'
														rel='noopener noreferrer'
														className='bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-red-200 transition-colors group'
													>
														<div className='flex items-center gap-2.5'>
															<div className='w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-red-600'>
																<Video size={18} />
															</div>
															<span className='text-[13px] font-bold text-slate-700'>
																Mavzuga oid videoni ko'rish
															</span>
														</div>
														<ExternalLink
															size={12}
															className='text-slate-300 group-hover:text-red-400'
														/>
													</a>
												</section>
											)}

											{validSources.length > 0 && (
												<section className='space-y-4'>
													<div className='flex items-center gap-3 text-slate-400'>
														<div className='w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center'>
															<BookMarked size={18} />
														</div>
														<h4 className='font-bold uppercase text-[11px] tracking-[0.2em]'>
															Manbalar
														</h4>
													</div>
													<div className='bg-[#1E293B]/30 p-6 rounded-[32px] border border-slate-800/50 backdrop-blur-sm divide-y divide-slate-800/50'>
														{validSources.map((source, i) => {
															const urlMatch =
																source.match(/https?:\/\/[^\s)]+/)
															const url = urlMatch ? urlMatch[0] : null
															const cleanSource = source
																.replace(/\(https?:\/\/[^\s)]+\)/, '')
																.trim()

															return (
																<div
																	key={i}
																	className='py-5 first:pt-0 last:pb-0 flex items-start gap-4 group'
																>
																	<div className='w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-sm font-mono text-slate-400 group-hover:bg-[#2c5ff2]/20 group-hover:text-[#2c5ff2] transition-colors shrink-0'>
																		{String(i + 1).padStart(2, '0')}
																	</div>
																	<div className='flex-1 space-y-3'>
																		<p className='text-slate-200 text-base font-semibold leading-relaxed break-all'>
																			{cleanSource}
																		</p>
																		{url ? (
																			<a
																				href={url}
																				target='_blank'
																				rel='noopener noreferrer'
																				className='inline-flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20'
																			>
																				<ExternalLink size={14} />
																				<span>Manbani ko'rish (Link)</span>
																			</a>
																		) : null}
																	</div>
																</div>
															)
														})}
													</div>
												</section>
											)}

											<div className='pt-4'>{/* AI Chat is now global */}</div>
										</>
									)}
								</div>
							</motion.div>
						) : (
							<div className='flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4'>
								<div className='w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center'>
									<GraduationCap className='text-[#2c5ff2]' size={32} />
								</div>
								<div className='space-y-1'>
									<h4 className='font-bold text-slate-900 dark:text-white text-base'>
										AI yordami kutilmoqda
									</h4>
									<p className='text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-62.5 mx-auto'>
										Javobingizni yuboring va AI sizga batafsil tushuntirish,
										vizual materiallar va manbalarni taqdim etadi.
									</p>
								</div>
								<div className='pt-2 flex gap-1.5'>
									<div className='w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 animate-bounce' />
									<div className='w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 animate-bounce [animation-delay:0.2s]' />
									<div className='w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 animate-bounce [animation-delay:0.4s]' />
								</div>
							</div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Footer Navigation */}
			<footer className='h-18 bg-[#1E293B] border-t border-slate-700 px-4 md:px-8 flex justify-between items-center shrink-0 '>
				<button
					onClick={handlePrevious}
					disabled={currentIndex === 0}
					className='flex items-center gap-2 text-slate-400 hover:text-white transition-colors disabled:opacity-30 p-2'
				>
					<ChevronLeft size={20} />
					<span className='font-bold text-sm hidden sm:inline'>Oldingi</span>
				</button>
				<div className='flex-1 flex justify-center px-4'>
					{!isSubmitted ? (
						<button
							disabled={!selectedOption}
							onClick={handleSubmit}
							className='w-full max-w-xs bg-[#2c5ff2] hover:bg-[#214fd7] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#2c5ff2]/20 disabled:opacity-50 text-sm'
						>
							Javobni yuborish
						</button>
					) : (
						<button
							onClick={handleNext}
							className='w-full max-w-xs bg-slate-100 hover:bg-white text-slate-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-sm'
						>
							{currentIndex + 1 >= questions.length ? 'Yakunlash' : 'Keyingi'}
							<ArrowRight size={18} />
						</button>
					)}
				</div>
				<div className='w-10 sm:w-20' /> {/* Spacer for balance */}
			</footer>
		</div>
	)
}
