import { Note } from './db';
import type Dexie from 'dexie';

// Parse wiki-style links [[note-name]] from content
export function parseWikiLinks(content: string): string[] {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = wikiLinkRegex.exec(content)) !== null) {
    links.push(match[1].trim());
  }

  return [...new Set(links)]; // Remove duplicates
}

// Find backlinks - notes that link to a specific note title
export async function findBacklinks(noteTitle: string, db: Dexie): Promise<Note[]> {
  const allNotes = await db.table('notes').toArray();
  const backlinks: Note[] = [];

  for (const note of allNotes) {
    const links = parseWikiLinks(note.content);
    if (links.some((link) => link.toLowerCase() === noteTitle.toLowerCase())) {
      backlinks.push(note);
    }
  }

  return backlinks;
}

// Convert wiki links to HTML links
export function renderWikiLinks(content: string): string {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  return content.replace(wikiLinkRegex, (_match, linkText) => {
    return `<a href="/notes?link=${encodeURIComponent(linkText)}" class="wiki-link" data-link="${linkText}">${linkText}</a>`;
  });
}

// Find note by title (fuzzy search)
export async function findNoteByTitle(title: string, db: Dexie): Promise<Note | null> {
  const notes = await db.table('notes').toArray();
  const normalizedTitle = title.toLowerCase().trim();

  // Exact match
  let match = notes.find((n: Note) => n.title.toLowerCase() === normalizedTitle);
  if (match) return match;

  // Partial match
  match = notes.find((n: Note) => n.title.toLowerCase().includes(normalizedTitle));
  return match || null;
}
