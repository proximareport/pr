import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';
import MediaSelector from '@/components/MediaSelector';

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
  const quillRef = useRef<ReactQuill>(null);
  
  useEffect(() => {
    onChange(value);
  }, [value, onChange]);
  
  // Function to insert media from the Media Library
  const handleMediaSelect = (media: any) => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection(true);
    
    if (!range) return;
    
    if (media.fileType === 'image') {
      quill.insertEmbed(range.index, 'image', media.fileUrl);
      // Move cursor after the image
      quill.setSelection(range.index + 1);
    } else if (media.fileType === 'video' && media.mimeType.includes('video')) {
      quill.insertEmbed(range.index, 'video', media.fileUrl);
      quill.setSelection(range.index + 1);
    } else {
      // For any other file type, insert as a link
      const linkText = media.fileName || 'Download file';
      quill.insertText(range.index, linkText);
      quill.setSelection(range.index, linkText.length);
      quill.format('link', media.fileUrl);
      quill.setSelection(range.index + linkText.length + 1);
    }
  };

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
      <div className="relative">
        <div className="absolute right-4 top-2 z-10">
          <MediaSelector
            onSelect={handleMediaSelect}
            allowedTypes={["image", "video", "document"]}
            triggerComponent={
              <Button 
                type="button" 
                size="sm" 
                variant="ghost" 
                className="flex items-center gap-1"
              >
                <ImageIcon className="h-4 w-4" />
                Media Library
              </Button>
            }
          />
        </div>
        <div className="quill-editor-container">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value}
            onChange={setValue}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            className="wysiwyg-editor"
          />
        </div>
      </div>
    </Card>
  );
};

export default RichTextEditor;