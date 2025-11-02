import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, CheckSquare, Square } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  bulkActions?: {
    label: string;
    onClick: (selectedIds: string[]) => void;
    variant?: 'primary' | 'danger';
  }[];
  getRowId?: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  // External selection control
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  showCheckboxes?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  searchable = true,
  searchPlaceholder = 'Search...',
  pagination = true,
  pageSize = 10,
  bulkActions = [],
  getRowId = (row) => row.id || String(row),
  loading = false,
  emptyMessage = 'No data available',
  selectedRows: externalSelectedRows,
  onSelectionChange,
  showCheckboxes = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());
  
  // Use external selection if provided, otherwise use internal
  const selectedRows = externalSelectedRows !== undefined ? externalSelectedRows : internalSelectedRows;
  const setSelectedRows = onSelectionChange || setInternalSelectedRows;
  const hasSelection = showCheckboxes || bulkActions.length > 0;

  // Filter data
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const toggleRowSelection = (rowId: string) => {
    const next = new Set(selectedRows);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    setSelectedRows(next);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((row) => getRowId(row))));
    }
  };

  if (loading) {
    return (
      <div className="card-brand p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Bulk Actions */}
      <div className="flex items-center justify-between gap-4">
        {searchable && (
          <div className="flex-1 max-w-md admin-search">
            <Search className="admin-search-icon h-5 w-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-input pl-10"
            />
          </div>
        )}
        {bulkActions.length > 0 && selectedRows.size > 0 && (
          <div className="flex gap-2">
            {bulkActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  action.onClick(Array.from(selectedRows));
                  setSelectedRows(new Set());
                }}
                className={`admin-btn ${action.variant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white' : 'admin-btn-primary'}`}
              >
                {action.label} ({selectedRows.size})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                {hasSelection && (
                  <th className="w-12">
                    <button onClick={toggleAllSelection} className="p-2 text-gray-600 hover:text-gray-900">
                      {selectedRows.size === paginatedData.length && paginatedData.length > 0 ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable && sortColumn === col.key && (
                        <span className="text-lime-500 font-bold">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (hasSelection ? 1 : 0)} className="px-4 py-12">
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-600">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const rowId = getRowId(row);
                  return (
                    <tr
                      key={rowId}
                      className={`hover:bg-gray-50 transition-colors ${selectedRows.has(rowId) ? 'bg-blue-50' : ''}`}
                      onClick={() => onRowClick?.(row)}
                    >
                      {hasSelection && (
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowSelection(rowId);
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900"
                          >
                            {selectedRows.has(rowId) ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key}>
                          {col.render ? col.render(row[col.key], row) : String(row[col.key] || '')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-900 font-medium rounded-xl bg-gray-100">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

