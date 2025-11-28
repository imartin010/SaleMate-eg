import { motion } from 'framer-motion';
import { Home, Bed, Square, MapPin, DollarSign, TrendingUp, Loader2, RefreshCw, Search } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatCurrency } from '../../lib/format';
import type { InventoryMatch } from '../../types/case';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../core/api/client';
import { matchInventory } from '../../features/case-manager/services/case.service';
import { useAuthStore } from '../../features/auth/store/auth.store';

interface InventoryMatchesCardProps {
  leadId: string;
}

interface InventoryMatchData extends InventoryMatch {
  id: string;
  created_at?: string;
}

export function InventoryMatchesCard({ leadId }: InventoryMatchesCardProps) {
  const [match, setMatch] = useState<InventoryMatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [displayedUnitsCount, setDisplayedUnitsCount] = useState(3); // Start with 3 units displayed
  const [customBudget, setCustomBudget] = useState<string>(''); // User's custom budget input
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);
  const { user } = useAuthStore();

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
        // Filter out units with price < 500,000
        const validUnits = ((data.top_units as any[]) || []).filter((unit: any) => {
          const price = typeof unit.price === 'number' ? unit.price : parseFloat(unit.price || '0');
          return price >= 500000;
        });
        
        // Filter to show only one unit per developer
        const developerMap = new Map<string, any>();
        const uniqueDeveloperUnits: any[] = [];
        
        for (const unit of validUnits) {
          // Extract developer name from the unit
          let developerName = '';
          if (typeof unit.developer === 'string') {
            try {
              // Try to parse if it's a JSON string
              const parsed = JSON.parse(unit.developer);
              developerName = parsed.name || parsed.id || unit.developer;
            } catch {
              // If not JSON, use as is
              developerName = unit.developer;
            }
          } else if (unit.developer && typeof unit.developer === 'object') {
            developerName = unit.developer.name || unit.developer.id || '';
          }
          
          // If we haven't seen this developer yet, add the unit
          if (developerName && !developerMap.has(developerName)) {
            developerMap.set(developerName, true);
            uniqueDeveloperUnits.push(unit);
          }
        }
        
        // Transform the event data into our match format
        const matchData: InventoryMatchData = {
          id: data.id,
          resultCount: uniqueDeveloperUnits.length,
          topUnits: uniqueDeveloperUnits,
          recommendation: data.recommendation || 'No recommendation available.',
          matchId: data.id,
          filters: data.filters as any,
          created_at: data.created_at,
        };
        console.log('🔵 Setting match data:', matchData);
        setMatch(matchData);
        setDisplayedUnitsCount(3); // Reset to showing 3 units when new match is loaded
      } else {
        console.log('🔵 No match data found');
        setMatch(null);
        setDisplayedUnitsCount(3); // Reset when no match
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
    console.log('🔵 InventoryMatchesCard mounted with leadId:', leadId);
    if (!leadId) {
      console.warn('⚠️ No leadId provided to InventoryMatchesCard');
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

  console.log('🔵 InventoryMatchesCard render - loading:', loading, 'match:', !!match, 'error:', error);

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <span className="ml-2 text-sm text-gray-600">Loading inventory matches...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
        <div className="text-center py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </Card>
    );
  }

  if (!match) {
    return (
      <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Home className="h-5 w-5 text-teal-600" />
            Inventory Matches
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!match || !user?.id) {
                // If no match exists, just refetch
                setRefreshing(true);
                fetchLatestMatch();
                return;
              }

              // Re-run inventory matching with stored filters
              setRefreshing(true);
              setError(null);
              
              try {
                const filters = match.filters || {};
                const result = await matchInventory({
                  leadId,
                  userId: user.id,
                  totalBudget: typeof filters.totalBudget === 'number' ? filters.totalBudget : undefined,
                  downPayment: typeof filters.downPayment === 'number' ? filters.downPayment : undefined,
                  monthlyInstallment: typeof filters.monthlyInstallment === 'number' ? filters.monthlyInstallment : undefined,
                  area: typeof filters.area === 'string' ? filters.area : undefined,
                  minBedrooms: typeof filters.minBedrooms === 'number' ? filters.minBedrooms : undefined,
                });

                // After matching, fetch the latest results
                await fetchLatestMatch();
              } catch (err) {
                console.error('Error re-running inventory match:', err);
                setError(err instanceof Error ? err.message : 'Failed to refresh inventory matches');
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No inventory matching has been performed yet.</p>
          <p className="text-xs mt-2 text-gray-400">
            Change the lead stage to "Low Budget" and enter budget information to see matching properties.
          </p>
        </div>
      </Card>
    );
  }

  const latestMatch = match;

  const parseCompoundName = (compound: string) => {
    try {
      if (typeof compound === 'object') return (compound as any).name || 'N/A';
      const match = compound.match(/'name':\s*'([^']+)'/);
      return match ? match[1] : compound;
    } catch {
      return compound;
    }
  };

  const parseAreaName = (area: string) => {
    try {
      if (typeof area === 'object') return (area as any).name || 'N/A';
      const match = area.match(/'name':\s*'([^']+)'/);
      return match ? match[1] : area;
    } catch {
      return area;
    }
  };

  const handleBudgetChange = async (newBudget: number) => {
    if (!user?.id || !leadId || !newBudget || newBudget < 500000) {
      return;
    }

    setIsUpdatingBudget(true);
    setError(null);

    try {
      const filters = match?.filters || {};
      const result = await matchInventory({
        leadId,
        userId: user.id,
        totalBudget: newBudget,
        downPayment: filters.downPayment,
        monthlyInstallment: filters.monthlyInstallment,
        area: filters.area,
        minBedrooms: filters.minBedrooms,
      });

      // After matching, fetch the latest results
      await fetchLatestMatch();
      setCustomBudget(''); // Clear the input
    } catch (err) {
      console.error('Error updating budget match:', err);
      setError(err instanceof Error ? err.message : 'Failed to update budget matches');
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
      <div className="flex items-center gap-2 mb-4">
        <Home className="h-5 w-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Inventory Matches</h3>
        <Badge variant="secondary" className="ml-auto">
          {latestMatch.resultCount} units
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            if (!match || !user?.id) {
              // If no match exists, just refetch
              setRefreshing(true);
              fetchLatestMatch();
              return;
            }

            // Re-run inventory matching with stored filters
            setRefreshing(true);
            setError(null);
            
            try {
              const filters = match.filters || {};
              const result = await matchInventory({
                leadId,
                userId: user.id,
                totalBudget: filters.totalBudget,
                downPayment: filters.downPayment,
                monthlyInstallment: filters.monthlyInstallment,
                area: filters.area,
                minBedrooms: filters.minBedrooms,
              });

              // After matching, fetch the latest results
              await fetchLatestMatch();
            } catch (err) {
              console.error('Error re-running inventory match:', err);
              setError(err instanceof Error ? err.message : 'Failed to refresh inventory matches');
            } finally {
              setRefreshing(false);
            }
          }}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Budget Adjustment Section */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-teal-200">
        <Label htmlFor="custom-budget" className="text-sm font-medium text-gray-700 mb-2 block">
          Adjust Budget to See More Units
        </Label>
        <div className="flex gap-2">
          <Input
            id="custom-budget"
            type="number"
            value={customBudget}
            onChange={(e) => setCustomBudget(e.target.value)}
            placeholder={`Current: ${latestMatch.filters?.totalBudget ? formatCurrency(latestMatch.filters.totalBudget as number, 'EGP') : 'N/A'}`}
            min="500000"
            step="100000"
            className="flex-1"
            disabled={isUpdatingBudget}
          />
          <Button
            onClick={() => {
              const budget = parseFloat(customBudget);
              if (!isNaN(budget) && budget >= 500000) {
                handleBudgetChange(budget);
              }
            }}
            disabled={isUpdatingBudget || !customBudget || parseFloat(customBudget) < 500000}
            size="sm"
          >
            {isUpdatingBudget ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter a new budget (minimum 500,000 EGP) to see matching units
        </p>
      </div>

      {/* Recommendation */}
      {latestMatch.recommendation && (
        <div className={`rounded-lg p-3 mb-4 ${
          latestMatch.resultCount > 0 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`} data-testid="inventory-recommendation">
          <p className={`text-sm ${
            latestMatch.resultCount > 0 ? 'text-green-800' : 'text-amber-800'
          }`}>
            {latestMatch.recommendation}
          </p>
        </div>
      )}

      {/* Top Units */}
      {latestMatch.topUnits && latestMatch.topUnits.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Top Matches:</h4>
          {latestMatch.topUnits.slice(0, displayedUnitsCount).map((unit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-4 border border-teal-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">
                    {parseCompoundName(unit.compound)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                    <MapPin className="h-3 w-3" />
                    {parseAreaName(unit.area)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-teal-700">
                    {formatCurrency(unit.price, unit.currency)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-600">
                {unit.bedrooms !== undefined && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-3 w-3" />
                    {unit.bedrooms} beds
                  </div>
                )}
                {unit.unit_area && (
                  <div className="flex items-center gap-1">
                    <Square className="h-3 w-3" />
                    {unit.unit_area}m²
                  </div>
                )}
                {unit.unit_number && (
                  <div className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {unit.unit_number}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {latestMatch.topUnits.length > displayedUnitsCount && (
            <button
              onClick={() => {
                // First batch: show next 7 units (from 3 to 10)
                // Then show 10 more units at a time
                const remaining = latestMatch.topUnits.length - displayedUnitsCount;
                if (displayedUnitsCount === 3) {
                  // First click: show next 7 units (total 10)
                  setDisplayedUnitsCount(10);
                } else {
                  // Subsequent clicks: show 10 more units
                  setDisplayedUnitsCount(Math.min(displayedUnitsCount + 10, latestMatch.topUnits.length));
                }
              }}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium text-center w-full py-2 hover:underline transition-colors"
            >
              + {latestMatch.topUnits.length - displayedUnitsCount} more units available
            </button>
          )}
        </div>
      )}

      {/* Filters Used */}
      <div className="mt-4 pt-4 border-t border-teal-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Search Criteria:</h4>
        <div className="space-y-1 text-xs text-gray-600">
          {latestMatch.filters.totalBudget && (
            <div className="flex justify-between">
              <span>Budget:</span>
              <span className="font-medium">
                EGP {(latestMatch.filters.totalBudget as number).toLocaleString()}
              </span>
            </div>
          )}
          {latestMatch.filters.downPayment && (
            <div className="flex justify-between">
              <span>Down Payment:</span>
              <span className="font-medium">
                EGP {(latestMatch.filters.downPayment as number).toLocaleString()}
              </span>
            </div>
          )}
          {latestMatch.filters.monthlyInstallment && (
            <div className="flex justify-between">
              <span>Monthly:</span>
              <span className="font-medium">
                EGP {(latestMatch.filters.monthlyInstallment as number).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

