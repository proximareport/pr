import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
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
  Heading3,
  Image as ImageIcon,
  Youtube,
  Link as LinkIcon,
  Quote,
  Table,
  PlusCircle,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContentEditableEvent } from 'react-contenteditable';
import ContentEditable from 'react-contenteditable';
import { v4 as uuidv4 } from 'uuid';

// Define the types of content elements
type ElementType = 
  | 'paragraph' 
  | 'heading-1' 
  | 'heading-2' 
  | 'heading-3' 
  | 'image' 
  | 'video' 
  | 'list-ordered' 
  | 'list-unordered'
  | 'quote'
  | 'table'
  | 'poll';

// Element base interface
interface BaseElement {
  id: string;
  type: ElementType;
  position?: 'left' | 'center' | 'right' | 'full';
}

// Text element interface
interface TextElement extends BaseElement {
  type: 'paragraph' | 'heading-1' | 'heading-2' | 'heading-3' | 'quote';
  content: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
}

// Image element interface
interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

// Video element interface
interface VideoElement extends BaseElement {
  type: 'video';
  videoId: string;
  caption?: string;
}

// List element interface
interface ListElement extends BaseElement {
  type: 'list-ordered' | 'list-unordered';
  items: string[];
}

// Table element interface
interface TableElement extends BaseElement {
  type: 'table';
  rows: string[][];
  headers: string[];
}

// Poll element interface
interface PollElement extends BaseElement {
  type: 'poll';
  question: string;
  options: string[];
  multipleChoice: boolean;
}

// Union type for all element types
type ContentElement = 
  | TextElement 
  | ImageElement 
  | VideoElement 
  | ListElement 
  | TableElement
  | PollElement;

// Props for the editor component
interface GoogleDocsEditorProps {
  initialContent?: ContentElement[];
  onSave: (content: ContentElement[]) => void;
  readOnly?: boolean;
}

// Create a new empty paragraph element
const createEmptyParagraph = (): TextElement => ({
  id: uuidv4(),
  type: 'paragraph',
  content: '',
  position: 'full',
});

