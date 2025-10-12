import { useState, useCallback } from 'react';
import { parseCSV } from '../../lib/admin/csvParser';
import { uploadLeadsAdmin } from '../../lib/supabaseAdminClient';

export interface LeadUploadProgress {
  current: number;
  total: number;
  percentage: number;
}

export function useLeadUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<LeadUploadProgress>({ current: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const uploadLeads = useCallback(async (projectId: string, csvContent: string) => {
    try {
      setUploading(true);
      setError(null);
      setProgress({ current: 0, total: 0, percentage: 0 });
      setSuccessCount(0);

      // Parse CSV
      const leads = parseCSV(csvContent);
      
      if (leads.length === 0) {
        throw new Error('No valid leads found in CSV file');
      }

      setProgress({ current: 0, total: leads.length, percentage: 0 });

      // Upload in batches of 50 for better performance
      const batchSize = 50;
      let uploaded = 0;

      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        
        try {
          await uploadLeadsAdmin(projectId, batch);
          uploaded += batch.length;
          
          setProgress({
            current: uploaded,
            total: leads.length,
            percentage: Math.round((uploaded / leads.length) * 100),
          });
        } catch (batchError) {
          console.error(`Error uploading batch ${i / batchSize + 1}:`, batchError);
          // Continue with next batch even if one fails
        }
      }

      setSuccessCount(uploaded);
      
      if (uploaded === 0) {
        throw new Error('Failed to upload any leads');
      }

      return { success: true, count: uploaded };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload leads';
      setError(errorMessage);
      console.error('Lead upload error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({ current: 0, total: 0, percentage: 0 });
    setError(null);
    setSuccessCount(0);
  }, []);

  return {
    uploadLeads,
    uploading,
    progress,
    error,
    successCount,
    reset,
  };
}

