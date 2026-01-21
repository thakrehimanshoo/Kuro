import { create } from 'zustand';

export type TimerStatus = 'idle' | 'running' | 'paused';
export type TimerType = 'work' | 'short-break' | 'long-break';

interface TimerState {
  status: TimerStatus;
  type: TimerType;
  timeLeft: number; // in seconds
  totalTime: number; // in seconds
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  completedPomodoros: number;

  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  switchType: (type: TimerType) => void;
  completeSession: () => void;
  setDurations: (work: number, shortBreak: number, longBreak: number) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  status: 'idle',
  type: 'work',
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  completedPomodoros: 0,

  start: () => set({ status: 'running' }),

  pause: () => set({ status: 'paused' }),

  reset: () => {
    const { type, workDuration, shortBreakDuration, longBreakDuration } = get();
    const duration =
      type === 'work' ? workDuration :
      type === 'short-break' ? shortBreakDuration :
      longBreakDuration;

    set({
      status: 'idle',
      timeLeft: duration * 60,
      totalTime: duration * 60,
    });
  },

  tick: () => {
    const { timeLeft, status } = get();
    if (status === 'running' && timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    }
    if (status === 'running' && timeLeft === 1) {
      get().completeSession();
    }
  },

  switchType: (type: TimerType) => {
    const { workDuration, shortBreakDuration, longBreakDuration } = get();
    const duration =
      type === 'work' ? workDuration :
      type === 'short-break' ? shortBreakDuration :
      longBreakDuration;

    set({
      type,
      status: 'idle',
      timeLeft: duration * 60,
      totalTime: duration * 60,
    });
  },

  completeSession: () => {
    const { type, completedPomodoros } = get();
    if (type === 'work') {
      set({
        status: 'idle',
        completedPomodoros: completedPomodoros + 1
      });
    } else {
      set({ status: 'idle' });
    }
  },

  setDurations: (work: number, shortBreak: number, longBreak: number) => {
    const { type } = get();
    const duration =
      type === 'work' ? work :
      type === 'short-break' ? shortBreak :
      longBreak;

    set({
      workDuration: work,
      shortBreakDuration: shortBreak,
      longBreakDuration: longBreak,
      timeLeft: duration * 60,
      totalTime: duration * 60,
    });
  },
}));
