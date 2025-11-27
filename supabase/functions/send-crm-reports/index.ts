import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email service configuration (using Resend or Supabase email)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@salemate.com';

interface ReportData {
  agentPerformance: any[];
  sourcePerformance: any[];
  timeAnalytics: any[];
  period: string;
  periodLabel: string;
}

async function sendEmail(to: string[], subject: string, html: string) {
  if (RESEND_API_KEY) {
    // Use Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: to,
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    return await response.json();
  } else {
    // Fallback: Log email (for development)
    console.log('Email would be sent to:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    return { id: 'dev-email-id' };
  }
}

function generateReportHTML(data: ReportData, reportType: string): string {
  const { agentPerformance, sourcePerformance, timeAnalytics, period, periodLabel } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2563eb; }
    h2 { color: #1e40af; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .metric-card { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h1>CRM Analytics Report - ${periodLabel}</h1>
    <p>Report Type: <strong>${reportType}</strong></p>
    <p>Generated: ${new Date().toLocaleString()}</p>

    <h2>Agent Performance</h2>
    <table>
      <thead>
        <tr>
          <th>Agent</th>
          <th>Total Leads</th>
          <th>Closed Deals</th>
          <th>Conversion Rate</th>
          <th>Avg Response Time</th>
          <th>Total Budget</th>
        </tr>
      </thead>
      <tbody>
        ${agentPerformance.map(agent => `
        <tr>
          <td>${agent.agent_name || 'Unknown'}</td>
          <td>${agent.total_leads}</td>
          <td>${agent.closed_deals}</td>
          <td>${agent.conversion_rate}%</td>
          <td>${agent.avg_response_time_hours ? agent.avg_response_time_hours.toFixed(1) + 'h' : 'N/A'}</td>
          <td>${agent.total_budget ? agent.total_budget.toLocaleString('en-US', { style: 'currency', currency: 'EGP' }) : '0'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>Source Performance</h2>
    <table>
      <thead>
        <tr>
          <th>Source</th>
          <th>Total Leads</th>
          <th>Closed Deals</th>
          <th>Conversion Rate</th>
          <th>Total Cost</th>
          <th>Total Revenue</th>
          <th>ROI</th>
        </tr>
      </thead>
      <tbody>
        ${sourcePerformance.map(source => `
        <tr>
          <td>${source.source}</td>
          <td>${source.total_leads}</td>
          <td>${source.closed_deals}</td>
          <td>${source.conversion_rate}%</td>
          <td>${source.total_cost ? source.total_cost.toLocaleString('en-US', { style: 'currency', currency: 'EGP' }) : '0'}</td>
          <td>${source.total_revenue ? source.total_revenue.toLocaleString('en-US', { style: 'currency', currency: 'EGP' }) : '0'}</td>
          <td class="${source.roi_percentage >= 0 ? 'positive' : 'negative'}">
            ${source.roi_percentage}%
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>Time-Based Analytics</h2>
    <p>Leads created and closed over time:</p>
    <table>
      <thead>
        <tr>
          <th>Period</th>
          <th>Leads Created</th>
          <th>Leads Closed</th>
          <th>Conversion Rate</th>
        </tr>
      </thead>
      <tbody>
        ${timeAnalytics.map(period => `
        <tr>
          <td>${period.period_label}</td>
          <td>${period.leads_created}</td>
          <td>${period.leads_closed}</td>
          <td>${period.conversion_rate}%</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>This is an automated report from SaleMate CRM.</p>
      <p>To manage your report preferences, visit your CRM Dashboard.</p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if this is a manual trigger or cron trigger
    const url = new URL(req.url);
    const reportId = url.searchParams.get('reportId');
    const isCron = req.headers.get('x-cron-secret') === Deno.env.get('CRON_SECRET');

    if (reportId) {
      // Manual trigger: send specific report
      const { data: report, error: reportError } = await supabase
        .from('crm_scheduled_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        return new Response(
          JSON.stringify({ error: 'Report not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate and send report
      await generateAndSendReport(supabase, report);
    } else if (isCron) {
      // Cron trigger: send all due reports
      const now = new Date().toISOString();
      const { data: dueReports, error } = await supabase
        .from('crm_scheduled_reports')
        .select('*')
        .eq('is_active', true)
        .lte('next_send_at', now);

      if (error) {
        console.error('Error fetching due reports:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send all due reports
      for (const report of dueReports || []) {
        await generateAndSendReport(supabase, report);
      }

      return new Response(
        JSON.stringify({ success: true, sent: dueReports?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Use reportId query param or cron secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateAndSendReport(supabase: any, report: any) {
  try {
    // Calculate date range based on report type
    const now = new Date();
    let startDate: Date;
    let endDate = now;
    let periodLabel: string;

    switch (report.report_type) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        periodLabel = `Daily Report - ${startDate.toLocaleDateString()}`;
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodLabel = `Weekly Report - Week of ${startDate.toLocaleDateString()}`;
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodLabel = `Monthly Report - ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        periodLabel = 'Report';
    }

    // Fetch analytics data
    const [agentPerf, sourcePerf, timeAnalytics] = await Promise.all([
      supabase.from('crm_agent_performance').select('*'),
      supabase.from('crm_source_performance').select('*'),
      supabase.rpc('get_crm_time_analytics', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        granularity: report.report_type === 'daily' ? 'day' : report.report_type === 'weekly' ? 'week' : 'month',
      }),
    ]);

    const reportData: ReportData = {
      agentPerformance: agentPerf.data || [],
      sourcePerformance: sourcePerf.data || [],
      timeAnalytics: timeAnalytics.data || [],
      period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      periodLabel,
    };

    // Generate HTML
    const html = generateReportHTML(reportData, report.report_type);

    // Send email
    await sendEmail(report.email_recipients, `CRM ${report.report_type} Report - ${periodLabel}`, html);

    // Update report record
    const { data: nextSendAt, error: calcError } = await supabase.rpc('calculate_next_send_at', {
      report_type: report.report_type,
      current_timestamp_param: now.toISOString(),
    });

    if (calcError) {
      console.error('Error calculating next send at:', calcError);
      // Continue without updating next_send_at
    }

    await supabase
      .from('crm_scheduled_reports')
      .update({
        last_sent_at: now.toISOString(),
        next_send_at: nextSendAt || null,
      })
      .eq('id', report.id);

    console.log(`✅ Report sent: ${report.id} to ${report.email_recipients.join(', ')}`);
  } catch (error) {
    console.error(`❌ Error sending report ${report.id}:`, error);
    throw error;
  }
}

