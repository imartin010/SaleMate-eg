import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import type { Database } from '../../types/database';

type Project = Database['public']['Tables']['projects']['Row'];

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  result?: {
    batchId: string;
    totalLeads: number;
    successfulLeads: number;
    failedLeads: number;
  };
}

export const BulkLeadUpload: React.FC = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const [formData, setFormData] = useState({
    projectId: '',
    cplPrice: '',
    batchName: '',
    csvData: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      setFormData(prev => ({
        ...prev,
        csvData: csvContent,
        batchName: prev.batchName || `Batch_${file.name.replace('.csv', '')}_${new Date().toISOString().split('T')[0]}`
      }));
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!formData.projectId || !formData.cplPrice || !formData.batchName || !formData.csvData) {
      setUploadStatus({ status: 'error', message: 'Please fill all required fields' });
      return;
    }

    setUploadStatus({ status: 'uploading' });

    try {
      // 1. Create lead batch
      const { data: batch, error: batchError } = await supabase
        .from('lead_batches')
        .insert({
          project_id: formData.projectId,
          batch_name: formData.batchName,
          cpl: parseFloat(formData.cplPrice),
          created_by: user?.id
        })
        .select()
        .single();

      if (batchError) {
        throw new Error(`Failed to create batch: ${batchError.message}`);
      }

      // 2. Parse CSV data
      const lines = formData.csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Map CSV headers to database columns
      const headerMap: { [key: string]: string } = {
        'name': 'client_name',
        'client_name': 'client_name',
        'phone': 'client_phone',
        'client_phone': 'client_phone',
        'phone1': 'client_phone',
        'phone2': 'client_phone2',
        'phone3': 'client_phone3',
        'email': 'client_email',
        'client_email': 'client_email',
        'job_title': 'client_job_title',
        'client_job_title': 'client_job_title',
        'source': 'source',
        'feedback': 'feedback'
      };

      const leads = [];
      let successCount = 0;
      let failedCount = 0;

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const leadData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          const dbColumn = headerMap[header];
          if (dbColumn && values[index]) {
            leadData[dbColumn] = values[index];
          }
        });

        // Validate required fields
        if (!leadData.client_name || !leadData.client_phone) {
          failedCount++;
          continue;
        }

        const processedLead = {
          project_id: formData.projectId,
          batch_id: batch.id,
          client_name: leadData.client_name,
          client_phone: leadData.client_phone,
          client_phone2: leadData.client_phone2 || null,
          client_phone3: leadData.client_phone3 || null,
          client_email: leadData.client_email || null,
          client_job_title: leadData.client_job_title || null,
          source: leadData.source || null,
          feedback: leadData.feedback || null,
          stage: 'New Lead' as const,
          buyer_user_id: null // Available for purchase
        };

        leads.push(processedLead);
        successCount++;
      }

      // 3. Insert leads in chunks
      const chunkSize = 1000;
      for (let i = 0; i < leads.length; i += chunkSize) {
        const chunk = leads.slice(i, i + chunkSize);
        
        const { error: insertError } = await supabase
          .from('leads')
          .insert(chunk);

        if (insertError) {
          console.error('Insert error for chunk:', insertError);
          failedCount += chunk.length;
          successCount -= chunk.length;
        }
      }

      setUploadStatus({
        status: 'success',
        message: `Upload completed successfully!`,
        result: {
          batchId: batch.id,
          totalLeads: successCount + failedCount,
          successfulLeads: successCount,
          failedLeads: failedCount
        }
      });

      // Clear form
      setFormData({
        projectId: '',
        cplPrice: '',
        batchName: '',
        csvData: ''
      });

    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadStatus({
        status: 'error',
        message: err.message || 'Upload failed'
      });
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `client_name,client_phone,client_email,client_job_title,source
Ahmed Mohamed,+201234567890,ahmed@example.com,Sales Manager,Facebook
Sara Hassan,+201234567891,sara@example.com,Marketing Director,Google
Mohamed Ali,+201234567892,mohamed@example.com,Business Owner,TikTok`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bulk Lead Upload</h2>
          <p className="text-muted-foreground">Upload multiple leads at once using CSV files</p>
        </div>
        <Button onClick={downloadSampleCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Sample CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project *</label>
            <Select 
              value={formData.projectId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={projects.length === 0 ? "Loading projects..." : "Select a project"} />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="" disabled>
                    No projects available - Create projects first
                  </SelectItem>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.developer} ({project.region})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* CPL Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cost Per Lead (CPL) *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter price per lead (e.g., 25.00)"
              value={formData.cplPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, cplPrice: e.target.value }))}
            />
          </div>

          {/* Batch Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Batch Name *</label>
            <Input
              placeholder="Enter a name for this batch (e.g., Q1_2024_Leads)"
              value={formData.batchName}
              onChange={(e) => setFormData(prev => ({ ...prev, batchName: e.target.value }))}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">CSV File *</label>
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <span className="text-sm text-muted-foreground">
                  {formData.csvData ? 'CSV file loaded' : 'Click to upload CSV file'}
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a CSV file with lead information. See sample format above.
            </p>
          </div>

          {/* Upload Button */}
          <Button 
            onClick={handleUpload}
            disabled={uploadStatus.status === 'uploading' || !formData.projectId || !formData.cplPrice || !formData.batchName || !formData.csvData}
            className="w-full"
          >
            {uploadStatus.status === 'uploading' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading Leads...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Leads
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Status */}
      {uploadStatus.status !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadStatus.status === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : uploadStatus.status === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              Upload Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className={`text-sm ${
                uploadStatus.status === 'success' ? 'text-green-700' : 
                uploadStatus.status === 'error' ? 'text-red-700' : 
                'text-blue-700'
              }`}>
                {uploadStatus.message}
              </p>
              
              {uploadStatus.result && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{uploadStatus.result.totalLeads}</div>
                    <div className="text-xs text-blue-600">Total Processed</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{uploadStatus.result.successfulLeads}</div>
                    <div className="text-xs text-green-600">Successful</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{uploadStatus.result.failedLeads}</div>
                    <div className="text-xs text-red-600">Failed</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Format Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>client_name</strong> - Full name of the client (required)</li>
                <li><strong>client_phone</strong> - Primary phone number (required)</li>
                <li><strong>client_email</strong> - Email address</li>
                <li><strong>client_job_title</strong> - Job title or position</li>
                <li><strong>client_phone2</strong> - Secondary phone number</li>
                <li><strong>client_phone3</strong> - Third phone number</li>
                <li><strong>source</strong> - Lead source information</li>
                <li><strong>feedback</strong> - Additional notes or feedback</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};