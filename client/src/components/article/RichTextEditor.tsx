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
      

    </Card>
  );
};

export default RichTextEditor;