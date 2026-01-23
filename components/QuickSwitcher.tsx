'use client';

import { useState, useEffect, useMemo } from 'react';
import { Note } from '@/lib/db';

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (noteId: number) => void;
  onCreateNote?: (title: string) => void;
}

export default function QuickSwitcher({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onCreateNote,
}: QuickSwitcherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes.slice(0, 20);

    const query = searchQuery.toLowerCase();
    return notes
      .filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query))
      )
      .slice(0, 20);
  }, [notes, searchQuery]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredNotes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredNotes.length > 0) {
          const note = filteredNotes[selectedIndex];
          if (note?.id) {
            onSelectNote(note.id);
            onClose();
          }
        } else if (searchQuery.trim() && onCreateNote) {
          onCreateNote(searchQuery.trim());
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredNotes, onClose, onSelectNote, searchQuery, onCreateNote]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
      <div className="bg-black border border-white/20 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-white/10">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search notes or create new..."
            className="w-full bg-transparent text-lg outline-none placeholder-white/30"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredNotes.length > 0 ? (
            <div>
              {filteredNotes.map((note, index) => (
                <button
                  key={note.id}
                  onClick={() => {
                    if (note.id) {
                      onSelectNote(note.id);
                      onClose();
                    }
                  }}
                  className={`w-full text-left px-6 py-3 transition-colors ${
                    index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium">{note.title}</span>
                    {note.isPinned && <span className="text-xs">📌</span>}
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-white/5 rounded opacity-60"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-6 text-center">
              <p className="text-sm opacity-40 mb-3">No notes found</p>
              {onCreateNote && (
                <button
                  onClick={() => {
                    onCreateNote(searchQuery.trim());
                    onClose();
                  }}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
                >
                  Create &quot;{searchQuery.trim()}&quot;
                </button>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-sm opacity-40">
              Start typing to search or create a note
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs opacity-40">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>{filteredNotes.length} results</span>
        </div>
      </div>
    </div>
  );
}
