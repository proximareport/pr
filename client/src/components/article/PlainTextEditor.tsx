import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Bold, Italic, Heading, List, Quote, Code } from 'lucide-react';

interface PlainTextEditorProps {
  initialValue?: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

/**
 * A basic plain text editor without any special formatting that treats text as plain text only
 */
const PlainTextEditor: React.FC<PlainTextEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Enter your article content here...'
}) => {
  const [content, setContent] = useState(initialValue);
  
  // Sync with parent component
  useEffect(() => {
    onChange(content);
  }, [content, onChange]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const insertAtCursor = (textToInsert: string) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + textToInsert + content.substring(end);
    
    setContent(newContent);
    
    // Focus and set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };
  
  const insertAroundSelection = (prefix: string, suffix: string) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      prefix + selectedText + suffix + 
      content.substring(end);
    
    setContent(newContent);
    
    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText.length > 0 
        ? start + prefix.length + selectedText.length + suffix.length 
        : start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <Card className="border-white/10 bg-[#0A0A15]">
      <CardHeader className="border-b border-white/10 p-3 bg-[#1A1A27]">
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => insertAroundSelection('\n## ', '\n')}
          >
            <Heading className="h-4 w-4 mr-1" />
            <span className="text-xs">Heading</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => insertAroundSelection('**', '**')}
          >
            <Bold className="h-4 w-4 mr-1" />
            <span className="text-xs">Bold</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => insertAroundSelection('*', '*')}
          >
            <Italic className="h-4 w-4 mr-1" />
            <span className="text-xs">Italic</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => insertAtCursor('\n- Item 1\n- Item 2\n- Item 3\n')}
          >
            <List className="h-4 w-4 mr-1" />
            <span className="text-xs">List</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => insertAtCursor('\n> Your quote here\n')}
          >
            <Quote className="h-4 w-4 mr-1" />
            <span className="text-xs">Quote</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => insertAroundSelection('\n```\n', '\n```\n')}
          >
            <Code className="h-4 w-4 mr-1" />
            <span className="text-xs">Code</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Textarea
          id="editor-textarea"
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          className="min-h-[400px] rounded-t-none border-0 focus-visible:ring-0 resize-y text-base p-4 bg-[#0A0A15]"
          rows={20}
        />
      </CardContent>
    </Card>
  );
};

export default PlainTextEditor;