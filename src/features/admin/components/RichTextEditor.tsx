import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Code, Eye, EyeOff } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  showPreview?: boolean;
  variables?: string[];
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  showPreview = true,
  variables = [],
  className = '',
}) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const insertVariable = (variable: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`{{${variable}}}`).run();
    setShowVariables(false);
  };

  if (!editor) {
    return <div className="card-brand p-4">Loading editor...</div>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-brand-light rounded-lg border border-gray-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-white transition-colors ${
              editor.isActive('bold') ? 'bg-white text-brand-primary' : 'text-brand-muted'
            }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-white transition-colors ${
              editor.isActive('italic') ? 'bg-white text-brand-primary' : 'text-brand-muted'
            }`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-white transition-colors ${
              editor.isActive('bulletList') ? 'bg-white text-brand-primary' : 'text-brand-muted'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-white transition-colors ${
              editor.isActive('codeBlock') ? 'bg-white text-brand-primary' : 'text-brand-muted'
            }`}
          >
            <Code className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {variables.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="px-3 py-1 text-sm text-brand-primary hover:bg-white rounded transition-colors"
              >
                Variables
              </button>
              {showVariables && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                  <div className="p-2 text-xs font-semibold text-brand-muted border-b border-gray-200">
                    Available Variables
                  </div>
                  {variables.map((variable) => (
                    <button
                      key={variable}
                      onClick={() => insertVariable(variable)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-brand-light transition-colors"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {showPreview && (
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="p-2 rounded hover:bg-white transition-colors text-brand-muted"
            >
              {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      {previewMode ? (
        <div
          className="card-brand p-4 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
        />
      ) : (
        <div className="card-brand border border-gray-200">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
};

