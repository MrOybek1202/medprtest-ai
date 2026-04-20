export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          topic: string
          difficulty_level: number
          stem: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: string
          explanation_title: string | null
          explanation_body: string | null
          key_points: string[] | null
          typical_mistakes: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          topic: string
          difficulty_level: number
          stem: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: string
          explanation_title?: string | null
          explanation_body?: string | null
          key_points?: string[] | null
          typical_mistakes?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          topic?: string
          difficulty_level?: number
          stem?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_option?: string
          explanation_title?: string | null
          explanation_body?: string | null
          key_points?: string[] | null
          typical_mistakes?: string[] | null
          created_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          topic: string | null
          status: string
          current_question_index: number
          total_questions: number
          question_ids: string[] | null
          score_percent: number | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          topic?: string | null
          status?: string
          current_question_index?: number
          total_questions: number
          question_ids?: string[] | null
          score_percent?: number | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string | null
          status?: string
          current_question_index?: number
          total_questions?: number
          question_ids?: string[] | null
          score_percent?: number | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          id: string
          user_id: string
          session_id: string
          question_id: string
          question_topic: string
          level: number
          selected_option: string
          correct_option: string
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          question_id: string
          question_topic: string
          level: number
          selected_option: string
          correct_option: string
          is_correct: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          question_id?: string
          question_topic?: string
          level?: number
          selected_option?: string
          correct_option?: string
          is_correct?: boolean
          created_at?: string
        }
        Relationships: []
      }
      glossary: {
        Row: {
          id: string
          user_id: string
          term: string
          definition: string
          tip: string | null
          related_terms: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          term: string
          definition: string
          tip?: string | null
          related_terms?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          term?: string
          definition?: string
          tip?: string | null
          related_terms?: string[] | null
          created_at?: string
        }
        Relationships: []
      }
      stats: {
        Row: {
          id: string
          user_id: string
          overall_accuracy: number
          study_streak: number
          average_time_seconds: number
          weak_topic: string | null
          recommendation: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          overall_accuracy?: number
          study_streak?: number
          average_time_seconds?: number
          weak_topic?: string | null
          recommendation?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          overall_accuracy?: number
          study_streak?: number
          average_time_seconds?: number
          weak_topic?: string | null
          recommendation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          thread_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          role?: 'user' | 'assistant'
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      focus_timers: {
        Row: {
          id: string
          auth_user_id: string
          mode: 'countdown' | 'elapsed'
          start_time: number | null
          duration: number
          is_running: boolean
          elapsed_ms: number
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          mode?: 'countdown' | 'elapsed'
          start_time?: number | null
          duration?: number
          is_running?: boolean
          elapsed_ms?: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          mode?: 'countdown' | 'elapsed'
          start_time?: number | null
          duration?: number
          is_running?: boolean
          elapsed_ms?: number
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
