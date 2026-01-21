'use client';

import { useEffect } from 'react';
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
    start,
    pause,
    reset,
    tick,
    skipToNext,
  } = useTimerStore();

  useEffect(() => {
    if (status === 'running') {
      const interval = setInterval(() => {
        tick();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, tick]);

  useEffect(() => {
    // Save completed session to database when auto-progressing
    if (status === 'idle' && timeLeft !== totalTime) {
      const session = {
        type,
        duration: totalTime / 60,
        completedAt: Date.now(),
        date: getTodayDate(),
      };

      db.sessions.add(session);
    }
  }, [status, type, timeLeft, totalTime]);

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  const handleStartPause = () => {
    if (status === 'running') {
      pause();
    } else {
      start();
    }
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
        return 'Stay focused';
      } else {
        return 'Take a break';
      }
    } else {
      if (type === 'work') {
        return 'Ready to focus?';
      } else {
        return 'Time to rest';
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white safe-top">
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 max-w-md">
        {/* Pomodoro cycle indicator */}
        {type === 'work' && (
          <div className="mb-6 flex items-center gap-2">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  num <= currentPomodoro
                    ? 'bg-white scale-125'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        )}

        {/* Phase and pomodoro number */}
        <div className="text-center mb-8">
          <div className="text-sm opacity-40 uppercase tracking-[0.2em] mb-2">
            {getPhaseLabel()}
          </div>
          {type === 'work' && (
            <div className="text-xs opacity-30">
              Session {currentPomodoro} of 4
            </div>
          )}
        </div>

        {/* Timer display with progress ring */}
        <div className="relative mb-10">
          <div className={status === 'running' ? 'animate-pulse-slow' : ''}>
            <ProgressRing progress={progress} size={320} strokeWidth={3} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-7xl font-extralight tracking-tighter mb-3">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm opacity-30 tracking-wide">
                {getMessage()}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={reset}
            className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center transition-all duration-200 active:scale-95 hover:border-white/30"
          >
            <ResetIcon className="w-6 h-6" />
          </button>

          <button
            onClick={handleStartPause}
            className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center transition-all duration-200 active:scale-95 hover:bg-white/5"
          >
            {status === 'running' ? (
              <PauseIcon className="w-10 h-10" />
            ) : (
              <PlayIcon className="w-10 h-10 ml-1" />
            )}
          </button>

          <button
            onClick={skipToNext}
            className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center transition-all duration-200 active:scale-95 hover:border-white/30"
          >
            <SkipIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Next phase indicator */}
        <div className="text-xs opacity-20 tracking-wide">
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
