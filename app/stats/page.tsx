'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getTodayDate, getWeekDates } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export default function StatsPage() {
  const todayDate = getTodayDate();

  const todaySessions = useLiveQuery(
    () => db.sessions.where('date').equals(todayDate).toArray(),
    [todayDate]
  );

  const allSessions = useLiveQuery(() => db.sessions.toArray());
  const allTasks = useLiveQuery(() => db.tasks.toArray());

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

  // Month heatmap
  const monthHeatmap = useMemo(() => {
    if (!allSessions) return [];

    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const sessions = allSessions.filter(
        (s) => s.date === dateStr && s.type === 'work' && !s.abandoned
      );

      return {
        date: dateStr,
        day: day.getDate(),
        dayOfWeek: day.getDay(),
        count: sessions.length,
        duration: sessions.reduce((sum, s) => sum + s.duration, 0),
      };
    });
  }, [allSessions]);

  // Time of day analysis
  const timeOfDayData = useMemo(() => {
    if (!allSessions) return [];

    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map((hour) => {
      const sessionsInHour = allSessions.filter((s) => {
        if (s.type !== 'work' || s.abandoned) return false;

        const sessionDate = new Date(s.completedAt);
        return sessionDate.getHours() === hour;
      });

      return {
        hour,
        count: sessionsInHour.length,
        label: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
      };
    });
  }, [allSessions]);

  const peakHour = useMemo(() => {
    const maxCount = Math.max(...timeOfDayData.map((d) => d.count), 0);
    return timeOfDayData.find((d) => d.count === maxCount);
  }, [timeOfDayData]);

  // Task completion stats
  const taskStats = useMemo(() => {
    if (!allTasks) return { completed: 0, pending: 0, overdue: 0, completionRate: 0 };

    const completed = allTasks.filter((t) => t.completed).length;
    const pending = allTasks.filter((t) => !t.completed).length;
    const overdue = allTasks.filter((t) => !t.completed && t.dueDate && t.dueDate < Date.now()).length;
    const total = allTasks.length;

    return {
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [allTasks]);

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

    const workSessions = allSessions.filter((s) => s.type === 'work' && !s.abandoned);
    const uniqueDates = [...new Set(workSessions.map((s) => s.date))].sort().reverse();

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

  const maxHeatmapCount = useMemo(() =>
    Math.max(...monthHeatmap.map((d) => d.count), 1),
    [monthHeatmap]
  );

  const hasData = allTimeMetrics.attempted > 0;

  const getHeatmapOpacity = (count: number) => {
    if (count === 0) return 0.05;
    return 0.3 + (count / maxHeatmapCount) * 0.7;
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white lg:ml-64">
      {/* Header */}
      <div className="safe-top px-4 xs:px-6 lg:px-12 pt-6 xs:pt-8 lg:pt-12 pb-4 xs:pb-6">
        <h1 className="text-3xl xs:text-4xl lg:text-5xl font-extralight mb-2 xs:mb-3">Stats</h1>
        <p className="text-xs xs:text-sm lg:text-base opacity-40">Your productivity insights</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 lg:pb-8 px-4 xs:px-6 lg:px-12">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 xs:w-20 xs:h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-4 xs:mb-6">
              <svg className="w-8 h-8 xs:w-10 xs:h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm opacity-40 text-center mb-2">No data yet</p>
            <p className="text-xs opacity-30 text-center max-w-xs">
              Complete your first focus session to start tracking your progress
            </p>
          </div>
        ) : (
          <div className="max-w-7xl space-y-8 xs:space-y-10 lg:space-y-12">
            {/* Today's Overview */}
            <div>
              <h2 className="text-[11px] xs:text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-4 xs:mb-6">Today&apos;s Progress</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl xs:rounded-2xl p-4 xs:p-6">
                  <div className="text-3xl xs:text-4xl lg:text-5xl font-extralight mb-1.5 xs:mb-3">{todayMetrics.completed}</div>
                  <div className="text-xs xs:text-sm opacity-60">Sessions</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl xs:rounded-2xl p-4 xs:p-6">
                  <div className="text-3xl xs:text-4xl lg:text-5xl font-extralight mb-1.5 xs:mb-3">{todayMetrics.focusTime}</div>
                  <div className="text-xs xs:text-sm opacity-60">Minutes</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl xs:rounded-2xl p-4 xs:p-6">
                  <div className="text-3xl xs:text-4xl lg:text-5xl font-extralight mb-1.5 xs:mb-3">{streak}</div>
                  <div className="text-xs xs:text-sm opacity-60">Day Streak</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-xl xs:rounded-2xl p-4 xs:p-6">
                  <div className="text-3xl xs:text-4xl lg:text-5xl font-extralight mb-1.5 xs:mb-3">{taskStats.completionRate}%</div>
                  <div className="text-xs xs:text-sm opacity-60">Tasks Done</div>
                </div>
              </div>
            </div>

            {/* Week Chart and Task Stats */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-8 xs:space-y-10 lg:space-y-0">
              {/* Week Chart */}
              <div>
                <h2 className="text-[11px] xs:text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-4 xs:mb-6">Last 7 Days</h2>
                <div className="bg-white/[0.02] border border-white/10 rounded-xl xs:rounded-2xl p-4 xs:p-6">
                  <div className="flex items-end justify-between h-36 xs:h-48 gap-1.5 xs:gap-2">
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

              {/* Task Stats */}
              <div>
                <h2 className="text-[11px] xs:text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-4 xs:mb-6">Task Overview</h2>
                <div className="bg-white/[0.02] border border-white/10 rounded-xl xs:rounded-2xl p-4 xs:p-6 min-h-[240px] xs:h-[280px] flex flex-col justify-center">
                  <div className="space-y-3 xs:space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5 xs:mb-2">
                        <span className="text-xs xs:text-sm opacity-60">Completed</span>
                        <span className="text-xl xs:text-2xl font-extralight">{taskStats.completed}</span>
                      </div>
                      <div className="h-1.5 xs:h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${taskStats.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5 xs:mb-2">
                        <span className="text-xs xs:text-sm opacity-60">Pending</span>
                        <span className="text-xl xs:text-2xl font-extralight">{taskStats.pending}</span>
                      </div>
                      <div className="h-1.5 xs:h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 transition-all duration-500"
                          style={{
                            width: `${taskStats.pending > 0 ? (taskStats.pending / (taskStats.completed + taskStats.pending)) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    {taskStats.overdue > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5 xs:mb-2">
                          <span className="text-xs xs:text-sm opacity-60">Overdue</span>
                          <span className="text-xl xs:text-2xl font-extralight text-red-400">{taskStats.overdue}</span>
                        </div>
                        <div className="h-1.5 xs:h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 transition-all duration-500"
                            style={{
                              width: `${(taskStats.overdue / taskStats.pending) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Month Heatmap */}
            <div>
              <h2 className="text-[11px] xs:text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-4 xs:mb-6">This Month</h2>
              <div className="bg-white/[0.02] border border-white/10 rounded-xl xs:rounded-2xl p-3 xs:p-6">
                <div className="grid grid-cols-7 gap-1 xs:gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-[10px] xs:text-xs opacity-40 mb-1 xs:mb-2">
                      {day}
                    </div>
                  ))}

                  {/* Empty cells for first week */}
                  {monthHeatmap.length > 0 &&
                    Array.from({ length: monthHeatmap[0].dayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                  {monthHeatmap.map((day) => (
                    <div
                      key={day.date}
                      className="aspect-square rounded-md xs:rounded-lg border border-white/10 flex items-center justify-center text-[10px] xs:text-xs group relative transition-all duration-200 hover:border-white/30"
                      style={{
                        backgroundColor: `rgba(255, 255, 255, ${getHeatmapOpacity(day.count)})`,
                      }}
                    >
                      <span className={day.count > 0 ? 'text-black font-medium' : 'opacity-60'}>
                        {day.day}
                      </span>
                      {day.count > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-white/20 rounded px-2 py-1 text-[10px] xs:text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {day.count} session{day.count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Productivity by Time */}
            {peakHour && peakHour.count > 0 && (
              <div>
                <h2 className="text-[11px] xs:text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-4 xs:mb-6">
                  Productivity by Time
                </h2>
                <div className="bg-white/[0.02] border border-white/10 rounded-xl xs:rounded-2xl p-4 xs:p-6">
                  <div className="flex items-center justify-between mb-4 xs:mb-6">
                    <div>
                      <div className="text-xs xs:text-sm opacity-60 mb-1">Peak Hour</div>
                      <div className="text-2xl xs:text-3xl font-extralight">{peakHour.label}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs xs:text-sm opacity-60 mb-1">Sessions</div>
                      <div className="text-2xl xs:text-3xl font-extralight">{peakHour.count}</div>
                    </div>
                  </div>
                  <div className="h-24 xs:h-32 flex items-end gap-0.5 xs:gap-1">
                    {timeOfDayData.map((hour) => {
                      const maxHourCount = Math.max(...timeOfDayData.map((d) => d.count), 1);
                      const height = (hour.count / maxHourCount) * 100;

                      if (hour.count === 0) return <div key={hour.hour} className="flex-1" />;

                      return (
                        <div
                          key={hour.hour}
                          className="flex-1 bg-white/20 rounded-t hover:bg-white/40 transition-all relative group"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-white/20 rounded px-2 py-1 text-[10px] xs:text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {hour.label}: {hour.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-3 xs:mt-4 text-[10px] xs:text-xs opacity-40">
                    <span>12 AM</span>
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>11 PM</span>
                  </div>
                </div>
              </div>
            )}

            {/* All-time stats */}
            <div>
              <h2 className="text-[11px] xs:text-xs lg:text-sm opacity-40 uppercase tracking-wider mb-4 xs:mb-6">All Time</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 lg:gap-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-xl xs:rounded-2xl p-4 xs:p-6 flex items-center justify-between">
                  <div>
                    <div className="text-xs xs:text-sm opacity-40 mb-1.5 xs:mb-2">Total Sessions</div>
                    <div className="text-2xl xs:text-3xl font-extralight">{allTimeMetrics.completed}</div>
                  </div>
                  <div className="text-3xl xs:text-4xl opacity-10">✓</div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-xl xs:rounded-2xl p-4 xs:p-6 flex items-center justify-between">
                  <div>
                    <div className="text-xs xs:text-sm opacity-40 mb-1.5 xs:mb-2">Success Rate</div>
                    <div className="text-2xl xs:text-3xl font-extralight">{allTimeMetrics.completionRate}%</div>
                  </div>
                  <div className="text-3xl xs:text-4xl opacity-10">📈</div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-xl xs:rounded-2xl p-4 xs:p-6 flex items-center justify-between sm:col-span-2 lg:col-span-1">
                  <div>
                    <div className="text-xs xs:text-sm opacity-40 mb-1.5 xs:mb-2">Total Focus Time</div>
                    <div className="text-2xl xs:text-3xl font-extralight">
                      {Math.floor(allTimeMetrics.focusTime / 60)}h {allTimeMetrics.focusTime % 60}m
                    </div>
                  </div>
                  <div className="text-3xl xs:text-4xl opacity-10">⏱️</div>
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
