import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Search, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import Papa from 'papaparse';

interface Project {
  id: string;
  name: string;
  project_code: string;
  region: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export default function LeadUpload() {
  const { profile } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, project_code, region')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) {
      return projects;
    }
    
    const searchLower = projectSearch.toLowerCase();
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.region?.toLowerCase().includes(searchLower) ||
        project.project_code?.toLowerCase().includes(searchLower)
      );
    });
  }, [projects, projectSearch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    // Parse CSV for preview
    Papa.parse(selectedFile, {
      header: true,
      preview: 5,
      complete: (results) => {
        setPreview(results.data);
      },
    });
  };

  const handleUpload = async () => {
    if (!file || !selectedProjectId) {
      alert('Please select a project and file');
      return;
    }

        setUploading(true);
        setResult(null);
        setProgress({ current: 0, total: 0 });
        setCancelled(false); // Reset cancellation flag at start

    try {
      // Parse entire CSV
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const rows = results.data as any[];
          const validLeads: any[] = [];
          const errors: { row: number; error: string }[] = [];

          // Step 1: Validate and prepare all leads
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            try {
              // Find selected project to get name
              const selectedProject = projects.find(p => p.id === selectedProjectId);
              
              // Map CSV columns to lead fields
              const lead = {
                project_id: selectedProjectId,
                project_name: selectedProject?.name || null, // Denormalized for performance
                client_name: row.client_name || row.name || row.full_name || '',
                client_phone: row.client_phone || row.phone || row.phone_number || '',
                client_phone2: row.client_phone2 || row.phone2 || null,
                client_phone3: row.client_phone3 || row.phone3 || null,
                client_email: row.client_email || row.email || null,
                client_job_title: row.client_job_title || row.job_title || null,
                company_name: row.company_name || row.company || null,
                stage: 'New Lead',
                is_sold: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              // Validate required fields
              if (!lead.client_name || !lead.client_phone) {
                throw new Error('Missing required fields: client_name and client_phone');
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
              
              // Platform should match source or be NULL
              lead.platform = lead.source || null;

              validLeads.push(lead);
            } catch (err: any) {
              errors.push({
                row: i + 2, // +2 for header and 1-based indexing
                error: err.message || 'Unknown error',
              });
            }
          }

          setProgress({ current: 0, total: validLeads.length });

          if (validLeads.length === 0) {
            setResult({ success: 0, failed: rows.length, errors });
            setUploading(false);
            return;
          }

          // Step 2: Insert leads in batches for better performance
          // Use smaller batches for very large uploads to prevent freezing
          const batchSize = validLeads.length > 15000 ? 25 : validLeads.length > 10000 ? 50 : 100;
          let successCount = 0;
          let failedCount = errors.length; // Start with validation errors
          setCancelled(false); // Reset cancellation flag

          console.log(`Starting upload: ${validLeads.length} leads in batches of ${batchSize}`);

          // Helper to force UI update with requestAnimationFrame for smoother updates
          const updateProgress = async (current: number, total: number) => {
            setProgress({ current, total });
            // Use requestAnimationFrame for smoother UI updates
            return new Promise<void>((resolve) => {
              requestAnimationFrame(() => {
                setTimeout(() => resolve(), 0);
              });
            });
          };

          for (let i = 0; i < validLeads.length; i += batchSize) {
            // Check if upload was cancelled
            if (cancelled) {
              console.log('Upload cancelled by user at', i, 'of', validLeads.length);
              setResult({ 
                success: successCount, 
                failed: failedCount + (validLeads.length - i),
                errors: [...errors, { row: i + 2, error: 'Upload cancelled by user' }]
              });
              setUploading(false);
              return;
            }
            
            const batch = validLeads.slice(i, i + batchSize);
            const currentBatch = Math.min(i + batchSize, validLeads.length);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(validLeads.length / batchSize);
            
            console.log(`Processing batch ${batchNumber}/${totalBatches} (${i}-${currentBatch})`);
            
            try {
              // Update progress before batch
              await updateProgress(i, validLeads.length);

              // Bulk insert batch with shorter timeout for large files
              const timeoutMs = validLeads.length > 15000 ? 20000 : 30000;
              
              const insertPromise = supabase
                .from('leads')
                .insert(batch)
                .then((result) => {
                  console.log(`✓ Batch ${batchNumber} inserted successfully (${batch.length} leads)`);
                  return result;
                })
                .catch((err) => {
                  console.error(`✗ Batch ${batchNumber} insert error:`, err);
                  throw err;
                });

              // Add timeout to prevent hanging
              const timeoutPromise = new Promise<{ error: any }>((_, reject) => {
                setTimeout(() => reject(new Error(`Batch insert timeout after ${timeoutMs}ms`)), timeoutMs);
              });

              let insertError;
              try {
                const result = await Promise.race([
                  insertPromise,
                  timeoutPromise
                ]);
                insertError = result.error;
              } catch (err: any) {
                // Timeout or other error occurred
                console.warn(`Batch ${batchNumber} timeout or error:`, err.message);
                insertError = { message: err.message || 'Batch insert timeout or error' };
              }

              if (insertError) {
                // If batch insert fails, try individual inserts with smaller batches
                console.warn('Batch insert failed, trying smaller batches:', insertError);
                const smallBatchSize = 10;
                
                for (let k = 0; k < batch.length; k += smallBatchSize) {
                  const smallBatch = batch.slice(k, k + smallBatchSize);
                  
                  try {
                    const { error: smallBatchError } = await supabase
                      .from('leads')
                      .insert(smallBatch);

                    if (smallBatchError) {
                      // Final fallback: individual inserts
                      for (let j = 0; j < smallBatch.length; j++) {
                        try {
                          const { error: singleError } = await supabase
                            .from('leads')
                            .insert(smallBatch[j]);
                          
                          if (singleError) {
                            failedCount++;
                            errors.push({
                              row: i + k + j + 2,
                              error: singleError.message,
                            });
                          } else {
                            successCount++;
                          }
                        } catch (err: any) {
                          failedCount++;
                          errors.push({
                            row: i + k + j + 2,
                            error: err.message || 'Unknown error',
                          });
                        }
                      }
                    } else {
                      successCount += smallBatch.length;
                    }
                  } catch (err: any) {
                    // Small batch failed, try individual
                    for (let j = 0; j < smallBatch.length; j++) {
                      try {
                        const { error: singleError } = await supabase
                          .from('leads')
                          .insert(smallBatch[j]);
                        
                        if (singleError) {
                          failedCount++;
                          errors.push({
                            row: i + k + j + 2,
                            error: singleError.message,
                          });
                        } else {
                          successCount++;
                        }
                      } catch (err: any) {
                        failedCount++;
                        errors.push({
                          row: i + k + j + 2,
                          error: err.message || 'Unknown error',
                        });
                      }
                    }
                  }
                }
              } else {
                successCount += batch.length;
              }

              // Update progress after batch completes
              await updateProgress(currentBatch, validLeads.length);
              
              // Log success
              const progressPercent = Math.round((currentBatch / validLeads.length) * 100);
              console.log(`Progress: ${currentBatch}/${validLeads.length} (${progressPercent}%) - ${successCount} successful, ${failedCount} failed`);
              
            } catch (err: any) {
              // Batch failed due to timeout or other error
              console.error(`Batch ${batchNumber} (${i}-${currentBatch}) error:`, err);
              failedCount += batch.length;
              for (let j = 0; j < batch.length; j++) {
                errors.push({
                  row: i + j + 2,
                  error: err.message || 'Batch insert failed',
                });
              }
              
              // Still update progress even on error
              await updateProgress(currentBatch, validLeads.length);
            }
            
            // Small delay between batches for very large uploads to prevent overwhelming the browser
            if (validLeads.length > 10000) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          console.log(`Upload complete: ${successCount} successful, ${failedCount} failed`);

          // Step 3: Update available_leads count once (only if we have successful inserts)
          if (successCount > 0) {
            const { data: projectData } = await supabase
              .from('projects')
              .select('available_leads')
              .eq('id', selectedProjectId)
              .single();
            
            if (projectData) {
              await supabase
                .from('projects')
                .update({ 
                  available_leads: (projectData.available_leads || 0) + successCount 
                })
                .eq('id', selectedProjectId);
            }
          }

          setResult({ success: successCount, failed: failedCount, errors });
          setUploading(false);
          setProgress({ current: 0, total: 0 });
        },
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err.message);
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `client_name,client_phone,client_phone2,client_phone3,client_email,client_job_title,company_name,source
Ahmed Hassan,+201234567890,+201234567891,,ahmed@example.com,Sales Manager,ABC Company,facebook
Sara Mohamed,+201234567892,,,sara@example.com,Marketing Director,XYZ Corp,instagram`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Leads</h1>
        <p className="text-gray-600 mt-1">Bulk upload leads from CSV file</p>
      </div>

      {/* Instructions Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>1. Select the project these leads belong to</li>
          <li>2. Download the CSV template and fill in your lead data</li>
          <li>3. Upload the CSV file (required: client_name, client_phone)</li>
          <li>4. Review the preview and click "Upload Leads"</li>
        </ul>
        <button
          onClick={downloadTemplate}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="space-y-4">
          {/* Project Selection - Searchable */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={selectedProjectId 
                  ? projects.find(p => p.id === selectedProjectId)?.name || projectSearch
                  : projectSearch
                }
                onChange={(e) => {
                  setProjectSearch(e.target.value);
                  setShowProjectDropdown(true);
                  if (e.target.value === '') {
                    setSelectedProjectId('');
                  }
                }}
                onFocus={() => setShowProjectDropdown(true)}
                placeholder="Search project by name, region, or code..."
                className="w-full px-4 pl-10 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              {selectedProjectId && (
                <button
                  onClick={() => {
                    setSelectedProjectId('');
                    setProjectSearch('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Dropdown */}
              {showProjectDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProjectDropdown(false)}
                  />
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredProjects.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No projects found
                      </div>
                    ) : (
                      filteredProjects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setProjectSearch(project.name);
                            setShowProjectDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between ${
                            selectedProjectId === project.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{project.name}</div>
                            <div className="text-xs text-gray-500">
                              {project.region} {project.project_code && `• Code: ${project.project_code}`}
                            </div>
                          </div>
                          {selectedProjectId === project.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                {file ? (
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900">Click to upload CSV</p>
                    <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0] || {}).map((key) => (
                        <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-4 py-2 text-sm text-gray-900">
                            {val || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

              {/* Progress Bar */}
              {uploading && progress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading leads...</span>
                    <span className="font-semibold">
                      {progress.current.toLocaleString()} / {progress.total.toLocaleString()} ({Math.round((progress.current / progress.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 relative overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                      style={{ width: `${Math.min((progress.current / progress.total) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    💡 Check browser console (F12) for detailed progress logs
                  </div>
                </div>
              )}

          {/* Upload Button */}
          <div className="flex gap-2">
            {uploading && (
              <button
                onClick={() => {
                  setCancelled(true);
                  setUploading(false);
                  alert('Upload cancelled. Please check how many leads were successfully uploaded.');
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <X className="h-5 w-5" />
                Cancel Upload
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!file || !selectedProjectId || uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading... {progress.total > 0 && `${progress.current}/${progress.total}`}</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Upload Leads</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-4">
            {result.failed === 0 ? (
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Complete</h3>
              <div className="space-y-1 text-sm">
                <p className="text-green-600 font-medium">✓ {result.success} leads uploaded successfully</p>
                {result.failed > 0 && (
                  <p className="text-red-600 font-medium">✗ {result.failed} leads failed</p>
                )}
              </div>

              {/* Error Details */}
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setPreview([]);
                  setSelectedProjectId('');
                }}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Upload Another File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Format Guide */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">CSV Format Guide</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Required Columns:</strong> client_name, client_phone</p>
          <p><strong>Optional Columns:</strong> client_phone2, client_phone3, client_email, client_job_title, company_name, source</p>
          <p><strong>Source Values:</strong> facebook, instagram, google, tiktok, snapchat, whatsapp</p>
          <p className="mt-4 text-xs">
            💡 Tip: Use the template to ensure correct formatting
          </p>
        </div>
      </div>
    </div>
  );
}

