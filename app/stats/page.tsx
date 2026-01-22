'use client';

import { useMemo } from 'react';
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

  // Memoize week data calculation
  const weekData = useMemo(() => {
    if (!allSessions) return [];
    const weekDates = getWeekDates();
    return weekDates.map((date) => {
      const completedSessions = allSessions.filter(
        (s) => s.date === date && s.type === 'work' && !s.abandoned
      );
      const abandonedSessions = allSessions.filter(
        (s) => s.date === date && s.type === 'work' && s.abandoned
      );
      return {
        date,
        completed: completedSessions.length,
        abandoned: abandonedSessions.length,
        duration: completedSessions.reduce((sum, s) => sum + s.duration, 0),
      };
    });
  }, [allSessions]);

  // Memoize today's metrics
  const todayMetrics = useMemo(() => {
    if (!todaySessions) return { completed: 0, abandoned: 0, focusTime: 0 };

    const completed = todaySessions.filter((s) => s.type === 'work' && !s.abandoned);
    const abandoned = todaySessions.filter((s) => s.type === 'work' && s.abandoned);

    return {
      completed: completed.length,
      abandoned: abandoned.length,
      focusTime: Math.round(completed.reduce((sum, s) => sum + s.duration, 0)),
    };
  }, [todaySessions]);

  // Memoize all-time metrics
  const allTimeMetrics = useMemo(() => {
    if (!allSessions) return { completed: 0, abandoned: 0, attempted: 0, completionRate: 0, focusTime: 0 };

    const completed = allSessions.filter((s) => s.type === 'work' && !s.abandoned);
    const abandoned = allSessions.filter((s) => s.type === 'work' && s.abandoned);
    const totalCompleted = completed.length;
    const totalAbandoned = abandoned.length;
    const totalAttempted = totalCompleted + totalAbandoned;

    return {
      completed: totalCompleted,
      abandoned: totalAbandoned,
      attempted: totalAttempted,
      completionRate: totalAttempted > 0 ? Math.round((totalCompleted / totalAttempted) * 100) : 0,
      focusTime: Math.round(completed.reduce((sum, s) => sum + s.duration, 0)),
    };
  }, [allSessions]);

  // Memoize streak calculation
  const streak = useMemo(() => {
    if (!allSessions || allSessions.length === 0) return 0;

    const workSessions = allSessions.filter(s => s.type === 'work' && !s.abandoned);
    const uniqueDates = [...new Set(workSessions.map(s => s.date))].sort().reverse();

    let currentStreak = 0;
    const today = getTodayDate();
    const checkDate = new Date(today);

    for (let i = 0; i < uniqueDates.length; i++) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

      if (uniqueDates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0 && dateStr === today) {
        // Today hasn't been completed yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return currentStreak;
  }, [allSessions]);

  const maxCount = useMemo(() =>
    Math.max(...weekData.map((d) => d.completed + d.abandoned), 1),
    [weekData]
  );

  const hasData = allTimeMetrics.attempted > 0;

  return (
    <div className="flex flex-col h-screen bg-black text-white lg:ml-64">
      {/* Header */}
      <div className="safe-top px-6 lg:px-12 pt-8 lg:pt-12 pb-6">
        <h1 className="text-4xl lg:text-5xl font-extralight mb-3">Stats</h1>
        <p className="text-sm lg:text-base opacity-40">Your productivity insights</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-8 px-6 lg:px-12">
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
          <div className="max-w-7xl">
            {/* Today's stats */}
            <div className="mb-12">
              <h2 className="text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-6">Today</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <div className="text-5xl font-extralight mb-3">{todayMetrics.completed}</div>
                  <div className="text-sm opacity-40">Completed</div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <div className="text-5xl font-extralight mb-3">{todayMetrics.focusTime}</div>
                  <div className="text-sm opacity-40">Minutes</div>
                </div>
                {todayMetrics.abandoned > 0 && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                    <div className="text-5xl font-extralight mb-3 opacity-60">{todayMetrics.abandoned}</div>
                    <div className="text-sm opacity-40">Abandoned</div>
                  </div>
                )}
                {allTimeMetrics.attempted > 5 && (
                  <div className="hidden lg:block bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                    <div className="text-5xl font-extralight mb-3">{allTimeMetrics.completionRate}%</div>
                    <div className="text-sm opacity-40">Success Rate</div>
                  </div>
                )}
              </div>
            </div>

            {/* Completion Rate - Mobile */}
            {allTimeMetrics.attempted > 5 && (
              <div className="mb-12 lg:hidden">
                <h2 className="text-xs opacity-40 uppercase tracking-wider mb-6">Completion Rate</h2>
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-end gap-4 mb-4">
                    <div className="text-6xl font-extralight">{allTimeMetrics.completionRate}%</div>
                    <div className="pb-2 opacity-40 text-sm">
                      {allTimeMetrics.completed} of {allTimeMetrics.attempted}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${allTimeMetrics.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Week chart and Streak Grid */}
            <div className="mb-12 lg:grid lg:grid-cols-2 lg:gap-6">
              <div>
              <h2 className="text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-6 lg:mb-6">Last 7 Days</h2>
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <div className="flex items-end justify-between h-48 gap-2">
                  {weekData.map((day) => {
                    const total = day.completed + day.abandoned;
                    const completedHeight = maxCount > 0 ? (day.completed / maxCount) * 100 : 0;
                    const abandonedHeight = maxCount > 0 ? (day.abandoned / maxCount) * 100 : 0;
                    const date = new Date(day.date);
                    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1);
                    const isToday = day.date === todayDate;

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <div className="w-full flex flex-col items-center justify-end flex-1 mb-3 relative">
                          {total > 0 && (
                            <div className="text-xs opacity-0 group-hover:opacity-60 transition-opacity duration-200 mb-2 absolute -top-6">
                              {day.completed}{day.abandoned > 0 && ` +${day.abandoned}`}
                            </div>
                          )}
                          <div className="w-full flex flex-col-reverse gap-[2px]">
                            {/* Completed sessions */}
                            {day.completed > 0 && (
                              <div
                                className={`w-full rounded-t-md transition-all duration-300 ${
                                  isToday ? 'bg-white' : 'bg-white/70'
                                } hover:bg-white`}
                                style={{
                                  height: `${completedHeight}%`,
                                  minHeight: '8px',
                                }}
                              />
                            )}
                            {/* Abandoned sessions */}
                            {day.abandoned > 0 && (
                              <div
                                className="w-full bg-white/20 rounded-t-md transition-all duration-300 hover:bg-white/30"
                                style={{
                                  height: `${abandonedHeight}%`,
                                  minHeight: '4px',
                                }}
                              />
                            )}
                          </div>
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
                <div className="flex items-center justify-center gap-6 mt-6 text-xs opacity-40">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-sm" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/20 rounded-sm" />
                    <span>Abandoned</span>
                  </div>
                </div>
              </div>
              </div>

              {/* Streak - Desktop in grid, Mobile below chart */}
              {streak > 0 && (
                <div className="mt-12 lg:mt-0">
                  <h2 className="text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-6">Current Streak</h2>
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 lg:p-8 flex flex-col justify-center h-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-5xl lg:text-6xl font-extralight mb-2">{streak}</div>
                        <div className="text-sm lg:text-base opacity-40">Day{streak !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-6xl lg:text-7xl opacity-10">🔥</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* All-time stats */}
            <div className="mb-8">
              <h2 className="text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-6">All Time</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-40 mb-2">Total Completed</div>
                    <div className="text-3xl font-extralight">{allTimeMetrics.completed}</div>
                  </div>
                  <div className="text-4xl opacity-10">✓</div>
                </div>
                {allTimeMetrics.abandoned > 0 && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-40 mb-2">Total Abandoned</div>
                      <div className="text-3xl font-extralight opacity-60">{allTimeMetrics.abandoned}</div>
                    </div>
                    <div className="text-4xl opacity-10">⊗</div>
                  </div>
                )}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-40 mb-2">Total Focus Time</div>
                    <div className="text-3xl font-extralight">
                      {Math.floor(allTimeMetrics.focusTime / 60)}h {allTimeMetrics.focusTime % 60}m
                    </div>
                  </div>
                  <div className="text-4xl opacity-10">⏱️</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
