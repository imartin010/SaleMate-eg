import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Star, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useSavedFilters, SavedFilter } from '../../hooks/crm/useSavedFilters';
import { LeadFilters } from '../../hooks/crm/useLeadFilters';

interface SavedFiltersManagerProps {
  currentFilters: LeadFilters;
  onLoadFilter: (filters: LeadFilters) => void;
}

export function SavedFiltersManager({ currentFilters, onLoadFilter }: SavedFiltersManagerProps) {
  const { savedFilters, loading, saveFilter, updateFilter, deleteFilter, loadFilter } = useSavedFilters();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null);
  const [filterName, setFilterName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!filterName.trim()) return;

    try {
      setSaving(true);
      if (editingFilter) {
        await updateFilter(editingFilter.id, {
          name: filterName,
          filters: currentFilters,
          is_default: isDefault,
        });
      } else {
        await saveFilter(filterName, currentFilters, isDefault);
      }
      setShowSaveDialog(false);
      setShowEditDialog(false);
      setFilterName('');
      setIsDefault(false);
      setEditingFilter(null);
    } catch (error) {
      console.error('Error saving filter:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (savedFilter: SavedFilter) => {
    const filters = loadFilter(savedFilter);
    onLoadFilter(filters);
  };

  const handleEdit = (filter: SavedFilter) => {
    setEditingFilter(filter);
    setFilterName(filter.name);
    setIsDefault(filter.is_default);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved filter?')) return;
    try {
      await deleteFilter(id);
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };

  const [showSavedList, setShowSavedList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSavedList(false);
      }
    };

    if (showSavedList) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSavedList]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-1">
        {savedFilters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavedList(!showSavedList)}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Saved ({savedFilters.length})
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowSaveDialog(true);
            setFilterName('');
            setIsDefault(false);
            setEditingFilter(null);
          }}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {savedFilters.length > 0 ? 'Save New' : 'Save Filters'}
        </Button>
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveDialog(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Save Filter</h3>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Filter Name</label>
                    <Input
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="e.g., Hot Leads This Week"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="isDefault" className="text-sm">
                      Set as default filter
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowSaveDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!filterName.trim() || saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <AnimatePresence>
        {showEditDialog && editingFilter && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditDialog(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Edit Filter</h3>
                  <button
                    onClick={() => setShowEditDialog(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Filter Name</label>
                    <Input
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="e.g., Hot Leads This Week"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefaultEdit"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="isDefaultEdit" className="text-sm">
                      Set as default filter
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!filterName.trim() || saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Update'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Saved Filters List - Show in dropdown */}
      {savedFilters.length > 0 && showSavedList && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px] z-50 max-h-[300px] overflow-y-auto">
          <div className="p-2 space-y-1">
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group cursor-pointer"
                onClick={() => handleLoad(filter)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {filter.is_default && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                  <span className="text-sm font-medium">{filter.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(filter);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(filter.id);
                    }}
                    className="p-1 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