// The main editor component
export default function GoogleDocsEditor({ 
  initialContent, 
  onSave,
  readOnly = false
}: GoogleDocsEditorProps) {
  // State for the editor elements
  const [elements, setElements] = useState<ContentElement[]>(
    initialContent && initialContent.length > 0 
      ? initialContent 
      : [createEmptyParagraph()]
  );
  
  // State for the currently focused element
  const [focusedId, setFocusedId] = useState<string | null>(null);
  
  // Element refs for focusing
  const elementRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  
  // State for drag and drop functionality
  const [draggedElement, setDraggedElement] = useState<{id: string, index: number} | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // State for image dialog
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  
  // State for video dialog
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  
  // State for link dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  
  // State for poll dialog
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);
  
  // Toast for notifications
  const { toast } = useToast();
  
  // Initialize editor with content when provided
  useEffect(() => {
    if (initialContent && initialContent.length > 0) {
      setElements(initialContent);
    }
  }, [initialContent]);
  
  // Auto-save the content whenever it changes
  useEffect(() => {
    if (!readOnly) {
      onSave(elements);
    }
  }, [elements, onSave, readOnly]);
  
  // Find element index by ID
  const getElementIndex = useCallback((id: string) => {
    return elements.findIndex(el => el.id === id);
  }, [elements]);
  
  // Update a specific element
  const updateElement = useCallback((id: string, updates: Partial<ContentElement>) => {
    setElements(prevElements => 
      prevElements.map(element => 
        element.id === id ? { ...element, ...updates } : element
      )
    );
  }, []);
  
  // Handle text changes in contenteditable elements
  const handleContentChange = useCallback((id: string, e: ContentEditableEvent) => {
    const content = e.target.value;
    updateElement(id, { content } as Partial<ContentElement>);
  }, [updateElement]);
  
  // Insert a new element after the specified element
  const insertElementAfter = useCallback((id: string, newElement: ContentElement) => {
    const index = getElementIndex(id);
    if (index === -1) return;
    
    setElements(prevElements => [
      ...prevElements.slice(0, index + 1),
      newElement,
      ...prevElements.slice(index + 1)
    ]);
    
    // Focus the new element after render
    setTimeout(() => {
      const el = elementRefs.current[newElement.id];
      if (el) {
        el.focus();
        setFocusedId(newElement.id);
      }
    }, 0);
  }, [getElementIndex]);
  
  // Delete an element
  const deleteElement = useCallback((id: string) => {
    // Don't delete if it's the only element
    if (elements.length <= 1) {
      return;
    }
    
    const index = getElementIndex(id);
    if (index === -1) return;
    
    setElements(prevElements => {
      const newElements = [
        ...prevElements.slice(0, index),
        ...prevElements.slice(index + 1)
      ];
      
      // If the deleted element was the last one, focus the new last element
      if (index >= newElements.length) {
        setTimeout(() => {
          const lastId = newElements[newElements.length - 1].id;
          const el = elementRefs.current[lastId];
          if (el) {
            el.focus();
            setFocusedId(lastId);
          }
        }, 0);
      } else {
        // Focus the element that comes after the deleted one
        setTimeout(() => {
          const nextId = newElements[index].id;
          const el = elementRefs.current[nextId];
          if (el) {
            el.focus();
            setFocusedId(nextId);
          }
        }, 0);
      }
      
      return newElements;
    });
  }, [elements.length, getElementIndex]);
  
  // Handle key presses in editor elements
  const handleKeyDown = useCallback((event: React.KeyboardEvent, id: string) => {
    if (readOnly) return;
    
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    // Enter key behavior depends on element type
    if (event.key === 'Enter' && !event.shiftKey) {
      if (['paragraph', 'heading-1', 'heading-2', 'heading-3'].includes(element.type)) {
        event.preventDefault();
        insertElementAfter(id, createEmptyParagraph());
      }
    }
    
    // Backspace key behavior
    if (event.key === 'Backspace') {
      if ('content' in element && element.content === '') {
        event.preventDefault();
        deleteElement(id);
      }
    }
  }, [deleteElement, elements, insertElementAfter, readOnly]);
  
  // Handle focus on an element
  const handleFocus = (id: string) => {
    setFocusedId(id);
  };
  
  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedElement({ id, index });
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedElement === null) return;
    if (dragOverIndex === index) return;
    
    setDragOverIndex(index);
  }, [draggedElement, dragOverIndex]);
  
  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedElement === null) return;
    
    // Reorder the elements
    setElements(prevElements => {
      const newElements = [...prevElements];
      const [movedElement] = newElements.splice(draggedElement.index, 1);
      newElements.splice(index, 0, movedElement);
      return newElements;
    });
    
    setDraggedElement(null);
    setDragOverIndex(null);
  }, [draggedElement]);
  
  const handleDragEnd = useCallback(() => {
    setDraggedElement(null);
    setDragOverIndex(null);
  }, []);
  
  // Format text (bold, italic, etc.)
  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    if (!focusedId) return;
    
    const element = elements.find(el => el.id === focusedId);
    if (!element || !('styles' in element)) {
      // If the element doesn't have styles yet, initialize them
      updateElement(focusedId, {
        styles: { [format]: true }
      } as Partial<ContentElement>);
    } else {
      // Toggle the formatting
      const textElement = element as TextElement;
      updateElement(focusedId, {
        styles: {
          ...textElement.styles,
          [format]: !textElement.styles?.[format]
        }
      } as Partial<ContentElement>);
    }
  };
  
  // Change the type of an element
  const changeElementType = (newType: ElementType) => {
    if (!focusedId) return;
    
    updateElement(focusedId, { type: newType } as Partial<ContentElement>);
  };
  
  // Change element alignment
  const changeAlignment = (alignment: 'left' | 'center' | 'right' | 'full') => {
    if (!focusedId) return;
    
    updateElement(focusedId, { position: alignment } as Partial<ContentElement>);
  };
  
  // Add an image
  const addImage = () => {
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
    setImageDialogOpen(true);
  };
  
  // Handle image submission
  const handleImageSubmit = () => {
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive"
      });
      return;
    }
    
    const newImage: ImageElement = {
      id: uuidv4(),
      type: 'image',
      src: imageUrl,
      alt: imageAlt || 'Image',
      caption: imageCaption,
      position: 'center'
    };
    
    if (focusedId) {
      insertElementAfter(focusedId, newImage);
    } else {
      setElements(prev => [...prev, newImage]);
    }
    
    setImageDialogOpen(false);
  };
  
  // Add a video
  const addVideo = () => {
    setVideoUrl('');
    setVideoCaption('');
    setVideoDialogOpen(true);
  };
  
  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  // Handle video submission
  const handleVideoSubmit = () => {
    const videoId = extractYouTubeId(videoUrl);
    
    if (!videoId) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }
    
    const newVideo: VideoElement = {
      id: uuidv4(),
      type: 'video',
      videoId: videoId,
      caption: videoCaption,
      position: 'center'
    };
    
    if (focusedId) {
      insertElementAfter(focusedId, newVideo);
    } else {
      setElements(prev => [...prev, newVideo]);
    }
    
    setVideoDialogOpen(false);
  };
  
  // Add a poll
  const addPoll = () => {
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollMultipleChoice(false);
    setPollDialogOpen(true);
  };
  
  // Add an option to the poll
  const addPollOption = () => {
    setPollOptions(prev => [...prev, '']);
  };
  
  // Remove an option from the poll
  const removePollOption = (index: number) => {
    if (pollOptions.length <= 2) {
      toast({
        title: "Error",
        description: "A poll needs at least two options",
        variant: "destructive"
      });
      return;
    }
    
    setPollOptions(prev => prev.filter((_, i) => i !== index));
  };
  
  // Update a poll option
  const updatePollOption = (index: number, value: string) => {
    setPollOptions(prev => 
      prev.map((option, i) => i === index ? value : option)
    );
  };
  
  // Handle poll submission
  const handlePollSubmit = () => {
    if (!pollQuestion) {
      toast({
        title: "Error",
        description: "Please enter a poll question",
        variant: "destructive"
      });
      return;
    }
    
    if (pollOptions.some(option => !option.trim())) {
      toast({
        title: "Error",
        description: "All poll options must have text",
        variant: "destructive"
      });
      return;
    }
    
    const newPoll: PollElement = {
      id: uuidv4(),
      type: 'poll',
      question: pollQuestion,
      options: pollOptions,
      multipleChoice: pollMultipleChoice,
      position: 'full'
    };
    
    if (focusedId) {
      insertElementAfter(focusedId, newPoll);
    } else {
      setElements(prev => [...prev, newPoll]);
    }
    
    setPollDialogOpen(false);
  };
  
  // Handle manual save
  const handleSave = () => {
    onSave(elements);
    toast({
      title: "Saved",
      description: "Content has been saved",
    });
  };
  
  // Render toolbar
  const renderToolbar = () => (
    <div className="flex items-center gap-1 bg-white/5 p-2 rounded-md mb-4 border border-white/10 overflow-x-auto">
      <div className="flex items-center space-x-1 mr-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => formatText('bold')}
          disabled={readOnly}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => formatText('italic')}
          disabled={readOnly}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => formatText('underline')}
          disabled={readOnly}
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="h-6 w-px bg-white/20 mx-2" />
      
      <div className="flex items-center space-x-1 mr-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeElementType('heading-1')}
          disabled={readOnly}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeElementType('heading-2')}
          disabled={readOnly}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeElementType('heading-3')}
          disabled={readOnly}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeElementType('paragraph')}
          disabled={readOnly}
        >
          <span className="text-xs font-mono">P</span>
        </Button>
      </div>
      
      <div className="h-6 w-px bg-white/20 mx-2" />
      
      <div className="flex items-center space-x-1 mr-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeAlignment('left')}
          disabled={readOnly}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeAlignment('center')}
          disabled={readOnly}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeAlignment('right')}
          disabled={readOnly}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="h-6 w-px bg-white/20 mx-2" />
      
      <div className="flex items-center space-x-1 mr-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeElementType('list-ordered')}
          disabled={readOnly}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeElementType('list-unordered')}
          disabled={readOnly}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => changeElementType('quote')}
          disabled={readOnly}
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="h-6 w-px bg-white/20 mx-2" />
      
      <div className="flex items-center space-x-1 mr-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={addImage}
          disabled={readOnly}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={addVideo}
          disabled={readOnly}
        >
          <Youtube className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={addPoll}
          disabled={readOnly}
        >
          <PlusCircle className="h-4 w-4" />
          <span className="ml-1 text-xs">Poll</span>
        </Button>
      </div>
      
      <div className="h-6 w-px bg-white/20 mx-2" />
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleSave}
        disabled={readOnly}
        className="ml-auto"
      >
        <Save className="h-4 w-4 mr-1" />
        Save
      </Button>
    </div>
  );
  
  // Render a specific element based on its type
  const renderElement = (element: ContentElement, index: number) => {
    const isFocused = focusedId === element.id;
    const classList = `relative transition-all p-2 rounded-md ${isFocused && !readOnly ? 'outline outline-blue-500 outline-2 bg-white/5' : ''}`;
    
    // Position classes
    const positionClasses = {
      left: 'text-left',
      center: 'text-center mx-auto',
      right: 'text-right ml-auto',
      full: 'w-full'
    };
    
    const positionClass = element.position ? positionClasses[element.position] : 'w-full';
    
    // Element controls for dragging and deleting
    const elementControls = !readOnly && isFocused ? (
      <div className="absolute -left-10 top-1 flex flex-col items-center space-y-1">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6 bg-slate-800 hover:bg-slate-700 cursor-move"
          onClick={(e) => e.stopPropagation()}
          draggable
          onDragStart={(e) => handleDragStart(e, element.id, index)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="7" r="1" />
            <circle cx="17" cy="7" r="1" />
            <circle cx="7" cy="17" r="1" />
            <circle cx="17" cy="17" r="1" />
          </svg>
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6 bg-red-800 hover:bg-red-700 text-white"
          onClick={(e) => {
            e.stopPropagation();
            deleteElement(element.id);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </Button>
      </div>
    ) : null;
    
    // Render different elements based on their type
    switch (element.type) {
      case 'paragraph':
      case 'heading-1':
      case 'heading-2':
      case 'heading-3':
      case 'quote': {
        const textElement = element as TextElement;
        
        // Style classes based on element type and styles
        let styleClasses = '';
        if (textElement.styles) {
          if (textElement.styles.bold) styleClasses += ' font-bold';
          if (textElement.styles.italic) styleClasses += ' italic';
          if (textElement.styles.underline) styleClasses += ' underline';
        }
        
        // Classes for different heading levels
        const typeClasses = {
          'paragraph': 'text-base',
          'heading-1': 'text-3xl font-bold',
          'heading-2': 'text-2xl font-bold',
          'heading-3': 'text-xl font-bold',
          'quote': 'text-base italic border-l-4 border-white/30 pl-4'
        };
        
        return (
          <div 
            key={element.id} 
            className={`${classList} ${positionClass} mb-4 ${dragOverIndex === index ? 'border-t-2 border-blue-500' : ''}`}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => handleFocus(element.id)}
          >
            {elementControls}
            <ContentEditable
              innerRef={el => { elementRefs.current[element.id] = el; }}
              html={textElement.content}
              disabled={readOnly}
              onChange={e => handleContentChange(element.id, e)}
              onKeyDown={e => handleKeyDown(e, element.id)}
              onFocus={() => handleFocus(element.id)}
              className={`${typeClasses[textElement.type]} outline-none ${styleClasses}`}
              data-placeholder={`Type ${textElement.type} here...`}
            />
          </div>
        );
      }
      
      case 'image': {
        const imageElement = element as ImageElement;
        return (
          <div 
            key={element.id} 
            className={`${classList} ${positionClass} mb-6 ${dragOverIndex === index ? 'border-t-2 border-blue-500' : ''}`}
            onClick={() => handleFocus(element.id)}
            tabIndex={0}
            ref={el => { elementRefs.current[element.id] = el; }}
            onKeyDown={e => handleKeyDown(e, element.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {elementControls}
            <div className="max-w-3xl mx-auto">
              <img 
                src={imageElement.src} 
                alt={imageElement.alt} 
                className="max-w-full h-auto rounded-md mx-auto"
              />
              {imageElement.caption && (
                <p className="text-sm text-center text-gray-400 mt-2">{imageElement.caption}</p>
              )}
            </div>
          </div>
        );
      }
      
      case 'video': {
        const videoElement = element as VideoElement;
        return (
          <div 
            key={element.id} 
            className={`${classList} ${positionClass} mb-6 ${dragOverIndex === index ? 'border-t-2 border-blue-500' : ''}`}
            onClick={() => handleFocus(element.id)}
            tabIndex={0}
            ref={el => { elementRefs.current[element.id] = el; }}
            onKeyDown={e => handleKeyDown(e, element.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {elementControls}
            <div className="max-w-3xl mx-auto">
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={`https://www.youtube.com/embed/${videoElement.videoId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-md"
                ></iframe>
              </div>
              {videoElement.caption && (
                <p className="text-sm text-center text-gray-400 mt-2">{videoElement.caption}</p>
              )}
            </div>
          </div>
        );
      }
      
      case 'list-ordered':
      case 'list-unordered': {
        const listElement = element as ListElement;
        const ListTag = listElement.type === 'list-ordered' ? 'ol' : 'ul';
        
        return (
          <div 
            key={element.id} 
            className={`${classList} ${positionClass} mb-4`}
            onClick={() => handleFocus(element.id)}
            tabIndex={0}
            ref={el => { elementRefs.current[element.id] = el; }}
            onKeyDown={e => handleKeyDown(e, element.id)}
          >
            <ListTag className={listElement.type === 'list-ordered' ? 'list-decimal ml-6' : 'list-disc ml-6'}>
              {listElement.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ListTag>
          </div>
        );
      }
      
      case 'poll': {
        const pollElement = element as PollElement;
        return (
          <div 
            key={element.id} 
            className={`${classList} ${positionClass} mb-6 p-4 border border-white/20 rounded-lg`}
            onClick={() => handleFocus(element.id)}
            tabIndex={0}
            ref={el => { elementRefs.current[element.id] = el; }}
            onKeyDown={e => handleKeyDown(e, element.id)}
          >
            <h3 className="text-lg font-bold mb-3">{pollElement.question}</h3>
            <div className="space-y-2">
              {pollElement.options.map((option, i) => (
                <div key={i} className="flex items-center p-2 bg-white/5 rounded">
                  <input 
                    type={pollElement.multipleChoice ? "checkbox" : "radio"} 
                    name={`poll-${pollElement.id}`}
                    className="mr-2"
                    disabled={readOnly}
                  />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-[#1E1E2D] text-white rounded-lg flex flex-col h-full">
      {!readOnly && (
        <div className="p-4 border-b border-white/10 sticky top-0 z-10 bg-[#1E1E2D]">
          {renderToolbar()}
        </div>
      )}
      
      <div className="p-4 overflow-y-auto flex-grow" style={{ height: 'calc(100% - 60px)' }}>
        {elements.map((element, index) => renderElement(element, index))}
      </div>
      
      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-url">Image URL</Label>
              <Input 
                id="image-url" 
                placeholder="https://example.com/image.png" 
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input 
                id="image-alt" 
                placeholder="Description of the image" 
                value={imageAlt}
                onChange={e => setImageAlt(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="image-caption">Caption (optional)</Label>
              <Input 
                id="image-caption" 
                placeholder="Image caption" 
                value={imageCaption}
                onChange={e => setImageCaption(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleImageSubmit}>Add Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add YouTube Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-url">YouTube URL</Label>
              <Input 
                id="video-url" 
                placeholder="https://www.youtube.com/watch?v=..." 
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="video-caption">Caption (optional)</Label>
              <Input 
                id="video-caption" 
                placeholder="Video caption" 
                value={videoCaption}
                onChange={e => setVideoCaption(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleVideoSubmit}>Add Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Poll Dialog */}
      <Dialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="poll-question">Question</Label>
              <Input 
                id="poll-question" 
                placeholder="Enter your poll question" 
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
              />
            </div>
            <div>
              <Label>Options</Label>
              <div className="space-y-2 mt-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input 
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={e => updatePollOption(index, e.target.value)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removePollOption(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addPollOption}
                  className="mt-2"
                >
                  Add Option
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="multiple-choice"
                checked={pollMultipleChoice}
                onChange={e => setPollMultipleChoice(e.target.checked)}
              />
              <Label htmlFor="multiple-choice">Allow multiple choices</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPollDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePollSubmit}>Add Poll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}