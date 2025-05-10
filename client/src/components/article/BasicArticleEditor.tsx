import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Link as LinkIcon,
  PlusCircle,
  Type,
  Quote,
  Code
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Block {
  id: string;
  type: string;
  content: string;
  align?: string;
  heading?: string;
  imageUrl?: string;
  altText?: string;
  url?: string;
  question?: string;
  options?: string[];
  multipleChoice?: boolean;
}

interface ArticleEditorProps {
  initialContent?: Block[];
  onChange: (content: Block[]) => void;
}

// Helper function to create an empty content block
const createEmptyBlock = (): Block => ({
  id: uuidv4(),
  type: 'paragraph',
  content: '',
  align: 'left',
});

const ArticleEditor: React.FC<ArticleEditorProps> = ({ initialContent = [], onChange }) => {
  const [content, setContent] = useState<Block[]>(initialContent.length > 0 ? initialContent : [createEmptyBlock()]);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentAltText, setCurrentAltText] = useState('');
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');
  const [currentLinkText, setCurrentLinkText] = useState('');
  const [currentPollQuestion, setCurrentPollQuestion] = useState('');
  const [currentPollOptions, setCurrentPollOptions] = useState(['', '']);
  const [currentPollMultipleChoice, setCurrentPollMultipleChoice] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const editorRefs = useRef<(HTMLTextAreaElement | HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    onChange(content);
  }, [content, onChange]);

  const addBlock = (type: string, index: number) => {
    const newBlock = {
      id: uuidv4(),
      type,
      content: '',
      align: 'left',
    };
    
    const newContent = [...content];
    newContent.splice(index + 1, 0, newBlock);
    setContent(newContent);
    
    // Focus the new block after it's rendered
    setTimeout(() => {
      setActiveBlockIndex(index + 1);
      if (editorRefs.current[index + 1]) {
        editorRefs.current[index + 1]?.focus();
      }
    }, 10);
  };

  const removeBlock = (index: number) => {
    if (content.length === 1) {
      // Keep at least one block
      const emptyBlock = createEmptyBlock();
      setContent([emptyBlock]);
      return;
    }
    
    const newContent = [...content];
    newContent.splice(index, 1);
    setContent(newContent);
    
    // Set active block to the previous one or the next one if it was the first
    const newActiveIndex = index > 0 ? index - 1 : 0;
    setActiveBlockIndex(newActiveIndex);
  };

  const updateBlockContent = (index: number, newContent: string) => {
    setContent(prevContent => 
      prevContent.map((block, i) => 
        i === index ? { ...block, content: newContent } : block
      )
    );
  };

  const updateBlockAlign = (index: number, align: string) => {
    setContent(prevContent => 
      prevContent.map((block, i) => 
        i === index ? { ...block, align } : block
      )
    );
  };

  const updateBlockType = (index: number, type: string) => {
    setContent(prevContent => 
      prevContent.map((block, i) => 
        i === index ? { ...block, type } : block
      )
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) {
      return;
    }
    
    const newContent = [...content];
    const [removed] = newContent.splice(sourceIndex, 1);
    newContent.splice(destIndex, 0, removed);
    
    setContent(newContent);
    setActiveBlockIndex(destIndex);
  };

  const addImageBlock = () => {
    setCurrentImageUrl('');
    setCurrentAltText('');
    setImageDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Use fetch directly for form data uploads
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setCurrentImageUrl(data.imageUrl);
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setImageUploading(false);
    }
  };

  const confirmImageAdd = () => {
    if (!currentImageUrl) {
      toast({
        title: 'Missing image URL',
        description: 'Please enter an image URL or upload an image',
        variant: 'destructive',
      });
      return;
    }
    
    const newBlock = {
      id: uuidv4(),
      type: 'image',
      content: '',
      imageUrl: currentImageUrl,
      altText: currentAltText || 'Image',
      align: 'center',
    };
    
    const newContent = [...content];
    newContent.splice(activeBlockIndex + 1, 0, newBlock);
    setContent(newContent);
    setImageDialogOpen(false);
  };

  const addLinkBlock = () => {
    setCurrentLinkUrl('');
    setCurrentLinkText('');
    setLinkDialogOpen(true);
  };

  const confirmLinkAdd = () => {
    if (!currentLinkUrl) {
      toast({
        title: 'Missing URL',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }
    
    const linkText = currentLinkText || currentLinkUrl;
    
    // Insert the link into the current block's content
    const block = content[activeBlockIndex];
    
    if (block.type === 'paragraph' || block.type === 'heading') {
      const textArea = editorRefs.current[activeBlockIndex] as HTMLTextAreaElement;
      
      if (textArea) {
        const startPos = textArea.selectionStart;
        const endPos = textArea.selectionEnd;
        
        const beforeText = block.content.substring(0, startPos);
        const selectedText = block.content.substring(startPos, endPos);
        const afterText = block.content.substring(endPos);
        
        const newText = selectedText 
          ? `${beforeText}[${selectedText}](${currentLinkUrl})${afterText}`
          : `${beforeText}[${linkText}](${currentLinkUrl})${afterText}`;
        
        updateBlockContent(activeBlockIndex, newText);
      }
    }
    
    setLinkDialogOpen(false);
  };

  const addPollBlock = () => {
    setCurrentPollQuestion('');
    setCurrentPollOptions(['', '']);
    setCurrentPollMultipleChoice(false);
    setPollDialogOpen(true);
  };

  const addPollOption = () => {
    setCurrentPollOptions([...currentPollOptions, '']);
  };

  const removePollOption = (index: number) => {
    if (currentPollOptions.length <= 2) {
      toast({
        title: 'Minimum options required',
        description: 'A poll must have at least 2 options',
        variant: 'destructive',
      });
      return;
    }
    
    const newOptions = [...currentPollOptions];
    newOptions.splice(index, 1);
    setCurrentPollOptions(newOptions);
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...currentPollOptions];
    newOptions[index] = value;
    setCurrentPollOptions(newOptions);
  };

  const confirmPollAdd = () => {
    if (!currentPollQuestion) {
      toast({
        title: 'Missing question',
        description: 'Please enter a poll question',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentPollOptions.filter(opt => opt.trim()).length < 2) {
      toast({
        title: 'Insufficient options',
        description: 'Please provide at least 2 valid options',
        variant: 'destructive',
      });
      return;
    }
    
    const newBlock = {
      id: uuidv4(),
      type: 'poll',
      content: '',
      question: currentPollQuestion,
      options: currentPollOptions.filter(opt => opt.trim()),
      multipleChoice: currentPollMultipleChoice,
    };
    
    const newContent = [...content];
    newContent.splice(activeBlockIndex + 1, 0, newBlock);
    setContent(newContent);
    
    setCurrentPollQuestion('');
    setCurrentPollOptions(['', '']);
    setCurrentPollMultipleChoice(false);
    setPollDialogOpen(false);
  };

  const blockControls = (block: Block, index: number) => (
    <div className="bg-[#1A1A27] rounded-lg p-3 flex space-x-2 mb-2 border border-white/10">
      {block.type === 'paragraph' || block.type === 'heading' ? (
        <>
          <div className="border-r border-white/10 pr-2 flex space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${block.type === 'paragraph' ? 'bg-white/10' : ''}`}
              onClick={() => updateBlockType(index, 'paragraph')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${block.type === 'heading' && block.heading === 'h2' ? 'bg-white/10' : ''}`}
              onClick={() => {
                updateBlockType(index, 'heading');
                setContent(prevContent => 
                  prevContent.map((b, i) => 
                    i === index ? { ...b, heading: 'h2' } : b
                  )
                );
              }}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${block.type === 'heading' && block.heading === 'h3' ? 'bg-white/10' : ''}`}
              onClick={() => {
                updateBlockType(index, 'heading');
                setContent(prevContent => 
                  prevContent.map((b, i) => 
                    i === index ? { ...b, heading: 'h3' } : b
                  )
                );
              }}
            >
              <Type className="h-3 w-3" />
            </Button>
          </div>
          <div className="border-r border-white/10 pr-2 flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${block.align === 'left' ? 'bg-white/10' : ''}`}
              onClick={() => updateBlockAlign(index, 'left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${block.align === 'center' ? 'bg-white/10' : ''}`}
              onClick={() => updateBlockAlign(index, 'center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${block.align === 'right' ? 'bg-white/10' : ''}`}
              onClick={() => updateBlockAlign(index, 'right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="border-r border-white/10 pr-2 flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                const textArea = editorRefs.current[index] as HTMLTextAreaElement;
                if (textArea) {
                  const startPos = textArea.selectionStart;
                  const endPos = textArea.selectionEnd;
                  const beforeText = block.content.substring(0, startPos);
                  const selectedText = block.content.substring(startPos, endPos);
                  const afterText = block.content.substring(endPos);
                  updateBlockContent(index, `${beforeText}**${selectedText}**${afterText}`);
                }
              }}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                const textArea = editorRefs.current[index] as HTMLTextAreaElement;
                if (textArea) {
                  const startPos = textArea.selectionStart;
                  const endPos = textArea.selectionEnd;
                  const beforeText = block.content.substring(0, startPos);
                  const selectedText = block.content.substring(startPos, endPos);
                  const afterText = block.content.substring(endPos);
                  updateBlockContent(index, `${beforeText}*${selectedText}*${afterText}`);
                }
              }}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          {block.type === 'image' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs">Image settings</span>
              <select
                value={block.align}
                onChange={(e) => {
                  const align = e.target.value;
                  setContent(prevContent => 
                    prevContent.map((b, i) => 
                      i === index ? { ...b, align } : b
                    )
                  );
                }}
                className="h-8 rounded bg-[#121220] border border-white/10 text-xs px-2"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="full">Full width</option>
              </select>
            </div>
          )}
          
          {block.type === 'poll' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs">Poll settings</span>
            </div>
          )}
        </>
      )}
      
      <div className="ml-auto flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => addBlock('paragraph', index)}
        >
          Add block
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => removeBlock(index)}
        >
          &times;
        </Button>
      </div>
    </div>
  );

  const renderBlock = (block: Block, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <textarea
            ref={el => editorRefs.current[index] = el}
            value={block.content}
            onChange={e => updateBlockContent(index, e.target.value)}
            onFocus={() => setActiveBlockIndex(index)}
            className={`w-full min-h-[100px] p-4 bg-[#141422] border border-white/10 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none text-${block.align}`}
            placeholder="Type paragraph text here..."
          />
        );
      
      case 'heading':
        return (
          <textarea
            ref={el => editorRefs.current[index] = el}
            value={block.content}
            onChange={e => updateBlockContent(index, e.target.value)}
            onFocus={() => setActiveBlockIndex(index)}
            className={`w-full p-4 bg-[#141422] border border-white/10 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none text-${block.align} ${
              block.heading === 'h2' ? 'text-2xl font-bold' : 'text-xl font-semibold'
            }`}
            placeholder={`Type ${block.heading} heading here...`}
            rows={2}
          />
        );
      
      case 'image':
        return (
          <div className={`text-${block.align} p-4 bg-[#141422] border border-white/10 rounded-lg`}>
            <img 
              src={block.imageUrl} 
              alt={block.altText} 
              className={`
                ${block.align === 'left' ? 'float-left mr-4 w-1/2' : ''}
                ${block.align === 'right' ? 'float-right ml-4 w-1/2' : ''}
                ${block.align === 'center' ? 'mx-auto max-w-[70%]' : ''}
                ${block.align === 'full' ? 'w-full' : ''}
                rounded-lg
              `}
            />
            <input
              ref={el => editorRefs.current[index] = el}
              type="text"
              value={block.altText || ''}
              onChange={e => {
                setContent(prevContent => 
                  prevContent.map((b, i) => 
                    i === index ? { ...b, altText: e.target.value } : b
                  )
                );
              }}
              onFocus={() => setActiveBlockIndex(index)}
              className="w-full mt-2 p-2 bg-[#0D0D1A] border border-white/10 rounded text-sm"
              placeholder="Image description (alt text)"
            />
          </div>
        );
      
      case 'poll':
        return (
          <div className="p-4 bg-[#141422] border border-white/10 rounded-lg">
            <h3 className="font-bold text-lg mb-2">{block.question}</h3>
            <div className="space-y-2">
              {block.options?.map((option, i) => (
                <div 
                  key={i} 
                  className="flex items-center p-2 bg-[#1A1A27] rounded border border-white/10 hover:border-primary/50 cursor-pointer"
                >
                  <span className="ml-2">{option}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-white/60">
              {block.multipleChoice ? 'Multiple choices allowed' : 'Single choice only'}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="article-editor">
      <div className="sticky top-0 z-10 bg-[#14141E] p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock('paragraph', content.length - 1)}
          >
            <AlignLeft className="h-4 w-4 mr-1" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addImageBlock}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addPollBlock}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Poll
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateBlockType(activeBlockIndex, 'blockquote');
            }}
          >
            <Quote className="h-4 w-4 mr-1" />
            Quote
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addLinkBlock}
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            Link
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="article-blocks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-6"
              >
                {content.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${index === activeBlockIndex ? 'ring-2 ring-primary/30 bg-[#0A0A15]' : ''} rounded-lg transition-all duration-200`}
                      >
                        <div className="relative">
                          <div 
                            {...provided.dragHandleProps}
                            className="absolute top-0 right-0 w-6 h-6 bg-[#1E1E2D] text-white/40 flex items-center justify-center rounded-bl cursor-move"
                          >
                            ⋮
                          </div>
                          <div className="p-2">
                            {index === activeBlockIndex && blockControls(block, index)}
                            {renderBlock(block, index)}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => addBlock('paragraph', content.length - 1)}
            className="w-full border-dashed"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Content Block
          </Button>
        </div>
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
            <DialogDescription>Upload or enter the URL of an image</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Upload Image</Label>
              <div className="flex items-center">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="flex-1"
                />
                {imageUploading && <span className="ml-2 text-sm">Uploading...</span>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={currentImageUrl}
                onChange={(e) => setCurrentImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alt-text">Alt Text</Label>
              <Input
                id="alt-text"
                value={currentAltText}
                onChange={(e) => setCurrentAltText(e.target.value)}
                placeholder="Describe the image"
              />
            </div>
            
            {currentImageUrl && (
              <div className="rounded-md overflow-hidden border border-white/10">
                <img 
                  src={currentImageUrl} 
                  alt={currentAltText || 'Preview'} 
                  className="max-h-40 mx-auto" 
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setImageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmImageAdd}>Add Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>Enter the URL and display text</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={currentLinkUrl}
                onChange={(e) => setCurrentLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link-text">Display Text</Label>
              <Input
                id="link-text"
                value={currentLinkText}
                onChange={(e) => setCurrentLinkText(e.target.value)}
                placeholder="Click here"
              />
              <p className="text-xs text-white/60">Leave empty to use URL as link text</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmLinkAdd}>Add Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Poll Dialog */}
      <Dialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
            <DialogDescription>Set up your interactive poll</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="poll-question">Question</Label>
              <Input
                id="poll-question"
                value={currentPollQuestion}
                onChange={(e) => setCurrentPollQuestion(e.target.value)}
                placeholder="What is your favorite planet?"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Options</Label>
              {currentPollOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => removePollOption(index)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={addPollOption}
                className="mt-2"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="multiple-choice"
                checked={currentPollMultipleChoice}
                onChange={(e) => setCurrentPollMultipleChoice(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="multiple-choice" className="text-sm">Allow multiple choices</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPollDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmPollAdd}>Create Poll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticleEditor;