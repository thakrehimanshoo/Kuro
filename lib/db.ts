import Dexie, { type EntityTable } from 'dexie';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id?: number;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  createdAt: number;
  completedAt?: number;
}

export interface PomodoroSession {
  id?: number;
  type: 'work' | 'short-break' | 'long-break';
  duration: number;
  completedAt: number;
  date: string; // YYYY-MM-DD format for grouping
  taskId?: number; // Link to task
  abandoned: boolean; // Track if session was abandoned
}

export interface Settings {
  id?: number;
  soundEnabled: boolean;
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface JournalEntry {
  id?: number;
  title: string;
  content: string; // HTML content from editor
  date: string; // YYYY-MM-DD format
  mood?: string; // Optional mood emoji
  tags?: string[]; // Optional tags
  createdAt: number;
  updatedAt: number;
}

const db = new Dexie('KuroDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  sessions: EntityTable<PomodoroSession, 'id'>;
  settings: EntityTable<Settings, 'id'>;
  journal: EntityTable<JournalEntry, 'id'>;
};

// Version 1: Initial schema
db.version(1).stores({
  tasks: '++id, completed, createdAt, priority',
  sessions: '++id, date, completedAt, type, taskId, abandoned',
  settings: '++id',
});

// Version 2: Add journal entries
db.version(2).stores({
  tasks: '++id, completed, createdAt, priority',
  sessions: '++id, date, completedAt, type, taskId, abandoned',
  settings: '++id',
  journal: '++id, date, createdAt, updatedAt',
});

export { db };
