import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react';
import { supabase } from '@/core/api/client';
import { uploadFile, listFiles, getPublicUrl } from '../../lib/storage';

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  accept?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  value,
  onChange,
  bucket = 'public',
  folder = 'cms',
  accept = 'image/*',
}) => {
  const [uploading, setUploading] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [showExisting, setShowExisting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(value || null);

  useEffect(() => {
    loadExistingImages();
  }, [bucket, folder]);

  const loadExistingImages = async () => {
    try {
      const files = await listFiles(bucket, folder);
      const imageUrls = files
        .filter((file) => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .map((file) => getPublicUrl(bucket, `${folder}/${file.name}`));
      setExistingImages(imageUrls);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const path = `${folder}/${Date.now()}-${file.name}`;
      const result = await uploadFile({
        bucket,
        path,
        file,
      });

      if (result.success && result.url) {
        setSelectedImage(result.url);
        onChange(result.url);
        await loadExistingImages();
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectExisting = (url: string) => {
    setSelectedImage(url);
    onChange(url);
    setShowExisting(false);
  };

  const handleRemove = () => {
    setSelectedImage(null);
    onChange('');
  };

  return (
    <div className="space-y-4">
      {/* Current Selection */}
      {selectedImage && (
        <div className="relative inline-block">
          <img
            src={selectedImage}
            alt="Selected"
            className="h-32 w-32 object-cover rounded-lg border-2 border-brand-primary"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-brand-error text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
            Selected
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!selectedImage && (
        <label className="cursor-pointer">
          <div className="card-brand p-8 border-2 border-dashed border-gray-300 hover:border-brand-primary transition-colors text-center">
            {uploading ? (
              <div className="animate-pulse text-brand-muted">Uploading...</div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-brand-muted mx-auto mb-2" />
                <div className="text-sm text-brand-dark mb-1">Click to upload image</div>
                <div className="text-xs text-brand-muted">or drag and drop</div>
              </>
            )}
          </div>
          <input
            type="file"
            accept={accept}
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}

      {/* Browse Existing */}
      {existingImages.length > 0 && (
        <div>
          <button
            onClick={() => setShowExisting(!showExisting)}
            className="flex items-center gap-2 text-brand-primary hover:text-brand-primary-dark transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
            {showExisting ? 'Hide' : 'Browse'} existing images ({existingImages.length})
          </button>
          {showExisting && (
            <div className="grid grid-cols-4 gap-2 mt-2 p-4 bg-brand-light rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              {existingImages.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectExisting(url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === url
                      ? 'border-brand-primary ring-2 ring-brand-primary'
                      : 'border-gray-200 hover:border-brand-primary'
                  }`}
                >
                  <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                  {selectedImage === url && (
                    <div className="absolute inset-0 bg-brand-primary bg-opacity-20 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

