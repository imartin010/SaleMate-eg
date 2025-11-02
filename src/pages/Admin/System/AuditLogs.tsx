import React, { useState, useEffect } from 'react';
import { FileSearch, Search, Filter, Download } from 'lucide-react';
import { DataTable, Column } from '../../../components/admin/DataTable';
import { supabase } from '../../../lib/supabaseClient';

interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  changes?: Record<string, unknown>;
  created_at: string;
  actor?: {
    name: string;
    email: string;
  };
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
    
    const channel = supabase
      .channel('audit_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
        loadLogs();
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:actor_id (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        ...item,
        actor: item.profiles,
      }));

      setLogs(formatted);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      approve: 'bg-green-100 text-green-800',
      reject: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[action] || 'bg-gray-100 text-gray-800'}`}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </span>
    );
  };

  const exportCSV = () => {
    const headers = ['Actor', 'Action', 'Entity', 'Entity ID', 'Changes', 'Date'];
    const rows = filteredLogs.map((log) => [
      log.actor?.name || 'Unknown',
      log.action,
      log.entity,
      log.entity_id,
      JSON.stringify(log.changes || {}),
      new Date(log.created_at).toLocaleString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'actor',
      label: 'Actor',
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.actor?.name || 'System'}</div>
          <div className="text-sm text-gray-600">{row.actor?.email || ''}</div>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (value) => getActionBadge(value as string),
    },
    {
      key: 'entity',
      label: 'Entity',
      render: (value) => (
        <span className="text-gray-900 font-medium">{value as string}</span>
      ),
    },
    {
      key: 'entity_id',
      label: 'Entity ID',
      render: (value) => (
        <span className="text-gray-600 font-mono text-xs">{String(value).substring(0, 8)}...</span>
      ),
    },
    {
      key: 'changes',
      label: 'Changes',
      render: (value) => (
        <span className="text-gray-600 text-sm">
          {value ? Object.keys(value as Record<string, unknown>).join(', ') : '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleString(),
    },
  ];

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));
  const uniqueEntities = Array.from(new Set(logs.map((l) => l.entity)));

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">System activity and change history</p>
        </div>
        <button onClick={exportCSV} className="admin-btn admin-btn-secondary flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="admin-input"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="admin-input"
          >
            <option value="all">All Entities</option>
            {uniqueEntities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        loading={loading}
        emptyMessage="No audit logs found"
        pagination
        pageSize={50}
      />
    </div>
  );
}

