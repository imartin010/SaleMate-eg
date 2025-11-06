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

    console.log('📤 Starting file upload:', {
      bucket,
      path,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Add timeout to prevent hanging
    const uploadPromise = supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert,
      });

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
      setTimeout(() => {
        resolve({ data: null, error: { message: 'Upload timeout after 30 seconds' } });
      }, 30000); // 30 second timeout
    });

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Upload error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Provide helpful error messages
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        return { 
          success: false, 
          error: `Storage bucket "${bucket}" not found. Please create it in Supabase Dashboard → Storage.` 
        };
      }
      
      if (error.message?.includes('timeout')) {
        return { 
          success: false, 
          error: 'Upload timed out. The file may be too large or the connection is slow.' 
        };
      }
      
      return { success: false, error: error.message || 'Upload failed' };
    }

    if (!data) {
      console.error('❌ Upload returned no data');
      return { success: false, error: 'Upload failed - no data returned' };
    }

    console.log('✅ File uploaded successfully:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('✅ Public URL generated:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('❌ Upload exception:', error);
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
    console.log('📤 uploadCMSImage called:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      alt,
      userId
    });

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { 
        success: false, 
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 10MB` 
      };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        error: `File type "${file.type}" not allowed. Please use JPEG, PNG, WebP, or GIF.` 
      };
    }

    // Generate path
    const path = generateFilePath('cms', file.name);
    console.log('📁 Generated file path:', path);

    // Upload to storage
    console.log('📤 Starting upload to bucket "public"...');
    const uploadResult = await uploadFile({
      bucket: 'public',
      path,
      file,
    });

    console.log('📤 Upload result:', uploadResult);

    if (!uploadResult.success || !uploadResult.url) {
      console.error('❌ Upload failed:', uploadResult.error);
      return { success: false, error: uploadResult.error || 'Upload failed' };
    }

    console.log('✅ File uploaded, URL:', uploadResult.url);

    // Create image element to get dimensions (with timeout)
    console.log('📐 Getting image dimensions...');
    const img = new Image();
    const dimensionsPromise = new Promise<{width: number; height: number}>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Image dimensions timeout, using defaults');
        resolve({ width: 0, height: 0 });
      }, 5000); // 5 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        clearTimeout(timeout);
        console.warn('⚠️ Image load error, using defaults');
        resolve({ width: 0, height: 0 });
      };
    });
    img.src = URL.createObjectURL(file);
    const dimensions = await dimensionsPromise;
    console.log('📐 Image dimensions:', dimensions);

    // Save to cms_media table (skip if table doesn't exist or has issues)
    console.log('💾 Saving to cms_media table...');
    try {
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
        console.warn('⚠️ CMS media insert error (non-fatal):', error);
        // Don't fail the upload if media insert fails - the file is already uploaded
      } else {
        console.log('✅ Saved to cms_media, ID:', data.id);
      }
    } catch (mediaError) {
      console.warn('⚠️ CMS media insert exception (non-fatal):', mediaError);
      // Continue - the file upload succeeded even if media insert failed
    }

    console.log('✅ uploadCMSImage completed successfully');
    return {
      success: true,
      mediaId: undefined, // Optional - don't fail if media insert failed
      url: uploadResult.url,
    };
  } catch (error) {
    console.error('❌ Upload CMS image exception:', error);
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

