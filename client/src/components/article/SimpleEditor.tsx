import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  List,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Youtube,
  Link as LinkIcon,
  Quote,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ContentEditable from 'react-contenteditable';
import { v4 as uuidv4 } from 'uuid';

// Element type definitions
type PositionType = 'full' | 'left' | 'right' | 'center';

interface BaseElement {
  id: string;
  type: string;
  position: PositionType;
}

interface TextElement extends BaseElement {
  type: 'paragraph' | 'heading1' | 'heading2' | 'quote';
  content: string;
  align?: 'left' | 'center' | 'right';
}

interface ImageElement extends BaseElement {
  type: 'image';
  url: string;
  caption?: string;
  alt?: string;
}

interface VideoElement extends BaseElement {
  type: 'video';
  videoId: string; // YouTube video ID
  caption?: string;
}

interface ListElement extends BaseElement {
  type: 'bullet-list' | 'ordered-list';
  items: string[];
}

// Union type for all element types
type ContentElement = 
  | TextElement 
  | ImageElement 
  | VideoElement 
  | ListElement;

// Props for the editor component
interface SimpleEditorProps {
  initialContent?: ContentElement[];
  onSave: (content: ContentElement[]) => void;
  readOnly?: boolean;
}

// Create a new empty paragraph element
const createEmptyParagraph = (): TextElement => ({
  id: uuidv4(),
  type: 'paragraph',
  content: '',
  position: 'full'
});

