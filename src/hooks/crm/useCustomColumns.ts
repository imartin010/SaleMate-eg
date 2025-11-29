import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'select', label: 'Select', visible: true, order: 0 },
  { id: 'name', label: 'Name', visible: true, order: 1 },
  { id: 'contact', label: 'Contact', visible: true, order: 2 },
  { id: 'project', label: 'Project', visible: true, order: 3 },
  { id: 'stage', label: 'Stage', visible: true, order: 4 },
  { id: 'budget', label: 'Budget', visible: true, order: 5 },
  { id: 'feedback', label: 'Feedback', visible: true, order: 6 },
  { id: 'assigned_to', label: 'Assigned To', visible: true, order: 7 },
  { id: 'actions', label: 'Actions', visible: true, order: 8 },
];

const STORAGE_KEY = 'crm_custom_columns';

interface CustomColumnsContextType {
  columns: ColumnConfig[];
  savedColumns: ColumnConfig[];
  visibleColumns: ColumnConfig[];
  savedVisibleColumns: ColumnConfig[];
  toggleColumn: (columnId: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  resetColumns: () => void;
  saveColumns: () => void;
  resetTempColumns: () => void;
}

const CustomColumnsContext = createContext<CustomColumnsContextType | undefined>(undefined);

export function CustomColumnsProvider({ children }: { children: React.ReactNode }) {
  // Saved columns (persisted in localStorage)
  const [savedColumns, setSavedColumns] = useState<ColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading custom columns:', error);
    }
    return DEFAULT_COLUMNS;
  });

  // Temporary columns (for real-time preview)
  const [tempColumns, setTempColumns] = useState<ColumnConfig[]>(savedColumns);

  // Save temp columns to saved columns and localStorage
  const saveColumns = useCallback(() => {
    setSavedColumns(tempColumns);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tempColumns));
    } catch (error) {
      console.error('Error saving custom columns:', error);
    }
  }, [tempColumns]);

  // Reset temp columns to saved columns (cancel changes)
  const resetTempColumns = useCallback(() => {
    setTempColumns(savedColumns);
  }, [savedColumns]);

  // Initialize temp columns when saved columns change
  useEffect(() => {
    setTempColumns(savedColumns);
  }, [savedColumns]);

  // Toggle column visibility in temp columns (real-time)
  const toggleColumn = useCallback((columnId: string) => {
    setTempColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

  // Reorder columns in temp columns (real-time)
  const reorderColumns = useCallback((fromIndex: number, toIndex: number) => {
    setTempColumns((prev) => {
      const newColumns = [...prev];
      const [moved] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, moved);
      // Update order values
      return newColumns.map((col, index) => ({ ...col, order: index }));
    });
  }, []);

  // Reset temp columns to defaults
  const resetColumns = useCallback(() => {
    setTempColumns(DEFAULT_COLUMNS);
  }, []);

  // Get visible columns from temp columns (for real-time preview)
  const getVisibleColumns = useCallback(() => {
    return tempColumns
      .filter((col) => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [tempColumns]);

  // Get visible columns from saved columns (for normal display)
  const getSavedVisibleColumns = useCallback(() => {
    return savedColumns
      .filter((col) => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [savedColumns]);

  const value: CustomColumnsContextType = {
    columns: tempColumns, // Use temp columns for UI
    savedColumns,
    visibleColumns: getVisibleColumns(), // Real-time preview
    savedVisibleColumns: getSavedVisibleColumns(), // Saved state
    toggleColumn,
    reorderColumns,
    resetColumns,
    saveColumns,
    resetTempColumns,
  };

  return React.createElement(
    CustomColumnsContext.Provider,
    { value },
    children
  );
}

export function useCustomColumns() {
  const context = useContext(CustomColumnsContext);
  if (context === undefined) {
    throw new Error('useCustomColumns must be used within a CustomColumnsProvider');
  }
  return context;
}

