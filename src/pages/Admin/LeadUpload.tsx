import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
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

    try {
      // Parse entire CSV
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const rows = results.data as any[];
          let successCount = 0;
          let failedCount = 0;
          const errors: { row: number; error: string }[] = [];

          // Process each row
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            try {
              // Map CSV columns to lead fields
              const lead = {
                project_id: selectedProjectId,
                client_name: row.client_name || row.name || row.full_name || '',
                client_phone: row.client_phone || row.phone || row.phone_number || '',
                client_phone2: row.client_phone2 || row.phone2 || null,
                client_phone3: row.client_phone3 || row.phone3 || null,
                client_email: row.client_email || row.email || null,
                client_job_title: row.client_job_title || row.job_title || null,
                company_name: row.company_name || row.company || null,
                source: row.source?.toLowerCase() || 'manual',
                platform: row.platform?.toLowerCase() || 'manual',
                stage: 'New Lead',
                is_sold: false,
              };

              // Validate required fields
              if (!lead.client_name || !lead.client_phone) {
                throw new Error('Missing required fields: client_name and client_phone');
              }

              // Insert lead
              const { error: insertError } = await supabase
                .from('leads')
                .insert(lead);

              if (insertError) throw insertError;

              // Increment available leads
              await supabase.rpc('sql', {
                query: `UPDATE projects SET available_leads = available_leads + 1 WHERE id = '${selectedProjectId}'`
              }).catch(() => {
                // Fallback: direct update
                supabase
                  .from('projects')
                  .update({ available_leads: supabase.sql`available_leads + 1` })
                  .eq('id', selectedProjectId);
              });

              successCount++;
            } catch (err: any) {
              failedCount++;
              errors.push({
                row: i + 2, // +2 for header and 1-based indexing
                error: err.message || 'Unknown error',
              });
            }
          }

          setResult({ success: successCount, failed: failedCount, errors });
          setUploading(false);
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
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.region}) - Code: {project.project_code || 'Not set'}
                </option>
              ))}
            </select>
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

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || !selectedProjectId || uploading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
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

