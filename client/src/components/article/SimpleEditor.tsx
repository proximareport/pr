import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SimpleEditorProps {
  initialValue?: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

/**
 * A simple markdown editor that doesn't try to do too much
 */
const SimpleEditor: React.FC<SimpleEditorProps> = ({ 
  initialValue = '', 
  onChange, 
  placeholder = 'Write your article content here...' 
}) => {
  const [content, setContent] = useState(initialValue);
  
  useEffect(() => {
    onChange(content);
  }, [content, onChange]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const insertText = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('simple-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);
    
    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setContent(newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length + selectedText.length + suffix.length,
        start + prefix.length + selectedText.length + suffix.length
      );
    }, 0);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b border-white/10 bg-[#1E1E2D] py-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('## ', '\n')}
            >
              H2
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('### ', '\n')}
            >
              H3
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('**', '**')}
            >
              Bold
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('*', '*')}
            >
              Italic
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('[', '](url)')}
            >
              Link
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('\n> ', '\n')}
            >
              Quote
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('\n- ', '\n')}
            >
              List
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('\n1. ', '\n')}
            >
              Numbered
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('\n```\n', '\n```\n')}
            >
              Code
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-9 px-2" 
              onClick={() => insertText('\n![Alt text](', ')\n')}
            >
              Image
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Textarea
            id="simple-editor"
            value={content}
            onChange={handleChange}
            placeholder={placeholder}
            className="min-h-[400px] p-4 border-none rounded-none font-mono text-base resize-y"
            rows={20}
          />
        </CardContent>
      </Card>
      
      <div className="text-xs text-white/60">
        <p className="mb-1">Markdown Tips:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li># Heading 1, ## Heading 2, ### Heading 3</li>
          <li>**Bold** or __Bold__</li>
          <li>*Italic* or _Italic_</li>
          <li>[Link text](url)</li>
          <li>![Alt text](image-url)</li>
          <li>- Bullet list item</li>
          <li>1. Numbered list item</li>
          <li>> Blockquote</li>
          <li>```code block```</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleEditor;