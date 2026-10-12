import React, { useEffect, useRef } from 'react';
import type { Align } from '../../types/resume';
import { sanitizeHtml } from '../../lib/format';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  align?: Align;
  onAlignChange?: (align: Align) => void;
  showAlignControls?: boolean;
  minHeight?: number;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write here...',
  align,
  onAlignChange,
  showAlignControls = false,
  minHeight = 72,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync incoming value to DOM
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const safeValue = sanitizeHtml(value || '');
      if (editorRef.current.innerHTML !== safeValue) {
        editorRef.current.innerHTML = safeValue;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const rawHtml = editorRef.current.innerHTML;
      const html = sanitizeHtml(rawHtml);
      if (rawHtml !== html) {
        editorRef.current.innerHTML = html;
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      onChange(html === '<br>' ? '' : html);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain').slice(0, 50_000);
    document.execCommand('insertText', false, text);
    handleInput();
  };

  const exec = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  return (
    <div className={`border border-line rounded-lg bg-white overflow-hidden focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-line bg-slate-50/70 text-slate-600 select-none">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}
          className="size-7 rounded hover:bg-slate-200/80 hover:text-ink flex items-center justify-center font-bold text-xs"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}
          className="size-7 rounded hover:bg-slate-200/80 hover:text-ink flex items-center justify-center italic text-xs font-serif"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}
          className="size-7 rounded hover:bg-slate-200/80 hover:text-ink flex items-center justify-center underline text-xs"
          title="Underline (Ctrl+U)"
        >
          U
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }}
          className="size-7 rounded hover:bg-slate-200/80 hover:text-ink flex items-center justify-center"
          title="Bullet List"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" x2="19" y1="6" y2="6"/><line x1="9" x2="19" y1="12" y2="12"/><line x1="9" x2="19" y1="18" y2="18"/>
            <circle cx="4" cy="6" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="4" cy="18" r="2"/>
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }}
          className="size-7 rounded hover:bg-slate-200/80 hover:text-ink flex items-center justify-center"
          title="Numbered List"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/>
            <path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
          </svg>
        </button>

        {showAlignControls && onAlignChange && (
          <>
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <button
              type="button"
              onClick={() => onAlignChange('left')}
              className={`size-7 rounded flex items-center justify-center transition-colors ${align === 'left' ? 'bg-blue-100 text-brand font-semibold' : 'hover:bg-slate-200/80 hover:text-ink'}`}
              title="Align Left"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onAlignChange('center')}
              className={`size-7 rounded flex items-center justify-center transition-colors ${align === 'center' ? 'bg-blue-100 text-brand font-semibold' : 'hover:bg-slate-200/80 hover:text-ink'}`}
              title="Align Center"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" x2="6" y1="6" y2="6"/><line x1="21" x2="3" y1="12" y2="12"/><line x1="18" x2="6" y1="18" y2="18"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onAlignChange('right')}
              className={`size-7 rounded flex items-center justify-center transition-colors ${align === 'right' ? 'bg-blue-100 text-brand font-semibold' : 'hover:bg-slate-200/80 hover:text-ink'}`}
              title="Align Right"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onAlignChange('justify')}
              className={`size-7 rounded flex items-center justify-center transition-colors ${align === 'justify' ? 'bg-blue-100 text-brand font-semibold' : 'hover:bg-slate-200/80 hover:text-ink'}`}
              title="Justify"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="rte-content p-3 text-sm text-ink outline-none leading-relaxed overflow-y-auto"
        style={{ minHeight: `${minHeight}px`, textAlign: align }}
      />
    </div>
  );
};
