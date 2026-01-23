import { db } from './db';

export async function seedNotesDatabase() {
  // Check if already seeded
  const notebookCount = await db.notebooks.count();
  if (notebookCount > 0) return;

  // Create default notebook
  const defaultNotebookId = await db.notebooks.add({
    name: 'Quick Notes',
    description: 'Your default notebook for quick thoughts',
    icon: '📝',
    color: '#6366f1',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Create system templates
  const templates = [
    {
      name: 'Daily Journal',
      description: 'Reflect on your day',
      icon: '📔',
      content: `<h1>Daily Journal</h1><h2>What happened today?</h2><p></p><h2>What am I grateful for?</h2><ul><li></li></ul><h2>What can I improve tomorrow?</h2><p></p>`,
      isSystem: true,
      createdAt: Date.now(),
    },
    {
      name: 'Meeting Notes',
      description: 'Capture meeting discussions',
      icon: '🤝',
      content: `<h1>Meeting Notes</h1><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ul><li></li></ul><h2>Discussion Points</h2><p></p><h2>Action Items</h2><ul data-type="taskList"><li data-checked="false"></li></ul>`,
      isSystem: true,
      createdAt: Date.now(),
    },
    {
      name: 'Project Plan',
      description: 'Organize project details',
      icon: '🎯',
      content: `<h1>Project Plan</h1><h2>Overview</h2><p></p><h2>Goals</h2><ul><li></li></ul><h2>Timeline</h2><p></p><h2>Resources Needed</h2><ul><li></li></ul><h2>Next Steps</h2><ul data-type="taskList"><li data-checked="false"></li></ul>`,
      isSystem: true,
      createdAt: Date.now(),
    },
    {
      name: 'To-Do List',
      description: 'Track tasks and todos',
      icon: '✅',
      content: `<h1>To-Do List</h1><h2>Today</h2><ul data-type="taskList"><li data-checked="false"></li></ul><h2>This Week</h2><ul data-type="taskList"><li data-checked="false"></li></ul><h2>Backlog</h2><ul data-type="taskList"><li data-checked="false"></li></ul>`,
      isSystem: true,
      createdAt: Date.now(),
    },
    {
      name: 'Weekly Review',
      description: 'Review your week',
      icon: '📊',
      content: `<h1>Weekly Review</h1><h2>Wins This Week</h2><ul><li></li></ul><h2>Challenges Faced</h2><ul><li></li></ul><h2>Lessons Learned</h2><p></p><h2>Goals for Next Week</h2><ul data-type="taskList"><li data-checked="false"></li></ul>`,
      isSystem: true,
      createdAt: Date.now(),
    },
    {
      name: 'Blank Note',
      description: 'Start from scratch',
      icon: '📄',
      content: '<p></p>',
      isSystem: true,
      createdAt: Date.now(),
    },
  ];

  await db.templates.bulkAdd(templates);

  // Create a welcome note
  if (typeof defaultNotebookId === 'number') {
    await db.notes.add({
      notebookId: defaultNotebookId,
    title: 'Welcome to Kuro Notes',
    content: `<h1>Welcome to Kuro Notes! 👋</h1><p>Your powerful, Notion-like note-taking workspace integrated with Pomodoro productivity.</p><h2>Getting Started</h2><ul><li>Create notebooks to organize your notes by project or topic</li><li>Use rich text formatting to make your notes beautiful</li><li>Add tags to easily find related notes</li><li>Pin important notes to keep them at the top</li><li>Use templates to quickly create structured notes</li></ul><h2>Features</h2><ul data-type="taskList"><li data-checked="true">Rich text editing with formatting</li><li data-checked="true">Notebooks for organization</li><li data-checked="true">Tags for categorization</li><li data-checked="true">Search across all notes</li><li data-checked="true">Templates for quick starts</li><li data-checked="true">Pin and favorite notes</li><li data-checked="true">Auto-save</li></ul><p>Start creating your first note or explore the templates! 🚀</p>`,
    tags: ['welcome', 'getting-started'],
    isPinned: true,
    isFavorite: false,
    isArchived: false,
    createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Create default tags
  const defaultTags = [
    { name: 'important', color: '#ef4444', usageCount: 0, createdAt: Date.now() },
    { name: 'ideas', color: '#8b5cf6', usageCount: 0, createdAt: Date.now() },
    { name: 'meeting', color: '#3b82f6', usageCount: 0, createdAt: Date.now() },
    { name: 'personal', color: '#10b981', usageCount: 0, createdAt: Date.now() },
    { name: 'work', color: '#f59e0b', usageCount: 0, createdAt: Date.now() },
  ];

  await db.tags.bulkAdd(defaultTags);
}
