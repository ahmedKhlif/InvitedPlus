'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-50 rounded-md animate-pulse" />
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  height?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  disabled = false,
  height = '200px',
  label,
  required = false,
  error
}) => {
  // Convert HTML to markdown for display (basic conversion)
  const htmlToMarkdown = (html: string): string => {
    if (!html) return '';
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<h1>(.*?)<\/h1>/g, '# $1')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1')
      .replace(/<ul>/g, '').replace(/<\/ul>/g, '')
      .replace(/<ol>/g, '').replace(/<\/ol>/g, '')
      .replace(/<li>(.*?)<\/li>/g, '- $1')
      .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags
  };

  // Convert markdown to HTML for storage
  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/, '<p>$1</p>');
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <MDEditor
          value={htmlToMarkdown(value)}
          onChange={(val) => onChange(markdownToHtml(val || ''))}
          preview="edit"
          hideToolbar={disabled}
          visibleDragBar={false}
          data-color-mode="light"
          height={parseInt(height)}
          style={{
            backgroundColor: disabled ? '#f3f4f6' : 'white',
          }}
          textareaProps={{
            placeholder,
            disabled,
            style: {
              fontSize: 14,
              lineHeight: 1.5,
              fontFamily: 'inherit',
              backgroundColor: disabled ? '#f3f4f6' : 'white',
              color: disabled ? '#6b7280' : 'inherit',
            },
          }}
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      <style jsx global>{`
        .rich-text-editor .w-md-editor {
          background-color: ${disabled ? '#f3f4f6' : 'white'};
        }

        .rich-text-editor .w-md-editor-text-textarea,
        .rich-text-editor .w-md-editor-text {
          font-size: 14px !important;
          line-height: 1.5 !important;
          font-family: inherit !important;
        }

        .rich-text-editor .w-md-editor.w-md-editor-focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 1px #3b82f6 !important;
        }

        .rich-text-editor .w-md-editor-toolbar {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        ${error ? `
        .rich-text-editor .w-md-editor {
          border-color: #fca5a5 !important;
        }
        ` : ''}
      `}</style>
    </div>
  );
};

export default RichTextEditor;
