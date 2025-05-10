import { useState, useRef, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Type, 
  ImageIcon, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3, 
  ListOrdered, 
  List, 
  Quote, 
  SeparatorHorizontal,
  LockIcon,
  Youtube,
  Map,
  BarChart4,
  ExternalLink,
  InfoIcon,
  AlertTriangle,
  Save,
  Eye,
  Hash,
  ChevronDown,
  ChevronUp,
  FileCode,
  BarChart2,
  ListTodo,
  Layout,
  Columns,
  Plus,
  AlertCircle,
  X
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { nanoid } from "nanoid";
import { apiRequest } from "@/lib/queryClient";
import { ChromePicker } from "react-color";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ArticleEditorProps {
  initialArticle?: any;
  onSave: (article: any) => void;
}

// Ensure all content blocks have unique IDs
const ensureBlockIds = (blocks: any[]) => {
  return blocks.map(block => {
    if (!block.id) {
      return {...block, id: nanoid(8)};
    }
    return block;
  });
};

function ArticleEditor({ initialArticle, onSave }: ArticleEditorProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialArticle?.title || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [summary, setSummary] = useState(initialArticle?.summary || "");
  const [category, setCategory] = useState(initialArticle?.category || "space");
  const [featuredImage, setFeaturedImage] = useState(initialArticle?.featuredImage || "");
  const [isBreaking, setIsBreaking] = useState(initialArticle?.isBreaking || false);
  const [readTime, setReadTime] = useState(initialArticle?.readTime || 5);
  const [tags, setTags] = useState<string[]>(initialArticle?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([
    "mars", "space", "astronomy", "physics", "spacex", "nasa", "iss", 
    "satellite", "exoplanet", "telescope", "blackhole", "rocket", "moon", 
    "jupiter", "galaxy", "climate", "science", "technology", "engineering", 
    "mathematics", "research", "discovery", "innovation"
  ]);
  const [content, setContent] = useState<any[]>(
    ensureBlockIds(initialArticle?.content?.blocks || [])
  );
  const [isDraft, setIsDraft] = useState<boolean>(initialArticle?.status === "draft" || true);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  
  // Tag management functions
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    
    // Don't add duplicates
    if (tags.includes(newTag)) {
      toast({
        title: "Tag already exists",
        description: "This tag has already been added to the article.",
        variant: "destructive",
      });
      return;
    }
    
    // Add to article tags
    setTags([...tags, newTag]);
    
    // Add to available tags if it's not already there
    if (!availableTags.includes(newTag)) {
      setAvailableTags([...availableTags, newTag]);
    }
    
    // Clear input
    setTagInput("");
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  const editorRef = useRef<HTMLDivElement>(null);

  // New state variables for enhanced features
  const [showTableOfContents, setShowTableOfContents] = useState(initialArticle?.showTableOfContents || true);
  const [tocPlacement, setTocPlacement] = useState(initialArticle?.tocPlacement || "top"); // top, left, right
  const [tocAutomatic, setTocAutomatic] = useState(initialArticle?.tocAutomatic || true);
  const [manualToc, setManualToc] = useState<{title: string, anchor: string}[]>(initialArticle?.manualToc || []);
  const [tocTitle, setTocTitle] = useState(initialArticle?.tocTitle || "Table of Contents");
  const [imageUploadDialogOpen, setImageUploadDialogOpen] = useState(false);
  // availableTags already declared above
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [currentPollOptions, setCurrentPollOptions] = useState<string[]>([""]);
  const [currentPollQuestion, setCurrentPollQuestion] = useState("");
  const [currentPollMultipleChoice, setCurrentPollMultipleChoice] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [newTocItem, setNewTocItem] = useState({ title: "", anchor: "" });

  // Dropzone for featured image
  const onFeaturedImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // In a real app, you would upload the file to a server and get a URL back
      // For this example, we'll create a data URL
      const reader = new FileReader();
      reader.onload = () => {
        setFeaturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps: getFeaturedImageRootProps, getInputProps: getFeaturedImageInputProps } = useDropzone({
    onDrop: onFeaturedImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1
  });

  // Auto-generate slug from title
  const generateSlug = () => {
    const slugified = title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-");
    setSlug(slugified);
  };

  // Using the addTag and removeTag functions from above

  // Add a new content block
  const addBlock = (type: string) => {
    // For polls, open the poll dialog instead of directly adding the block
    if (type === "poll") {
      setPollDialogOpen(true);
      return;
    }
    
    const newBlock = createEmptyBlock(type);
    
    // Insert at active index or append to end
    if (activeBlockIndex !== null) {
      const newContent = [...content];
      newContent.splice(activeBlockIndex + 1, 0, newBlock);
      setContent(newContent);
      setActiveBlockIndex(activeBlockIndex + 1);
    } else {
      setContent([...content, newBlock]);
      setActiveBlockIndex(content.length);
    }
  };

  // Create an empty block of the specified type
  const createEmptyBlock = (type: string): any => {
    const blockId = nanoid(8);
    
    switch (type) {
      case "paragraph":
        return { id: blockId, type: "paragraph", content: "" };
      case "heading":
        return { id: blockId, type: "heading", content: "", level: 2, anchor: `section-${blockId}` };
      case "image":
        return { 
          id: blockId, 
          type: "image", 
          url: "", 
          alt: "", 
          caption: "", 
          alignment: "center", // new: left, center, right
          width: 100, // percentage of container width
          float: "none" // none, left, right (for text wrapping)
        };
      case "code":
        return { id: blockId, type: "code", content: "", language: "javascript" };
      case "list":
        return { id: blockId, type: "list", items: [""], ordered: false };
      case "quote":
        return { id: blockId, type: "quote", content: "", author: "", source: "" };
      case "divider":
        return { id: blockId, type: "divider" };
      case "premium":
        return { id: blockId, type: "premium", content: { type: "paragraph", content: "" } };
      case "embed":
        return { id: blockId, type: "embed", html: "", caption: "" };
      case "youtube":
        return { id: blockId, type: "youtube", html: "", videoId: "", caption: "" };
      case "chart":
        return { id: blockId, type: "chart", data: { labels: [], datasets: [] }, options: {}, chartType: "bar" };
      case "map":
        return { id: blockId, type: "map", lat: 0, lng: 0, zoom: 10, caption: "" };
      case "callout":
        return { id: blockId, type: "callout", content: "", calloutType: "info" };
      case "poll":
        return { 
          id: blockId, 
          type: "poll", 
          question: "", 
          options: ["", ""], 
          allowMultiple: false,
          expiresAt: null, // null for never expires
          backgroundColor: "#1e1e2d", 
          textColor: "#ffffff" 
        };
      case "html":
        return { id: blockId, type: "html", content: "" };
      case "table":
        return { 
          id: blockId, 
          type: "table", 
          rows: 2, 
          columns: 2, 
          data: [["Header 1", "Header 2"], ["", ""]], 
          hasHeaderRow: true 
        };
      case "toc":
        return { 
          id: blockId, 
          type: "toc", 
          title: "Table of Contents", 
          automatic: true, 
          items: [] 
        };
      case "columns":
        return {
          id: blockId,
          type: "columns",
          columns: [
            { blocks: [createEmptyBlock("paragraph")] },
            { blocks: [createEmptyBlock("paragraph")] }
          ],
          ratio: "1:1" // 1:1, 1:2, 2:1, etc.
        };
      default:
        return { id: blockId, type: "paragraph", content: "" };
    }
  };
  
  // Handle the drag end event 
  const handleDragEnd = (result: DropResult) => {
    // If not dropped in a droppable area or dropped in same position, do nothing
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    
    // Create a new array with the reordered blocks
    const reorderedBlocks = Array.from(content);
    const [removed] = reorderedBlocks.splice(result.source.index, 1);
    reorderedBlocks.splice(result.destination.index, 0, removed);
    
    // Update the content state
    setContent(reorderedBlocks);
  };
  
  // Generate table of contents from headings
  const generateTableOfContents = () => {
    const toc: {title: string, anchor: string, level: number}[] = [];
    
    content.forEach(block => {
      if (block.type === "heading" && block.content.trim()) {
        toc.push({
          title: block.content,
          anchor: block.anchor || `heading-${block.id}`,
          level: block.level
        });
      }
    });
    
    return toc;
  };
  
  // Create poll function
  const createPoll = () => {
    const poll = {
      question: currentPollQuestion,
      options: currentPollOptions.filter(opt => opt.trim() !== ""),
      allowMultiple: currentPollMultipleChoice,
      backgroundColor: "#1e1e2d",
      textColor: "#ffffff"
    };
    
    // Add a new poll block
    const pollBlock = createEmptyBlock("poll");
    pollBlock.question = poll.question;
    pollBlock.options = poll.options;
    pollBlock.allowMultiple = poll.allowMultiple;
    pollBlock.backgroundColor = poll.backgroundColor;
    pollBlock.textColor = poll.textColor;
    
    // Insert at active index or append to end
    if (activeBlockIndex !== null) {
      const newContent = [...content];
      newContent.splice(activeBlockIndex + 1, 0, pollBlock);
      setContent(newContent);
      setActiveBlockIndex(activeBlockIndex + 1);
    } else {
      setContent([...content, pollBlock]);
      setActiveBlockIndex(content.length);
    }
    
    // Reset poll state
    setCurrentPollQuestion("");
    setCurrentPollOptions([""]);
    setCurrentPollMultipleChoice(false);
    setPollDialogOpen(false);
  };

  // Update a block's content
  const updateBlock = (index: number, updatedBlock: any) => {
    const newContent = [...content];
    newContent[index] = { ...newContent[index], ...updatedBlock };
    setContent(newContent);
  };

  // Remove a block
  const removeBlock = (index: number) => {
    const newContent = [...content];
    newContent.splice(index, 1);
    setContent(newContent);
    if (activeBlockIndex === index) {
      setActiveBlockIndex(null);
    } else if (activeBlockIndex !== null && activeBlockIndex > index) {
      setActiveBlockIndex(activeBlockIndex - 1);
    }
  };

  // Move block up or down
  const moveBlock = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || 
        (direction === "down" && index === content.length - 1)) {
      return;
    }

    const newContent = [...content];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap blocks
    [newContent[index], newContent[targetIndex]] = [newContent[targetIndex], newContent[index]];
    
    setContent(newContent);
    setActiveBlockIndex(targetIndex);
  };

  // Convert YouTube URL to embed HTML
  const getYoutubeEmbed = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      const videoId = match[2];
      return {
        html: `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
        videoId,
      };
    }
    
    return { html: "", videoId: "" };
  };

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await apiRequest("GET", "/api/tags");
        const data = await response.json();
        setAvailableTags(data);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        // No need to show error toast as tags are not critical
      }
    };
    
    fetchTags();
  }, []);
  
  // Add TOC item to manual TOC
  const addTocItem = () => {
    if (newTocItem.title && newTocItem.anchor) {
      setManualToc([...manualToc, newTocItem]);
      setNewTocItem({ title: "", anchor: "" });
    }
  };
  
  // Save the article
  const saveArticle = async (publish: boolean = false) => {
    // Basic validation
    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for your article.",
        variant: "destructive",
      });
      return;
    }

    if (!summary.trim()) {
      toast({
        title: "Missing Summary",
        description: "Please provide a summary for your article.",
        variant: "destructive",
      });
      return;
    }

    if (content.length === 0) {
      toast({
        title: "No Content",
        description: "Please add some content to your article.",
        variant: "destructive",
      });
      return;
    }

    if (!featuredImage) {
      toast({
        title: "Missing Featured Image",
        description: "Please upload a featured image for your article.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data
    const articleData = {
      title,
      slug: slug || title.toLowerCase().replace(/[^\w\s]/gi, "").replace(/\s+/g, "-"),
      summary,
      content: { blocks: content },
      category,
      featuredImage,
      isBreaking,
      readTime: parseInt(readTime.toString()),
      tags,
      status: publish ? "published" : "draft",
      publishedAt: publish ? new Date().toISOString() : null,
      showTableOfContents,
      tocPlacement,
      tocAutomatic,
      manualToc: tocAutomatic ? [] : manualToc,
      tocTitle,
    };

    // Update or create
    try {
      if (initialArticle?.id) {
        // Update existing article
        const response = await apiRequest("PUT", `/api/articles/${initialArticle.id}`, articleData);
        toast({
          title: publish ? "Article Published" : "Draft Saved",
          description: publish 
            ? "Your article has been published successfully."
            : "Your draft has been saved successfully.",
        });
      } else {
        // Create new article
        const response = await apiRequest("POST", "/api/articles", articleData);
        toast({
          title: publish ? "Article Published" : "Draft Saved",
          description: publish 
            ? "Your article has been published successfully."
            : "Your draft has been saved successfully.",
        });
      }
      
      // Call the onSave callback
      onSave(articleData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save article. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render a block editor based on its type
  const renderBlockEditor = (block: any, index: number) => {
    const isActive = activeBlockIndex === index;

    const commonProps = {
      className: `relative p-4 my-2 rounded-lg border ${
        isActive ? "border-purple-500" : "border-white/10"
      } group transition-all`,
    };

    const blockControls = (
      <div className={`absolute right-2 top-2 flex space-x-1 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
          onClick={() => moveBlock(index, "up")}
          disabled={index === 0}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
          onClick={() => moveBlock(index, "down")}
          disabled={index === content.length - 1}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-red-500"
          onClick={() => removeBlock(index)}
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </Button>
      </div>
    );

    switch (block.type) {
      case "paragraph":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <Type className="h-4 w-4 absolute left-2 top-2 text-purple-500/70" />
            <Textarea
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              placeholder="Start writing..."
              className="resize-none border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 mt-3 mb-0"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
        
      case "html":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <FileCode className="h-4 w-4 absolute left-2 top-2 text-purple-500/70" />
            <div className="mt-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">HTML Editor</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => {
                    // Toggle preview
                    const updatedBlock = { ...block, preview: !block.preview };
                    updateBlock(index, updatedBlock);
                  }}
                >
                  {block.preview ? "Edit" : "Preview"}
                </Button>
              </div>
              
              {block.preview ? (
                <div 
                  className="mt-2 p-3 bg-black/30 rounded border border-white/10"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              ) : (
                <Textarea
                  value={block.content}
                  onChange={(e) => updateBlock(index, { content: e.target.value })}
                  placeholder="<div class='example'>Write your HTML here</div>"
                  className="mt-2 font-mono text-sm resize-y h-40 bg-black/30"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </div>
        );
        
      case "poll":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <BarChart2 className="h-4 w-4 absolute left-2 top-2 text-purple-500/70" />
            <div className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label htmlFor={`poll-question-${block.id}`}>Poll Question</Label>
                <Input
                  id={`poll-question-${block.id}`}
                  value={block.question}
                  onChange={(e) => updateBlock(index, { question: e.target.value })}
                  placeholder="Ask a question..."
                  className="bg-black/30"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Options</Label>
                {block.options.map((option: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...block.options];
                        newOptions[i] = e.target.value;
                        updateBlock(index, { options: newOptions });
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="bg-black/30"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {block.options.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500"
                        onClick={() => {
                          const newOptions = [...block.options];
                          newOptions.splice(i, 1);
                          updateBlock(index, { options: newOptions });
                        }}
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const newOptions = [...block.options, ""];
                    updateBlock(index, { options: newOptions });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Option
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`poll-multiple-${block.id}`}
                  checked={block.allowMultiple}
                  onCheckedChange={(checked) => {
                    updateBlock(index, { allowMultiple: checked === true });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label
                  htmlFor={`poll-multiple-${block.id}`}
                  className="text-sm"
                >
                  Allow multiple answers
                </Label>
              </div>
            </div>
          </div>
        );
        
      case "toc":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <List className="h-4 w-4 absolute left-2 top-2 text-purple-500/70" />
            <div className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label htmlFor={`toc-title-${block.id}`}>Table of Contents Title</Label>
                <Input
                  id={`toc-title-${block.id}`}
                  value={block.title}
                  onChange={(e) => updateBlock(index, { title: e.target.value })}
                  placeholder="Table of Contents"
                  className="bg-black/30"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`toc-auto-${block.id}`}
                  checked={block.automatic}
                  onCheckedChange={(checked) => {
                    updateBlock(index, { automatic: checked === true });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label 
                  htmlFor={`toc-auto-${block.id}`}
                  className="text-sm"
                >
                  Automatically generate from headings
                </Label>
              </div>
              
              {!block.automatic && (
                <div className="space-y-2 border-t border-white/10 pt-3 mt-3">
                  <Label>Manual Table of Contents Items</Label>
                  {block.items.map((item: {title: string, anchor: string}, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...block.items];
                          newItems[i] = { ...newItems[i], title: e.target.value };
                          updateBlock(index, { items: newItems });
                        }}
                        placeholder="Section title"
                        className="bg-black/30"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Input
                        value={item.anchor}
                        onChange={(e) => {
                          const newItems = [...block.items];
                          newItems[i] = { ...newItems[i], anchor: e.target.value };
                          updateBlock(index, { items: newItems });
                        }}
                        placeholder="section-id"
                        className="bg-black/30"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500"
                        onClick={() => {
                          const newItems = [...block.items];
                          newItems.splice(i, 1);
                          updateBlock(index, { items: newItems });
                        }}
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const newItems = [...block.items, { title: "", anchor: "" }];
                      updateBlock(index, { items: newItems });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                  </Button>
                </div>
              )}
              
              <div className="bg-black/30 rounded p-3 border border-white/10">
                <h3 className="font-bold mb-2">{block.title || "Table of Contents"}</h3>
                {block.automatic ? (
                  <>
                    <p className="text-sm text-white/70 italic">
                      Automatically generated from headings in the article
                    </p>
                    <div className="mt-2">
                      {generateTableOfContents().length > 0 ? (
                        <ul className="space-y-1 text-sm text-white/80">
                          {generateTableOfContents().map((item, i) => (
                            <li 
                              key={i}
                              className="hover:text-white transition-colors"
                              style={{ marginLeft: `${(item.level - 2) * 16}px` }}
                            >
                              {item.title}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-white/60">No headings found in the article yet.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {block.items.length > 0 ? (
                      <ul className="space-y-1 text-sm text-white/80">
                        {block.items.map((item: {title: string, anchor: string}, i: number) => (
                          <li 
                            key={i}
                            className="hover:text-white transition-colors"
                          >
                            {item.title || 'Untitled section'}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-white/60">No items added yet.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
        
      case "heading":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <div className="flex items-center gap-2 mb-2">
              <Heading2 className="h-4 w-4 text-purple-500/70" />
              <Select
                value={block.level.toString()}
                onValueChange={(value) => updateBlock(index, { level: parseInt(value) })}
              >
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">H2</SelectItem>
                  <SelectItem value="3">H3</SelectItem>
                  <SelectItem value="4">H4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              placeholder={`Heading ${block.level}`}
              className="border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-space font-bold text-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
        
      case "image":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <ImageIcon className="h-4 w-4 absolute left-2 top-2 text-purple-500/70" />
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Input
                  value={block.url}
                  onChange={(e) => updateBlock(index, { url: e.target.value })}
                  placeholder="Image URL"
                  className="bg-black/30"
                  onClick={(e) => e.stopPropagation()}
                />
                <Input
                  value={block.alt}
                  onChange={(e) => updateBlock(index, { alt: e.target.value })}
                  placeholder="Alt text"
                  className="bg-black/30"
                  onClick={(e) => e.stopPropagation()}
                />
                <Input
                  value={block.caption}
                  onChange={(e) => updateBlock(index, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  className="bg-black/30"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`image-align-${block.id}`}>Alignment</Label>
                  <Select
                    value={block.alignment || "center"}
                    onValueChange={(value) => updateBlock(index, { alignment: value })}
                  >
                    <SelectTrigger id={`image-align-${block.id}`} className="w-[120px] bg-black/30">
                      <SelectValue placeholder="Alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`image-width-${block.id}`}>Width (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`image-width-${block.id}`}
                      type="number"
                      min="10"
                      max="100"
                      value={block.width || 100}
                      onChange={(e) => updateBlock(index, { width: parseInt(e.target.value) || 100 })}
                      className="w-20 bg-black/30"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-white/70">%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`image-float-${block.id}`}>Text Wrap</Label>
                  <Select
                    value={block.float || "none"}
                    onValueChange={(value) => updateBlock(index, { float: value })}
                  >
                    <SelectTrigger id={`image-float-${block.id}`} className="w-[120px] bg-black/30">
                      <SelectValue placeholder="Text Wrap" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="left">Float Left</SelectItem>
                      <SelectItem value="right">Float Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {block.url && (
                <div 
                  className="mt-3 relative border border-white/10 p-2 rounded bg-black/20"
                  style={{
                    textAlign: block.alignment || "center",
                  }}
                >
                  <img
                    src={block.url}
                    alt={block.alt}
                    className="rounded shadow-md"
                    style={{
                      maxHeight: "200px",
                      width: `${block.width || 100}%`,
                      display: "inline-block"
                    }}
                  />
                  {block.caption && (
                    <p className="mt-2 text-sm text-white/70 text-center">{block.caption}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
        
      case "code":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <Code className="h-4 w-4 absolute left-2 top-2 text-purple-500/70" />
            <div className="space-y-2">
              <Select
                value={block.language}
                onValueChange={(value) => updateBlock(index, { language: value })}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                  <SelectItem value="swift">Swift</SelectItem>
                  <SelectItem value="bash">Bash</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={block.content}
                onChange={(e) => updateBlock(index, { content: e.target.value })}
                placeholder="// Enter your code here"
                className="font-mono resize-none min-h-[150px]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        );
        
      case "list":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <div className="flex items-center gap-2 mb-2">
              {block.ordered ? (
                <ListOrdered className="h-4 w-4 text-purple-500/70" />
              ) : (
                <List className="h-4 w-4 text-purple-500/70" />
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={block.ordered}
                  onCheckedChange={(checked) => updateBlock(index, { ordered: !!checked })}
                  id={`list-ordered-${index}`}
                />
                <label
                  htmlFor={`list-ordered-${index}`}
                  className="text-sm text-white/70"
                >
                  Ordered list
                </label>
              </div>
            </div>
            {block.items.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div className="w-6 text-center text-white/50">
                  {block.ordered ? `${i + 1}.` : '•'}
                </div>
                <Input
                  value={item}
                  onChange={(e) => {
                    const newItems = [...block.items];
                    newItems[i] = e.target.value;
                    updateBlock(index, { items: newItems });
                  }}
                  className="border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newItems = block.items.filter((_: any, idx: number) => idx !== i);
                    updateBlock(index, { items: newItems.length ? newItems : [""] });
                  }}
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-500 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                updateBlock(index, { items: [...block.items, ""] });
              }}
            >
              + Add item
            </Button>
          </div>
        );
        
      case "quote":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <Quote className="h-4 w-4 absolute left-2 top-2 text-purple-500/70" />
            <div className="space-y-2">
              <Textarea
                value={block.content}
                onChange={(e) => updateBlock(index, { content: e.target.value })}
                placeholder="Quote text"
                className="resize-none"
                onClick={(e) => e.stopPropagation()}
              />
              <Input
                value={block.author}
                onChange={(e) => updateBlock(index, { author: e.target.value })}
                placeholder="Author (optional)"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        );
        
      case "divider":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <div className="flex justify-center items-center py-2">
              <SeparatorHorizontal className="h-4 w-4 text-purple-500/70" />
              <div className="text-white/50 text-sm ml-2">Page break / Divider</div>
            </div>
          </div>
        );
        
      case "premium":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <div className="flex items-center gap-2 mb-2">
              <LockIcon className="h-4 w-4 text-purple-500/70" />
              <span className="text-purple-500">Premium Content</span>
            </div>
            <div className="border border-purple-500/30 rounded-lg p-4 bg-purple-500/5">
              <Textarea
                value={block.content.content}
                onChange={(e) => updateBlock(index, { content: { ...block.content, content: e.target.value } })}
                placeholder="Enter premium content here"
                className="resize-none border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        );
        
      case "embed":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <ExternalLink className="h-4 w-4 absolute left-2 top-2 text-purple-500/70" />
            <div className="space-y-2">
              <Input
                value={block.html}
                onChange={(e) => {
                  const value = e.target.value;
                  // Check if it's a YouTube URL and convert it
                  if (value.includes("youtube.com") || value.includes("youtu.be")) {
                    const { html, videoId } = getYoutubeEmbed(value);
                    updateBlock(index, { html, videoId });
                  } else {
                    updateBlock(index, { html: value });
                  }
                }}
                placeholder="HTML embed code or YouTube URL"
                onClick={(e) => e.stopPropagation()}
              />
              <Input
                value={block.caption}
                onChange={(e) => updateBlock(index, { caption: e.target.value })}
                placeholder="Caption (optional)"
                onClick={(e) => e.stopPropagation()}
              />
              {block.html && (
                <div className="mt-2 border border-white/10 rounded-lg p-3 bg-black/20">
                  <div dangerouslySetInnerHTML={{ __html: block.html }} />
                </div>
              )}
            </div>
          </div>
        );
        
      case "callout":
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <div className="flex items-center gap-2 mb-2">
              {block.type === "info" ? (
                <InfoIcon className="h-4 w-4 text-blue-500" />
              ) : block.type === "warning" ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <InfoIcon className="h-4 w-4 text-purple-500" />
              )}
              <Select
                value={block.type}
                onValueChange={(value) => updateBlock(index, { type: value })}
              >
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="tip">Tip</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              placeholder="Callout text"
              className="resize-none border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
        
      default:
        return (
          <div
            {...commonProps}
            onClick={() => setActiveBlockIndex(index)}
          >
            {blockControls}
            <div className="p-4 text-white/70 text-center">
              Unknown block type: {block.type}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Editor */}
      <div className="w-full md:w-2/3 space-y-4">
        <Card className="bg-[#14141E] border-white/10">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-space font-bold text-xl text-white">
                {initialArticle?.id ? "Edit Article" : "New Article"}
              </h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
                  {previewMode ? (
                    <>
                      <Type className="h-4 w-4 mr-2" /> Edit
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" /> Preview
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => saveArticle(false)}>
                  <Save className="h-4 w-4 mr-2" /> Save Draft
                </Button>
                <Button className="bg-purple-800 hover:bg-purple-700" onClick={() => saveArticle(true)}>
                  Publish
                </Button>
              </div>
            </div>

            {!previewMode ? (
              <div>
                <div className="mb-4">
                  <label className="text-sm text-white/70 mb-1 block">Article Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={generateSlug}
                    placeholder="Enter article title"
                    className="bg-[#1E1E2D] border-white/10"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm text-white/70 mb-1 block">URL Slug</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="article-url-slug"
                    className="bg-[#1E1E2D] border-white/10"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm text-white/70 mb-1 block">Summary</label>
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief summary of the article (appears in previews)"
                    className="bg-[#1E1E2D] border-white/10 min-h-[80px]"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm text-white/70 mb-1 block">Tags</label>
                  <div className="flex items-center mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag"
                      className="bg-[#1E1E2D] border-white/10 mr-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button variant="outline" type="button" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center bg-[#1E1E2D] px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-white/60 hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Category</label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                    >
                      <SelectTrigger className="bg-[#1E1E2D] border-white/10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="space">Space</SelectItem>
                        <SelectItem value="astronomy">Astronomy</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="biology">Biology</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Est. Read Time (min)</label>
                    <Input
                      type="number"
                      value={readTime}
                      onChange={(e) => setReadTime(parseInt(e.target.value) || 1)}
                      min="1"
                      max="60"
                      className="bg-[#1E1E2D] border-white/10"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center">
                    <Checkbox
                      id="breaking-news"
                      checked={isBreaking}
                      onCheckedChange={(checked) => setIsBreaking(!!checked)}
                    />
                    <label
                      htmlFor="breaking-news"
                      className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as Breaking News
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm text-white/70 mb-1 block">Featured Image</label>
                  <div
                    {...getFeaturedImageRootProps()}
                    className={`cursor-pointer bg-[#1E1E2D] border border-dashed border-white/20 rounded-lg p-4 hover:border-purple-500/50 transition-colors ${
                      featuredImage ? "py-2" : "py-8"
                    }`}
                  >
                    <input {...getFeaturedImageInputProps()} />
                    {featuredImage ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <img 
                            src={featuredImage} 
                            alt="Featured" 
                            className="h-40 object-cover rounded mx-auto"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full bg-black/50 hover:bg-black/70"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeaturedImage("");
                            }}
                          >
                            ×
                          </Button>
                        </div>
                        <p className="text-center text-sm text-white/70">
                          Click to replace or drag a new image
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="h-10 w-10 mx-auto mb-2 text-white/40" />
                        <p className="text-white/70">
                          Drag and drop an image here, or click to select
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm text-white/70 mb-1 block">Content</label>
                  <div className="mb-6">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="media">Media & Interactive</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>
                      <TabsContent value="basic" className="pt-4 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("paragraph")}
                        >
                          <Type className="h-4 w-4 mr-1" /> Text
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("heading")}
                        >
                          <Heading2 className="h-4 w-4 mr-1" /> Heading
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("list")}
                        >
                          <List className="h-4 w-4 mr-1" /> List
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("quote")}
                        >
                          <Quote className="h-4 w-4 mr-1" /> Quote
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("divider")}
                        >
                          <SeparatorHorizontal className="h-4 w-4 mr-1" /> Divider
                        </Button>
                      </TabsContent>
                      <TabsContent value="media" className="pt-4 flex flex-wrap gap-2">
                        <Button
                          variant="default"
                          className="bg-purple-700 hover:bg-purple-800"
                          size="sm"
                          onClick={() => addBlock("image")}
                        >
                          <ImageIcon className="h-4 w-4 mr-1" /> Add Image
                        </Button>
                        <Button
                          variant="default"
                          className="bg-purple-700 hover:bg-purple-800"
                          size="sm"
                          onClick={() => setPollDialogOpen(true)}
                        >
                          <BarChart2 className="h-4 w-4 mr-1" /> Add Poll
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("callout")}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" /> Callout
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("html")}
                        >
                          <FileCode className="h-4 w-4 mr-1" /> HTML
                        </Button>
                      </TabsContent>
                      <TabsContent value="advanced" className="pt-4 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("code")}
                        >
                          <Code className="h-4 w-4 mr-1" /> Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("toc")}
                        >
                          <List className="h-4 w-4 mr-1" /> Table of Contents
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock("columns")}
                        >
                          <Columns className="h-4 w-4 mr-1" /> Columns
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock("divider")}
                    >
                      <SeparatorHorizontal className="h-4 w-4 mr-1" /> Divider
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" /> More Blocks
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#14141E] border-white/10">
                        <DialogHeader>
                          <DialogTitle>Insert Special Block</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              addBlock("premium");
                              document.body.click(); // Close dialog
                            }}
                          >
                            <LockIcon className="h-4 w-4 mr-2" /> Premium Content
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              addBlock("embed");
                              document.body.click(); // Close dialog
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" /> Embed
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              addBlock("youtube");
                              document.body.click(); // Close dialog
                            }}
                          >
                            <Youtube className="h-4 w-4 mr-2" /> YouTube
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              addBlock("chart");
                              document.body.click(); // Close dialog
                            }}
                          >
                            <BarChart4 className="h-4 w-4 mr-2" /> Chart
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              addBlock("map");
                              document.body.click(); // Close dialog
                            }}
                          >
                            <Map className="h-4 w-4 mr-2" /> Map
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              addBlock("callout");
                              document.body.click(); // Close dialog
                            }}
                          >
                            <InfoIcon className="h-4 w-4 mr-2" /> Callout
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div
                    ref={editorRef}
                    className="bg-[#14141E] border border-white/10 rounded-lg p-3 min-h-[400px]"
                  >
                    {content.length > 0 ? (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="article-content">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-3"
                            >
                              {content.map((block, index) => (
                                <Draggable 
                                  key={block.id || `block-${index}`} 
                                  draggableId={block.id || `block-${index}`} 
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`relative group ${snapshot.isDragging ? 'opacity-70' : ''}`}
                                    >
                                      <div 
                                        {...provided.dragHandleProps}
                                        className="absolute left-0 top-0 h-full w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
                                      >
                                        <div className="w-1 h-10 rounded-full bg-white/20"></div>
                                      </div>
                                      <div className="pl-6">
                                        {renderBlockEditor(block, index)}
                                        
                                        {/* Control bar */}
                                        <div className="flex items-center justify-end mt-1 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10"
                                            onClick={() => {
                                              const newContent = [...content];
                                              newContent.splice(index, 1);
                                              setContent(newContent);
                                              if (activeBlockIndex === index) {
                                                setActiveBlockIndex(null);
                                              } else if (activeBlockIndex && activeBlockIndex > index) {
                                                setActiveBlockIndex(activeBlockIndex - 1);
                                              }
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                          
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10"
                                            onClick={() => {
                                              const newBlock = block.type === "poll" 
                                                ? createEmptyBlock("paragraph") 
                                                : createEmptyBlock(block.type);
                                              
                                              const newContent = [...content];
                                              newContent.splice(index + 1, 0, newBlock);
                                              setContent(newContent);
                                              setActiveBlockIndex(index + 1);
                                            }}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
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
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center h-40 text-white/40 cursor-pointer"
                        onClick={() => addBlock("paragraph")}
                      >
                        <Type className="h-8 w-8 mb-2" />
                        <p>Click a block type above to start writing</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="article-preview">
                <h1 className="font-space font-bold text-3xl mb-4">{title}</h1>
                <div className="mb-6 text-white/70">{summary}</div>
                
                <div className="mb-6">
                  {featuredImage && (
                    <img
                      src={featuredImage}
                      alt={title}
                      className="w-full h-auto rounded-lg mb-4"
                    />
                  )}
                </div>
                
                <div className="space-y-4">
                  {content.map((block, index) => {
                    switch (block.type) {
                      case "paragraph":
                        return <p key={index} className="text-white/90">{block.content}</p>;
                      case "heading":
                        const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
                        return (
                          <HeadingTag
                            key={index}
                            className={`font-space font-bold text-white ${
                              block.level === 2 ? "text-2xl" : block.level === 3 ? "text-xl" : "text-lg"
                            }`}
                          >
                            {block.content}
                          </HeadingTag>
                        );
                      case "image":
                        return (
                          <figure key={index}>
                            <img
                              src={block.url}
                              alt={block.alt || "Article image"}
                              className="w-full h-auto rounded-lg"
                            />
                            {block.caption && (
                              <figcaption className="text-center text-white/60 text-sm mt-2">
                                {block.caption}
                              </figcaption>
                            )}
                          </figure>
                        );
                      case "code":
                        return (
                          <div key={index}>
                            <pre className="bg-[#1a1a2e] p-4 rounded-lg overflow-x-auto font-mono text-sm text-white/90 border border-white/10">
                              <code>{block.content}</code>
                            </pre>
                          </div>
                        );
                      case "list":
                        const ListTag = block.ordered ? "ol" : "ul";
                        return (
                          <ListTag
                            key={index}
                            className={`ml-6 text-white/90 ${
                              block.ordered ? "list-decimal" : "list-disc"
                            }`}
                          >
                            {block.items.map((item: string, i: number) => (
                              <li key={i} className="mb-2">
                                {item}
                              </li>
                            ))}
                          </ListTag>
                        );
                      case "quote":
                        return (
                          <blockquote
                            key={index}
                            className="border-l-4 border-purple-500 pl-4 italic text-white/80"
                          >
                            <p>{block.content}</p>
                            {block.author && (
                              <footer className="text-white/60 mt-2 text-sm">— {block.author}</footer>
                            )}
                          </blockquote>
                        );
                      case "divider":
                        return <hr key={index} className="my-8 border-white/10" />;
                      case "premium":
                        return (
                          <div
                            key={index}
                            className="premium-content my-10 bg-[#14141E] border border-white/10 rounded-lg p-6"
                          >
                            <div className="relative z-10 text-center">
                              <LockIcon className="mx-auto text-purple-500 h-6 w-6 mb-2" />
                              <h3 className="font-space font-bold text-xl mb-2">Premium Content</h3>
                              <p className="text-white/80 mb-4">
                                This content is available to Supporter and Pro subscribers.
                              </p>
                              <Button className="bg-purple-800 hover:bg-purple-700">
                                Upgrade to Pro
                              </Button>
                            </div>
                          </div>
                        );
                      case "embed":
                        return (
                          <div key={index}>
                            <div
                              className="rounded-lg overflow-hidden"
                              dangerouslySetInnerHTML={{ __html: block.html }}
                            />
                            {block.caption && (
                              <p className="text-center text-white/60 text-sm mt-2">{block.caption}</p>
                            )}
                          </div>
                        );
                      case "callout":
                        return (
                          <div
                            key={index}
                            className={`p-4 rounded-lg ${
                              block.type === "info"
                                ? "bg-blue-900/20 border border-blue-700/30"
                                : block.type === "warning"
                                ? "bg-amber-900/20 border border-amber-700/30"
                                : "bg-purple-900/20 border border-purple-700/30"
                            }`}
                          >
                            <p className="text-white/90">{block.content}</p>
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata & Settings */}
      <div className="w-full md:w-1/3 space-y-4">
        <Card className="bg-[#14141E] border-white/10">
          <CardContent className="p-4">
            <h3 className="font-space font-bold text-lg mb-3">Article Tags</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    className="bg-purple-800 hover:bg-purple-700 flex items-center gap-1 px-3 py-1"
                  >
                    <span>{tag}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 p-0 text-white/80 hover:text-white hover:bg-transparent"
                      onClick={() => removeTag(tag)}
                    >
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </Button>
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-white/60 text-sm">No tags added yet</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  className="flex-1 bg-[#1E1E2D] border-white/10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              
              {availableTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-white/70 mb-2">Popular tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 10).map(tag => (
                      <Button
                        key={tag}
                        variant="outline"
                        size="sm"
                        className="py-0 h-6 text-xs"
                        onClick={() => {
                          if (!tags.includes(tag)) {
                            setTags([...tags, tag]);
                          }
                        }}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#14141E] border-white/10">
          <CardContent className="p-4">
            <h3 className="font-space font-bold text-lg mb-3">Article Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2 bg-[#1E1E2D] rounded-md">
                <span className="text-white/70">Status</span>
                <span className={isDraft ? "text-amber-500" : "text-green-500"}>
                  {isDraft ? "Draft" : "Published"}
                </span>
              </div>
              
              {initialArticle?.id && (
                <>
                  <div className="flex items-center justify-between px-3 py-2 bg-[#1E1E2D] rounded-md">
                    <span className="text-white/70">Created</span>
                    <span className="text-white/90">
                      {new Date(initialArticle.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {initialArticle.publishedAt && (
                    <div className="flex items-center justify-between px-3 py-2 bg-[#1E1E2D] rounded-md">
                      <span className="text-white/70">Published</span>
                      <span className="text-white/90">
                        {new Date(initialArticle.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between px-3 py-2 bg-[#1E1E2D] rounded-md">
                    <span className="text-white/70">Last Modified</span>
                    <span className="text-white/90">
                      {new Date(initialArticle.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center mt-4">
                <Checkbox
                  id="isDraft"
                  checked={isDraft}
                  onCheckedChange={(checked: boolean | "indeterminate") => setIsDraft(checked === true)}
                />
                <label
                  htmlFor="isDraft"
                  className="ml-2 text-sm font-medium leading-none"
                >
                  Save as draft
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#14141E] border-white/10">
          <CardContent className="p-4">
            <h3 className="font-space font-bold text-lg mb-3">Quick Tips</h3>
            <ul className="space-y-2 text-white/70 text-sm list-disc pl-5">
              <li>Add a compelling featured image to grab attention</li>
              <li>Use headings to organize content for better readability</li>
              <li>Premium content blocks are only visible to paid subscribers</li>
              <li>Engage readers with embedded content like videos and charts</li>
              <li>Include a clear call to action at the end of your article</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Poll Creation Dialog */}
      <Dialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
        <DialogContent className="bg-[#14141E] border-white/10">
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="poll-question">Poll Question</Label>
              <Input
                id="poll-question"
                value={currentPollQuestion}
                onChange={(e) => setCurrentPollQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="bg-[#1E1E2D] border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Poll Options</Label>
              {currentPollOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...currentPollOptions];
                      newOptions[index] = e.target.value;
                      setCurrentPollOptions(newOptions);
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="bg-[#1E1E2D] border-white/10"
                  />
                  {currentPollOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newOptions = currentPollOptions.filter((_, i) => i !== index);
                        setCurrentPollOptions(newOptions);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {currentPollOptions.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPollOptions([...currentPollOptions, ""])}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allow-multiple"
                  checked={currentPollMultipleChoice}
                  onCheckedChange={(checked) => setCurrentPollMultipleChoice(checked === true)}
                />
                <Label htmlFor="allow-multiple">Allow multiple choices</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPollDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Create a poll block and add it to the content
              const pollBlock = createEmptyBlock("poll");
              pollBlock.question = currentPollQuestion;
              pollBlock.options = currentPollOptions.filter(opt => opt.trim() !== "");
              pollBlock.allowMultiple = currentPollMultipleChoice;
              
              // Insert at active index or append to end
              if (activeBlockIndex !== null) {
                const newContent = [...content];
                newContent.splice(activeBlockIndex + 1, 0, pollBlock);
                setContent(newContent);
                setActiveBlockIndex(activeBlockIndex + 1);
              } else {
                setContent([...content, pollBlock]);
                setActiveBlockIndex(content.length);
              }
              
              // Reset form and close dialog
              setCurrentPollQuestion("");
              setCurrentPollOptions([""]);
              setCurrentPollMultipleChoice(false);
              setPollDialogOpen(false);
            }}>
              Add Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ArticleEditor;
