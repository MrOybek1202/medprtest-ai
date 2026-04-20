import { supabase } from '@/src/lib/supabase';

export type TimerMode = 'countdown' | 'elapsed';

export interface TimerSyncState {
  mode: TimerMode;
  startTime: number | null;
  duration: number;
  isRunning: boolean;
  elapsedMs: number;
}

interface FocusTimerRow {
  mode: TimerMode;
  start_time: number | null;
  duration: number;
  is_running: boolean;
  elapsed_ms: number;
  updated_at: string;
}

export const timerService = {
  async getFocusTimer(authUserId: string) {
    const { data, error } = await supabase
      .from('focus_timers')
      .select('mode, start_time, duration, is_running, elapsed_ms, updated_at')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      // Graceful fallback when table is not yet migrated.
      if (error.code === '42P01' || error.code === 'PGRST204') {
        return null;
      }
      throw error;
    }

    if (!data) return null;

    const row = data as FocusTimerRow;
    return {
      state: {
        mode: row.mode === 'elapsed' ? 'elapsed' : 'countdown',
        startTime: row.start_time,
        duration: row.duration,
        isRunning: row.is_running,
        elapsedMs: row.elapsed_ms,
      } as TimerSyncState,
      updatedAt: Date.parse(row.updated_at) || Date.now(),
    };
  },

  async upsertFocusTimer(authUserId: string, state: TimerSyncState) {
    const payload = {
      auth_user_id: authUserId,
      mode: state.mode,
      start_time: state.startTime,
      duration: state.duration,
      is_running: state.isRunning,
      elapsed_ms: state.elapsedMs,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('focus_timers').upsert(payload, {
      onConflict: 'auth_user_id',
    });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST204') {
        return;
      }
      throw error;
    }
  },
};
