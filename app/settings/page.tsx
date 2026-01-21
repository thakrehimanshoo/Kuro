'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useTimerStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.toArray());
  const currentSettings = settings?.[0];

  const { setDurations, setAutoStart, autoStartBreaks, autoStartPomodoros } = useTimerStore();

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

  const updateSettings = async (updates: Partial<typeof currentSettings>) => {
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

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="safe-top px-6 pt-8 pb-6">
        <h1 className="text-4xl font-extralight mb-3">Settings</h1>
        <p className="text-sm opacity-40">Customize your experience</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Timer durations */}
        <div className="mb-8">
          <div className="px-6 py-4">
            <h2 className="text-xs opacity-40 uppercase tracking-wider">Timer Durations</h2>
          </div>

          <div className="px-6 space-y-6">
            <div className="flex items-center justify-between py-2">
              <span className="text-base">Focus Session</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDurationChange('work', workDuration - 1)}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center active:scale-90 transition-transform duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-16 text-center text-lg font-light">{workDuration}</span>
                <button
                  onClick={() => handleDurationChange('work', workDuration + 1)}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center active:scale-90 transition-transform duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="text-sm opacity-40 w-12">min</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-base">Short Break</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDurationChange('short', shortBreakDuration - 1)}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center active:scale-90 transition-transform duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-16 text-center text-lg font-light">{shortBreakDuration}</span>
                <button
                  onClick={() => handleDurationChange('short', shortBreakDuration + 1)}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center active:scale-90 transition-transform duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="text-sm opacity-40 w-12">min</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-base">Long Break</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDurationChange('long', longBreakDuration - 1)}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center active:scale-90 transition-transform duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-16 text-center text-lg font-light">{longBreakDuration}</span>
                <button
                  onClick={() => handleDurationChange('long', longBreakDuration + 1)}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center active:scale-90 transition-transform duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="text-sm opacity-40 w-12">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-start */}
        <div className="mb-8 border-t border-white/10">
          <div className="px-6 py-4 mt-6">
            <h2 className="text-xs opacity-40 uppercase tracking-wider">Auto-start</h2>
          </div>

          <div className="px-6 space-y-4">
            <button
              onClick={handleAutoBreaksToggle}
              className="w-full flex items-center justify-between py-3 active:opacity-60 transition-opacity duration-200"
            >
              <div className="text-left">
                <div className="text-base mb-1">Auto-start Breaks</div>
                <div className="text-xs opacity-40">Automatically start breaks after focus sessions</div>
              </div>
              <Toggle enabled={autoBreaks} />
            </button>

            <button
              onClick={handleAutoPomodorosToggle}
              className="w-full flex items-center justify-between py-3 active:opacity-60 transition-opacity duration-200"
            >
              <div className="text-left">
                <div className="text-base mb-1">Auto-start Pomodoros</div>
                <div className="text-xs opacity-40">Automatically start focus sessions after breaks</div>
              </div>
              <Toggle enabled={autoPomodoros} />
            </button>
          </div>
        </div>

        {/* Sound */}
        <div className="mb-8 border-t border-white/10">
          <div className="px-6 py-4 mt-6">
            <h2 className="text-xs opacity-40 uppercase tracking-wider">Audio</h2>
          </div>

          <div className="px-6">
            <button
              onClick={handleSoundToggle}
              className="w-full flex items-center justify-between py-3 active:opacity-60 transition-opacity duration-200"
            >
              <div className="text-left">
                <div className="text-base mb-1">Sound Notifications</div>
                <div className="text-xs opacity-40">Play sound when timer completes</div>
              </div>
              <Toggle enabled={soundEnabled} />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="px-6 py-12 border-t border-white/10 mt-8">
          <div className="text-center">
            <div className="text-5xl font-extralight mb-3">Kuro</div>
            <div className="text-sm opacity-40 mb-1">Version 1.0.0</div>
            <div className="text-xs opacity-20 mt-6">
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
      className={`w-14 h-8 rounded-full border transition-all duration-200 flex-shrink-0 ${
        enabled ? 'bg-white border-white' : 'bg-transparent border-white/20'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full mt-0.5 transition-all duration-200 ${
          enabled ? 'ml-7 bg-black' : 'ml-1 bg-white/40'
        }`}
      />
    </div>
  );
}
