'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-50 rounded-md animate-pulse" />
});

// Import Quill styles
import 'react-quill/dist/quill.snow.css';

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
  const quillRef = useRef<any>(null);

  // Custom toolbar configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image', 'align', 'color', 'background'
  ];

  // Custom styles for the editor
  const editorStyle = {
    height: height,
    marginBottom: '42px' // Space for toolbar
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
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={disabled}
          modules={modules}
          formats={formats}
          style={editorStyle}
          className={`
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      <style jsx global>{`
        .rich-text-editor .ql-editor {
          min-height: ${height};
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
          background: #f9fafb;
        }
        
        .rich-text-editor .ql-container {
          border-bottom: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
          font-family: inherit;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        .rich-text-editor .ql-editor:focus {
          outline: none;
        }
        
        .rich-text-editor .ql-container.ql-snow {
          border: 1px solid #e5e7eb;
        }
        
        .rich-text-editor .ql-toolbar.ql-snow {
          border: 1px solid #e5e7eb;
        }
        
        /* Focus styles */
        .rich-text-editor:focus-within .ql-toolbar {
          border-color: #3b82f6;
        }
        
        .rich-text-editor:focus-within .ql-container {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
        
        /* Error styles */
        .rich-text-editor .ql-toolbar.border-red-300 {
          border-color: #fca5a5;
        }
        
        .rich-text-editor .ql-container.border-red-300 {
          border-color: #fca5a5;
        }
        
        /* Disabled styles */
        .rich-text-editor .ql-toolbar.ql-disabled {
          background: #f3f4f6;
        }
        
        .rich-text-editor .ql-editor.ql-disabled {
          background: #f3f4f6;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
