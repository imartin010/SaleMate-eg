/**
 * Supabase Storage Helpers
 * Centralized functions for file upload, delete, and URL generation
 */

import { supabase } from './supabaseClient';

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  try {
    const { bucket, path, file, upsert = false } = options;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Generate a unique file path
 */
export function generateFilePath(prefix: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = filename.split('.').pop();
  const name = filename.replace(`.${ext}`, '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  return `${prefix}/${timestamp}-${random}-${name}.${ext}`;
}

/**
 * Upload image and save to cms_media table
 */
export async function uploadCMSImage(
  file: File,
  alt?: string,
  userId?: string
): Promise<{ success: boolean; mediaId?: string; url?: string; error?: string }> {
  try {
    // Generate path
    const path = generateFilePath('cms', file.name);

    // Upload to storage
    const uploadResult = await uploadFile({
      bucket: 'public',
      path,
      file,
    });

    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error };
    }

    // Create image element to get dimensions
    const img = new Image();
    const dimensionsPromise = new Promise<{width: number; height: number}>((resolve) => {
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
    });
    img.src = URL.createObjectURL(file);
    const dimensions = await dimensionsPromise;

    // Save to cms_media table
    const { data, error } = await supabase
      .from('cms_media')
      .insert({
        bucket: 'public',
        path,
        alt: alt || file.name,
        width: dimensions.width,
        height: dimensions.height,
        size_bytes: file.size,
        mime_type: file.type,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('CMS media insert error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      mediaId: data.id,
      url: uploadResult.url,
    };
  } catch (error) {
    console.error('Upload CMS image exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * List files in a bucket
 */
export async function listFiles(bucket: string, path?: string) {
  try {
    const { data, error} = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('List files exception:', error);
    return [];
  }
}

