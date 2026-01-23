# Kuro Notes - Functional Requirements Document

## Overview
Transform Kuro's basic journal into a full-featured Notion-like note-taking system with notebooks, rich text editing, search, and advanced organization.

## Core Features

### 1. Notebooks (Workspaces)
- **Create/Edit/Delete notebooks**
  - Name, description, color/icon
  - Default notebook for quick notes
- **Switch between notebooks**
  - Sidebar navigation
  - Recent notebooks
- **Notebook statistics**
  - Note count, last modified

### 2. Notes Management
- **Create notes**
  - Quick add button
  - Title + rich content
  - Auto-save (1s debounce)
- **Edit notes**
  - Full Tiptap editor
  - Markdown shortcuts
  - Formatting toolbar
- **Delete notes**
  - Move to trash (30-day retention)
  - Permanent delete
- **Organize notes**
  - Pin to top
  - Archive
  - Favorite/star
  - Tags (multiple per note)

### 3. Rich Text Editor (Enhanced)
- **Basic formatting**: Bold, italic, underline, strikethrough
- **Headings**: H1, H2, H3
- **Lists**: Bullet, numbered, checklist
- **Code**: Inline code, code blocks
- **Quotes**: Blockquotes
- **Links**: Insert hyperlinks
- **Tables**: Basic table support
- **Images**: Upload/embed (future)
- **Emoji picker**: Quick emoji insertion

### 4. Search & Filter
- **Full-text search**
  - Search across all notebooks
  - Search within current notebook
  - Real-time results
- **Filter by**
  - Tags
  - Created date
  - Modified date
  - Pinned/Favorited
  - Archived

### 5. Tags System
- **Create tags**
  - Auto-suggest existing tags
  - Color coding
- **Assign multiple tags per note**
- **Tag management**
  - Rename tags
  - Delete unused tags
  - Merge tags
- **Filter by tags**

### 6. Templates
- **Pre-built templates**
  - Daily Journal
  - Meeting Notes
  - Project Plan
  - To-Do List
  - Weekly Review
- **Custom templates**
  - Save notes as templates
  - Template library

### 7. Views & Organization
- **List view** (default)
  - Note title, preview, metadata
  - Sort: created, modified, title
- **Grid view**
  - Card-based layout
- **Table view**
  - Spreadsheet-style
  - Sortable columns

### 8. Sidebar Navigation
- **Quick access**
  - All notes
  - Favorites
  - Recent
  - Trash
- **Notebooks list**
  - Expandable/collapsible
  - Note count badges
- **Tags list**
  - Click to filter
  - Tag cloud

### 9. Performance Optimizations
- **Virtual scrolling** for large note lists
- **Lazy loading** editor components
- **Debounced search** (300ms)
- **Indexed database queries**
- **Memoized components**
- **Code splitting**

### 10. Mobile Responsive
- **Mobile sidebar** as drawer
- **Touch-optimized** editor toolbar
- **Swipe gestures** (future)
- **Pull to refresh** (future)

## Database Schema

### Notebooks Table
```typescript
{
  id: number
  name: string
  description?: string
  icon?: string
  color?: string
  createdAt: number
  updatedAt: number
  isDefault: boolean
}
```

### Notes Table
```typescript
{
  id: number
  notebookId: number
  title: string
  content: string (HTML)
  tags: string[]
  isPinned: boolean
  isFavorite: boolean
  isArchived: boolean
  createdAt: number
  updatedAt: number
  deletedAt?: number (trash)
}
```

### Tags Table
```typescript
{
  id: number
  name: string
  color?: string
  usageCount: number
  createdAt: number
}
```

### Templates Table
```typescript
{
  id: number
  name: string
  description?: string
  icon?: string
  content: string (HTML)
  isSystem: boolean
  createdAt: number
}
```

## UI/UX Design

### Desktop Layout
```
┌─────────────────────────────────────────────────┐
│ Sidebar (256px) │ Note List (320px) │ Editor   │
├─────────────────┼───────────────────┼──────────┤
│ - Kuro Brand    │ Search bar        │ Title    │
│ - Quick Access  │ ┌───────────────┐ │ ────────  │
│ - Notebooks     │ │ Note 1        │ │ Toolbar  │
│   • Work (12)   │ │ Preview...    │ │ Editor   │
│   • Personal    │ │ tags          │ │ Content  │
│ - Tags          │ └───────────────┘ │          │
│   #ideas        │ Note 2            │          │
│   #meeting      │ ...               │          │
└─────────────────┴───────────────────┴──────────┘
```

### Mobile Layout
```
Notes List View:
┌──────────────────┐
│ ☰ Notes      [+] │
│ ──────────────── │
│ 📝 Note Title    │
│    Preview text  │
│    #tag1         │
└──────────────────┘

Editor View:
┌──────────────────┐
│ [←] Title    [⋮] │
│ ──────────────── │
│ [B] [I] [H1]...  │
│ ──────────────── │
│ Editor content   │
│                  │
└──────────────────┘
```

## Implementation Priority

### Phase 1 (MVP) - Current Sprint
1. ✅ Database schema redesign
2. ✅ Notebooks CRUD
3. ✅ Notes CRUD with notebooks
4. ✅ Enhanced editor
5. ✅ Basic search
6. ✅ Tags system
7. ✅ Responsive layout

### Phase 2 (Enhancement)
1. Templates
2. Advanced search/filter
3. Pin/favorite/archive
4. Virtual scrolling
5. Grid/table views

### Phase 3 (Advanced)
1. Trash/restore
2. Export notes (PDF, Markdown)
3. Import from other apps
4. Keyboard shortcuts
5. Dark/light themes

## Success Criteria
- ✓ Create notebook in < 1 second
- ✓ Create note in < 1 second
- ✓ Search results in < 300ms
- ✓ Editor loads in < 500ms
- ✓ Smooth scrolling with 1000+ notes
- ✓ Works offline
- ✓ Data persists in IndexedDB
- ✓ Mobile responsive

## References
Based on research of top open-source Notion alternatives:
- AppFlowy: Local-first, powerful databases
- AFFiNE: Whiteboarding, offline-first
- Anytype: Object-based, privacy-focused
- Outline: Fast performance, markdown
- Docmost: Real-time collaboration

Sources:
- [5 Open-Source Alternatives to Notion](https://docmost.com/blog/open-source-notion-alternatives/)
- [10+ Best Open Source Notion Alternatives](https://openalternative.co/alternatives/notion)
- [AppFlowy GitHub](https://github.com/AppFlowy-IO/AppFlowy)
