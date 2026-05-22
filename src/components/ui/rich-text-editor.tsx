
import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Palette } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { sanitizeRichTextHtml, sanitizeRichTextUrl } from '@/lib/htmlSanitizer';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = '',
  maxLength,
  className = ''
}) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        validate: (href) => Boolean(sanitizeRichTextUrl(href)),
        HTMLAttributes: {
          class: 'text-[#75E0A7] underline hover:text-[#6BC995]',
        },
      }),
    ],
    content: sanitizeRichTextHtml(content),
    onUpdate: ({ editor }) => {
      const html = sanitizeRichTextHtml(editor.getHTML());
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[120px] p-3',
      },
      transformPastedHTML: (html) => sanitizeRichTextHtml(html),
    },
  });

  const setLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const safeUrl = sanitizeRichTextUrl(url);
    if (!safeUrl) return;

    editor.chain().focus().extendMarkRange('link').setLink({ href: safeUrl }).run();
  };

  const setColor = (color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
    setColorPickerOpen(false);
  };

  const predefinedColors = [
    '#F7F7F7', // White
    '#75E0A7', // Green
    '#94979C', // Gray
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#DDA0DD', // Purple
    '#FFD700', // Gold
    '#98FB98', // Light Green
  ];

  if (!editor) return null;

  const currentLength = editor.getText().length;
  const remainingChars = maxLength ? maxLength - currentLength : null;
  const currentColor = editor.getAttributes('textStyle').color || '#F7F7F7';

  return (
    <div className={`border border-[#373A41] rounded-lg bg-[#0C0E12] ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-[#373A41]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${
            editor.isActive('bold') ? 'bg-[#373A41] text-[#75E0A7]' : 'text-[#94979C] hover:text-[#CECFD2]'
          }`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${
            editor.isActive('italic') ? 'bg-[#373A41] text-[#75E0A7]' : 'text-[#94979C] hover:text-[#CECFD2]'
          }`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${
            editor.isActive('bulletList') ? 'bg-[#373A41] text-[#75E0A7]' : 'text-[#94979C] hover:text-[#CECFD2]'
          }`}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${
            editor.isActive('orderedList') ? 'bg-[#373A41] text-[#75E0A7]' : 'text-[#94979C] hover:text-[#CECFD2]'
          }`}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={`h-8 w-8 p-0 ${
            editor.isActive('link') ? 'bg-[#373A41] text-[#75E0A7]' : 'text-[#94979C] hover:text-[#CECFD2]'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        {/* Color Picker */}
        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[#94979C] hover:text-[#CECFD2] relative"
            >
              <Palette className="h-4 w-4" />
              <div 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-1 rounded-sm"
                style={{ backgroundColor: currentColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3 bg-[#0C0E12] border border-[#373A41]" align="start">
            <div className="grid grid-cols-5 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setColor(color)}
                  className="w-8 h-8 rounded border border-[#373A41] hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-[#373A41]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorPickerOpen(false);
                }}
                className="w-full text-xs text-[#94979C] hover:text-[#CECFD2]"
              >
                Remove Color
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Editor */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="text-[#F7F7F7] text-base leading-6"
        />
        {editor.isEmpty && (
          <div className="absolute top-3 left-3 text-[#94979C] pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
      
      {/* Character count */}
      {remainingChars !== null && (
        <div className="px-3 py-2 text-sm text-[#94979C] border-t border-[#373A41]">
          {remainingChars} characters left
        </div>
      )}
    </div>
  );
};
