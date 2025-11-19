import { motion } from 'framer-motion';
import { Home, Bed, Square, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../../lib/format';
import type { InventoryMatch } from '../../types/case';

interface InventoryMatchesCardProps {
  matches: InventoryMatch[];
}

export function InventoryMatchesCard({ matches }: InventoryMatchesCardProps) {
  const latestMatch = matches[0];
  if (!latestMatch) return null;

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

  return (
    <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
      <div className="flex items-center gap-2 mb-4">
        <Home className="h-5 w-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Inventory Matches</h3>
        <Badge variant="secondary" className="ml-auto">
          {latestMatch.result_count} units
        </Badge>
      </div>

      {/* Recommendation */}
      {latestMatch.recommendation && (
        <div className={`rounded-lg p-3 mb-4 ${
          latestMatch.result_count > 0 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`} data-testid="inventory-recommendation">
          <p className={`text-sm ${
            latestMatch.result_count > 0 ? 'text-green-800' : 'text-amber-800'
          }`}>
            {latestMatch.recommendation}
          </p>
        </div>
      )}

      {/* Top Units */}
      {latestMatch.top_units && latestMatch.top_units.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Top Matches:</h4>
          {latestMatch.top_units.slice(0, 3).map((unit, index) => (
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

          {latestMatch.top_units.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              + {latestMatch.top_units.length - 3} more units available
            </p>
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

