import { useMemo } from 'react';
import { Lead } from './useLeads';

export interface LeadStats {
  totalLeads: number;
  hotCases: number;
  meetings: number;
  qualityRate: number;
  newLeads: number;
  potential: number;
  callBacks: number;
}

export function useLeadStats(leads: Lead[]) {
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const hotCases = leads.filter((lead) => lead.stage === 'Hot Case').length;
    const meetings = leads.filter((lead) => lead.stage === 'Meeting Done').length;
    const newLeads = leads.filter((lead) => lead.stage === 'New Lead').length;
    const potential = leads.filter((lead) => lead.stage === 'Potential').length;
    const callBacks = leads.filter((lead) => lead.stage === 'Call Back').length;
    const closedDeals = leads.filter((lead) => lead.stage === 'Closed Deal').length;
    const noAnswer = leads.filter((lead) => lead.stage === 'No Answer').length;
    const wrongNumber = leads.filter((lead) => lead.stage === 'Wrong Number').length;
    const switchedOff = leads.filter((lead) => lead.stage === 'Switched Off').length;

    // Quality Rate = (Potential + Hot Case + Meeting Done + Closed Deal + Call Back) / ((Total Leads) - (New Leads + No Answer + Wrong Number + Switched Off))
    const qualityNumerator = potential + hotCases + meetings + closedDeals + callBacks;
    const qualityDenominator = totalLeads - (newLeads + noAnswer + wrongNumber + switchedOff);
    const qualityRate = qualityDenominator > 0 ? (qualityNumerator / qualityDenominator) * 100 : 0;

    return {
      totalLeads,
      hotCases,
      meetings,
      qualityRate: Math.round(qualityRate * 10) / 10,
      newLeads,
      potential,
      callBacks,
    };
  }, [leads]);

  return stats;
}

