import { supabase } from '@/src/lib/supabase';
import { Database } from '@/src/types/database';
import { Question } from '@/src/types';

export const questionService = {
  async getQuestions(limit = 10, difficulty?: number) {
    console.log(`Fetching questions (limit: ${limit}, difficulty: ${difficulty || 'any'})...`);
    let query = supabase
      .from('questions')
      .select('*');
    
    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }

    const { data, error } = await query.limit(limit);
    
    if (error) {
      console.error('Supabase error fetching questions:', error);
      throw error;
    }
    console.log('Fetched questions:', data?.length || 0);
    return data;
  },

  async getQuestionsByTopic(topic: string, difficulty?: number) {
    console.log(`Fetching all questions for topic: ${topic} (difficulty: ${difficulty || 'any'})`);
    let query = supabase
      .from('questions')
      .select('*')
      .eq('topic', topic);
    
    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }

    const { data, error } = await query.order('id', { ascending: true });
    
    if (error) {
      console.error(`Supabase error fetching questions for topic ${topic}:`, error);
      throw error;
    }
    return data;
  },

  async getQuestionsByIds(ids: string[]) {
    console.log(`Fetching questions by IDs: ${ids.length}`);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .in('id', ids);
    
    if (error) {
      console.error('Supabase error fetching questions by IDs:', error);
      throw error;
    }
    
    // Sort data to match the order of IDs
    return ids.map(id => data.find(q => q.id === id)).filter(Boolean) as any[];
  },

  async getTopics() {
    console.log('Fetching topics...');
    const { data, error } = await supabase
      .from('questions')
      .select('topic');
    
    if (error) {
      console.error('Supabase error fetching topics:', error);
      throw error;
    }
    // Return unique topics
    const topics = Array.from(new Set(data.map(q => q.topic)));
    console.log('Fetched topics:', topics.length);
    return topics;
  },

  async getQuestionById(id: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTotalQuestionCount() {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  },

  async createQuestion(question: Partial<Question>) {
    const { data, error } = await supabase
      .from('questions')
      .insert([question])
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }
    if (!data) {
      console.warn('Question created but no data returned. This might be an RLS issue.');
      return question as Question;
    }
    return data;
  },

  async updateQuestion(id: string, updates: Partial<Question>) {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating question:', error);
      throw error;
    }
    if (!data) {
      console.warn(`Question ${id} updated but no data returned. This might be an RLS issue or ID mismatch.`);
      return { id, ...updates } as Question;
    }
    return data;
  },

  async deleteQuestion(id: string) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  async getTopicProgress(userId: string) {
    // 1. Get total questions per topic
    const { data: totalData, error: totalError } = await supabase
      .from('questions')
      .select('topic');
    
    if (totalError) throw totalError;

    const topicTotals: Record<string, number> = {};
    totalData.forEach(q => {
      topicTotals[q.topic] = (topicTotals[q.topic] || 0) + 1;
    });

    // 2. Get solved questions per topic for this user
    const { data: solvedData, error: solvedError } = await supabase
      .from('question_attempts')
      .select('question_topic')
      .eq('user_id', userId);
    
    if (solvedError) throw solvedError;

    const topicSolved: Record<string, Set<string>> = {}; // Use Set to count unique questions solved
    // Wait, question_attempts might have multiple attempts for same question.
    // Let's get unique question_id per topic.
    const { data: solvedUniqueData, error: solvedUniqueError } = await supabase
      .from('question_attempts')
      .select('question_id, question_topic')
      .eq('user_id', userId);

    if (solvedUniqueError) throw solvedUniqueError;

    const uniqueSolvedPerTopic: Record<string, Set<string>> = {};
    solvedUniqueData.forEach(a => {
      if (!uniqueSolvedPerTopic[a.question_topic]) uniqueSolvedPerTopic[a.question_topic] = new Set();
      uniqueSolvedPerTopic[a.question_topic].add(a.question_id);
    });

    const progress: Record<string, { total: number; solved: number; percentage: number }> = {};
    for (const topic in topicTotals) {
      const total = topicTotals[topic];
      const solved = uniqueSolvedPerTopic[topic]?.size || 0;
      progress[topic] = {
        total,
        solved,
        percentage: Math.round((solved / total) * 100)
      };
    }

    return progress;
  },

  async getRecommendedDifficulty(userId: string) {
    const { data: stats } = await supabase
      .from('stats')
      .select('overall_accuracy')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!stats) return 1;
    
    const accuracy = stats.overall_accuracy || 0;
    if (accuracy > 80) return 3;
    if (accuracy > 50) return 2;
    return 1;
  }
};

