import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Home, MapPin, Building2, Bed, Square, CheckCircle, XCircle, Search, Loader2, RefreshCw } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '../../core/api/client';

interface InventoryMatch {
  id: string;
  resultCount: number;
  topUnits: Array<{
    id: number;
    unit_id?: string;
    unit_number?: string;
    compound: string;
    area: string;
    developer: string;
    property_type: string;
    bedrooms?: number;
    unit_area?: number;
    price: number;
    currency: string;
  }>;
  recommendation: string;
  matchId: string;
  filters?: {
    totalBudget?: number;
    downPayment?: number;
    monthlyInstallment?: number;
    maxPrice?: number;
  };
  created_at: string;
}

interface InventoryMatchingResultsProps {
  leadId: string;
}

export function InventoryMatchingResults({ leadId }: InventoryMatchingResultsProps) {
  const [match, setMatch] = useState<InventoryMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLatestMatch = useCallback(async () => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('🔵 Fetching inventory match for leadId:', leadId);
      // Query the events table for the latest inventory matching result
      const { data, error: queryError } = await supabase
        .from('events')
        .select('*')
        .eq('lead_id', leadId)
        .eq('event_type', 'activity')
        .eq('activity_type', 'recommendation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) {
        console.error('Error fetching inventory match:', queryError);
        setError(queryError.message);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('🔵 Query result:', data);
      if (data) {
        // Filter out units with price 0
        const validUnits = ((data.top_units as any[]) || []).filter((unit: any) => {
          const price = typeof unit.price === 'number' ? unit.price : parseFloat(unit.price || '0');
          return price > 0;
        });
        
        // Transform the event data into our match format
        const matchData: InventoryMatch = {
          id: data.id,
          resultCount: validUnits.length, // Update count to reflect filtered units
          topUnits: validUnits,
          recommendation: data.recommendation || 'No recommendation available.',
          matchId: data.id,
          filters: data.filters as any,
          created_at: data.created_at,
        };
        console.log('🔵 Setting match data:', matchData);
        console.log('🔵 Filtered out', ((data.top_units as any[]) || []).length - validUnits.length, 'units with price 0');
        setMatch(matchData);
      } else {
        console.log('🔵 No match data found');
        setMatch(null);
      }
    } catch (err) {
      console.error('Error fetching inventory match:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leadId]);

  useEffect(() => {
    console.log('🔵 InventoryMatchingResults mounted with leadId:', leadId);
    if (!leadId) {
      console.warn('⚠️ No leadId provided to InventoryMatchingResults');
      return;
    }

    fetchLatestMatch();

    // Set up real-time subscription to listen for new matches
    const channel = supabase
      .channel(`inventory-matches-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          console.log('🔵 Real-time event received:', payload);
          const newEvent = payload.new as any;
          if (newEvent.event_type === 'activity' && newEvent.activity_type === 'recommendation') {
            console.log('🔵 New inventory match event detected, refetching...');
            // Refetch to get the latest data
            fetchLatestMatch();
          }
        }
      )
      .subscribe((status) => {
        console.log('🔵 Real-time subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, fetchLatestMatch]);

  console.log('🔵 InventoryMatchingResults render - loading:', loading, 'match:', !!match, 'error:', error);

  if (loading) {
    return (
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-sm text-gray-600">Loading budget matches...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100">
        <div className="text-center py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </Card>
    );
  }

  // Always show the component - show placeholder if no match
  if (!match) {
    return (
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-600" />
            Budget Matching Results
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              fetchLatestMatch();
            }}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No budget matching has been performed yet.</p>
          <p className="text-xs mt-2 text-gray-400">
            Change the lead stage to "Low Budget" and enter budget information to see matching properties.
          </p>
        </div>
      </Card>
    );
  }

  const hasMatches = match.resultCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-600" />
            Budget Matching Results
          </h3>
          <div className="flex items-center gap-3">
            {match.filters && (
              <div className="text-xs text-gray-500">
                {match.filters.totalBudget && (
                  <span>Budget: {match.filters.totalBudget.toLocaleString()} EGP</span>
                )}
                {match.filters.downPayment && match.filters.monthlyInstallment && (
                  <span>
                    {match.filters.totalBudget ? ' • ' : ''}
                    DP: {match.filters.downPayment.toLocaleString()} EGP, Monthly: {match.filters.monthlyInstallment.toLocaleString()} EGP
                  </span>
                )}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshing(true);
                fetchLatestMatch();
              }}
              disabled={refreshing || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {!hasMatches ? (
            // No matches found - show warning
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <XCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-red-900 mb-2">
                    No Matching Properties Found
                  </h4>
                  <p className="text-red-800 mb-4">
                    <strong>Yes, he's low budget - don't waste your time with him. Move to another lead.</strong>
                  </p>
                  <p className="text-sm text-red-700">
                    The client's budget is below what's available in our inventory. Consider focusing on leads with higher budgets.
                  </p>
                  {match.recommendation && (
                    <div className="mt-4 p-3 bg-red-100 rounded border border-red-200">
                      <p className="text-sm text-red-800">{match.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Matches found - show projects
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-semibold">
                    Found {match.resultCount} {match.resultCount === 1 ? 'property' : 'properties'} matching the budget
                  </p>
                </div>
              </div>

              {match.recommendation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">{match.recommendation}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Matching Projects (Up to 10):</h4>
                <div className="grid gap-4">
                  {match.topUnits.slice(0, 10).map((unit) => (
                    <motion.div
                      key={unit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            {unit.compound || 'N/A'}
                          </h5>
                          {unit.unit_number && (
                            <p className="text-sm text-gray-600">Unit: {unit.unit_number}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {unit.price.toLocaleString()} {unit.currency || 'EGP'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{unit.area || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="h-4 w-4" />
                          <span className="truncate">{unit.developer || 'N/A'}</span>
                        </div>
                        {unit.bedrooms !== undefined && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Bed className="h-4 w-4" />
                            <span>{unit.bedrooms} {unit.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                          </div>
                        )}
                        {unit.unit_area && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Square className="h-4 w-4" />
                            <span>{unit.unit_area} m²</span>
                          </div>
                        )}
                      </div>

                      {unit.property_type && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {unit.property_type}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

