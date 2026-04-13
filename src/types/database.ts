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
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          email: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          email?: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
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
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          status: string
          current_question_index: number
          total_questions: number
          score_percent: number | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status: string
          current_question_index?: number
          total_questions: number
          score_percent?: number | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          current_question_index?: number
          total_questions?: number
          score_percent?: number | null
          created_at?: string
          completed_at?: string | null
        }
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
      }
    }
  }
}
