import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PlusCircle, 
  Image as ImageIcon, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Bold,
  Italic,
  Link as LinkIcon,
  Youtube,
  ListOrdered,
  List,
  Quote
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type BlockType = 'text' | 'heading' | 'image' | 'youtube' | 'list' | 'quote';

interface Block {
  id: string;
  type: BlockType;
  content: string;
  level?: number; // For headings
  imageUrl?: string;
  align?: 'left' | 'center' | 'right';
}

interface ArticleEditorProps {
  initialArticle?: any;
  onSave: (article: any) => void;
}

function ArticleEditorSimple({ initialArticle, onSave }: ArticleEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const { toast } = useToast();
  
  // Initialize content
  useEffect(() => {
    if (initialArticle?.content?.blocks?.length > 0) {
      setBlocks(initialArticle.content.blocks);
    } else {
      // Start with an empty text block
      setBlocks([
        {
          id: uuidv4(),
          type: 'text',
          content: '',
          align: 'left'
        }
      ]);
    }
  }, [initialArticle]);
  
  // Add a new block
  const addBlock = (type: BlockType, index: number) => {
    const newBlock: Block = {
      id: uuidv4(),
      type,
      content: '',
      align: 'left'
    };
    
    // Special defaults for different block types
    if (type === 'heading') {
      newBlock.level = 2;
    }
    
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setActiveBlockIndex(index + 1);
  };
  
  // Remove a block
  const removeBlock = (index: number) => {
    if (blocks.length <= 1) {
      // Keep at least one block
      return;
    }
    
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
    
    if (activeBlockIndex === index) {
      setActiveBlockIndex(Math.max(0, index - 1));
    } else if (activeBlockIndex !== null && activeBlockIndex > index) {
      setActiveBlockIndex(activeBlockIndex - 1);
    }
  };
  
  // Update a block
  const updateBlock = (index: number, changes: Partial<Block>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      ...changes
    };
    setBlocks(newBlocks);
  };
  
  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(sourceIndex, 1);
    newBlocks.splice(destinationIndex, 0, removed);
    
    setBlocks(newBlocks);
    if (activeBlockIndex === sourceIndex) {
      setActiveBlockIndex(destinationIndex);
    }
  };
  
  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingImage(true);
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await apiRequest('POST', '/api/upload', formData, {
        isFormData: true
      });
      
      const data = await response.json();
      setTempImageUrl(data.imageUrl || data.url);
      
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Image upload failed',
        description: 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Add image block
  const addImageBlock = () => {
    setTempImageUrl('');
    setImageDialogOpen(true);
  };
  
  // Confirm adding image
  const confirmAddImage = () => {
    if (!tempImageUrl) {
      toast({
        title: 'No image',
        description: 'Please upload or enter an image URL',
        variant: 'destructive'
      });
      return;
    }
    
    const newBlock: Block = {
      id: uuidv4(),
      type: 'image',
      content: '',
      imageUrl: tempImageUrl,
      align: 'center'
    };
    
    const insertIndex = activeBlockIndex !== null ? activeBlockIndex : blocks.length - 1;
    const newBlocks = [...blocks];
    newBlocks.splice(insertIndex + 1, 0, newBlock);
    
    setBlocks(newBlocks);
    setImageDialogOpen(false);
    setActiveBlockIndex(insertIndex + 1);
  };
  
  // Save the article
  const saveArticle = () => {
    if (initialArticle) {
      onSave({
        ...initialArticle,
        content: {
          blocks
        }
      });
    }
  };
  
  // Render block controls
  const renderBlockControls = (index: number, block: Block) => (
    <div className="flex items-center space-x-1 mb-2 p-2 bg-[#1A1A27] rounded-lg border border-white/10">
      {/* Block type controls */}
      <div className="border-r border-white/10 pr-1 flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${block.type === 'text' ? 'bg-white/10' : ''}`}
          onClick={() => updateBlock(index, { type: 'text' })}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${block.type === 'heading' && block.level === 2 ? 'bg-white/10' : ''}`}
          onClick={() => updateBlock(index, { type: 'heading', level: 2 })}
        >
          <Type className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${block.type === 'quote' ? 'bg-white/10' : ''}`}
          onClick={() => updateBlock(index, { type: 'quote' })}
        >
          <Quote className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Alignment controls */}
      {(block.type === 'text' || block.type === 'heading' || block.type === 'image') && (
        <div className="border-r border-white/10 pr-1 flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${block.align === 'left' ? 'bg-white/10' : ''}`}
            onClick={() => updateBlock(index, { align: 'left' })}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${block.align === 'center' ? 'bg-white/10' : ''}`}
            onClick={() => updateBlock(index, { align: 'center' })}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${block.align === 'right' ? 'bg-white/10' : ''}`}
            onClick={() => updateBlock(index, { align: 'right' })}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      
      {/* Other controls */}
      <div className="flex-1"></div>
      
      {/* Add/Remove */}
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => addBlock('text', index)}
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => removeBlock(index)}
        >
          &times;
        </Button>
      </div>
    </div>
  );
  
  // Render a block
  const renderBlock = (block: Block, index: number) => {
    switch (block.type) {
      case 'text':
        return (
          <Textarea
            value={block.content}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
            placeholder="Type paragraph text here..."
            className={`w-full resize-none min-h-[200px] bg-[#0F0F19] border border-white/10 rounded-lg text-${block.align}`}
            onFocus={() => setActiveBlockIndex(index)}
            rows={10}
          />
        );
      
      case 'heading':
        return (
          <Textarea
            value={block.content}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
            placeholder="Type heading here..."
            className={`w-full resize-none bg-[#0F0F19] border border-white/10 rounded-lg ${
              block.level === 2 ? 'text-2xl font-bold' : 'text-xl font-semibold'
            } text-${block.align}`}
            onFocus={() => setActiveBlockIndex(index)}
            rows={3}
          />
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            <div className={`bg-[#0F0F19] border border-white/10 rounded-lg p-4 text-${block.align}`}>
              <img
                src={block.imageUrl}
                alt="Content"
                className={`
                  ${block.align === 'center' ? 'mx-auto' : ''}
                  ${block.align === 'left' ? 'float-left mr-4' : ''}
                  ${block.align === 'right' ? 'float-right ml-4' : ''}
                  max-h-[400px] rounded-lg
                `}
                onFocus={() => setActiveBlockIndex(index)}
              />
            </div>
            <Input
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              placeholder="Image caption (optional)"
              className="bg-[#0F0F19] border border-white/10 rounded-lg"
              onFocus={() => setActiveBlockIndex(index)}
            />
          </div>
        );
      
      case 'quote':
        return (
          <div className="bg-[#0F0F19] border-l-4 border-primary p-4 rounded-r-lg">
            <Textarea
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              placeholder="Type quote here..."
              className="w-full resize-none border-none bg-transparent focus:ring-0 italic"
              onFocus={() => setActiveBlockIndex(index)}
            />
          </div>
        );
      
      default:
        return (
          <div className="p-4 bg-[#0F0F19] border border-white/10 rounded-lg text-white/60 text-center">
            Unknown block type: {block.type}
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Editor toolbar */}
      <Card className="bg-[#14141E] border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addBlock('text', activeBlockIndex !== null ? activeBlockIndex : blocks.length - 1)}
            >
              <AlignLeft className="h-4 w-4 mr-1" /> Text
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addBlock('heading', activeBlockIndex !== null ? activeBlockIndex : blocks.length - 1)}
            >
              <Type className="h-4 w-4 mr-1" /> Heading
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={addImageBlock}
            >
              <ImageIcon className="h-4 w-4 mr-1" /> Image
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addBlock('quote', activeBlockIndex !== null ? activeBlockIndex : blocks.length - 1)}
            >
              <Quote className="h-4 w-4 mr-1" /> Quote
            </Button>
            <div className="ml-auto">
              <Button 
                onClick={saveArticle}
                className="bg-primary hover:bg-primary/90"
              >
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Content blocks - IMPROVED LAYOUT */}
      <div className="bg-[#1A1A27] border border-white/10 rounded-lg p-6 shadow-lg min-h-[600px]">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="article-blocks">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-8"
              >
                {blocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`rounded-lg p-4 ${
                          activeBlockIndex === index 
                            ? 'ring-2 ring-primary/30 bg-[#14141E]' 
                            : 'bg-[#14141E]'
                        }`}
                      >
                        <div className="relative">
                          <div 
                            {...provided.dragHandleProps}
                            className="absolute top-2 right-2 w-8 h-8 bg-[#1E1E2D] text-white/60 flex items-center justify-center rounded-md cursor-move z-10 hover:bg-primary/20 hover:text-primary"
                          >
                            ⋮⋮
                          </div>
                          
                          {activeBlockIndex === index && renderBlockControls(index, block)}
                          {renderBlock(block, index)}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {/* Add a block button inside the editor */}
                <div className="flex justify-center mt-6">
                  <div className="inline-flex space-x-2">
                    <Button
                      variant="outline"
                      className="border-dashed"
                      onClick={() => addBlock('text', blocks.length - 1)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Text
                    </Button>
                    <Button
                      variant="outline"
                      className="border-dashed"
                      onClick={() => addBlock('heading', blocks.length - 1)}
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Add Heading
                    </Button>
                    <Button
                      variant="outline"
                      className="border-dashed"
                      onClick={addImageBlock}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      
      {/* Image dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Upload Image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }}
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="text-sm text-white/60">Uploading...</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image-url">Or enter image URL</Label>
              <Input
                id="image-url"
                value={tempImageUrl}
                onChange={(e) => setTempImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            {tempImageUrl && (
              <div className="mt-4 p-2 border border-white/10 rounded-lg">
                <img 
                  src={tempImageUrl} 
                  alt="Preview" 
                  className="max-h-40 mx-auto" 
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAddImage}>
              Add Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ArticleEditorSimple;