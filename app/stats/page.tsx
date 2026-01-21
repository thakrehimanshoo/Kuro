'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getTodayDate, getWeekDates } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';

export default function StatsPage() {
  const todayDate = getTodayDate();

  const todaySessions = useLiveQuery(
    () => db.sessions.where('date').equals(todayDate).toArray(),
    [todayDate]
  );

  const allSessions = useLiveQuery(() => db.sessions.toArray());

  const weekDates = getWeekDates();
  const weekData = weekDates.map((date) => {
    const sessions = allSessions?.filter(
      (s) => s.date === date && s.type === 'work'
    ) || [];
    return {
      date,
      count: sessions.length,
      duration: sessions.reduce((sum, s) => sum + s.duration, 0),
    };
  });

  const todayPomodoros = todaySessions?.filter((s) => s.type === 'work').length || 0;
  const todayFocusTime = Math.round(
    (todaySessions?.filter((s) => s.type === 'work')
      .reduce((sum, s) => sum + s.duration, 0) || 0)
  );

  const totalPomodoros = allSessions?.filter((s) => s.type === 'work').length || 0;
  const totalFocusTime = Math.round(
    (allSessions?.filter((s) => s.type === 'work')
      .reduce((sum, s) => sum + s.duration, 0) || 0)
  );

  const maxCount = Math.max(...weekData.map((d) => d.count), 1);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="safe-top px-6 pt-12 pb-6 border-b border-white/10">
        <h1 className="text-3xl font-light">Stats</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-6 py-6">
        {/* Today's stats */}
        <div className="mb-12">
          <h2 className="text-sm opacity-40 uppercase tracking-wider mb-4">Today</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-white/10 rounded-lg p-6">
              <div className="text-4xl font-light mb-2">{todayPomodoros}</div>
              <div className="text-sm opacity-40">Pomodoros</div>
            </div>
            <div className="border border-white/10 rounded-lg p-6">
              <div className="text-4xl font-light mb-2">{todayFocusTime}</div>
              <div className="text-sm opacity-40">Minutes</div>
            </div>
          </div>
        </div>

        {/* Week chart */}
        <div className="mb-12">
          <h2 className="text-sm opacity-40 uppercase tracking-wider mb-6">Last 7 Days</h2>
          <div className="flex items-end justify-between h-48 gap-2">
            {weekData.map((day, index) => {
              const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              const date = new Date(day.date);
              const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="w-full flex flex-col items-center justify-end flex-1 mb-2">
                    {day.count > 0 && (
                      <div className="text-xs opacity-40 mb-2">{day.count}</div>
                    )}
                    <div
                      className="w-full bg-white transition-all duration-300"
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: day.count > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                  <div
                    className={`text-xs ${
                      day.date === todayDate ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    {dayLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All-time stats */}
        <div>
          <h2 className="text-sm opacity-40 uppercase tracking-wider mb-4">All Time</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-white/10 rounded-lg p-6">
              <div className="text-4xl font-light mb-2">{totalPomodoros}</div>
              <div className="text-sm opacity-40">Pomodoros</div>
            </div>
            <div className="border border-white/10 rounded-lg p-6">
              <div className="text-4xl font-light mb-2">
                {Math.floor(totalFocusTime / 60)}
                <span className="text-2xl opacity-40">h</span>{' '}
                {totalFocusTime % 60}
                <span className="text-2xl opacity-40">m</span>
              </div>
              <div className="text-sm opacity-40">Focus Time</div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
