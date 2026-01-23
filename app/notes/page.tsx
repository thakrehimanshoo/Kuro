'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Note, Notebook } from '@/lib/db';
import { seedNotesDatabase } from '@/lib/notes-seed';
import BottomNav from '@/components/BottomNav';
import Editor from '@/components/Editor';

export default function NotesPage() {
  const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotesList, setShowNotesList] = useState(true);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Seed database on first load
  useEffect(() => {
    seedNotesDatabase();
  }, []);

  // Get all notebooks
  const notebooks = useLiveQuery(() => db.notebooks.orderBy('createdAt').toArray());

  // Get default notebook
  const defaultNotebook = useMemo(
    () => notebooks?.find((nb) => nb.isDefault),
    [notebooks]
  );

  // Set initial notebook
  useEffect(() => {
    if (!selectedNotebookId && defaultNotebook) {
      setSelectedNotebookId(defaultNotebook.id!);
    }
  }, [selectedNotebookId, defaultNotebook]);

  // Get notes for selected notebook
  const allNotes = useLiveQuery(async () => {
    if (!selectedNotebookId) return [];

    const notes = await db.notes
      .where('notebookId')
      .equals(selectedNotebookId)
      .and((note) => !note.deletedAt && !note.isArchived)
      .toArray();

    // Sort: pinned first, then by updatedAt
    return notes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [selectedNotebookId]);

  // Filter notes by search
  const filteredNotes = useMemo(() => {
    if (!allNotes) return [];
    if (!searchQuery) return allNotes;

    const query = searchQuery.toLowerCase();
    return allNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [allNotes, searchQuery]);

  // Get current note
  const currentNote = useLiveQuery(
    () => (selectedNoteId ? db.notes.get(selectedNoteId) : undefined),
    [selectedNoteId]
  );

  // Load note into editor
  useEffect(() => {
    if (currentNote) {
      setNoteTitle(currentNote.title);
      setNoteContent(currentNote.content);
      setNoteTags(currentNote.tags || []);
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteTags([]);
    }
  }, [currentNote]);

  // Auto-save
  const saveNote = useCallback(async () => {
    if (!selectedNoteId || !noteTitle.trim()) return;

    setIsSaving(true);
    try {
      await db.notes.update(selectedNoteId, {
        title: noteTitle,
        content: noteContent,
        tags: noteTags,
        updatedAt: Date.now(),
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedNoteId, noteTitle, noteContent, noteTags]);

  useEffect(() => {
    const timeout = setTimeout(saveNote, 1000);
    return () => clearTimeout(timeout);
  }, [noteTitle, noteContent, noteTags, saveNote]);

  // Create new note
  const createNote = async () => {
    if (!selectedNotebookId) return;

    const noteId = await db.notes.add({
      notebookId: selectedNotebookId,
      title: 'Untitled',
      content: '<p></p>',
      tags: [],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    setSelectedNoteId(noteId as number);
    setShowNotesList(false);
  };

  // Delete note
  const deleteNote = async (noteId: number) => {
    if (confirm('Move this note to trash?')) {
      await db.notes.update(noteId, { deletedAt: Date.now() });
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
    }
  };

  // Toggle pin
  const togglePin = async (noteId: number, isPinned: boolean) => {
    await db.notes.update(noteId, { isPinned: !isPinned });
  };

  return (
    <div className="flex h-screen bg-black text-white lg:ml-64">
      {/* Sidebar - Notebooks & Tags */}
      <div
        className={`${
          showSidebar ? 'fixed inset-0 z-50' : 'hidden'
        } lg:relative lg:flex flex-col w-full lg:w-64 bg-black lg:bg-white/[0.02] border-r border-white/10`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setShowSidebar(false)}
          className="lg:hidden absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
        >
          ✕
        </button>

        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-extralight mb-2">Notebooks</h2>
          <button
            onClick={async () => {
              const id = await db.notebooks.add({
                name: 'New Notebook',
                isDefault: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
              setSelectedNotebookId(id as number);
            }}
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
          >
            + New Notebook
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notebooks?.map((nb) => (
            <button
              key={nb.id}
              onClick={() => {
                setSelectedNotebookId(nb.id!);
                setShowSidebar(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-150 ${
                selectedNotebookId === nb.id
                  ? 'bg-white/10'
                  : 'bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{nb.icon || '📁'}</span>
                <span className="text-sm font-medium truncate">{nb.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div
        className={`${
          showNotesList ? 'flex' : 'hidden lg:flex'
        } flex-col w-full lg:w-80 bg-white/[0.02] border-r border-white/10`}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white/5"
            >
              ☰
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
            />
          </div>
          <button
            onClick={createNote}
            className="w-full px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:scale-105 transition-transform"
          >
            + New Note
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm opacity-40">No notes yet</p>
              <p className="text-xs opacity-30 mt-2">Create your first note!</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id!);
                    setShowNotesList(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 ${
                    selectedNoteId === note.id
                      ? 'bg-white/10'
                      : 'bg-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium truncate flex-1">
                      {note.title}
                    </span>
                    {note.isPinned && <span className="text-xs">📌</span>}
                  </div>
                  <div
                    className="text-xs opacity-40 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: note.content.replace(/<[^>]*>/g, ''),
                    }}
                  />
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-white/5 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className={`${showNotesList ? 'hidden lg:flex' : 'flex'} flex-1 flex-col`}>
        {selectedNoteId ? (
          <>
            <div className="p-6 lg:p-8 border-b border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setShowNotesList(true)}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white/5"
                >
                  ←
                </button>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Untitled"
                  className="flex-1 text-3xl lg:text-4xl font-extralight bg-transparent outline-none"
                />
                <button
                  onClick={() => currentNote && togglePin(currentNote.id!, currentNote.isPinned)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5"
                  title="Pin note"
                >
                  {currentNote?.isPinned ? '📌' : '📍'}
                </button>
                <button
                  onClick={() => selectedNoteId && deleteNote(selectedNoteId)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5"
                  title="Delete note"
                >
                  🗑️
                </button>
              </div>
              {isSaving && (
                <span className="text-xs opacity-40">Saving...</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <Editor content={noteContent} onChange={setNoteContent} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg opacity-60 mb-2">Select a note or create a new one</p>
              <p className="text-sm opacity-40">Your thoughts await...</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
