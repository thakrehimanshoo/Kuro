'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { db, type Task, type TaskPriority } from '@/lib/db';
import { useTimerStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';

type FilterType = 'all' | 'active' | 'completed';

export default function TasksPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [inputValue, setInputValue] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('medium');

  const { setActiveTask } = useTimerStore();

  const allTasks = useLiveQuery(() =>
    db.tasks.orderBy('createdAt').reverse().toArray()
  );

  // Memoize filtered tasks
  const tasks = useMemo(() => {
    if (!allTasks) return [];
    if (filter === 'active') return allTasks.filter(task => !task.completed);
    if (filter === 'completed') return allTasks.filter(task => task.completed);
    return allTasks;
  }, [allTasks, filter]);

  // Memoize task counts
  const { activeTasks, completedTasks } = useMemo(() => {
    if (!allTasks) return { activeTasks: 0, completedTasks: 0 };
    return {
      activeTasks: allTasks.filter(t => !t.completed).length,
      completedTasks: allTasks.filter(t => t.completed).length,
    };
  }, [allTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      await db.tasks.add({
        title: inputValue.trim(),
        completed: false,
        priority: selectedPriority,
        createdAt: Date.now(),
      });
      setInputValue('');
      setSelectedPriority('medium');
    }
  };

  const handleToggleTask = async (task: Task) => {
    await db.tasks.update(task.id!, {
      completed: !task.completed,
      completedAt: !task.completed ? Date.now() : undefined,
    });
  };

  const handleDeleteTask = async (id: number) => {
    await db.tasks.delete(id);
  };

  const handleStartPomodoro = (task: Task) => {
    if (task.id) {
      setActiveTask(task.id);
      router.push('/');
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'opacity-100';
      case 'medium': return 'opacity-60';
      case 'low': return 'opacity-30';
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'High Priority';
      case 'medium': return 'Medium Priority';
      case 'low': return 'Low Priority';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="safe-top px-6 pt-8 pb-6">
        <h1 className="text-4xl font-extralight mb-3">Tasks</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="opacity-60">
            {activeTasks} active
          </span>
          <span className="opacity-20">•</span>
          <span className="opacity-60">
            {completedTasks} completed
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-white/10 px-6">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-4 text-sm transition-all duration-200 relative ${
            filter === 'all' ? 'opacity-100' : 'opacity-40'
          }`}
        >
          All
          {filter === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
          )}
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 py-4 text-sm transition-all duration-200 relative ${
            filter === 'active' ? 'opacity-100' : 'opacity-40'
          }`}
        >
          Active
          {filter === 'active' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
          )}
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-4 text-sm transition-all duration-200 relative ${
            filter === 'completed' ? 'opacity-100' : 'opacity-40'
          }`}
        >
          Completed
          {filter === 'completed' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
          )}
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto pb-40">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
              {filter === 'all' && <CheckIcon className="w-8 h-8 opacity-20" />}
              {filter === 'active' && <PlusIcon className="w-8 h-8 opacity-20" />}
              {filter === 'completed' && <CheckIcon className="w-8 h-8 opacity-20" />}
            </div>
            <p className="text-sm opacity-40 text-center mb-2">
              {filter === 'all' && 'No tasks yet. Add one below to get started.'}
              {filter === 'active' && 'No active tasks. Time to add some work!'}
              {filter === 'completed' && 'No completed tasks yet. Keep going!'}
            </p>
          </div>
        ) : (
          <div className="px-6 py-2">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center gap-3 py-5 border-b border-white/5 group"
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                {/* Priority indicator */}
                <div className={`flex-shrink-0 w-1 h-10 rounded-full bg-white ${getPriorityColor(task.priority)}`} />

                {/* Checkbox */}
                <button
                  onClick={() => handleToggleTask(task)}
                  className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-white/40 flex items-center justify-center transition-all duration-200 hover:border-white active:scale-90"
                >
                  {task.completed && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`block text-base transition-all duration-200 ${
                      task.completed ? 'opacity-30 line-through' : 'opacity-100'
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className="text-xs opacity-30">
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {!task.completed && (
                    <button
                      onClick={() => handleStartPomodoro(task)}
                      className="w-9 h-9 flex items-center justify-center hover:opacity-100 transition-all duration-200 active:scale-90"
                      title="Start Pomodoro"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTask(task.id!)}
                    className="w-9 h-9 flex items-center justify-center opacity-40 hover:opacity-100 transition-all duration-200 active:scale-90"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add task form */}
      <div className="fixed bottom-16 left-0 right-0 bg-black border-t border-white/10 safe-bottom">
        {/* Priority selector */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSelectedPriority('low')}
              className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                selectedPriority === 'low'
                  ? 'border-white bg-white/5'
                  : 'border-white/10 opacity-40'
              }`}
            >
              Low
            </button>
            <button
              onClick={() => setSelectedPriority('medium')}
              className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                selectedPriority === 'medium'
                  ? 'border-white bg-white/5'
                  : 'border-white/10 opacity-40'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setSelectedPriority('high')}
              className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                selectedPriority === 'high'
                  ? 'border-white bg-white/5'
                  : 'border-white/10 opacity-40'
              }`}
            >
              High
            </button>
          </div>
        </div>

        <div className="px-6 pb-4">
          <form onSubmit={handleAddTask} className="flex gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all duration-200 text-base"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-14 h-14 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-10 disabled:bg-white/5 disabled:text-white transition-all duration-200 active:scale-95 hover:scale-105 disabled:hover:scale-100 disabled:active:scale-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </form>
        </div>
      </div>

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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
