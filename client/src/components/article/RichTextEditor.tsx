import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card } from '@/components/ui/card';

interface RichTextEditorProps {
  initialValue?: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

/**
 * A rich text editor component that provides WYSIWYG editing capabilities
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Write your article content here...'
}) => {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    onChange(value);
  }, [value, onChange]);

  // Define the modules for the Quill editor
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image', 'video'],
    ],
  };

  // Define the formats we want to support
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'script',
    'blockquote', 'code-block',
    'color', 'background',
    'align',
    'link', 'image', 'video',
  ];

  return (
    <Card className="border-white/10 overflow-hidden">
      <div className="quill-editor-container">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={setValue}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="wysiwyg-editor"
          style={{ 
            height: '400px',
            backgroundColor: '#0A0A15', 
          }}
        />
      </div>
      
      <style>{`
        .quill-editor-container {
          height: 440px;
        }
        
        .ql-toolbar {
          background-color: #1A1A27;
          border-color: rgba(255, 255, 255, 0.1) !important;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        
        .ql-container {
          border-color: rgba(255, 255, 255, 0.1) !important;
          background-color: #0A0A15;
          font-size: 16px;
          font-family: inherit;
          height: 380px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        
        .ql-editor {
          padding: 1rem;
          height: 100%;
          overflow-y: auto;
        }
        
        .ql-editor p {
          margin-bottom: 1rem;
        }
        
        .ql-snow .ql-stroke, 
        .ql-snow .ql-fill {
          stroke: #fff;
        }
        
        .ql-snow .ql-picker {
          color: #fff;
        }
        
        .ql-snow .ql-picker-options {
          background-color: #1A1A27;
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .ql-snow.ql-toolbar button:hover, 
        .ql-snow .ql-toolbar button:hover, 
        .ql-snow.ql-toolbar button.ql-active, 
        .ql-snow .ql-toolbar button.ql-active {
          background-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </Card>
  );
};

export default RichTextEditor;