import { supabase } from '@/src/lib/supabase'
import { GlossaryItem } from '@/src/types'
import { Book, ChevronRight, Search, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface GlossaryProps {
	userId: string
}

export default function Glossary({ userId }: GlossaryProps) {
	const [items, setItems] = useState<GlossaryItem[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')

	useEffect(() => {
		const fetchGlossary = async () => {
			try {
				const { data, error } = await supabase
					.from('glossary')
					.select('*')
					.eq('user_id', userId)
					.order('created_at', { ascending: false })

				if (!error) setItems(data || [])
				else throw error
			} catch (error: any) {
				console.error('Failed to fetch glossary:', error)
				toast.error("Lug'atni yuklashda xatolik: " + (error.message || ''))
			} finally {
				setLoading(false)
			}
		}
		fetchGlossary()
	}, [userId])

	const filteredItems = items.filter(
		item =>
			item.term.toLowerCase().includes(search.toLowerCase()) ||
			item.definition.toLowerCase().includes(search.toLowerCase()),
	)

	const deleteItem = async (id: string) => {
		try {
			const { error } = await supabase.from('glossary').delete().eq('id', id)
			if (error) throw error
			setItems(items.filter(i => i.id !== id))
			toast.success("Termin o'chirildi")
		} catch (error: any) {
			console.error('Failed to delete item:', error)
			toast.error("O'chirishda xatolik: " + (error.message || ''))
		}
	}

	if (loading)
		return (
			<div className='p-8 max-w-5xl mx-auto space-y-8 dark:bg-[#0F172A]'>
				<div className='h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4 animate-pulse' />
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{[1, 2, 3, 4].map(i => (
						<div
							key={i}
							className='h-48 bg-slate-100 dark:bg-slate-800 rounded-[32px] animate-pulse'
						/>
					))}
				</div>
			</div>
		)

	return (
		<div className='p-8 max-w-5xl mx-auto space-y-8 dark:bg-[#0F172A]'>
			<header className='flex flex-col md:flex-row justify-between items-start md:items-end gap-6'>
				<div>
					<h2 className='text-3xl md:text-4xl font-bold text-slate-900 dark:text-white'>
						Shaxsiy lug'at
					</h2>
					<p className='text-slate-500 dark:text-slate-400 mt-1'>
						Siz saqlagan barcha tibbiy terminlar va ularning ta'riflari.
					</p>
				</div>
				<div className='bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 w-full md:w-80'>
					<Search size={18} className='text-slate-400 dark:text-slate-500' />
					<input
						type='text'
						placeholder='Terminlarni qidirish...'
						value={search}
						onChange={e => setSearch(e.target.value)}
						className='bg-transparent border-none focus:ring-0 text-sm w-full outline-none text-slate-900 dark:text-white'
					/>
				</div>
			</header>

			{filteredItems.length === 0 ? (
				<div className='bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 text-center space-y-6'>
					<div className='w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto'>
						<Search className='text-slate-300 dark:text-slate-600' size={32} />
					</div>
					<div className='space-y-2'>
						<h3 className='text-xl font-bold text-slate-900 dark:text-white'>
							Terminlar topilmadi
						</h3>
						<p className='text-slate-500 dark:text-slate-400 max-w-xs mx-auto'>
							Siz hali hech qanday termin saqlamagansiz yoki qidiruvga mos
							keladigan natija yo'q.
						</p>
					</div>
				</div>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					<AnimatePresence>
						{filteredItems.map(item => (
							<motion.div
								layout
								key={item.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95 }}
								className='bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative'
							>
								<div className='flex justify-between items-start mb-4'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-[#102347]/10 rounded-xl flex items-center justify-center text-[#102347]'>
											<Book size={20} />
										</div>
										<h3 className='text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#102347] transition-colors'>
											{item.term}
										</h3>
									</div>
									<button
										onClick={() => deleteItem(item.id)}
										className='text-slate-300 dark:text-slate-600 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100'
									>
										<Trash2 size={18} />
									</button>
								</div>

								<div className='bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-4'>
									<p className='text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic'>
										{item.definition}
									</p>
								</div>

								{item.tip && (
									<div className='mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-xs text-blue-700 dark:text-blue-400 font-medium flex items-start gap-2'>
										<div className='w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0' />
										Maslahat: {item.tip}
									</div>
								)}

								<div className='flex justify-between items-center pt-2'>
									<span className='text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest'>
										{new Date(item.created_at).toLocaleDateString('uz-UZ')}
									</span>
									<button className='flex items-center gap-1 text-[#102347] text-xs font-bold hover:underline'>
										Batafsil <ChevronRight size={14} />
									</button>
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}
		</div>
	)
}
