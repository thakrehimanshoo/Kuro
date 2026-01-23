'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { db, type Task, type TaskPriority } from '@/lib/db';
import { useTimerStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';

type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
type ViewType = 'list' | 'kanban';

export default function TasksPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewType, setViewType] = useState<ViewType>('list');
  const [inputValue, setInputValue] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [taskTags, setTaskTags] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const { setActiveTask } = useTimerStore();

  const allTasks = useLiveQuery(() =>
    db.tasks.orderBy('createdAt').reverse().toArray()
  );

  // Memoize filtered tasks
  const tasks = useMemo(() => {
    if (!allTasks) return [];

    let filtered = allTasks;

    if (filter === 'today') {
      filtered = allTasks.filter(task =>
        !task.completed && task.dueDate && isToday(new Date(task.dueDate))
      );
    } else if (filter === 'upcoming') {
      filtered = allTasks.filter(task =>
        !task.completed && task.dueDate && !isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
      );
    } else if (filter === 'overdue') {
      filtered = allTasks.filter(task =>
        !task.completed && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
      );
    } else if (filter === 'completed') {
      filtered = allTasks.filter(task => task.completed);
    } else {
      filtered = allTasks.filter(task => !task.completed);
    }

    return filtered;
  }, [allTasks, filter]);

  // Memoize task counts
  const taskCounts = useMemo(() => {
    if (!allTasks) return { today: 0, upcoming: 0, overdue: 0, completed: 0 };

    return {
      today: allTasks.filter(t => !t.completed && t.dueDate && isToday(new Date(t.dueDate))).length,
      upcoming: allTasks.filter(t => !t.completed && t.dueDate && !isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length,
      overdue: allTasks.filter(t => !t.completed && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length,
      completed: allTasks.filter(t => t.completed).length,
    };
  }, [allTasks]);

  // Kanban columns
  const kanbanColumns = useMemo(() => {
    if (!allTasks) return { low: [], medium: [], high: [] };

    const activeTasks = allTasks.filter(t => !t.completed);

    return {
      low: activeTasks.filter(t => t.priority === 'low'),
      medium: activeTasks.filter(t => t.priority === 'medium'),
      high: activeTasks.filter(t => t.priority === 'high'),
    };
  }, [allTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const tags = taskTags.split(',').map(t => t.trim()).filter(t => t);

      await db.tasks.add({
        title: inputValue.trim(),
        completed: false,
        priority: selectedPriority,
        createdAt: Date.now(),
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      // Auto-create calendar event if due date is set
      if (dueDate) {
        await db.calendar.add({
          title: `📋 ${inputValue.trim()}`,
          startDate: new Date(dueDate).getTime(),
          endDate: new Date(dueDate).getTime(),
          allDay: true,
          type: 'task',
          color: '#ff6b6b',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      setInputValue('');
      setSelectedPriority('medium');
      setDueDate('');
      setTaskTags('');
    }
  };

  const handleToggleTask = async (task: Task) => {
    await db.tasks.update(task.id!, {
      completed: !task.completed,
      completedAt: !task.completed ? Date.now() : undefined,
    });
  };

  const handleDeleteTask = async (id: number) => {
    // Delete associated calendar events
    const calendarEvents = await db.calendar.where('linkedId').equals(id).and(e => e.type === 'task').toArray();
    for (const event of calendarEvents) {
      if (event.id) await db.calendar.delete(event.id);
    }

    await db.tasks.delete(id);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setInputValue(task.title);
    setSelectedPriority(task.priority);
    setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
    setTaskTags(task.tags?.join(', ') || '');
    setShowTaskModal(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !inputValue.trim()) return;

    const tags = taskTags.split(',').map(t => t.trim()).filter(t => t);

    await db.tasks.update(editingTask.id!, {
      title: inputValue.trim(),
      priority: selectedPriority,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    setShowTaskModal(false);
    setEditingTask(null);
    setInputValue('');
    setSelectedPriority('medium');
    setDueDate('');
    setTaskTags('');
  };

  const handleStartPomodoro = (task: Task) => {
    if (task.id) {
      setActiveTask(task.id);
      router.push('/');
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
    }
  };

  const getDateLabel = (dueDate?: number) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);

    if (isToday(date)) return { text: 'Today', color: 'text-blue-400' };
    if (isTomorrow(date)) return { text: 'Tomorrow', color: 'text-green-400' };
    if (isPast(date)) return { text: 'Overdue', color: 'text-red-400' };
    if (isThisWeek(date)) return { text: format(date, 'EEE'), color: 'text-yellow-400' };

    return { text: format(date, 'MMM d'), color: 'text-white/60' };
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white lg:ml-64">
      {/* Header */}
      <div className="safe-top px-6 lg:px-12 pt-8 lg:pt-12 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-4xl lg:text-5xl font-extralight">Tasks</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('list')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                viewType === 'list' ? 'bg-white text-black' : 'bg-white/5 opacity-60'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewType('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                viewType === 'kanban' ? 'bg-white text-black' : 'bg-white/5 opacity-60'
              }`}
            >
              Board
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm lg:text-base flex-wrap">
          <span className="opacity-60">
            {taskCounts.today} today
          </span>
          <span className="opacity-20">•</span>
          <span className="opacity-60">
            {taskCounts.upcoming} upcoming
          </span>
          {taskCounts.overdue > 0 && (
            <>
              <span className="opacity-20">•</span>
              <span className="text-red-400">
                {taskCounts.overdue} overdue
              </span>
            </>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-white/10 px-6 lg:px-12 overflow-x-auto">
        {[
          { key: 'all', label: 'All', count: allTasks?.filter(t => !t.completed).length || 0 },
          { key: 'today', label: 'Today', count: taskCounts.today },
          { key: 'upcoming', label: 'Upcoming', count: taskCounts.upcoming },
          { key: 'overdue', label: 'Overdue', count: taskCounts.overdue },
          { key: 'completed', label: 'Done', count: taskCounts.completed },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterType)}
            className={`px-4 py-4 text-sm lg:text-base transition-all duration-150 relative whitespace-nowrap ${
              filter === key ? 'opacity-100' : 'opacity-40'
            }`}
          >
            {label} {count > 0 && `(${count})`}
            {filter === key && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Task list or Kanban */}
      <div className="flex-1 overflow-y-auto pb-64 lg:pb-8">
        {viewType === 'list' ? (
          // List View
          tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 lg:px-12">
              <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
                <CheckIcon className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm opacity-40 text-center mb-2">
                No tasks here
              </p>
            </div>
          ) : (
            <div className="px-6 lg:px-12 py-2 max-w-6xl">
              {tasks.map((task, index) => {
                const dateLabel = getDateLabel(task.dueDate);

                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 lg:gap-4 py-5 lg:py-6 border-b border-white/5 group"
                    style={{
                      animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    {/* Priority indicator */}
                    <div className={`flex-shrink-0 w-1 h-10 rounded-full ${getPriorityColor(task.priority)}`} />

                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-white/40 flex items-center justify-center transition-all duration-200 hover:border-white active:scale-90 mt-0.5"
                    >
                      {task.completed && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Task content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`block text-base mb-1 transition-all duration-200 ${
                          task.completed ? 'opacity-30 line-through' : 'opacity-100'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="opacity-30">{getPriorityLabel(task.priority)}</span>
                        {dateLabel && (
                          <>
                            <span className="opacity-20">•</span>
                            <span className={dateLabel.color}>{dateLabel.text}</span>
                          </>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <>
                            <span className="opacity-20">•</span>
                            <div className="flex gap-1">
                              {task.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-white/10 rounded text-xs">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-90"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {!task.completed && (
                        <button
                          onClick={() => handleStartPomodoro(task)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-90"
                          title="Start Pomodoro"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id!)}
                        className="w-9 h-9 flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-90"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // Kanban View
          <div className="px-6 lg:px-12 py-6 flex gap-4 overflow-x-auto min-h-full">
            {[
              { key: 'high', label: 'High Priority', tasks: kanbanColumns.high, color: 'border-red-500/30' },
              { key: 'medium', label: 'Medium Priority', tasks: kanbanColumns.medium, color: 'border-yellow-500/30' },
              { key: 'low', label: 'Low Priority', tasks: kanbanColumns.low, color: 'border-green-500/30' },
            ].map(({ key, label, tasks, color }) => (
              <div key={key} className="flex-1 min-w-[280px] max-w-[400px]">
                <div className={`bg-white/[0.02] border ${color} rounded-2xl p-4 h-full flex flex-col`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium opacity-60">{label}</h3>
                    <span className="text-xs opacity-40">{tasks.length}</span>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {tasks.map(task => {
                      const dateLabel = getDateLabel(task.dueDate);

                      return (
                        <div
                          key={task.id}
                          className="bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer"
                          onClick={() => handleEditTask(task)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-sm">{task.title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTask(task);
                              }}
                              className="flex-shrink-0 w-5 h-5 rounded border border-white/40 flex items-center justify-center hover:border-white"
                            >
                              {task.completed && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {dateLabel && (
                            <div className={`text-xs ${dateLabel.color} mb-2`}>
                              {dateLabel.text}
                            </div>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {task.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-white/10 rounded text-xs">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit task form */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-64 bg-black border-t border-white/10 safe-bottom">
        {/* Priority and date selectors */}
        <div className="px-6 lg:px-12 pt-4 pb-2">
          <div className="flex gap-2 mb-3 max-w-6xl">
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setSelectedPriority('low')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                  selectedPriority === 'low'
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-white/10 opacity-40'
                }`}
              >
                Low
              </button>
              <button
                onClick={() => setSelectedPriority('medium')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                  selectedPriority === 'medium'
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                    : 'border-white/10 opacity-40'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setSelectedPriority('high')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                  selectedPriority === 'high'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-white/10 opacity-40'
                }`}
              >
                High
              </button>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:border-white/30"
              placeholder="Due date"
            />
          </div>
        </div>

        <div className="px-6 lg:px-12 pb-4">
          <form onSubmit={handleAddTask} className="flex flex-col gap-3 max-w-6xl">
            <input
              type="text"
              value={taskTags}
              onChange={(e) => setTaskTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="bg-white/5 border border-white/10 rounded-xl px-5 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all duration-150 text-sm"
            />
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all duration-150 text-base"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-14 h-14 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-10 disabled:bg-white/5 disabled:text-white transition-all duration-150 active:scale-95 hover:scale-105 disabled:hover:scale-100 disabled:active:scale-100"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Task Modal */}
      {showTaskModal && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
          <div className="bg-black border border-white/20 rounded-2xl p-6 lg:p-8 w-full max-w-md">
            <h2 className="text-2xl font-extralight mb-6">Edit Task</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm opacity-60 mb-2">Title</label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Task title"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm opacity-60 mb-2">Priority</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPriority('low')}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                      selectedPriority === 'low'
                        ? 'border-green-500 bg-green-500/20 text-green-400'
                        : 'border-white/10 opacity-40'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    onClick={() => setSelectedPriority('medium')}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                      selectedPriority === 'medium'
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                        : 'border-white/10 opacity-40'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setSelectedPriority('high')}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                      selectedPriority === 'high'
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-white/10 opacity-40'
                    }`}
                  >
                    High
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm opacity-60 mb-2">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm opacity-60 mb-2">Tags</label>
                <input
                  type="text"
                  value={taskTags}
                  onChange={(e) => setTaskTags(e.target.value)}
                  placeholder="work, personal, urgent (comma separated)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setEditingTask(null);
                  setInputValue('');
                  setSelectedPriority('medium');
                  setDueDate('');
                  setTaskTags('');
                }}
                className="flex-1 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTask}
                disabled={!inputValue.trim()}
                className="flex-1 px-4 py-3 bg-white text-black rounded-lg hover:scale-105 transition-transform disabled:opacity-30 disabled:hover:scale-100"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
