import Dexie, { type EntityTable } from 'dexie';

export interface Task {
  id?: number;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface PomodoroSession {
  id?: number;
  type: 'work' | 'short-break' | 'long-break';
  duration: number;
  completedAt: number;
  date: string; // YYYY-MM-DD format for grouping
}

export interface Settings {
  id?: number;
  soundEnabled: boolean;
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
}

const db = new Dexie('KuroDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  sessions: EntityTable<PomodoroSession, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

db.version(1).stores({
  tasks: '++id, completed, createdAt',
  sessions: '++id, date, completedAt, type',
  settings: '++id',
});

export { db };
