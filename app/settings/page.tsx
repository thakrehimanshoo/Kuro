'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Settings } from '@/lib/db';
import { useTimerStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.toArray());
  const currentSettings = settings?.[0];

  const { setDurations, setAutoStart, autoStartBreaks, autoStartPomodoros } = useTimerStore();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [autoBreaks, setAutoBreaks] = useState(false);
  const [autoPomodoros, setAutoPomodoros] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const allSettings = await db.settings.toArray();
      if (allSettings.length === 0) {
        await db.settings.add({
          soundEnabled: true,
          workDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
        });
      } else {
        const s = allSettings[0];
        setSoundEnabled(s.soundEnabled);
        setWorkDuration(s.workDuration);
        setShortBreakDuration(s.shortBreakDuration);
        setLongBreakDuration(s.longBreakDuration);
        setDurations(s.workDuration, s.shortBreakDuration, s.longBreakDuration);
      }
    };

    loadSettings();
  }, [setDurations]);

  useEffect(() => {
    setAutoBreaks(autoStartBreaks);
    setAutoPomodoros(autoStartPomodoros);
  }, [autoStartBreaks, autoStartPomodoros]);

  const updateSettings = async (updates: Partial<Settings>) => {
    if (currentSettings?.id) {
      await db.settings.update(currentSettings.id, updates);

      if (updates.workDuration || updates.shortBreakDuration || updates.longBreakDuration) {
        setDurations(
          updates.workDuration ?? workDuration,
          updates.shortBreakDuration ?? shortBreakDuration,
          updates.longBreakDuration ?? longBreakDuration
        );
      }
    }
  };

  const handleSoundToggle = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await updateSettings({ soundEnabled: newValue });
  };

  const handleAutoBreaksToggle = () => {
    const newValue = !autoBreaks;
    setAutoBreaks(newValue);
    setAutoStart(newValue, autoPomodoros);
  };

  const handleAutoPomodorosToggle = () => {
    const newValue = !autoPomodoros;
    setAutoPomodoros(newValue);
    setAutoStart(autoBreaks, newValue);
  };

  const handleDurationChange = async (
    type: 'work' | 'short' | 'long',
    value: number
  ) => {
    if (value < 1 || value > 60) return;

    if (type === 'work') {
      setWorkDuration(value);
      await updateSettings({ workDuration: value });
    } else if (type === 'short') {
      setShortBreakDuration(value);
      await updateSettings({ shortBreakDuration: value });
    } else {
      setLongBreakDuration(value);
      await updateSettings({ longBreakDuration: value });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white lg:ml-64">
      {/* Header */}
      <div className="safe-top px-4 xs:px-6 lg:px-12 pt-6 xs:pt-8 lg:pt-12 pb-4 xs:pb-6">
        <h1 className="text-3xl xs:text-4xl lg:text-5xl font-extralight mb-2 xs:mb-3">Settings</h1>
        <p className="text-xs xs:text-sm lg:text-base opacity-40">Customize your experience</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 lg:pb-8 max-w-4xl">
        {/* Timer durations */}
        <div className="mb-6 xs:mb-8">
          <div className="px-4 xs:px-6 lg:px-12 py-3 xs:py-4">
            <h2 className="text-[11px] xs:text-xs lg:text-sm opacity-40 uppercase tracking-wider">Timer Durations</h2>
          </div>

          <div className="px-4 xs:px-6 lg:px-12 space-y-4 xs:space-y-6">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm xs:text-base">Focus Session</span>
              <div className="flex items-center gap-2 xs:gap-4">
                <button
                  onClick={() => handleDurationChange('work', workDuration - 1)}
                  className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/5 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-12 xs:w-16 text-center text-base xs:text-lg font-light">{workDuration}</span>
                <button
                  onClick={() => handleDurationChange('work', workDuration + 1)}
                  className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/5 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="text-xs xs:text-sm opacity-40 w-8 xs:w-12">min</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm xs:text-base">Short Break</span>
              <div className="flex items-center gap-2 xs:gap-4">
                <button
                  onClick={() => handleDurationChange('short', shortBreakDuration - 1)}
                  className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/5 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-12 xs:w-16 text-center text-base xs:text-lg font-light">{shortBreakDuration}</span>
                <button
                  onClick={() => handleDurationChange('short', shortBreakDuration + 1)}
                  className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/5 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="text-xs xs:text-sm opacity-40 w-8 xs:w-12">min</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm xs:text-base">Long Break</span>
              <div className="flex items-center gap-2 xs:gap-4">
                <button
                  onClick={() => handleDurationChange('long', longBreakDuration - 1)}
                  className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/5 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-12 xs:w-16 text-center text-base xs:text-lg font-light">{longBreakDuration}</span>
                <button
                  onClick={() => handleDurationChange('long', longBreakDuration + 1)}
                  className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/5 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="text-xs xs:text-sm opacity-40 w-8 xs:w-12">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-start */}
        <div className="mb-6 xs:mb-8 border-t border-white/10">
          <div className="px-4 xs:px-6 lg:px-12 py-3 xs:py-4 mt-4 xs:mt-6">
            <h2 className="text-[11px] xs:text-xs opacity-40 uppercase tracking-wider">Auto-start</h2>
          </div>

          <div className="px-4 xs:px-6 lg:px-12 space-y-2 xs:space-y-4">
            <button
              onClick={handleAutoBreaksToggle}
              className="w-full flex items-center justify-between min-h-11 py-2.5 xs:py-3 active:opacity-60 transition-opacity duration-200"
            >
              <div className="text-left pr-4">
                <div className="text-sm xs:text-base mb-0.5 xs:mb-1">Auto-start Breaks</div>
                <div className="text-[11px] xs:text-xs opacity-40">Automatically start breaks after focus sessions</div>
              </div>
              <Toggle enabled={autoBreaks} />
            </button>

            <button
              onClick={handleAutoPomodorosToggle}
              className="w-full flex items-center justify-between min-h-11 py-2.5 xs:py-3 active:opacity-60 transition-opacity duration-200"
            >
              <div className="text-left pr-4">
                <div className="text-sm xs:text-base mb-0.5 xs:mb-1">Auto-start Pomodoros</div>
                <div className="text-[11px] xs:text-xs opacity-40">Automatically start focus sessions after breaks</div>
              </div>
              <Toggle enabled={autoPomodoros} />
            </button>
          </div>
        </div>

        {/* Sound */}
        <div className="mb-6 xs:mb-8 border-t border-white/10">
          <div className="px-4 xs:px-6 lg:px-12 py-3 xs:py-4 mt-4 xs:mt-6">
            <h2 className="text-[11px] xs:text-xs opacity-40 uppercase tracking-wider">Audio</h2>
          </div>

          <div className="px-4 xs:px-6">
            <button
              onClick={handleSoundToggle}
              className="w-full flex items-center justify-between min-h-11 py-2.5 xs:py-3 active:opacity-60 transition-opacity duration-200"
            >
              <div className="text-left pr-4">
                <div className="text-sm xs:text-base mb-0.5 xs:mb-1">Sound Notifications</div>
                <div className="text-[11px] xs:text-xs opacity-40">Play sound when timer completes</div>
              </div>
              <Toggle enabled={soundEnabled} />
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="mb-6 xs:mb-8 border-t border-white/10">
          <div className="px-4 xs:px-6 lg:px-12 py-3 xs:py-4 mt-4 xs:mt-6">
            <h2 className="text-[11px] xs:text-xs opacity-40 uppercase tracking-wider">Account</h2>
          </div>

          <div className="px-4 xs:px-6 lg:px-12 space-y-3 xs:space-y-4">
            {user ? (
              <>
                <div className="bg-white/5 border border-white/10 rounded-xl xs:rounded-2xl p-3 xs:p-4">
                  <div className="text-[11px] xs:text-xs opacity-40 mb-1.5 xs:mb-2">Signed in as</div>
                  <div className="text-sm xs:text-base break-all">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-white/5 border border-white/10 min-h-11 py-2.5 xs:py-3 px-4 xs:px-6 rounded-xl xs:rounded-2xl hover:bg-white/10 active:bg-white/10 transition-colors text-sm xs:text-base"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="bg-white/5 border border-white/10 rounded-xl xs:rounded-2xl p-3 xs:p-4">
                  <div className="text-xs xs:text-sm mb-1.5 xs:mb-2">Not signed in</div>
                  <div className="text-[11px] xs:text-xs opacity-40">Sign in to sync your progress across devices</div>
                </div>
                <Link
                  href="/auth/login"
                  className="block w-full bg-white text-black text-center font-medium min-h-11 py-2.5 xs:py-3 px-4 xs:px-6 rounded-xl xs:rounded-2xl text-sm xs:text-base"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* About */}
        <div className="px-4 xs:px-6 lg:px-12 py-8 xs:py-12 border-t border-white/10 mt-6 xs:mt-8">
          <div className="text-center">
            <div className="text-4xl xs:text-5xl font-extralight mb-2 xs:mb-3">Kuro</div>
            <div className="text-xs xs:text-sm opacity-40 mb-1">Version 1.0.0</div>
            <div className="text-[11px] xs:text-xs opacity-20 mt-4 xs:mt-6">
              A minimal productivity app
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`w-12 xs:w-14 h-7 xs:h-8 rounded-full border transition-all duration-200 flex-shrink-0 ${
        enabled ? 'bg-white border-white' : 'bg-transparent border-white/20'
      }`}
    >
      <div
        className={`w-5 xs:w-6 h-5 xs:h-6 rounded-full mt-0.5 transition-all duration-200 ${
          enabled ? 'ml-6 xs:ml-7 bg-black' : 'ml-1 bg-white/40'
        }`}
      />
    </div>
  );
}
