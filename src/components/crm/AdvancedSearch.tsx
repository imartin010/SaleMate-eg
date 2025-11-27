import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, DollarSign, User, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LeadFilters } from '../../hooks/crm/useLeadFilters';

interface AdvancedSearchProps {
  filters: LeadFilters;
  onFiltersChange: (filters: Partial<LeadFilters>) => void;
  onClose?: () => void;
}

export function AdvancedSearch({ filters, onFiltersChange, onClose }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (field: 'createdDateFrom' | 'createdDateTo', value: string) => {
    onFiltersChange({ [field]: value || undefined });
  };

  const handleBudgetChange = (field: 'budgetMin' | 'budgetMax', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({ [field]: numValue });
  };

  const clearAdvancedFilters = () => {
    onFiltersChange({
      createdDateFrom: undefined,
      createdDateTo: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      assignedTo: undefined,
      owner: undefined,
    });
  };

  const hasAdvancedFilters = 
    filters.createdDateFrom ||
    filters.createdDateTo ||
    filters.budgetMin !== undefined ||
    filters.budgetMax !== undefined ||
    filters.assignedTo ||
    filters.owner;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`gap-2 ${hasAdvancedFilters ? 'bg-indigo-50 border-indigo-300' : ''}`}
      >
        <Filter className="h-4 w-4" />
        Advanced
        {hasAdvancedFilters && (
          <span className="ml-1 px-1.5 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
            {[
              filters.createdDateFrom && 1,
              filters.createdDateTo && 1,
              filters.budgetMin !== undefined && 1,
              filters.budgetMax !== undefined && 1,
              filters.assignedTo && 1,
              filters.owner && 1,
            ].filter(Boolean).length}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b">
                  <h3 className="text-lg font-semibold">Advanced Search</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Created Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">From</label>
                        <Input
                          type="date"
                          value={filters.createdDateFrom || ''}
                          onChange={(e) => handleDateChange('createdDateFrom', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">To</label>
                        <Input
                          type="date"
                          value={filters.createdDateTo || ''}
                          onChange={(e) => handleDateChange('createdDateTo', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget Range (EGP)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Min</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.budgetMin || ''}
                          onChange={(e) => handleBudgetChange('budgetMin', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Max</label>
                        <Input
                          type="number"
                          placeholder="No limit"
                          value={filters.budgetMax || ''}
                          onChange={(e) => handleBudgetChange('budgetMax', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assigned To
                    </label>
                    <Input
                      type="text"
                      placeholder="User ID or name"
                      value={filters.assignedTo || ''}
                      onChange={(e) => onFiltersChange({ assignedTo: e.target.value || undefined })}
                    />
                  </div>

                  {/* Owner */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Owner
                    </label>
                    <Input
                      type="text"
                      placeholder="User ID or name"
                      value={filters.owner || ''}
                      onChange={(e) => onFiltersChange({ owner: e.target.value || undefined })}
                    />
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={clearAdvancedFilters}
                    disabled={!hasAdvancedFilters}
                  >
                    Clear All
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

