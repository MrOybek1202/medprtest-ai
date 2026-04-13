import { Database } from '@/src/types/database';

export type Question = Database['public']['Tables']['questions']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Attempt = Database['public']['Tables']['question_attempts']['Row'];
export type UserStats = Database['public']['Tables']['stats']['Row'];
export type GlossaryItem = Database['public']['Tables']['glossary']['Row'];

export interface AIExplanation {
  explanation: string;
  keyPoints?: string[];
  typicalMistakes?: string[];
}
