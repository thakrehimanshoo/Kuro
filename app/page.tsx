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
    <div className="flex flex-col h-screen bg-black text-white lg:ml-64 overflow-hidden">
      {/* Main content - vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-3 xs:px-4 sm:px-6 lg:px-12 max-w-2xl mx-auto safe-top">
        {/* Pomodoro cycle indicator + Phase label */}
        <div className="text-center mb-2 xs:mb-3 sm:mb-6">
          {type === 'work' && (
            <div className="mb-1 xs:mb-2 flex items-center justify-center gap-1.5 xs:gap-2">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                    num <= currentPomodoro ? 'bg-white' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
          <div className="text-[9px] xs:text-[10px] sm:text-xs opacity-40 uppercase tracking-[0.1em] xs:tracking-[0.15em]">
            {getPhaseLabel()} {type === 'work' && `· ${currentPomodoro}/4`}
          </div>
        </div>

        {/* Timer display with progress ring */}
        <div className="relative mb-3 xs:mb-4 sm:mb-8">
          <div className={`progress-ring-container ${status === 'running' ? 'animate-pulse-slow' : ''}`}>
            <ProgressRing progress={progress} size="100%" strokeWidth={3} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl xs:text-5xl sm:text-7xl font-extralight tracking-tighter">
                {formatTime(timeLeft)}
              </div>
              <div className="text-[8px] xs:text-[10px] sm:text-sm opacity-30 tracking-wide max-w-[120px] xs:max-w-[160px] sm:max-w-xs truncate mx-auto mt-0.5">
                {getMessage()}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 mb-2 xs:mb-3 sm:mb-4">
          <button
            onClick={reset}
            disabled={status === 'idle' && timeLeft === totalTime}
            className="w-10 h-10 xs:w-11 xs:h-11 sm:w-14 sm:h-14 rounded-full border border-white/10 flex items-center justify-center transition-all duration-200 active:scale-95 hover:border-white/30 disabled:opacity-20"
          >
            <ResetIcon className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={handleStartPause}
            className="w-14 h-14 xs:w-16 xs:h-16 sm:w-24 sm:h-24 rounded-full border-2 border-white flex items-center justify-center transition-all duration-200 active:scale-95 hover:bg-white/5"
          >
            {status === 'running' ? (
              <PauseIcon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-10 sm:h-10" />
            ) : (
              <PlayIcon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-10 sm:h-10 ml-0.5" />
            )}
          </button>

          <button
            onClick={skipToNext}
            disabled={status === 'idle' && timeLeft === totalTime}
            className="w-10 h-10 xs:w-11 xs:h-11 sm:w-14 sm:h-14 rounded-full border border-white/10 flex items-center justify-center transition-all duration-200 active:scale-95 hover:border-white/30 disabled:opacity-20"
            title={getNextPhaseText()}
          >
            <SkipIcon className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Secondary controls - compact */}
        <div className="flex flex-col items-center gap-1.5 xs:gap-2 sm:gap-3">
          {type === 'work' && (status === 'running' || status === 'paused') && (
            <button
              onClick={handleCompleteSession}
              className="px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 sm:py-2.5 text-[10px] xs:text-xs sm:text-sm bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 transition-all duration-200 rounded-lg flex items-center gap-1.5 font-medium"
            >
              <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Done
            </button>
          )}

          {(status !== 'idle' || timeLeft !== totalTime) && (
            <button
              onClick={handleAbandon}
              className="px-3 py-1.5 text-[9px] xs:text-[10px] opacity-30 hover:opacity-60 transition-opacity"
            >
              Abandon
            </button>
          )}
        </div>

        {/* Next phase indicator */}
        <div className="text-[9px] xs:text-[10px] sm:text-xs opacity-20 mt-2 xs:mt-3">
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
