import React from 'react';

// Define the types of content elements (same as in GoogleDocsEditor)
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

// Props for the component
interface GoogleDocsArticleContentProps {
  content: ContentElement[] | any;
}

export default function GoogleDocsArticleContent({ content }: GoogleDocsArticleContentProps) {
  // If content is not an array or is empty, return null
  if (!Array.isArray(content) || content.length === 0) {
    return <div className="text-gray-500">No content available</div>;
  }

  // Position classes
  const positionClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
    full: 'w-full'
  };

  // Render a specific element based on its type
  const renderElement = (element: ContentElement) => {
    if (!element || !element.type) {
      return null;
    }

    const positionClass = element.position ? positionClasses[element.position] : 'w-full';

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
          'paragraph': 'text-base mb-4',
          'heading-1': 'text-3xl font-bold mb-6',
          'heading-2': 'text-2xl font-bold mb-5',
          'heading-3': 'text-xl font-bold mb-4',
          'quote': 'text-base italic border-l-4 border-gray-300 pl-4 py-2 my-4'
        };
        
        // Handle paragraphs and headings (convert newlines to <br> tags)
        const formattedContent = textElement.content
          ? textElement.content.split('\n').map((line, i) => 
              line ? <React.Fragment key={i}>{line}{i < textElement.content.split('\n').length - 1 && <br />}</React.Fragment> : <br key={i} />
            )
          : null;

        // Use the appropriate heading tag based on the element type
        let ContentTag: keyof JSX.IntrinsicElements = 'p';
        if (textElement.type === 'heading-1') ContentTag = 'h1';
        else if (textElement.type === 'heading-2') ContentTag = 'h2';
        else if (textElement.type === 'heading-3') ContentTag = 'h3';
        else if (textElement.type === 'quote') ContentTag = 'blockquote';
        
        return (
          <div className={`${positionClass} ${typeClasses[textElement.type]}`}>
            <ContentTag className={styleClasses}>
              {formattedContent}
            </ContentTag>
          </div>
        );
      }
      
      case 'image': {
        const imageElement = element as ImageElement;
        return (
          <figure className={`${positionClass} mb-6`}>
            <img 
              src={imageElement.src} 
              alt={imageElement.alt || 'Image'} 
              className="max-w-full h-auto rounded-md mx-auto"
            />
            {imageElement.caption && (
              <figcaption className="text-sm text-center text-gray-500 mt-2">{imageElement.caption}</figcaption>
            )}
          </figure>
        );
      }
      
      case 'video': {
        const videoElement = element as VideoElement;
        return (
          <figure className={`${positionClass} mb-6`}>
            <div className="aspect-w-16">
              <iframe
                src={`https://www.youtube.com/embed/${videoElement.videoId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-md"
              ></iframe>
            </div>
            {videoElement.caption && (
              <figcaption className="text-sm text-center text-gray-500 mt-2">{videoElement.caption}</figcaption>
            )}
          </figure>
        );
      }
      
      case 'list-ordered':
      case 'list-unordered': {
        const listElement = element as ListElement;
        const ListTag = listElement.type === 'list-ordered' ? 'ol' : 'ul';
        
        return (
          <div className={`${positionClass} mb-4`}>
            <ListTag className={listElement.type === 'list-ordered' ? 'list-decimal ml-6' : 'list-disc ml-6'}>
              {listElement.items.map((item, i) => (
                <li key={i} className="mb-1">{item}</li>
              ))}
            </ListTag>
          </div>
        );
      }
      
      case 'poll': {
        const pollElement = element as PollElement;
        return (
          <div className={`${positionClass} mb-6 p-4 border border-gray-200 rounded-lg`}>
            <h3 className="text-lg font-bold mb-3">{pollElement.question}</h3>
            <div className="space-y-2">
              {pollElement.options.map((option, i) => (
                <div key={i} className="flex items-center p-2 bg-gray-50 rounded">
                  <input 
                    type={pollElement.multipleChoice ? "checkbox" : "radio"} 
                    name={`poll-${pollElement.id}`}
                    className="mr-2"
                    disabled
                  />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      case 'table': {
        const tableElement = element as TableElement;
        return (
          <div className={`${positionClass} mb-6 overflow-x-auto`}>
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  {tableElement.headers.map((header, i) => (
                    <th key={i} className="border border-gray-300 px-4 py-2 bg-gray-100">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableElement.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-gray-300 px-4 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      
      default:
        return null;
    }
  };

  // Determine if the content is legacy format (object with blocks property)
  let elementsToRender = content;
  if (content && typeof content === 'object' && !Array.isArray(content) && content.blocks) {
    elementsToRender = content.blocks;
  }

  return (
    <div className="article-content">
      {Array.isArray(elementsToRender) && elementsToRender.map((element, index) => (
        <React.Fragment key={element.id || index}>
          {renderElement(element)}
        </React.Fragment>
      ))}
    </div>
  );
}