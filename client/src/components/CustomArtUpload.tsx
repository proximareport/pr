import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Image, FileText, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PremiumAccess } from '@/components/PremiumAccess';

interface CustomArtUploadProps {
  onUploadComplete?: (uploadedFile: any) => void;
  className?: string;
}

export const CustomArtUpload: React.FC<CustomArtUploadProps> = ({ 
  onUploadComplete, 
  className = '' 
}) => {
  const { user } = useAuth();
  const { canAccessFeature } = useSubscriptionAccess();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAccess = canAccessFeature('custom_art_upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (max 10MB for custom uploads)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, WebP, or SVG).",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', altText);
      formData.append('caption', caption);
      formData.append('isCustomArt', 'true');
      formData.append('userId', user.id.toString());

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const uploadedFile = await response.json();
      
      toast({
        title: "Upload successful",
        description: "Your custom art has been uploaded successfully.",
      });

      // Reset form
      setFile(null);
      setAltText('');
      setCaption('');
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete?.(uploadedFile);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <PremiumAccess
      requiredTier="tier3"
      featureName="Custom Art Upload"
      description="Upload custom art and images directly to the site"
      className={className}
    >
      <Card className="border-white/10 bg-[#14141E]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-400" />
            Custom Art Upload
          </CardTitle>
          <CardDescription>
            Upload your own artwork and images to share with the community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasAccess ? (
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Custom Art Upload</p>
              <p className="text-sm text-gray-500">
                This feature requires Tier 3 Supporter membership
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="file-upload">Select Image</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: JPEG, PNG, GIF, WebP, SVG (max 10MB)
                </p>
              </div>

              {file && (
                <div className="space-y-4">
                  {previewUrl && (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-white/10"
                      />
                      <Badge className="absolute top-2 right-2 bg-purple-600">
                        {getFileIcon(file)}
                        {file.name}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="alt-text">Alt Text (for accessibility)</Label>
                    <Input
                      id="alt-text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Describe the image for screen readers"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="caption">Caption (optional)</Label>
                    <Textarea
                      id="caption"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Add a caption for your artwork"
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Custom Art
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PremiumAccess>
  );
};
