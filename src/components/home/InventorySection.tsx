import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Inventory Section
 * Display inventory count and CTA
 */
const InventorySection: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventoryCount();
  }, []);

  const loadInventoryCount = async () => {
    try {
      setLoading(true);
      
      // Use count query for performance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: inventoryCount, error } = await (supabase as any)
        .from('salemate-inventory')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.warn('Error loading inventory count:', error);
        // Fallback to a default value if query fails
        setCount(30000);
      } else {
        setCount(inventoryCount || 30000);
      }
    } catch (err) {
      console.error('Error loading inventory count:', err);
      // Fallback to default
      setCount(30000);
    } finally {
      setLoading(false);
    }
  };

  const displayCount = loading ? '...' : count?.toLocaleString() || '30,000+';

  return (
    <div className="rounded-2xl md:rounded-3xl bg-white shadow-sm md:shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 md:p-8 border border-gray-100 h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 flex-1">
        <div className="space-y-2 md:space-y-3 flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <Package className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            Real-Time Inventory
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading inventory...
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2 mb-1">
                  <RefreshCw className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-semibold text-green-600">Live</span>
                </span>
                Explore more than <span className="font-bold text-blue-600">{displayCount}</span> primary updated units in Egypt
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/app/inventory')}
          className="px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 whitespace-nowrap text-sm md:text-base"
        >
          Explore
        </button>
      </div>
    </div>
  );
});

InventorySection.displayName = 'InventorySection';

export default InventorySection;

