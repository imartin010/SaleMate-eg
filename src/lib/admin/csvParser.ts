export interface ParsedLead {
  client_name: string;
  client_phone: string;
  client_phone2?: string;
  client_phone3?: string;
  client_email?: string;
  client_job_title?: string;
  platform: string;
  stage?: string;
}

export function parseCSV(csvContent: string): ParsedLead[] {
  try {
    // Remove BOM if present
    const content = csvContent.replace(/^\uFEFF/, '');
    
    // Split into lines and remove empty lines
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain headers and at least one data row');
    }

    // Parse headers (first line)
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    
    // Parse data rows
    const leads: ParsedLead[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle quoted fields
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Push the last value
      values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
      
      // Map values to lead object
      const lead: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Map header names to lead properties (case insensitive)
        const headerLower = header.toLowerCase();
        
        if (headerLower.includes('name')) {
          lead.client_name = value;
        } else if (headerLower.includes('phone') && !headerLower.includes('2') && !headerLower.includes('3')) {
          lead.client_phone = value;
        } else if (headerLower.includes('phone2') || headerLower.includes('phone 2')) {
          lead.client_phone2 = value;
        } else if (headerLower.includes('phone3') || headerLower.includes('phone 3')) {
          lead.client_phone3 = value;
        } else if (headerLower.includes('email')) {
          lead.client_email = value;
        } else if (headerLower.includes('job') || headerLower.includes('title')) {
          lead.client_job_title = value;
        } else if (headerLower.includes('platform') || headerLower.includes('source')) {
          lead.platform = value || 'Other';
        } else if (headerLower.includes('stage') || headerLower.includes('status')) {
          lead.stage = value || 'New Lead';
        }
      });
      
      // Validate required fields
      if (lead.client_name && lead.client_phone) {
        leads.push({
          client_name: lead.client_name,
          client_phone: lead.client_phone,
          client_phone2: lead.client_phone2 || undefined,
          client_phone3: lead.client_phone3 || undefined,
          client_email: lead.client_email || undefined,
          client_job_title: lead.client_job_title || undefined,
          platform: lead.platform || 'Other',
          stage: lead.stage || 'New Lead',
        });
      }
    }
    
    return leads;
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function generateCSVTemplate(): string {
  const headers = [
    'Client Name',
    'Client Phone',
    'Client Phone 2',
    'Client Phone 3',
    'Client Email',
    'Client Job Title',
    'Platform',
    'Stage'
  ];
  
  const sampleData = [
    ['Ahmed Mohamed', '+201234567890', '+201234567891', '', 'ahmed@example.com', 'Engineer', 'Facebook', 'New Lead'],
    ['Sara Ali', '+201098765432', '', '', 'sara@example.com', 'Doctor', 'Google', 'Potential'],
    ['Mohamed Hassan', '+201555666777', '+201555666778', '', 'mohamed@example.com', 'Teacher', 'TikTok', 'Hot Case'],
  ];
  
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.join(','),
    ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

export function downloadCSVTemplate(): void {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const today = new Date().toISOString().split('T')[0];
  const fileName = `SaleMate_Leads_Template_${today}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