export default function SimpleEditor({ 
  initialContent = [], 
  onSave, 
  readOnly = false 
}: SimpleEditorProps) {
  // State for managing the content blocks
  const [content, setContent] = useState<ContentElement[]>(
    initialContent.length > 0 ? initialContent : [createEmptyParagraph()]
  );
  
  // State for the currently selected block
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
  
  // State for dialogs
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  
  // State for dialog inputs
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  
  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  
  // Toast notifications
  const { toast } = useToast();
  
  // Handle content changes
  const handleContentChange = (e: any, index: number) => {
    const newContent = [...content];
    (newContent[index] as TextElement).content = e.target.value;
    setContent(newContent);
    
    // Trigger save callback
    onSave(newContent);
  };
  
  // Handle key down events in the editor
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Only proceed if the element is a paragraph, heading, or quote
    const currentElement = content[index];
    if (!['paragraph', 'heading1', 'heading2', 'quote'].includes(currentElement.type)) {
      return;
    }
    
    // Create a new paragraph on Enter key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const newBlock = createEmptyParagraph();
      const newContent = [
        ...content.slice(0, index + 1),
        newBlock,
        ...content.slice(index + 1)
      ];
      
      setContent(newContent);
      setActiveBlockIndex(index + 1);
      
      // Trigger save callback
      onSave(newContent);
    }
    
    // Delete empty block on backspace if it's not the only block
    if (e.key === 'Backspace' && (currentElement as TextElement).content === '' && content.length > 1) {
      e.preventDefault();
      
      const newContent = content.filter((_, i) => i !== index);
      setContent(newContent);
      setActiveBlockIndex(Math.max(0, index - 1));
      
      // Trigger save callback
      onSave(newContent);
    }
  };
  
  // Set active block when clicking on a block
  const handleBlockClick = (index: number) => {
    setActiveBlockIndex(index);
  };
  
  // Formatting helpers
  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };
  
  const formatText = (format: string) => {
    execCommand(format);
    
    // Need to focus back on the contenteditable after formatting
    if (activeElementRef.current) {
      activeElementRef.current.focus();
    }
  };
  
  const alignText = (alignment: 'left' | 'center' | 'right') => {
    if (activeBlockIndex >= 0 && activeBlockIndex < content.length) {
      const newContent = [...content];
      const currentElement = newContent[activeBlockIndex];
      
      if ('align' in currentElement) {
        (currentElement as TextElement).align = alignment;
        setContent(newContent);
        
        // Trigger save callback
        onSave(newContent);
      }
    }
  };
  
  // Insert elements
  const insertImage = () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid image URL",
        variant: "destructive"
      });
      return;
    }
    
    const newImage: ImageElement = {
      id: uuidv4(),
      type: 'image',
      url: imageUrl,
      caption: imageCaption,
      alt: imageAlt,
      position: 'full'
    };
    
    const newContent = [
      ...content.slice(0, activeBlockIndex + 1),
      newImage,
      ...content.slice(activeBlockIndex + 1)
    ];
    
    setContent(newContent);
    setActiveBlockIndex(activeBlockIndex + 1);
    
    // Trigger save callback
    onSave(newContent);
    
    // Reset and close dialog
    setImageUrl('');
    setImageCaption('');
    setImageAlt('');
    setImageDialogOpen(false);
  };
  
  const insertVideo = () => {
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(youtubeRegex);
    
    if (!match || !match[1]) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }
    
    const videoId = match[1];
    const newVideo: VideoElement = {
      id: uuidv4(),
      type: 'video',
      videoId,
      caption: videoCaption,
      position: 'full'
    };
    
    const newContent = [
      ...content.slice(0, activeBlockIndex + 1),
      newVideo,
      ...content.slice(activeBlockIndex + 1)
    ];
    
    setContent(newContent);
    setActiveBlockIndex(activeBlockIndex + 1);
    
    // Trigger save callback
    onSave(newContent);
    
    // Reset and close dialog
    setVideoUrl('');
    setVideoCaption('');
    setVideoDialogOpen(false);
  };
  
  const insertLink = () => {
    if (!linkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }
    
    // Create the HTML for the link
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText || linkUrl}</a>`;
    
    // Insert the link at the current cursor position
    execCommand('insertHTML', linkHtml);
    
    // Reset and close dialog
    setLinkUrl('');
    setLinkText('');
    setLinkDialogOpen(false);
  };
  
  const convertToParagraph = () => {
    if (activeBlockIndex >= 0 && activeBlockIndex < content.length) {
      const newContent = [...content];
      const currentElement = newContent[activeBlockIndex];
      
      if (['paragraph', 'heading1', 'heading2', 'quote'].includes(currentElement.type)) {
        (newContent[activeBlockIndex] as TextElement).type = 'paragraph';
        setContent(newContent);
        
        // Trigger save callback
        onSave(newContent);
      }
    }
  };
  
  const convertToHeading1 = () => {
    if (activeBlockIndex >= 0 && activeBlockIndex < content.length) {
      const newContent = [...content];
      const currentElement = newContent[activeBlockIndex];
      
      if (['paragraph', 'heading1', 'heading2', 'quote'].includes(currentElement.type)) {
        (newContent[activeBlockIndex] as TextElement).type = 'heading1';
        setContent(newContent);
        
        // Trigger save callback
        onSave(newContent);
      }
    }
  };
  
  const convertToHeading2 = () => {
    if (activeBlockIndex >= 0 && activeBlockIndex < content.length) {
      const newContent = [...content];
      const currentElement = newContent[activeBlockIndex];
      
      if (['paragraph', 'heading1', 'heading2', 'quote'].includes(currentElement.type)) {
        (newContent[activeBlockIndex] as TextElement).type = 'heading2';
        setContent(newContent);
        
        // Trigger save callback
        onSave(newContent);
      }
    }
  };
  
  const convertToQuote = () => {
    if (activeBlockIndex >= 0 && activeBlockIndex < content.length) {
      const newContent = [...content];
      const currentElement = newContent[activeBlockIndex];
      
      if (['paragraph', 'heading1', 'heading2', 'quote'].includes(currentElement.type)) {
        (newContent[activeBlockIndex] as TextElement).type = 'quote';
        setContent(newContent);
        
        // Trigger save callback
        onSave(newContent);
      }
    }
  };
  
  // Render each content block based on its type
  const renderContentBlock = (block: ContentElement, index: number) => {
    const isActive = index === activeBlockIndex;
    const blockClasses = `p-4 rounded-md transition-all duration-200 ${
      isActive ? 'ring-2 ring-blue-500 bg-white/5' : 'hover:bg-white/5'
    }`;
    
    switch (block.type) {
      case 'paragraph':
        return (
          <div 
            key={block.id} 
            className={blockClasses}
            onClick={() => handleBlockClick(index)}
          >
            <ContentEditable
              innerRef={(ref) => {
                if (isActive) activeElementRef.current = ref;
              }}
              html={(block as TextElement).content}
              disabled={readOnly}
              onChange={(e) => handleContentChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`outline-none w-full min-h-[1.5em] ${
                (block as TextElement).align === 'center' ? 'text-center' :
                (block as TextElement).align === 'right' ? 'text-right' : 'text-left'
              }`}
              tagName="p"
            />
          </div>
        );
        
      case 'heading1':
        return (
          <div 
            key={block.id} 
            className={blockClasses}
            onClick={() => handleBlockClick(index)}
          >
            <ContentEditable
              innerRef={(ref) => {
                if (isActive) activeElementRef.current = ref;
              }}
              html={(block as TextElement).content}
              disabled={readOnly}
              onChange={(e) => handleContentChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`outline-none w-full text-3xl font-bold min-h-[1.5em] ${
                (block as TextElement).align === 'center' ? 'text-center' :
                (block as TextElement).align === 'right' ? 'text-right' : 'text-left'
              }`}
              tagName="h1"
            />
          </div>
        );
        
      case 'heading2':
        return (
          <div 
            key={block.id} 
            className={blockClasses}
            onClick={() => handleBlockClick(index)}
          >
            <ContentEditable
              innerRef={(ref) => {
                if (isActive) activeElementRef.current = ref;
              }}
              html={(block as TextElement).content}
              disabled={readOnly}
              onChange={(e) => handleContentChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`outline-none w-full text-2xl font-bold min-h-[1.5em] ${
                (block as TextElement).align === 'center' ? 'text-center' :
                (block as TextElement).align === 'right' ? 'text-right' : 'text-left'
              }`}
              tagName="h2"
            />
          </div>
        );
        
      case 'quote':
        return (
          <div 
            key={block.id} 
            className={blockClasses}
            onClick={() => handleBlockClick(index)}
          >
            <ContentEditable
              innerRef={(ref) => {
                if (isActive) activeElementRef.current = ref;
              }}
              html={(block as TextElement).content}
              disabled={readOnly}
              onChange={(e) => handleContentChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`outline-none w-full italic border-l-4 border-white/30 pl-4 min-h-[1.5em] ${
                (block as TextElement).align === 'center' ? 'text-center' :
                (block as TextElement).align === 'right' ? 'text-right' : 'text-left'
              }`}
              tagName="blockquote"
            />
          </div>
        );
        
      case 'image':
        const imageBlock = block as ImageElement;
        return (
          <div 
            key={block.id} 
            className={blockClasses}
            onClick={() => handleBlockClick(index)}
          >
            <div className="flex flex-col items-center">
              <img
                src={imageBlock.url}
                alt={imageBlock.alt || 'Image'}
                className="max-w-full rounded-md"
              />
              {imageBlock.caption && (
                <p className="text-sm text-white/70 mt-2">{imageBlock.caption}</p>
              )}
            </div>
          </div>
        );
        
      case 'video':
        const videoBlock = block as VideoElement;
        return (
          <div 
            key={block.id} 
            className={blockClasses}
            onClick={() => handleBlockClick(index)}
          >
            <div className="flex flex-col items-center">
              <div className="w-full aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoBlock.videoId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-md"
                ></iframe>
              </div>
              {videoBlock.caption && (
                <p className="text-sm text-white/70 mt-2">{videoBlock.caption}</p>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="bg-[#1E1E2D] border-b border-white/10 p-2 rounded-t-md flex flex-wrap items-center gap-1 sticky top-0 z-10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => formatText('bold')}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => formatText('italic')}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => formatText('underline')}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-[1px] bg-white/20 mx-1" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => alignText('left')}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => alignText('center')}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => alignText('right')}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-[1px] bg-white/20 mx-1" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={convertToParagraph}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <span className="text-xs">P</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={convertToHeading1}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={convertToHeading2}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={convertToQuote}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-[1px] bg-white/20 mx-1" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLinkDialogOpen(true)}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setImageDialogOpen(true)}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setVideoDialogOpen(true)}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Youtube className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-[1px] bg-white/20 mx-1" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => execCommand('insertOrderedList')}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => execCommand('insertUnorderedList')}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <div className="ml-auto">
            <Button 
              size="sm" 
              onClick={() => onSave(content)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      )}
      
      <div 
        ref={editorRef}
        className={`p-4 min-h-[400px] max-h-[600px] overflow-y-auto flex-grow bg-[#0A0A15] ${readOnly ? 'rounded-md' : 'rounded-b-md'}`}
      >
        {content.map((block, index) => renderContentBlock(block, index))}
      </div>
      
      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-url" className="text-right">
                URL
              </Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-text" className="text-right">
                Text
              </Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="col-span-3"
                placeholder="Optional (uses URL if empty)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertLink}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-url" className="text-right">
                Image URL
              </Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-alt" className="text-right">
                Alt Text
              </Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-caption" className="text-right">
                Caption
              </Label>
              <Input
                id="image-caption"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertImage}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Insert YouTube Video</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="video-url" className="text-right">
                YouTube URL
              </Label>
              <Input
                id="video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="video-caption" className="text-right">
                Caption
              </Label>
              <Input
                id="video-caption"
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertVideo}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}