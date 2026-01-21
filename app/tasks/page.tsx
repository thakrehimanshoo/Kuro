'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '@/lib/db';
import BottomNav from '@/components/BottomNav';

type FilterType = 'all' | 'active' | 'completed';

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [inputValue, setInputValue] = useState('');

  const allTasks = useLiveQuery(() =>
    db.tasks.orderBy('createdAt').reverse().toArray()
  );

  const tasks = allTasks?.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  }) || [];

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      await db.tasks.add({
        title: inputValue.trim(),
        completed: false,
        createdAt: Date.now(),
      });
      setInputValue('');
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

  const activeTasks = allTasks?.filter(t => !t.completed).length || 0;

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="safe-top px-6 pt-12 pb-6 border-b border-white/10">
        <h1 className="text-3xl font-light mb-1">Tasks</h1>
        <p className="text-sm opacity-40">
          {activeTasks} {activeTasks === 1 ? 'task' : 'tasks'} remaining
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-3 text-sm transition-opacity duration-200 ${
            filter === 'all' ? 'opacity-100 border-b border-white' : 'opacity-40'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 py-3 text-sm transition-opacity duration-200 ${
            filter === 'active' ? 'opacity-100 border-b border-white' : 'opacity-40'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-3 text-sm transition-opacity duration-200 ${
            filter === 'completed' ? 'opacity-100 border-b border-white' : 'opacity-40'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto pb-20">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm opacity-40">
              {filter === 'all' && 'No tasks yet'}
              {filter === 'active' && 'No active tasks'}
              {filter === 'completed' && 'No completed tasks'}
            </p>
          </div>
        ) : (
          <div>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-6 py-4 border-b border-white/5 active:bg-white/5 transition-colors duration-200"
              >
                <button
                  onClick={() => handleToggleTask(task)}
                  className="flex-shrink-0 w-6 h-6 rounded-full border border-white/40 flex items-center justify-center transition-all duration-200"
                >
                  {task.completed && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 transition-opacity duration-200 ${
                    task.completed ? 'opacity-40 line-through' : ''
                  }`}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => handleDeleteTask(task.id!)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add task form */}
      <div className="fixed bottom-16 left-0 right-0 px-6 py-4 bg-black border-t border-white/10 safe-bottom">
        <form onSubmit={handleAddTask} className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors duration-200"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-12 h-12 rounded-lg border border-white/20 flex items-center justify-center disabled:opacity-20 transition-opacity duration-200 active:opacity-60"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
