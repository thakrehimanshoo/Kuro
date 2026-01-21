'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useTimerStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.toArray());
  const currentSettings = settings?.[0];

  const { setDurations } = useTimerStore();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);

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
      <div className="safe-top px-6 pt-12 pb-6 border-b border-white/10">
        <h1 className="text-3xl font-light">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Timer durations */}
        <div className="border-b border-white/10">
          <div className="px-6 py-4">
            <h2 className="text-sm opacity-40 uppercase tracking-wider">Timer Durations</h2>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <span>Focus</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDurationChange('work', workDuration - 1)}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center active:opacity-60 transition-opacity duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-12 text-center">{workDuration}</span>
              <button
                onClick={() => handleDurationChange('work', workDuration + 1)}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center active:opacity-60 transition-opacity duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <span className="text-sm opacity-40">min</span>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <span>Short Break</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDurationChange('short', shortBreakDuration - 1)}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center active:opacity-60 transition-opacity duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-12 text-center">{shortBreakDuration}</span>
              <button
                onClick={() => handleDurationChange('short', shortBreakDuration + 1)}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center active:opacity-60 transition-opacity duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <span className="text-sm opacity-40">min</span>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <span>Long Break</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDurationChange('long', longBreakDuration - 1)}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center active:opacity-60 transition-opacity duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-12 text-center">{longBreakDuration}</span>
              <button
                onClick={() => handleDurationChange('long', longBreakDuration + 1)}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center active:opacity-60 transition-opacity duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <span className="text-sm opacity-40">min</span>
            </div>
          </div>
        </div>

        {/* Sound */}
        <div className="border-b border-white/10">
          <div className="px-6 py-4">
            <h2 className="text-sm opacity-40 uppercase tracking-wider">Audio</h2>
          </div>

          <button
            onClick={handleSoundToggle}
            className="w-full px-6 py-4 flex items-center justify-between active:bg-white/5 transition-colors duration-200"
          >
            <span>Sound</span>
            <div
              className={`w-12 h-7 rounded-full border transition-all duration-200 ${
                soundEnabled ? 'bg-white border-white' : 'bg-transparent border-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full mt-0.5 transition-all duration-200 ${
                  soundEnabled ? 'ml-6 bg-black' : 'ml-1 bg-white/40'
                }`}
              />
            </div>
          </button>
        </div>

        {/* About */}
        <div className="px-6 py-8">
          <div className="text-center">
            <div className="text-4xl font-light mb-2">Kuro</div>
            <div className="text-sm opacity-40">Version 0.1.0</div>
            <div className="text-xs opacity-20 mt-4">
              A minimal productivity app
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
