import { supabase } from '@/src/lib/supabase';
import { Database } from '@/src/types/database';

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatThread = Database['public']['Tables']['chat_threads']['Row'];

export const chatService = {
  async getThreads(userId: string) {
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  async createThread(userId: string, title: string) {
    const { data: created, error: createError } = await supabase
      .from('chat_threads')
      .insert({
        user_id: userId,
        title,
      })
      .select('*')
      .single();

    if (createError) {
      throw createError;
    }

    return created as ChatThread;
  },

  async getMessages(threadId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data as ChatMessage[];
  },

  async saveMessage(
    threadId: string,
    role: Database['public']['Tables']['chat_messages']['Insert']['role'],
    content: string,
  ) {
    const { error } = await supabase.from('chat_messages').insert({
      thread_id: threadId,
      role,
      content,
    });

    if (error) {
      throw error;
    }

    const { error: updateError } = await supabase
      .from('chat_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);

    if (updateError) {
      throw updateError;
    }
  },

  async deleteThread(threadId: string) {
    const { error } = await supabase.from('chat_threads').delete().eq('id', threadId);

    if (error) {
      throw error;
    }
  },
};
