import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Download,
  Building2,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  ArrowRight,
  Check,
  X,
  Eye,
  HelpCircle,
  Zap,
  Shield,
  Target,
  Database as DatabaseIcon,
  Clock
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

interface ValidationError {
  field: string;
  message: string;
}

export const BulkLeadUpload: React.FC = () => {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    projectId: '',
    cplPrice: '',
    batchName: '',
    csvData: ''
  });
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [csvStats, setCsvStats] = useState({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    requiredColumnsFound: false
  });
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  // Filter projects based on search term
  useEffect(() => {
    if (!projectSearchTerm) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.developer.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.region.toLowerCase().includes(projectSearchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [projects, projectSearchTerm]);

  const loadProjects = async () => {
    try {
      setProjectsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
      setUploadStatus({ status: 'error', message: 'Failed to load projects' });
    } finally {
      setProjectsLoading(false);
    }
  };

  const validateCsvData = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return { isValid: false, errors: ['CSV file must have at least a header row and one data row'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredColumns = ['client_name', 'client_phone'];
    
    // Check for required columns
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(h => h === col || h === col.replace('client_', ''))
    );
    
    const errors: string[] = [];
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Validate data rows
    let validRows = 0;
    let invalidRows = 0;
    
    for (let i = 1; i < Math.min(lines.length, 11); i++) { // Check first 10 rows
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const hasName = values.some(v => v.length > 2);
      const hasPhone = values.some(v => v.match(/^\+?[\d\s-()]+$/) && v.length >= 10);
      
      if (hasName && hasPhone) {
        validRows++;
      } else {
        invalidRows++;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      stats: {
        totalRows: lines.length - 1,
        validRows,
        invalidRows,
        requiredColumnsFound: missingColumns.length === 0
      }
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setValidationErrors([]);
    setUploadStatus({ status: 'idle' });

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setValidationErrors([{ field: 'file', message: 'Please select a valid CSV file' }]);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setValidationErrors([{ field: 'file', message: 'File size must be less than 10MB' }]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      
      // Validate CSV content
      const validation = validateCsvData(csvContent);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors.map(error => ({ field: 'csv', message: error })));
        return;
      }

      // Parse CSV for preview
      const lines = csvContent.trim().split('\n');
      const preview = lines.slice(0, 6).map(line => 
        line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''))
      );
      setCsvPreview(preview);
      setCsvStats(validation.stats || { totalRows: 0, validRows: 0, invalidRows: 0, requiredColumnsFound: false });
      
      setFormData(prev => ({
        ...prev,
        csvData: csvContent,
        batchName: prev.batchName || `Batch_${file.name.replace('.csv', '')}_${new Date().toISOString().split('T')[0]}`
      }));
      
      // Auto-advance to next step
      if (currentStep === 2) {
        setCurrentStep(3);
      }
    };
    reader.readAsText(file);
  };

  const handleProjectSelection = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
    setFormData(prev => ({ 
      ...prev, 
      projectId,
      cplPrice: project?.price_per_lead?.toString() || prev.cplPrice
    }));
    // Auto-advance to next step
    if (projectId && currentStep === 1) {
      setCurrentStep(2);
    }
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
          cpl_price: parseFloat(formData.cplPrice),
          upload_user_id: user?.id
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
        const leadData: Record<string, string | null> = {};
        
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
          source: leadData.source || 'Bulk Upload',
          feedback: leadData.feedback || null,
          platform: 'Other' as const,
          stage: 'New Lead' as const,
          buyer_user_id: null, // Available for purchase
          upload_user_id: user?.id,
          cpl_price: parseFloat(formData.cplPrice)
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

    } catch (err: unknown) {
      console.error('Upload error:', err);
      setUploadStatus({
        status: 'error',
        message: (err instanceof Error ? err.message : 'Upload failed')
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

  const steps = [
    { id: 1, title: 'Select Project', icon: Building2, description: 'Choose the project for your leads' },
    { id: 2, title: 'Upload CSV', icon: Upload, description: 'Upload your lead data file' },
    { id: 3, title: 'Review & Configure', icon: Eye, description: 'Review data and set pricing' },
    { id: 4, title: 'Complete Upload', icon: Check, description: 'Finalize and upload leads' }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Smart Lead Upload
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload thousands of leads in minutes with our intelligent validation and processing system
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.id 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : currentStep === step.id 
                        ? 'border-blue-500 text-blue-500 bg-blue-50'
                        : 'border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="ml-4 min-w-0">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 hidden sm:block">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-8 ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-96">
            {/* Step 1: Project Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Building2 className="h-12 w-12 mx-auto text-blue-500" />
                  <h2 className="text-2xl font-bold">Select Target Project</h2>
                  <p className="text-muted-foreground">Choose which project these leads belong to</p>
                </div>

                {projectsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-lg">Loading projects...</span>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <AlertCircle className="h-16 w-16 mx-auto text-orange-500" />
                    <h3 className="text-xl font-semibold">No Projects Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You need to populate the projects table first. Run the project population SQL script in Supabase.
                    </p>
                    <Button onClick={loadProjects} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Projects
                    </Button>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {/* Search Input */}
                    <div className="space-y-2">
                      <Input
                        placeholder="Search projects by name, developer, or region..."
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                        className="h-12 text-lg"
                      />
                      <p className="text-sm text-muted-foreground text-center">
                        {filteredProjects.length} of {projects.length} projects shown
                      </p>
                    </div>

                    {/* Project Dropdown */}
                    <div className="space-y-3">
                      <Select 
                        value={formData.projectId} 
                        onValueChange={handleProjectSelection}
                      >
                        <SelectTrigger className="h-16 text-left">
                          <SelectValue placeholder="Select a project to upload leads to">
                            {selectedProject && (
                              <div className="flex items-center justify-between w-full">
                                <div className="space-y-1">
                                  <div className="font-semibold text-lg">{selectedProject.name}</div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {selectedProject.developer}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Target className="h-3 w-3" />
                                      {selectedProject.region}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {selectedProject.available_leads || 0} leads
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      ${selectedProject.price_per_lead || 0} CPL
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {filteredProjects.length === 0 ? (
                            <SelectItem value="none" disabled>
                              {projectSearchTerm ? 'No projects match your search' : 'No projects available'}
                            </SelectItem>
                          ) : (
                            filteredProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                <div className="flex flex-col py-2">
                                  <span className="font-semibold text-base">{project.name}</span>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {project.developer}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Target className="h-3 w-3" />
                                      {project.region}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {project.available_leads || 0} leads
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      ${project.price_per_lead || 0} CPL
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Project Details */}
                    {selectedProject && (
                      <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Selected Project
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600 font-medium">Project:</span>
                            <div className="font-semibold text-blue-900">{selectedProject.name}</div>
                          </div>
                          <div>
                            <span className="text-blue-600 font-medium">Developer:</span>
                            <div className="font-semibold text-blue-900">{selectedProject.developer}</div>
                          </div>
                          <div>
                            <span className="text-blue-600 font-medium">Region:</span>
                            <div className="font-semibold text-blue-900">{selectedProject.region}</div>
                          </div>
                          <div>
                            <span className="text-blue-600 font-medium">Current CPL:</span>
                            <div className="font-semibold text-blue-900">${selectedProject.price_per_lead || 0}</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <Button onClick={() => setCurrentStep(2)} className="w-full">
                            Continue to File Upload
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: File Upload */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-blue-500" />
                  <h2 className="text-2xl font-bold">Upload Your CSV File</h2>
                  <p className="text-muted-foreground">Upload a CSV file containing your lead data</p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    formData.csvData ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      {formData.csvData ? (
                        <div className="space-y-4">
                          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                          <div>
                            <h3 className="text-xl font-semibold text-green-700">File Uploaded Successfully!</h3>
                            <p className="text-green-600 mt-2">
                              {csvStats.totalRows} leads detected • {csvStats.validRows} valid • {csvStats.invalidRows} need review
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <FileText className="h-16 w-16 mx-auto text-gray-400" />
                          <div>
                            <h3 className="text-xl font-semibold">Drop your CSV file here</h3>
                            <p className="text-muted-foreground mt-2">or click to browse files</p>
                            <p className="text-sm text-muted-foreground mt-1">Maximum file size: 10MB</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                        <AlertCircle className="h-4 w-4" />
                        Validation Errors
                      </div>
                      <ul className="text-sm text-red-600 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-center gap-4">
                    <Button onClick={downloadSampleCSV} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample CSV
                    </Button>
                    <Button onClick={() => setCurrentStep(1)} variant="outline">
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Configure */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Eye className="h-12 w-12 mx-auto text-blue-500" />
                  <h2 className="text-2xl font-bold">Review & Configure</h2>
                  <p className="text-muted-foreground">Review your data and configure upload settings</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                  {/* Left: Data Preview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Preview</h3>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <DatabaseIcon className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{csvStats.totalRows}</div>
                        <div className="text-xs text-blue-600">Total Leads</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
                        <div className="text-2xl font-bold text-green-600">{csvStats.validRows}</div>
                        <div className="text-xs text-green-600">Valid</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <AlertCircle className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                        <div className="text-2xl font-bold text-orange-600">{csvStats.invalidRows}</div>
                        <div className="text-xs text-orange-600">Need Review</div>
                      </div>
                    </div>

                    {/* CSV Preview Table */}
                    {csvPreview.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                          <h4 className="font-medium">CSV Preview (First 5 rows)</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                {csvPreview[0]?.map((header, idx) => (
                                  <th key={idx} className="p-3 text-left font-medium">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.slice(1, 6).map((row, idx) => (
                                <tr key={idx} className="border-t">
                                  {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="p-3 truncate max-w-32">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Configuration */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Upload Configuration</h3>

                    {/* Project Info */}
                    {selectedProject && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Selected Project</h4>
                        <div className="space-y-1 text-sm text-blue-700">
                          <div><strong>{selectedProject.name}</strong></div>
                          <div>{selectedProject.developer} • {selectedProject.region}</div>
                          <div>Current CPL: ${selectedProject.price_per_lead || 0}</div>
                        </div>
                      </div>
                    )}

                    {/* CPL Configuration */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Cost Per Lead (CPL) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter price per lead (e.g., 25.00)"
                        value={formData.cplPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, cplPrice: e.target.value }))}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be the price buyers pay for each lead from this batch
                      </p>
                    </div>

                    {/* Batch Name */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Batch Name *
                      </label>
                      <Input
                        placeholder="Enter a name for this batch"
                        value={formData.batchName}
                        onChange={(e) => setFormData(prev => ({ ...prev, batchName: e.target.value }))}
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use a descriptive name to identify this batch later
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={() => setCurrentStep(2)} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(4)}
                        disabled={!formData.cplPrice || !formData.batchName}
                        className="flex-1"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Complete Upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Target className="h-12 w-12 mx-auto text-blue-500" />
                  <h2 className="text-2xl font-bold">Ready to Upload</h2>
                  <p className="text-muted-foreground">Review everything and complete your upload</p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Summary Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border">
                    <h3 className="text-lg font-semibold mb-4">Upload Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Project:</span>
                        <div className="font-medium">{selectedProject?.name}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Leads:</span>
                        <div className="font-medium">{csvStats.totalRows}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CPL:</span>
                        <div className="font-medium">${formData.cplPrice}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Batch Name:</span>
                        <div className="font-medium">{formData.batchName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {uploadStatus.status === 'uploading' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="text-lg font-medium">Processing your leads...</span>
                      </div>
                      <Progress value={uploadProgress} className="h-3" />
                      <p className="text-center text-sm text-muted-foreground">
                        This may take a few moments for large files
                      </p>
                    </div>
                  )}

                  {/* Success Result */}
                  {uploadStatus.status === 'success' && uploadStatus.result && (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-green-700">Upload Successful!</h3>
                        <p className="text-green-600 mt-2">{uploadStatus.message}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{uploadStatus.result.totalLeads}</div>
                          <div className="text-xs text-blue-600">Total</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{uploadStatus.result.successfulLeads}</div>
                          <div className="text-xs text-green-600">Success</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{uploadStatus.result.failedLeads}</div>
                          <div className="text-xs text-red-600">Failed</div>
                        </div>
                      </div>
                      <Button onClick={() => {
                        setCurrentStep(1);
                        setFormData({ projectId: '', cplPrice: '', batchName: '', csvData: '' });
                        setCsvPreview([]);
                        setUploadStatus({ status: 'idle' });
                      }}>
                        Upload More Leads
                      </Button>
                    </div>
                  )}

                  {/* Error Result */}
                  {uploadStatus.status === 'error' && (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-8 w-8 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-red-700">Upload Failed</h3>
                        <p className="text-red-600 mt-2">{uploadStatus.message}</p>
                      </div>
                      <Button onClick={() => setUploadStatus({ status: 'idle' })} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* Upload Button */}
                  {uploadStatus.status === 'idle' && (
                    <div className="flex gap-3">
                      <Button onClick={() => setCurrentStep(3)} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button onClick={handleUpload} className="flex-1 h-12 text-lg">
                        <Shield className="h-5 w-5 mr-2" />
                        Upload {csvStats.totalRows} Leads
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span>Need help? Check our documentation</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Your data is secure and encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Process thousands of leads in minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};