import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { useProjectStore } from '../../store/projects';
import { useAuthStore } from '../../store/auth';
import { supabase } from "../../lib/supabaseClient"
import type { Project, BulkUploadResponse } from '../../types';
import type { Database } from '../../types/database';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Download,
  Info
} from 'lucide-react';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  result?: BulkUploadResponse;
}

export const BulkLeadUpload: React.FC = () => {
  const { projects, fetchProjects } = useProjectStore();
  const { user } = useAuthStore();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const [formData, setFormData] = useState({
    projectId: '',
    cplPrice: '',
    batchName: '',
    csvData: ''
  });

  // Load projects on mount
  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const handleUpload = async () => {
    if (!formData.projectId || !formData.cplPrice || !formData.batchName || !formData.csvData) {
      setUploadStatus({
        status: 'error',
        message: 'Please fill in all required fields and upload a CSV file'
      });
      return;
    }

    setUploadStatus({ status: 'uploading' });

    try {
      // Parse CSV data
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
        'platform': 'platform',
        'stage': 'stage',
        'feedback': 'feedback',
        'source': 'source'
      };

      const leads = [];
      const errors = [];
      let failedCount = 0;

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, '')); // Remove quotes
        const leadData: Record<string, string> = {};
        
        // Map values to lead fields
        headers.forEach((header, index) => {
          const dbColumn = headerMap[header];
          if (dbColumn && values[index]) {
            leadData[dbColumn] = values[index];
          }
        });

        // Validate required fields
        if (!leadData.client_name || !leadData.client_phone) {
          errors.push(`Row ${i + 1}: Missing required fields (name or phone)`);
          failedCount++;
          continue;
        }

        // Validate and normalize enum values
        const validPlatforms = ['Facebook', 'Google', 'TikTok', 'Other'];
        const validStages = ['New Lead', 'Potential', 'Hot Lead', 'Non Potential'];
        
        const platform = validPlatforms.includes(leadData.platform) ? leadData.platform : 'Other';
        const stage = validStages.includes(leadData.stage) ? leadData.stage : 'New Lead';

        // Set defaults and ensure required fields are properly typed
        // Start with minimal required fields only
        const processedLead: Partial<Database["public"]["Tables"]["leads"]["Insert"]> = {
          client_name: leadData.client_name,
          client_phone: leadData.client_phone,
          platform: platform as Database["public"]["Enums"]["platform_type"],
          project_id: formData.projectId
        };

        // Add optional fields only if they exist in the data
        if (leadData.client_phone2) processedLead.client_phone2 = leadData.client_phone2;
        if (leadData.client_phone3) processedLead.client_phone3 = leadData.client_phone3;
        if (leadData.client_email) processedLead.client_email = leadData.client_email;
        if (leadData.client_job_title) processedLead.client_job_title = leadData.client_job_title;
        if (leadData.source) processedLead.source = leadData.source;
        if (leadData.feedback) processedLead.feedback = leadData.feedback;
        
        // Add system fields
        processedLead.stage = stage as Database["public"]["Enums"]["lead_stage"];
        processedLead.cpl_price = parseFloat(formData.cplPrice) || null;
        processedLead.is_sold = false;
        
        // Add user ID if available
        if (user?.id) processedLead.upload_user_id = user.id;

        leads.push(processedLead);
      }

      // Insert leads in batches
      const batchSize = 50;
      const insertedLeads = [];

      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        
        // Debug logging
        console.log('Attempting to insert batch:', {
          batchSize: batch.length,
          sampleLead: batch[0],
          allFields: Object.keys(batch[0] || {})
        });

        const { data: insertedBatch, error: insertError } = await supabase
          .from('leads')
          .insert(batch)
          .select('id');

        if (insertError) {
          console.error('Insert error:', insertError);
          console.error('Error details:', insertError.details);
          console.error('Error hint:', insertError.hint);
          failedCount += batch.length;
          errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}${insertError.details ? ` - ${insertError.details}` : ''}`);
        } else {
          insertedLeads.push(...(insertedBatch || []));
          console.log(`Successfully inserted batch of ${insertedBatch?.length || 0} leads`);
        }
      }

      // Update project available leads count
      if (insertedLeads.length > 0) {
        // First get the current count
        const { data: projectData } = await supabase
          .from('projects')
          .select('available_leads')
          .eq('id', formData.projectId)
          .single();

        if (projectData) {
          const newCount = (projectData.available_leads || 0) + insertedLeads.length;
          await supabase
            .from('projects')
            .update({ 
              available_leads: newCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', formData.projectId);
        }
      }

      setUploadStatus({
        status: 'success',
        message: `Successfully uploaded ${insertedLeads.length} leads${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
        result: {
          success: true,
          batchId: Date.now().toString(),
          totalProcessed: leads.length + failedCount,
          successful: insertedLeads.length,
          failed: failedCount,
          errors: errors.length > 0 ? errors : undefined,
          message: `Successfully uploaded ${insertedLeads.length} leads`
        }
      });
      
      // Reset form
      setFormData({
        projectId: '',
        cplPrice: '',
        batchName: '',
        csvData: ''
      });
      
      // Clear file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh projects to update available leads count
      setTimeout(() => fetchProjects(), 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `client_name,client_phone,client_phone2,client_phone3,client_email,client_job_title,platform,stage,feedback,source
John Doe,+201234567890,+201234567891,,john.doe@email.com,Software Engineer,Facebook,New Lead,Interested in 2BR apartment,Website
Jane Smith,+201234567892,,+201234567893,jane.smith@email.com,Marketing Manager,Google,Potential,Looking for investment property,Referral
Ahmed Ali,+201234567894,+201234567895,,ahmed.ali@email.com,Business Owner,TikTok,Hot Case,Ready to buy this month,Social Media`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bulk Lead Upload</h2>
          <p className="text-muted-foreground">Upload multiple leads at once using CSV files</p>
        </div>
        <Button 
          variant="outline" 
          onClick={downloadSampleCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Sample CSV
        </Button>
      </div>

      {/* Upload Form */}
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
            <Label htmlFor="project">Project *</Label>
            <Select 
              value={formData.projectId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: Project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} - {project.developer} ({project.region})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CPL Price */}
          <div className="space-y-2">
            <Label htmlFor="cpl-price">Cost Per Lead (CPL) *</Label>
            <Input
              id="cpl-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter price per lead (e.g., 50.00)"
              value={formData.cplPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, cplPrice: e.target.value }))}
            />
          </div>

          {/* Batch Name */}
          <div className="space-y-2">
            <Label htmlFor="batch-name">Batch Name *</Label>
            <Input
              id="batch-name"
              placeholder="Enter a name for this batch (e.g., Q1_2024_Leads)"
              value={formData.batchName}
              onChange={(e) => setFormData(prev => ({ ...prev, batchName: e.target.value }))}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File *</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
            />
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with lead information. See sample format above.
            </p>
          </div>

          {/* CSV Preview */}
          {formData.csvData && (
            <div className="space-y-2">
              <Label>CSV Preview</Label>
              <Textarea
                value={formData.csvData.split('\n').slice(0, 5).join('\n') + (formData.csvData.split('\n').length > 5 ? '\n...' : '')}
                readOnly
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Showing first 5 rows. Total rows: {formData.csvData.split('\n').length - 1} (excluding header)
              </p>
            </div>
          )}

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

      {/* Status Display */}
      {uploadStatus.status !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(uploadStatus.status)}
              Upload Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Badge className={getStatusColor(uploadStatus.status)}>
                {uploadStatus.status.toUpperCase()}
              </Badge>
              
              {uploadStatus.message && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{uploadStatus.message}</AlertDescription>
                </Alert>
              )}

              {uploadStatus.result && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadStatus.result.totalProcessed}
                    </div>
                    <div className="text-sm text-blue-600">Total Processed</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadStatus.result.successful}
                    </div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {uploadStatus.result.failed}
                    </div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {uploadStatus.result.successful > 0 ? Math.round((uploadStatus.result.successful / uploadStatus.result.totalProcessed) * 100) : 0}%
                    </div>
                    <div className="text-sm text-purple-600">Success Rate</div>
                  </div>
                </div>
              )}

              {uploadStatus.result?.errors && uploadStatus.result.errors.length > 0 && (
                <div className="space-y-2">
                  <Label>Errors:</Label>
                  <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded border">
                    {uploadStatus.result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadStatus.status === 'uploading' && (
                <div className="space-y-2">
                  <Progress value={33} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    Processing your CSV file...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            CSV Format Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required Columns:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code>client_name</code> - Full name of the client (required)</li>
                <li><code>client_phone</code> - Primary phone number (required)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Optional Columns:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code>client_phone2</code> - Secondary phone number</li>
                <li><code>client_phone3</code> - Third phone number</li>
                <li><code>client_email</code> - Email address</li>
                <li><code>client_job_title</code> - Job title or profession</li>
                <li><code>platform</code> - Lead source (Facebook, Google, TikTok, Other)</li>
                <li><code>stage</code> - Lead stage (New Lead, Potential, Hot Case, etc.)</li>
                <li><code>feedback</code> - Initial notes or feedback</li>
                <li><code>source</code> - Source description</li>
              </ul>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Download the sample CSV above to see the exact format. Make sure your CSV has headers in the first row.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
