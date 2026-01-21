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
      (s) => s.date === date && s.type === 'work' && !s.abandoned
    ) || [];
    return {
      date,
      count: sessions.length,
      duration: sessions.reduce((sum, s) => sum + s.duration, 0),
    };
  });

  const todayPomodoros = todaySessions?.filter((s) => s.type === 'work' && !s.abandoned).length || 0;
  const todayFocusTime = Math.round(
    (todaySessions?.filter((s) => s.type === 'work' && !s.abandoned)
      .reduce((sum, s) => sum + s.duration, 0) || 0)
  );

  const totalPomodoros = allSessions?.filter((s) => s.type === 'work' && !s.abandoned).length || 0;
  const totalFocusTime = Math.round(
    (allSessions?.filter((s) => s.type === 'work' && !s.abandoned)
      .reduce((sum, s) => sum + s.duration, 0) || 0)
  );

  // Calculate streak
  const calculateStreak = () => {
    if (!allSessions || allSessions.length === 0) return 0;

    const workSessions = allSessions.filter(s => s.type === 'work' && !s.abandoned);
    const uniqueDates = [...new Set(workSessions.map(s => s.date))].sort().reverse();

    let streak = 0;
    const today = getTodayDate();
    let checkDate = new Date(today);

    for (let i = 0; i < uniqueDates.length; i++) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0 && dateStr === today) {
        // Today hasn't been completed yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  const maxCount = Math.max(...weekData.map((d) => d.count), 1);

  const hasData = totalPomodoros > 0;

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="safe-top px-6 pt-8 pb-6">
        <h1 className="text-4xl font-extralight mb-3">Stats</h1>
        <p className="text-sm opacity-40">Your productivity insights</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm opacity-40 text-center mb-2">No data yet</p>
            <p className="text-xs opacity-30 text-center max-w-xs">
              Complete your first focus session to start tracking your progress
            </p>
          </div>
        ) : (
          <>
            {/* Today's stats */}
            <div className="mb-12">
              <h2 className="text-xs opacity-40 uppercase tracking-wider mb-6">Today</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <div className="text-5xl font-extralight mb-3">{todayPomodoros}</div>
                  <div className="text-sm opacity-40">Sessions</div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <div className="text-5xl font-extralight mb-3">{todayFocusTime}</div>
                  <div className="text-sm opacity-40">Minutes</div>
                </div>
              </div>
            </div>

            {/* Streak */}
            {streak > 0 && (
              <div className="mb-12">
                <h2 className="text-xs opacity-40 uppercase tracking-wider mb-6">Current Streak</h2>
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <div className="text-5xl font-extralight mb-2">{streak}</div>
                    <div className="text-sm opacity-40">Day{streak !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-6xl opacity-10">🔥</div>
                </div>
              </div>
            )}

            {/* Week chart */}
            <div className="mb-12">
              <h2 className="text-xs opacity-40 uppercase tracking-wider mb-6">Last 7 Days</h2>
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <div className="flex items-end justify-between h-48 gap-3">
                  {weekData.map((day, index) => {
                    const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    const date = new Date(day.date);
                    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1);
                    const isToday = day.date === todayDate;

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <div className="w-full flex flex-col items-center justify-end flex-1 mb-3 relative">
                          {day.count > 0 && (
                            <div className="text-xs opacity-0 group-hover:opacity-60 transition-opacity duration-200 mb-2 absolute -top-6">
                              {day.count}
                            </div>
                          )}
                          <div
                            className={`w-full rounded-t-lg transition-all duration-300 ${
                              isToday ? 'bg-white' : 'bg-white/60'
                            } hover:bg-white`}
                            style={{
                              height: `${heightPercent}%`,
                              minHeight: day.count > 0 ? '8px' : '0',
                            }}
                          />
                        </div>
                        <div
                          className={`text-xs ${
                            isToday ? 'opacity-100 font-medium' : 'opacity-40'
                          }`}
                        >
                          {dayLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* All-time stats */}
            <div className="mb-8">
              <h2 className="text-xs opacity-40 uppercase tracking-wider mb-6">All Time</h2>
              <div className="space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-40 mb-2">Total Sessions</div>
                    <div className="text-3xl font-extralight">{totalPomodoros}</div>
                  </div>
                  <div className="text-4xl opacity-10">📊</div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-40 mb-2">Total Focus Time</div>
                    <div className="text-3xl font-extralight">
                      {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
                    </div>
                  </div>
                  <div className="text-4xl opacity-10">⏱️</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
