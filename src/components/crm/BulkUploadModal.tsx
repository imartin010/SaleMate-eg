import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import Papa from 'papaparse';

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface Project {
  id: string;
  name: string;
  region: string;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ open, onClose, onUploadComplete }) => {
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadProjects();
      setFile(null);
      setSelectedProjectId('');
      setResult(null);
      setPreview([]);
      setProgress({ current: 0, total: 0 });
    }
  }, [open]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, region')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
      alert('Failed to load projects. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template with all lead fields
    const headers = [
      'client_name',
      'client_phone',
      'client_phone2',
      'client_phone3',
      'client_email',
      'client_job_title',
      'company_name',
      'source',
      'stage',
      'budget',
      'feedback'
    ];

    // Create sample data row (using lowercase source values as per database constraint)
    const sampleRow = [
      'John Doe',
      '01234567890',
      '',
      '',
      'john.doe@example.com',
      'Manager',
      'ABC Company',
      'facebook',
      'New Lead',
      '500000',
      'Interested in 3-bedroom apartment'
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      // Add empty rows for user to fill
      Array(headers.length).fill('').join(','),
      Array(headers.length).fill('').join(','),
      Array(headers.length).fill('').join(',')
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setResult(null);

    // Parse CSV for preview
    Papa.parse(selectedFile, {
      header: true,
      preview: 5,
      complete: (results) => {
        setPreview(results.data);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the file format.');
      },
    });
  };

  const handleUpload = async () => {
    if (!file || !selectedProjectId) {
      alert('Please select a project and CSV file');
      return;
    }

    if (!user?.id) {
      alert('You must be logged in to upload leads');
      return;
    }

    setUploading(true);
    setResult(null);
    setProgress({ current: 0, total: 0 });

    try {
      // Parse entire CSV
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const rows = results.data as any[];
          const validLeads: any[] = [];
          const errors: string[] = [];

          // Validate and prepare leads
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            try {
              const lead = {
                project_id: selectedProjectId,
                client_name: row.client_name || row.name || row.full_name || '',
                client_phone: row.client_phone || row.phone || row.phone_number || '',
                client_phone2: row.client_phone2 || row.phone2 || null,
                client_phone3: row.client_phone3 || row.phone3 || null,
                client_email: row.client_email || row.email || null,
                client_job_title: row.client_job_title || row.job_title || null,
                company_name: row.company_name || row.company || null,
                source: null as string | null,
                stage: (row.stage as any) || 'New Lead',
                budget: row.budget ? parseFloat(row.budget) : null,
                feedback: row.feedback || null,
                // Assign to the user who uploads
                buyer_user_id: user.id,
                owner_id: user.id,
                assigned_to_id: user.id,
                upload_user_id: user.id,
                assigned_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              // Validate required fields
              if (!lead.client_name || !lead.client_phone) {
                throw new Error(`Row ${i + 2}: Missing required fields (name and phone)`);
              }

              // Validate and normalize source (constraint allows: facebook, instagram, google, tiktok, snapchat, whatsapp, or NULL)
              const validSources = ['facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'whatsapp'];
              const rawSource = (row.source || row.platform || '').toString().toLowerCase().trim();
              
              // Map common variations and validate
              if (rawSource.includes('facebook') || rawSource === 'fb') {
                lead.source = 'facebook';
              } else if (rawSource.includes('instagram') || rawSource === 'ig') {
                lead.source = 'instagram';
              } else if (rawSource.includes('google') || rawSource === 'gg') {
                lead.source = 'google';
              } else if (rawSource.includes('tiktok') || rawSource === 'tt') {
                lead.source = 'tiktok';
              } else if (rawSource.includes('snapchat') || rawSource === 'snap') {
                lead.source = 'snapchat';
              } else if (rawSource.includes('whatsapp') || rawSource === 'wa' || rawSource === 'whats') {
                lead.source = 'whatsapp';
              } else if (validSources.includes(rawSource)) {
                lead.source = rawSource;
              } else {
                // Set to NULL if not a valid source (constraint allows NULL)
                lead.source = null;
              }

              validLeads.push(lead);
            } catch (error) {
              errors.push(error instanceof Error ? error.message : `Row ${i + 2}: Invalid data`);
            }
          }

          if (validLeads.length === 0) {
            setResult({ success: 0, failed: rows.length, errors });
            setUploading(false);
            return;
          }

          // Upload in batches
          const batchSize = 50;
          let successCount = 0;
          let failedCount = 0;

          setProgress({ current: 0, total: validLeads.length });

          for (let i = 0; i < validLeads.length; i += batchSize) {
            const batch = validLeads.slice(i, i + batchSize);
            
            try {
              const { error: insertError } = await supabase
                .from('leads')
                .insert(batch);

              if (insertError) {
                console.error('Error inserting batch:', insertError);
                failedCount += batch.length;
                errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
              } else {
                successCount += batch.length;
              }

              setProgress({ current: Math.min(i + batchSize, validLeads.length), total: validLeads.length });
            } catch (batchError) {
              console.error('Error uploading batch:', batchError);
              failedCount += batch.length;
              errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
            }
          }

          setResult({
            success: successCount,
            failed: failedCount + errors.length,
            errors: errors.slice(0, 10), // Show first 10 errors
          });

          if (successCount > 0) {
            onUploadComplete();
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setResult({ success: 0, failed: 0, errors: [`Error parsing CSV: ${error.message}`] });
        },
      });
    } catch (err) {
      console.error('Upload error:', err);
      setResult({
        success: 0,
        failed: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error occurred'],
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] md:w-[90vw] h-[95vh] md:h-[90vh] max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col p-4 md:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            Bulk Upload Leads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-0">
          {/* Template Download and Project Selection - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Need a template?</h3>
              <p className="text-xs text-blue-700 mb-3">
                Download our CSV template with all the required columns and sample data.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project *
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 h-10">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading projects...
                </div>
              ) : (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={loading}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No projects available</div>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} {project.region && `- ${project.region}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={uploading}
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileText className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Click to select CSV file'}
                </span>
                <span className="text-xs text-gray-500">
                  CSV format with columns: client_name, client_phone, client_email, etc.
                  <br />
                  <span className="text-indigo-600 font-medium">Download template above for correct format</span>
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="flex-1 min-h-0 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview (first 5 rows)
              </label>
              <div className="border rounded-lg overflow-auto flex-1 min-h-0">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {Object.keys(preview[0] || {}).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((value: any, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {String(value || '').substring(0, 50)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress and Results - Side by Side when both visible */}
          {(uploading || result) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Progress */}
              {uploading && (
                <div className="space-y-2 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">Uploading...</span>
                    <span className="text-indigo-600 font-semibold">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className="bg-indigo-600 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}% complete
                  </p>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className={`p-4 rounded-lg ${
                  result.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {result.success > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        result.success > 0 ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {result.success > 0
                          ? `Successfully uploaded ${result.success} lead(s)`
                          : 'Upload failed'}
                      </p>
                      {result.failed > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          {result.failed} lead(s) failed
                        </p>
                      )}
                      {result.errors.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600 max-h-24 overflow-y-auto">
                          {result.errors.map((error, idx) => (
                            <div key={idx} className="mb-1 break-words">• {error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              {result ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !selectedProjectId || uploading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Leads
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

