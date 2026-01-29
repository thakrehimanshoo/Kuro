'use client';

import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTimerStore } from '@/lib/store';
import { formatTime, getTodayDate } from '@/lib/utils';
import { db } from '@/lib/db';
import ProgressRing from '@/components/ProgressRing';
import BottomNav from '@/components/BottomNav';

export default function TimerPage() {
  const {
    status,
    type,
    timeLeft,
    totalTime,
    currentPomodoro,
    activeTaskId,
    start,
    pause,
    reset,
    skipToNext,
    abandon,
    resetCycle,
  } = useTimerStore();

  const activeTask = useLiveQuery(
    () => activeTaskId ? db.tasks.get(activeTaskId) : undefined,
    [activeTaskId]
  );

  // Get sessions for active task to show time spent
  const taskSessions = useLiveQuery(
    async () => {
      if (!activeTaskId) return [];
      const sessions = await db.sessions
        .where('taskId')
        .equals(activeTaskId)
        .and(s => s.type === 'work' && !s.abandoned)
        .toArray();
      return sessions;
    },
    [activeTaskId]
  );

  const totalTimeSpent = useMemo(() => {
    if (!taskSessions) return 0;
    return taskSessions.reduce((sum, s) => sum + s.duration, 0);
  }, [taskSessions]);

  // Timer tick is now handled globally by GlobalTimerProvider in layout
  // This ensures the timer continues running when navigating between pages

  useEffect(() => {
    // Save completed session to database and create calendar event
    const saveSession = async () => {
      if (timeLeft === 0 && status === 'idle' && type === 'work') {
        const now = Date.now();
        const sessionDuration = totalTime / 60;
        const startTime = now - (sessionDuration * 60 * 1000);

        // Save session
        const sessionId = await db.sessions.add({
          type,
          duration: sessionDuration,
          completedAt: now,
          date: getTodayDate(),
          taskId: activeTaskId || undefined,
          abandoned: false,
        });

        // Create calendar event
        await db.calendar.add({
          title: activeTaskId ? `🎯 Focus Session` : 'Focus Session',
          startDate: startTime,
          endDate: now,
          allDay: false,
          type: 'session',
          linkedId: sessionId as number,
          color: '#51cf66',
          createdAt: now,
          updatedAt: now,
        });

        // Auto-complete task if one is active
        if (activeTaskId && activeTask && !activeTask.completed) {
          await db.tasks.update(activeTaskId, {
            completed: true,
            completedAt: now,
          });
        }
      }
    };

    saveSession();
  }, [timeLeft, status, type, totalTime, activeTaskId, activeTask]);

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  const handleStartPause = () => {
    if (status === 'running') {
      pause();
    } else {
      start();
    }
  };

  const handleAbandon = async () => {
    if (status !== 'idle' && timeLeft < totalTime) {
      // Save abandoned session
      await db.sessions.add({
        type,
        duration: (totalTime - timeLeft) / 60,
        completedAt: Date.now(),
        date: getTodayDate(),
        taskId: activeTaskId || undefined,
        abandoned: true,
      });
    }
    abandon();
  };

  const getNextPhaseText = () => {
    if (type === 'work') {
      return currentPomodoro >= 4 ? 'Long Break' : 'Short Break';
    } else if (type === 'short-break') {
      return 'Focus Session';
    } else {
      return 'New Cycle';
    }
  };

  const getPhaseLabel = () => {
    if (type === 'work') {
      return 'Focus';
    } else if (type === 'short-break') {
      return 'Short Break';
    } else {
      return 'Long Break';
    }
  };

  const getMessage = () => {
    if (status === 'running') {
      if (type === 'work') {
        return activeTask ? `Working on: ${activeTask.title}` : 'Stay focused';
      } else {
        return 'Take a break';
      }
    } else {
      if (type === 'work') {
        return activeTask ? activeTask.title : 'Ready to focus?';
      } else {
        return 'Time to rest';
      }
    }
  };

  const handleCompleteSession = async () => {
    if (type === 'work' && (status === 'running' || status === 'paused')) {
      // Save the partial session
      const now = Date.now();
      const timeSpentSeconds = totalTime - timeLeft;
      const sessionDuration = timeSpentSeconds / 60; // in minutes
      const startTime = now - (timeSpentSeconds * 1000);

      if (sessionDuration > 1) { // Only save if at least 1 minute was spent
        // Save session
        const sessionId = await db.sessions.add({
          type: 'work',
          duration: sessionDuration,
          completedAt: now,
          date: getTodayDate(),
          taskId: activeTaskId || undefined,
          abandoned: false,
        });

        // Create calendar event
        await db.calendar.add({
          title: activeTaskId ? `🎯 Focus Session` : 'Focus Session',
          startDate: startTime,
          endDate: now,
          allDay: false,
          type: 'session',
          linkedId: sessionId as number,
          color: '#51cf66',
          createdAt: now,
          updatedAt: now,
        });

        // Auto-complete task if one is active
        if (activeTaskId && activeTask && !activeTask.completed) {
          await db.tasks.update(activeTaskId, {
            completed: true,
            completedAt: now,
          });
        }
      }

      // Reset the entire pomodoro cycle
      resetCycle();
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-black text-white safe-top lg:ml-64 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center w-full px-3 xs:px-4 sm:px-6 lg:px-12 max-w-2xl py-2">
        {/* Pomodoro cycle indicator */}
        {type === 'work' && (
          <div className="mb-2 xs:mb-3 sm:mb-6 flex items-center gap-1.5 xs:gap-2 sm:gap-3">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  num <= currentPomodoro
                    ? 'bg-white scale-110'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        )}

        {/* Phase and pomodoro number */}
        <div className="text-center mb-3 xs:mb-4 sm:mb-8">
          <div className="text-[10px] xs:text-xs sm:text-sm opacity-40 uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] mb-1 xs:mb-1.5 sm:mb-2">
            {getPhaseLabel()}
          </div>
          {type === 'work' && (
            <div className="text-[10px] xs:text-[11px] sm:text-xs opacity-30">
              Session {currentPomodoro} of 4
            </div>
          )}
          {/* Time spent on active task */}
          {activeTask && !activeTask.completed && type === 'work' && totalTimeSpent > 0 && (
            <div className="text-[10px] xs:text-[11px] sm:text-xs opacity-30 mt-1 xs:mt-1.5 sm:mt-2">
              Time spent: {Math.floor(totalTimeSpent / 60)}h {Math.round(totalTimeSpent % 60)}m
            </div>
          )}
        </div>

        {/* Timer display with progress ring */}
        <div className="relative mb-4 xs:mb-6 sm:mb-10">
          <div className={`progress-ring-container ${status === 'running' ? 'animate-pulse-slow' : ''}`}>
            <ProgressRing progress={progress} size="100%" strokeWidth={3} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-2 xs:px-4">
              <div className="text-4xl xs:text-5xl sm:text-7xl font-extralight tracking-tighter mb-0.5 xs:mb-1 sm:mb-3">
                {formatTime(timeLeft)}
              </div>
              <div className="text-[9px] xs:text-[11px] sm:text-sm opacity-30 tracking-wide max-w-[140px] xs:max-w-[180px] sm:max-w-xs truncate mx-auto">
                {getMessage()}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 xs:gap-3 sm:gap-4 mb-3 xs:mb-4 sm:mb-6">
          <button
            onClick={reset}
            disabled={status === 'idle' && timeLeft === totalTime}
            className="w-11 h-11 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 flex items-center justify-center transition-all duration-200 active:scale-95 hover:border-white/30 disabled:opacity-20 disabled:hover:border-white/10"
          >
            <ResetIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={handleStartPause}
            className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white flex items-center justify-center transition-all duration-200 active:scale-95 hover:bg-white/5"
          >
            {status === 'running' ? (
              <PauseIcon className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10" />
            ) : (
              <PlayIcon className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 ml-0.5 xs:ml-1" />
            )}
          </button>

          <button
            onClick={skipToNext}
            disabled={status === 'idle' && timeLeft === totalTime}
            className="w-11 h-11 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 flex items-center justify-center transition-all duration-200 active:scale-95 hover:border-white/30 disabled:opacity-20 disabled:hover:border-white/10"
            title={getNextPhaseText()}
          >
            <SkipIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex flex-col items-center gap-2 xs:gap-2.5 sm:gap-3 mb-2 xs:mb-3 sm:mb-4">
          {/* Complete Session button - shown during work sessions */}
          {type === 'work' && (status === 'running' || status === 'paused') && (
            <button
              onClick={handleCompleteSession}
              className="px-4 xs:px-5 sm:px-8 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm sm:text-base bg-green-500/20 text-green-400 border-2 border-green-500/40 hover:bg-green-500/30 hover:border-green-500/60 transition-all duration-200 rounded-xl flex items-center gap-1.5 xs:gap-2 font-medium min-h-10 xs:min-h-11"
            >
              <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="hidden xs:inline">Complete Session{activeTask && !activeTask.completed ? ' & Task' : ''}</span>
              <span className="xs:hidden">Complete{activeTask && !activeTask.completed ? ' Task' : ''}</span>
            </button>
          )}

          <div className="flex items-center gap-4">
            {(status !== 'idle' || timeLeft !== totalTime) && (
              <button
                onClick={handleAbandon}
                className="px-3 xs:px-4 py-2 xs:py-2.5 text-[10px] xs:text-xs opacity-40 hover:opacity-100 transition-opacity duration-200 border border-white/10 rounded-lg min-h-10 xs:min-h-11"
              >
                Abandon
              </button>
            )}
          </div>
        </div>

        {/* Next phase indicator */}
        <div className="text-[10px] xs:text-[11px] sm:text-xs opacity-20 tracking-wide">
          Next: {getNextPhaseText()}
        </div>
      </div>

      <BottomNav />

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function SkipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  );
}
