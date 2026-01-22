'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect } from 'react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function Editor({ content, onChange, placeholder = 'Start writing...' }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] lg:min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-wrapper">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 lg:gap-2 p-3 lg:p-4 border-b border-white/10 bg-white/[0.02] sticky top-0 z-10">
        {/* Text formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('bold') ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Bold (⌘B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('italic') ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Italic (⌘I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('underline') ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Underline (⌘U)"
        >
          <u>U</u>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('strike') ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Heading 3"
        >
          H3
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('bulletList') ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Bullet List"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('orderedList') ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Numbered List"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('taskList') ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Task List"
        >
          ☑
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Quotes & Code */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('blockquote') ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Quote"
        >
          &quot;
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            editor.isActive('codeBlock') ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Code Block"
        >
          &lt;/&gt;
        </button>
      </div>

      {/* Editor Content */}
      <div className="p-6 lg:p-8">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror {
          color: white;
        }

        .ProseMirror > * + * {
          margin-top: 0.75em;
        }

        .ProseMirror h1 {
          font-size: 2em;
          font-weight: 300;
          line-height: 1.2;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }

        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 300;
          line-height: 1.3;
          margin-top: 0.8em;
          margin-bottom: 0.4em;
        }

        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: 400;
          line-height: 1.4;
          margin-top: 0.6em;
          margin-bottom: 0.3em;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255, 255, 255, 0.3);
          pointer-events: none;
          height: 0;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
        }

        .ProseMirror ul {
          list-style-type: disc;
        }

        .ProseMirror ol {
          list-style-type: decimal;
        }

        .ProseMirror ul[data-type='taskList'] {
          list-style: none;
          padding-left: 0;
        }

        .ProseMirror ul[data-type='taskList'] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
        }

        .ProseMirror ul[data-type='taskList'] li > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
        }

        .ProseMirror ul[data-type='taskList'] li > div {
          flex: 1 1 auto;
        }

        .ProseMirror ul[data-type='taskList'] input[type='checkbox'] {
          cursor: pointer;
          width: 1.2em;
          height: 1.2em;
          margin-top: 0.2em;
        }

        .ProseMirror blockquote {
          border-left: 3px solid rgba(255, 255, 255, 0.2);
          padding-left: 1em;
          margin-left: 0;
          opacity: 0.7;
          font-style: italic;
        }

        .ProseMirror code {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 0.25em;
          padding: 0.2em 0.4em;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .ProseMirror pre {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 0.5em;
          padding: 1em;
          overflow-x: auto;
        }

        .ProseMirror pre code {
          background: none;
          padding: 0;
          font-size: 0.875em;
          color: inherit;
        }

        .ProseMirror strong {
          font-weight: 600;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror u {
          text-decoration: underline;
        }

        .ProseMirror s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
