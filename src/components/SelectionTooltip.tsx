import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X, Loader2, Plus, Search, Check } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { generateDefinition } from '@/src/lib/ai';
import { toast } from 'sonner';

interface Definition {
  term: string;
  definition: string;
  tip?: string;
  relatedTerms?: string[];
}
interface SelectionTooltipProps {
  userId: string;
  fullContext?: string;
  containerId?: string;
}

export default function SelectionTooltip({ userId, fullContext, containerId }: SelectionTooltipProps) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [definitionCache, setDefinitionCache] = useState<Record<string, Definition>>(() => {
    try {
      const saved = localStorage.getItem('medtest_definition_cache');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Don't trigger if clicking inside the tooltip
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }

      const selectionObj = window.getSelection();
      const selectedText = selectionObj?.toString().trim();
      
      if (selectedText && selectedText.length > 1 && selectedText.length < 100) {
        // Don't trigger if selecting text inside the tooltip itself
        if (tooltipRef.current && tooltipRef.current.contains(selectionObj?.anchorNode || null)) {
          return;
        }

        // Check if selection is within the container (if provided)
        if (containerId) {
          const container = document.getElementById(containerId);
          if (container && !container.contains(selectionObj?.anchorNode || null)) {
            setSelection(null);
            return;
          }
        }

        const range = selectionObj?.getRangeAt(0);
        const rects = range?.getClientRects();
        
        if (rects && rects.length > 0) {
          // Position at the end of the last rect of the selection
          const lastRect = rects[rects.length - 1];
          setSelection({
            text: selectedText,
            x: lastRect.right + window.scrollX,
            y: lastRect.bottom + window.scrollY + 5
          });
          setDefinition(null);
          setIsSaved(false);
        }
      } else {
        if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
          setSelection(null);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [containerId]);

  const fetchDefinition = async () => {
    if (!selection) return;
    
    const cacheKey = selection.text.toLowerCase().trim();
    if (definitionCache[cacheKey]) {
      setDefinition(definitionCache[cacheKey]);
      return;
    }

    setLoading(true);
    try {
      const data = await generateDefinition(selection.text, fullContext || selection.text);
      const newDefinition: Definition = {
        term: selection.text,
        definition: data.definition,
        tip: data.tip,
        relatedTerms: data.relatedTerms
      };
      
      setDefinition(newDefinition);
      
      // Update cache
      const newCache = { ...definitionCache, [cacheKey]: newDefinition };
      setDefinitionCache(newCache);
      localStorage.setItem('medtest_definition_cache', JSON.stringify(newCache));
      
    } catch (error: any) {
      console.error('Failed to fetch definition:', error);
      const errorMessage = error.message || 'Ma\'noni aniqlashda xatolik yuz berdi';
      toast.error(errorMessage || 'Ma\'noni aniqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const saveToGlossary = async () => {
    if (!definition || !userId) return;
    try {
      const { error } = await supabase.from('glossary').insert({
        user_id: userId,
        term: definition.term,
        definition: definition.definition,
        tip: definition.tip,
        related_terms: definition.relatedTerms
      });
      
      if (error) throw error;
      
      setIsSaved(true);
      toast.success('Lug\'atga muvaffaqiyatli qo\'shildi');
    } catch (error: any) {
      console.error('Failed to save to glossary:', error);
      toast.error('Lug\'atga qo\'shishda xatolik: ' + (error.message || ''));
    }
  };

  if (!selection) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div 
      ref={tooltipRef}
      style={{ 
        left: isMobile ? '50%' : selection.x, 
        top: isMobile ? 'auto' : selection.y,
        bottom: isMobile ? '20px' : 'auto',
        transform: isMobile ? 'translateX(-50%)' : 'none',
        position: isMobile ? 'fixed' : 'absolute',
        width: isMobile ? 'calc(100% - 32px)' : 'auto'
      }}
      className="z-50 pt-2"
    >
      <motion.div 
        initial={isMobile ? { opacity: 0, y: 50 } : { opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white text-slate-900 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] overflow-hidden min-w-[240px] md:max-w-[320px] border border-slate-200 flex flex-col"
      >
        {!definition && !loading ? (
          <button 
            onClick={fetchDefinition}
            className="w-full px-6 py-4 flex items-center justify-center gap-3 bg-slate-900 text-white hover:bg-slate-800 transition-all text-sm font-bold"
          >
            <Sparkles size={18} className="text-blue-400" />
            AI ma'nosi
          </button>
        ) : (
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center py-6 gap-4 text-slate-400">
                <Loader2 size={32} className="animate-spin text-[#1B4D3E]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Tahlil qilinmoqda...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-blue-500" />
                    <h5 className="font-bold text-slate-900 text-base">{definition?.term}</h5>
                  </div>
                  <button onClick={() => setSelection(null)} className="text-slate-300 hover:text-slate-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="text-sm text-slate-600 leading-relaxed">
                  {definition?.definition}
                </div>

                {definition?.tip && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs text-amber-900 leading-relaxed">
                      <span className="font-bold mr-1">Tip:</span>
                      {definition.tip}
                    </p>
                  </div>
                )}

                {definition?.relatedTerms && definition.relatedTerms.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-full mb-1">Bog'liq terminlar:</span>
                    {definition.relatedTerms.map((term, i) => (
                      <span key={i} className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        {term}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={saveToGlossary}
                    disabled={isSaved}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${isSaved ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'}`}
                  >
                    {isSaved ? (
                      <>
                        <Check size={14} />
                        Saqlandi
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        Lug'atga qo'shish
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