export const sessionService = {
  async createSession(userId: string, totalQuestions: number, topic?: string | null, questionIds?: string[]) {
    const payload: any = {
      user_id: userId,
      status: 'active',
      total_questions: totalQuestions,
      current_question_index: 0
    };

    // Only add these if we think they exist or want to try
    if (topic !== undefined) payload.topic = topic || null;
    if (questionIds !== undefined) payload.question_ids = questionIds || [];

    const { data, error } = await supabase
      .from('sessions')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      // Fallback for missing columns (42703 or PGRST204)
      if (error.code === '42703' || error.code === 'PGRST204') {
        console.warn('Sessions table missing topic or question_ids columns. Falling back to basic session.');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('sessions')
          .insert({
            user_id: userId,
            status: 'active',
            total_questions: totalQuestions,
            current_question_index: 0
          })
          .select('id, user_id, status, total_questions, current_question_index, created_at')
          .single();
        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      throw error;
    }
    return data;
  },

  async getActiveSession(userId: string, topic?: string | null) {
    try {
      let query = supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (topic) {
        query = query.eq('topic', topic);
      } else {
        // Try to filter by null topic if column exists
        query = query.is('topic', null);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        // Fallback for missing columns
        if (error.code === '42703' || error.code === 'PGRST204') {
          console.warn('Sessions table missing topic column. Falling back to basic active session check.');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('sessions')
            .select('id, user_id, status, total_questions, current_question_index, created_at')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (fallbackError) throw fallbackError;
          return fallbackData;
        }
        throw error;
      }
      return data;
    } catch (err: any) {
      console.error('Error in getActiveSession:', err);
      return null;
    }
  },

  async updateSession(sessionId: string, updates: Partial<Database['public']['Tables']['sessions']['Update']>) {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .select('id, user_id, status, total_questions, current_question_index, created_at')
      .single();
    
    if (error) throw error;
    return data;
  },

  async getRecentSessions(userId: string, limit = 5) {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, user_id, status, total_questions, current_question_index, created_at, topic')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getSolvedQuestionsCount(userId: string) {
    const { count, error } = await supabase
      .from('question_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) throw error;
    return count || 0;
  }
};

export const attemptService = {
  async recordAttempt(attempt: Database['public']['Tables']['question_attempts']['Insert']) {
    const { data, error } = await supabase
      .from('question_attempts')
      .insert(attempt)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const statsService = {
  async getUserStats(userId: string) {
    console.log(`Fetching stats for user: ${userId}`);
    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Supabase error fetching stats:', error);
      // Don't throw if it's just "not found", we might need to create it
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async updateUserStats(userId: string) {
    // Fetch all attempts for this user
    const { data: attempts, error: attemptsError } = await supabase
      .from('question_attempts')
      .select('is_correct, question_topic')
      .eq('user_id', userId);
    
    if (attemptsError) throw attemptsError;

    if (!attempts || attempts.length === 0) return;

    const correctCount = attempts.filter(a => a.is_correct).length;
    const accuracy = Math.round((correctCount / attempts.length) * 100);

    // Find weak topic (topic with lowest accuracy)
    const topicStats: Record<string, { total: number; correct: number }> = {};
    attempts.forEach(a => {
      if (!topicStats[a.question_topic]) topicStats[a.question_topic] = { total: 0, correct: 0 };
      topicStats[a.question_topic].total++;
      if (a.is_correct) topicStats[a.question_topic].correct++;
    });

    let weakTopic = null;
    let minAccuracy = 101;

    for (const topic in topicStats) {
      const topicAccuracy = (topicStats[topic].correct / topicStats[topic].total) * 100;
      if (topicAccuracy < minAccuracy) {
        minAccuracy = topicAccuracy;
        weakTopic = topic;
      }
    }

    // Predictive Analysis: Generate recommendation based on weak topic
    let recommendation = "Barcha mavzularni muntazam takrorlab boring.";
    if (weakTopic) {
      recommendation = `${weakTopic} mavzusida aniqlik darajangiz past (${Math.round(minAccuracy)}%). Ushbu mavzuni qayta ko'rib chiqish va ko'proq test yechish tavsiya etiladi.`;
    }

    const { error: updateError } = await supabase
      .from('stats')
      .update({
        overall_accuracy: accuracy,
        weak_topic: weakTopic,
        recommendation: recommendation,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) throw updateError;
  }
};
