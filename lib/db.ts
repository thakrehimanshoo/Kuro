import Dexie, { type EntityTable } from 'dexie';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id?: number;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  createdAt: number;
  completedAt?: number;
  dueDate?: number; // Timestamp
  tags?: string[];
  description?: string;
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

export interface Notebook {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
}

export interface Note {
  id?: number;
  notebookId: number;
  title: string;
  content: string; // HTML content from editor
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number; // For trash functionality
}

export interface Tag {
  id?: number;
  name: string;
  color?: string;
  usageCount: number;
  createdAt: number;
}

export interface Template {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
  content: string; // HTML template content
  isSystem: boolean; // Built-in vs user-created
  createdAt: number;
}

export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  startDate: number; // Timestamp
  endDate: number; // Timestamp
  allDay: boolean;
  type: 'task' | 'session' | 'note' | 'custom'; // Link to different entities
  linkedId?: number; // ID of linked task/session/note
  color?: string;
  createdAt: number;
  updatedAt: number;
}

const db = new Dexie('KuroDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  sessions: EntityTable<PomodoroSession, 'id'>;
  settings: EntityTable<Settings, 'id'>;
  notebooks: EntityTable<Notebook, 'id'>;
  notes: EntityTable<Note, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  templates: EntityTable<Template, 'id'>;
  calendar: EntityTable<CalendarEvent, 'id'>;
};

// Version 1: Initial schema
db.version(1).stores({
  tasks: '++id, completed, createdAt, priority',
  sessions: '++id, date, completedAt, type, taskId, abandoned',
  settings: '++id',
});

// Version 2: Add journal entries (deprecated)
db.version(2).stores({
  tasks: '++id, completed, createdAt, priority',
  sessions: '++id, date, completedAt, type, taskId, abandoned',
  settings: '++id',
  journal: '++id, date, createdAt, updatedAt',
});

// Version 3: Replace journal with full notes system
db.version(3).stores({
  tasks: '++id, completed, createdAt, priority',
  sessions: '++id, date, completedAt, type, taskId, abandoned',
  settings: '++id',
  notebooks: '++id, name, isDefault, createdAt, updatedAt',
  notes: '++id, notebookId, title, *tags, isPinned, isFavorite, isArchived, createdAt, updatedAt, deletedAt',
  tags: '++id, name, usageCount, createdAt',
  templates: '++id, name, isSystem, createdAt',
}).upgrade(async (tx) => {
  // Migrate journal entries to notes in default notebook
  const oldJournal = await tx.table('journal').toArray();

  if (oldJournal && oldJournal.length > 0) {
    // Create default notebook
    const defaultNotebookId = await tx.table('notebooks').add({
      name: 'Journal',
      description: 'Migrated from journal entries',
      icon: '📔',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Migrate all journal entries to notes
    for (const entry of oldJournal) {
      await tx.table('notes').add({
        notebookId: defaultNotebookId,
        title: entry.title || 'Untitled',
        content: entry.content || '',
        tags: entry.tags || [],
        isPinned: false,
        isFavorite: false,
        isArchived: false,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }
  }
});

// Version 4: Add calendar and enhance tasks
db.version(4).stores({
  tasks: '++id, completed, createdAt, priority, dueDate, *tags',
  sessions: '++id, date, completedAt, type, taskId, abandoned',
  settings: '++id',
  notebooks: '++id, name, isDefault, createdAt, updatedAt',
  notes: '++id, notebookId, title, *tags, isPinned, isFavorite, isArchived, createdAt, updatedAt, deletedAt',
  tags: '++id, name, usageCount, createdAt',
  templates: '++id, name, isSystem, createdAt',
  calendar: '++id, type, linkedId, startDate, endDate, allDay, createdAt, updatedAt',
}).upgrade(async (tx) => {
  // Auto-create calendar events for existing tasks with due dates
  const existingTasks = await tx.table('tasks').toArray();

  for (const task of existingTasks) {
    // Initialize new fields for existing tasks
    if (!task.tags) {
      await tx.table('tasks').update(task.id, { tags: [] });
    }
  }

  // Auto-create calendar events for existing sessions
  const existingSessions = await tx.table('sessions').toArray();

  for (const session of existingSessions) {
    if (session.type === 'work' && !session.abandoned) {
      await tx.table('calendar').add({
        title: session.taskId ? `Pomodoro Session` : 'Focus Session',
        startDate: session.completedAt - (session.duration * 60 * 1000),
        endDate: session.completedAt,
        allDay: false,
        type: 'session',
        linkedId: session.id,
        color: '#ffffff',
        createdAt: session.completedAt,
        updatedAt: session.completedAt,
      });
    }
  }
});

export { db };
