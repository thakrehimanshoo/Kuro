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

  // Pomodoro cycle tracking
  currentPomodoro: number; // 1-4
  completedPomodoros: number; // total completed in this cycle
  totalSessionsToday: number; // all sessions completed today
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;

  // Task linking
  activeTaskId: number | null;

  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  skipToNext: () => void;
  abandon: () => void;
  completeSession: () => void;
  setDurations: (work: number, shortBreak: number, longBreak: number) => void;
  setAutoStart: (breaks: boolean, pomodoros: boolean) => void;
  resetCycle: () => void;
  setActiveTask: (taskId: number | null) => void;
  canSwitchTask: () => boolean;
  switchTask: (newTaskId: number | null) => void;
  // Returns session info if there was an active session to complete, null otherwise
  completeActiveTaskSession: (taskId: number) => {
    hadActiveSession: boolean;
    timeSpentSeconds: number;
    wasRunning: boolean;
  };
  // Check if a task has an active timer running
  isTaskActive: (taskId: number) => boolean;
  // Clear active task without stopping timer (for when task is deleted)
  clearActiveTaskIfMatch: (taskId: number) => boolean;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  status: 'idle',
  type: 'work',
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  currentPomodoro: 1,
  completedPomodoros: 0,
  totalSessionsToday: 0,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  activeTaskId: null,

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

  skipToNext: () => {
    get().completeSession();
  },

  abandon: () => {
    // Reset current session without completing it
    const { type, workDuration, shortBreakDuration, longBreakDuration } = get();
    const duration =
      type === 'work' ? workDuration :
      type === 'short-break' ? shortBreakDuration :
      longBreakDuration;

    set({
      status: 'idle',
      timeLeft: duration * 60,
      totalTime: duration * 60,
      activeTaskId: null, // Clear active task when abandoning
    });
  },

  completeSession: () => {
    const {
      type,
      currentPomodoro,
      completedPomodoros,
      totalSessionsToday,
      workDuration,
      shortBreakDuration,
      longBreakDuration,
      autoStartBreaks,
      autoStartPomodoros,
      activeTaskId,
    } = get();

    let newType: TimerType;
    let newPomodoro = currentPomodoro;
    let newCompletedPomodoros = completedPomodoros;
    let newTotalSessions = totalSessionsToday;
    let shouldAutoStart = false;
    let clearTask = false;

    if (type === 'work') {
      // Completed a work session
      newCompletedPomodoros = completedPomodoros + 1;
      newTotalSessions = totalSessionsToday + 1;
      clearTask = true; // Clear task after completing work session

      if (currentPomodoro >= 4) {
        // After 4th pomodoro, take long break
        newType = 'long-break';
        shouldAutoStart = autoStartBreaks;
      } else {
        // Take short break
        newType = 'short-break';
        newPomodoro = currentPomodoro + 1;
        shouldAutoStart = autoStartBreaks;
      }
    } else if (type === 'short-break') {
      // Completed short break, start next pomodoro
      newType = 'work';
      shouldAutoStart = autoStartPomodoros;
    } else {
      // Completed long break, reset cycle
      newType = 'work';
      newPomodoro = 1;
      newCompletedPomodoros = 0;
      shouldAutoStart = autoStartPomodoros;
    }

    const duration =
      newType === 'work' ? workDuration :
      newType === 'short-break' ? shortBreakDuration :
      longBreakDuration;

    set({
      type: newType,
      status: shouldAutoStart ? 'running' : 'idle',
      timeLeft: duration * 60,
      totalTime: duration * 60,
      currentPomodoro: newPomodoro,
      completedPomodoros: newCompletedPomodoros,
      totalSessionsToday: newTotalSessions,
      activeTaskId: clearTask ? null : activeTaskId,
    });

    // Play completion sound
    if (typeof window !== 'undefined') {
      const audio = new Audio('data:audio/wav;base64,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');
      audio.play().catch(() => {});
    }
  },

  setDurations: (work: number, shortBreak: number, longBreak: number) => {
    const { type, status } = get();
    const duration =
      type === 'work' ? work :
      type === 'short-break' ? shortBreak :
      longBreak;

    const updates: Partial<TimerState> = {
      workDuration: work,
      shortBreakDuration: shortBreak,
      longBreakDuration: longBreak,
    };

    // Only update timer if not running
    if (status === 'idle') {
      updates.timeLeft = duration * 60;
      updates.totalTime = duration * 60;
    }

    set(updates);
  },

  setAutoStart: (breaks: boolean, pomodoros: boolean) => {
    set({
      autoStartBreaks: breaks,
      autoStartPomodoros: pomodoros,
    });
  },

  resetCycle: () => {
    const { workDuration } = get();
    set({
      status: 'idle',
      type: 'work',
      currentPomodoro: 1,
      completedPomodoros: 0,
      timeLeft: workDuration * 60,
      totalTime: workDuration * 60,
      activeTaskId: null,
    });
  },

  setActiveTask: (taskId: number | null) => {
    set({ activeTaskId: taskId });
  },

  canSwitchTask: () => {
    const { status, type } = get();
    // Can switch task if timer is idle or not on a work session
    return status === 'idle' || type !== 'work';
  },

  switchTask: (newTaskId: number | null) => {
    const { status, type, timeLeft, totalTime, activeTaskId } = get();

    // If switching to the same task, do nothing
    if (activeTaskId === newTaskId) return;

    // If timer is idle, just switch
    if (status === 'idle') {
      set({ activeTaskId: newTaskId });
      return;
    }

    // If on a break, allow switching without resetting
    if (type !== 'work') {
      set({ activeTaskId: newTaskId });
      return;
    }

    // If timer is running on a work session with a different task,
    // pause and require manual confirmation
    if (status === 'running' && timeLeft < totalTime) {
      // This will be handled in the UI with a confirmation dialog
      return;
    }

    set({ activeTaskId: newTaskId });
  },

  completeActiveTaskSession: (taskId: number) => {
    const { status, type, timeLeft, totalTime, activeTaskId, workDuration } = get();

    // If this task is not the active task, nothing to do
    if (activeTaskId !== taskId) {
      return { hadActiveSession: false, timeSpentSeconds: 0, wasRunning: false };
    }

    // If timer is idle and hasn't started, nothing to save
    if (status === 'idle' && timeLeft === totalTime) {
      set({ activeTaskId: null });
      return { hadActiveSession: false, timeSpentSeconds: 0, wasRunning: false };
    }

    const wasRunning = status === 'running';
    const timeSpentSeconds = totalTime - timeLeft;

    // Reset the timer and clear the active task
    set({
      status: 'idle',
      type: 'work',
      timeLeft: workDuration * 60,
      totalTime: workDuration * 60,
      currentPomodoro: 1,
      completedPomodoros: 0,
      activeTaskId: null,
    });

    return { hadActiveSession: true, timeSpentSeconds, wasRunning };
  },

  isTaskActive: (taskId: number) => {
    const { activeTaskId, status, type, timeLeft, totalTime } = get();
    // A task is "active" if it's the activeTaskId and timer has been used
    return activeTaskId === taskId && (status !== 'idle' || timeLeft < totalTime);
  },

  clearActiveTaskIfMatch: (taskId: number) => {
    const { activeTaskId, status, type, timeLeft, totalTime, workDuration } = get();

    if (activeTaskId !== taskId) {
      return false;
    }

    // If there's an active session, reset the timer
    if (status !== 'idle' || timeLeft < totalTime) {
      set({
        status: 'idle',
        type: 'work',
        timeLeft: workDuration * 60,
        totalTime: workDuration * 60,
        currentPomodoro: 1,
        completedPomodoros: 0,
        activeTaskId: null,
      });
    } else {
      set({ activeTaskId: null });
    }

    return true;
  },
}));
