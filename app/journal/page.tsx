'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getTodayDate } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';
import Editor from '@/components/Editor';

const MOOD_EMOJIS = ['😊', '😔', '😌', '😤', '😴', '🤔', '😍', '😎'];

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showEntryList, setShowEntryList] = useState(false);

  // Get current entry for selected date
  const currentEntry = useLiveQuery(
    () => db.journal.where('date').equals(selectedDate).first(),
    [selectedDate]
  );

  // Get all journal entries for the sidebar
  const allEntries = useLiveQuery(() =>
    db.journal.orderBy('date').reverse().toArray()
  );

  // Load entry when date changes or entry is loaded
  useEffect(() => {
    if (currentEntry) {
      setTitle(currentEntry.title);
      setContent(currentEntry.content);
      setMood(currentEntry.mood || '');
    } else {
      setTitle('');
      setContent('');
      setMood('');
    }
  }, [currentEntry, selectedDate]);

  const saveEntry = useCallback(async () => {
    if (!title.trim() && !content.trim()) return;

    setIsSaving(true);
    try {
      if (currentEntry?.id) {
        await db.journal.update(currentEntry.id, {
          title: title || 'Untitled',
          content,
          mood,
          updatedAt: Date.now(),
        });
      } else {
        await db.journal.add({
          title: title || 'Untitled',
          content,
          date: selectedDate,
          mood,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [title, content, mood, selectedDate, currentEntry?.id]);

  // Auto-save functionality
  useEffect(() => {
    const saveTimeout = setTimeout(async () => {
      if (title.trim() || content.trim()) {
        await saveEntry();
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [title, content, mood, saveEntry]);

  const deleteEntry = async () => {
    if (currentEntry?.id && confirm('Are you sure you want to delete this entry?')) {
      await db.journal.delete(currentEntry.id);
      setTitle('');
      setContent('');
      setMood('');
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date(getTodayDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === getTodayDate()) {
      return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div className="flex h-screen bg-black text-white lg:ml-64">
      {/* Desktop Sidebar - Entry List */}
      <div className="hidden lg:flex flex-col w-80 border-r border-white/10 bg-white/[0.02]">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-extralight mb-2">Journal</h2>
          <p className="text-xs opacity-40">Your daily reflections</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* New Entry Button */}
          <div className="p-4">
            <button
              onClick={() => setSelectedDate(getTodayDate())}
              className="w-full px-4 py-3 bg-white text-black rounded-xl font-medium text-sm transition-all duration-150 hover:scale-105 active:scale-95"
            >
              + New Entry
            </button>
          </div>

          {/* Entry List */}
          <div className="px-4 pb-4 space-y-2">
            {allEntries?.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedDate(entry.date)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-150 ${
                  entry.date === selectedDate
                    ? 'bg-white/10'
                    : 'bg-white/[0.02] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {entry.title}
                  </span>
                  {entry.mood && <span className="text-lg">{entry.mood}</span>}
                </div>
                <div className="text-xs opacity-40">
                  {formatDisplayDate(entry.date)}
                </div>
              </button>
            ))}

            {(!allEntries || allEntries.length === 0) && (
              <div className="text-center py-8 px-4">
                <p className="text-sm opacity-40">No entries yet</p>
                <p className="text-xs opacity-30 mt-2">
                  Start writing to create your first entry
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Entry List Overlay */}
      {showEntryList && (
        <div className="lg:hidden fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-2xl font-extralight">All Entries</h2>
            <button
              onClick={() => setShowEntryList(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {allEntries?.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  setSelectedDate(entry.date);
                  setShowEntryList(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {entry.title}
                  </span>
                  {entry.mood && <span className="text-lg">{entry.mood}</span>}
                </div>
                <div className="text-xs opacity-40">
                  {formatDisplayDate(entry.date)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="safe-top px-6 lg:px-12 pt-8 lg:pt-12 pb-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="text-4xl lg:text-5xl font-extralight bg-transparent border-none outline-none w-full placeholder-white/30"
              />
              <p className="text-sm opacity-40 mt-2">
                {formatDisplayDate(selectedDate)}
              </p>
            </div>

            <button
              onClick={() => setShowEntryList(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
            >
              ☰
            </button>
          </div>

          {/* Mood Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs opacity-40 uppercase tracking-wider">Mood:</span>
            {MOOD_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setMood(mood === emoji ? '' : emoji)}
                className={`text-2xl lg:text-3xl transition-all duration-150 ${
                  mood === emoji ? 'scale-125' : 'opacity-40 hover:opacity-70 hover:scale-110'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/30"
            />

            {currentEntry && (
              <button
                onClick={deleteEntry}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-all duration-150"
              >
                Delete
              </button>
            )}

            {isSaving && (
              <span className="text-xs opacity-40">Saving...</span>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-8">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl m-6 lg:m-12 overflow-hidden">
            <Editor
              content={content}
              onChange={setContent}
              placeholder="What's on your mind today?"
            />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
