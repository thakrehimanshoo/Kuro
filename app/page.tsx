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
    start,
    pause,
    reset,
    tick,
    switchType,
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
    // Save completed session to database
    if (status === 'idle' && timeLeft === 0) {
      const session = {
        type,
        duration: totalTime / 60,
        completedAt: Date.now(),
        date: getTodayDate(),
      };

      db.sessions.add(session);

      // Play sound if enabled
      if (typeof window !== 'undefined') {
        const audio = new Audio('data:audio/wav;base64,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');
        audio.play().catch(() => {});
      }
    }
  }, [status, timeLeft, type, totalTime]);

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  const handleStartPause = () => {
    if (status === 'running') {
      pause();
    } else {
      start();
    }
  };

  const typeLabels = {
    work: 'Focus',
    'short-break': 'Short Break',
    'long-break': 'Long Break',
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white safe-top">
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
        {/* Type selector */}
        <div className="flex gap-2 mb-12">
          <button
            onClick={() => switchType('work')}
            className={`px-4 py-2 text-sm transition-opacity duration-200 ${
              type === 'work' ? 'opacity-100 border-b border-white' : 'opacity-40'
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchType('short-break')}
            className={`px-4 py-2 text-sm transition-opacity duration-200 ${
              type === 'short-break' ? 'opacity-100 border-b border-white' : 'opacity-40'
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => switchType('long-break')}
            className={`px-4 py-2 text-sm transition-opacity duration-200 ${
              type === 'long-break' ? 'opacity-100 border-b border-white' : 'opacity-40'
            }`}
          >
            Long Break
          </button>
        </div>

        {/* Timer display */}
        <div className="relative mb-12">
          <ProgressRing progress={progress} size={280} strokeWidth={4} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-light tracking-tight mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm opacity-40 uppercase tracking-wider">
                {typeLabels[type]}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <button
            onClick={handleStartPause}
            className="w-20 h-20 rounded-full border border-white flex items-center justify-center transition-opacity duration-200 active:opacity-60"
          >
            {status === 'running' ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayIcon className="w-8 h-8 ml-1" />
            )}
          </button>
          <button
            onClick={reset}
            className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center transition-opacity duration-200 active:opacity-60"
          >
            <ResetIcon className="w-7 h-7" />
          </button>
        </div>
      </div>

      <BottomNav />
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
