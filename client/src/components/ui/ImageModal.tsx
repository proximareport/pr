import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import { Button } from './button';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  description?: string;
  date?: string;
  copyright?: string;
  externalUrl?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  description,
  date,
  copyright,
  externalUrl
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExternalLink = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 max-w-7xl max-h-[90vh] w-full mx-4 bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
            {date && (
              <p className="text-sm text-gray-400">{date}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {externalUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExternalLink}
                className="text-gray-300 hover:text-white"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View on NASA
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-gray-300 hover:text-white"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="relative bg-black">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto max-h-[70vh] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Footer */}
        {(description || copyright) && (
          <div className="p-4 border-t border-gray-700">
            {description && (
              <p className="text-gray-300 text-sm leading-relaxed mb-2">
                {description}
              </p>
            )}
            {copyright && (
              <p className="text-xs text-gray-500">
                © {copyright}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
