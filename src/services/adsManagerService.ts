/**
 * Facebook Ads Manager Integration Service
 * Extracts project codes from campaign names and assigns leads to projects
 */

import { supabase } from '../lib/supabaseClient';

export interface FacebookLead {
  id: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  form_name?: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

export interface LeadData {
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_phone2?: string;
  client_phone3?: string;
  client_job_title?: string;
  project_code?: string;
  campaign_name?: string;
  source: string;
}

export class AdsManagerService {
  /**
   * Extract project code from campaign name
   * Format: "PROJ001 - Campaign Name" or "PROJ001 Campaign Name"
   * Returns the project code (PROJ001) or null if not found
   */
  static extractProjectCode(campaignName: string): string | null {
    if (!campaignName) return null;

    // Pattern: Code at start followed by space, dash, or nothing
    // Examples:
    // "PROJ001 - Summer Campaign" -> "PROJ001"
    // "PROJ001 Summer Campaign" -> "PROJ001"
    // "PROJ001Campaign" -> "PROJ001"
    // "Summer Campaign" -> null
    
    const match = campaignName.match(/^([A-Z0-9]+)[\s\-]/);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Try without separator (code directly before text)
    const match2 = campaignName.match(/^([A-Z0-9]{3,})/);
    if (match2 && match2[1]) {
      // Check if followed by lowercase letter (likely part of word)
      const afterCode = campaignName.substring(match2[1].length);
      if (afterCode && /^[a-z]/.test(afterCode)) {
        // Code is part of word, not a separate code
        return null;
      }
      return match2[1].trim();
    }

    return null;
  }

  /**
   * Map Facebook lead data to internal lead format
   */
  static mapFacebookLeadToLeadData(fbLead: FacebookLead): LeadData {
    const fieldMap = new Map<string, string>();
    
    // Extract all field data into a map
    fbLead.field_data?.forEach(field => {
      if (field.values && field.values.length > 0) {
        fieldMap.set(field.name.toLowerCase(), field.values[0]);
      }
    });

    // Common field name mappings
    const getName = () => {
      return fieldMap.get('full_name') || 
             fieldMap.get('name') || 
             fieldMap.get('first_name') + ' ' + fieldMap.get('last_name') || 
             'Unknown';
    };

    const getPhone = () => {
      return fieldMap.get('phone_number') || 
             fieldMap.get('phone') || 
             fieldMap.get('mobile_number') || 
             '';
    };

    const getEmail = () => {
      return fieldMap.get('email') || 
             fieldMap.get('email_address') || 
             undefined;
    };

    // Extract project code from campaign name
    const projectCode = this.extractProjectCode(fbLead.campaign_name || '');

    return {
      client_name: getName(),
      client_phone: getPhone(),
      client_email: getEmail(),
      project_code: projectCode || undefined,
      campaign_name: fbLead.campaign_name,
      source: 'Facebook Ads Manager',
    };
  }

  /**
   * Find project by project code
   */
  static async findProjectByCode(projectCode: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('project_code', projectCode)
      .single();

    if (error || !data) {
      console.error(`Project not found for code: ${projectCode}`, error);
      return null;
    }

    return data.id;
  }

  /**
   * Create lead from Facebook Ads Manager data
   */
  static async createLeadFromFacebook(
    leadData: LeadData,
    integrationId?: string
  ): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      // Find project by code
      let projectId: string | null = null;
      
      if (leadData.project_code) {
        projectId = await this.findProjectByCode(leadData.project_code);
        
        if (!projectId) {
          return {
            success: false,
            error: `Project not found for code: ${leadData.project_code}`,
          };
        }
      } else {
        // If no project code found, use DEFAULT project
        const { data: defaultProject } = await supabase
          .from('projects')
          .select('id')
          .eq('project_code', 'DEFAULT')
          .single();

        if (!defaultProject) {
          return {
            success: false,
            error: 'No project code found and DEFAULT project does not exist',
          };
        }

        projectId = defaultProject.id;
      }

      // Get project CPL price
      const { data: projectData } = await supabase
        .from('projects')
        .select('price_per_lead')
        .eq('id', projectId)
        .single();

      const cplPrice = projectData?.price_per_lead || 0;

      // Create lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          project_id: projectId,
          client_name: leadData.client_name,
          client_phone: leadData.client_phone,
          client_email: leadData.client_email,
          client_phone2: leadData.client_phone2,
          client_phone3: leadData.client_phone3,
          client_job_title: leadData.client_job_title,
          source: leadData.source,
          cpl_price: cplPrice,
          integration_id: integrationId || null,
          stage: 'New Lead',
          is_sold: false,
          platform: 'Facebook' as any, // Using existing enum
        })
        .select('id')
        .single();

      if (leadError || !lead) {
        return {
          success: false,
          error: leadError?.message || 'Failed to create lead',
        };
      }

      // Update project available_leads counter
      await supabase.rpc('increment_project_available_leads', {
        project_id: projectId,
      });

      return {
        success: true,
        leadId: lead.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error creating lead',
      };
    }
  }

  /**
   * Process batch of Facebook leads
   */
  static async processBatchFacebookLeads(
    facebookLeads: FacebookLead[],
    integrationId?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const fbLead of facebookLeads) {
      const leadData = this.mapFacebookLeadToLeadData(fbLead);
      const result = await this.createLeadFromFacebook(leadData, integrationId);

      if (result.success) {
        success++;
      } else {
        failed++;
        errors.push(`Lead ${fbLead.id}: ${result.error}`);
      }
    }

    return { success, failed, errors };
  }
}

