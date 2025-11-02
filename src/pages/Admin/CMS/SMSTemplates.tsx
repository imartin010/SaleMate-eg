import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, Copy, Send, Archive, ArchiveRestore } from 'lucide-react';
import { DataTable, Column } from '../../../components/admin/DataTable';
import { EmptyState } from '../../../components/admin/EmptyState';
import { getAllSMSTemplates, createSMSTemplate, updateSMSTemplate, deleteSMSTemplate, SMSTemplate } from '../../../lib/data/templates';
import { useAuthStore } from '../../../store/auth';
import { logAudit } from '../../../lib/data/audit';

export default function SMSTemplates() {
  const { profile } = useAuthStore();
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    body: '',
    variables: [] as string[],
  });
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    setCharCount(formData.body.length);
  }, [formData.body]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAllSMSTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({ key: '', name: '', body: '', variables: [] });
    setShowEditor(true);
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setFormData({
      key: template.key,
      name: template.name,
      body: template.body,
      variables: template.variables || [],
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await updateSMSTemplate(editingTemplate.id, formData, profile?.id);
      } else {
        await createSMSTemplate({ ...formData, status: 'active' }, profile?.id);
      }
      await loadTemplates();
      setShowEditor(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    await deleteSMSTemplate(id, profile?.id);
    await loadTemplates();
  };

  const handleDuplicate = async (template: SMSTemplate) => {
    const duplicate = {
      key: `${template.key}_copy`,
      name: `${template.name} (Copy)`,
      body: template.body,
      variables: template.variables || [],
      status: 'active' as const,
    };
    await createSMSTemplate(duplicate, profile?.id);
    await loadTemplates();
  };

  const handleArchive = async (template: SMSTemplate) => {
    await updateSMSTemplate(
      template.id,
      { status: template.status === 'archived' ? 'active' : 'archived' },
      profile?.id
    );
    await loadTemplates();
  };

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      body: formData.body + `{{${variable}}}`,
    });
  };

  const variables = ['name', 'phone', 'project', 'amount', 'date', 'code'];

  const columns: Column<SMSTemplate>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{row.key}</div>
        </div>
      ),
    },
    {
      key: 'body',
      label: 'Message',
      render: (value) => (
        <span className="text-gray-900 line-clamp-2 max-w-md">
          {String(value).substring(0, 100)}
          {String(value).length > 100 ? '...' : ''}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value === 'active' ? 'Active' : 'Archived'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(row)} className="p-2 text-purple-600 hover:bg-blue-50 rounded-xl">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => handleDuplicate(row)} className="p-2 text-purple-600 hover:bg-blue-50 rounded-xl">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => handleArchive(row)} className="p-2 text-purple-600 hover:bg-blue-50 rounded-xl">
            {row.status === 'archived' ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMS Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage SMS templates</p>
        </div>
        <button onClick={handleCreate} className="admin-btn admin-btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      <DataTable
        columns={columns}
        data={templates}
        loading={loading}
        emptyMessage="No SMS templates found"
        pagination
        pageSize={20}
      />

      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="admin-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingTemplate ? 'Edit' : 'Create'} SMS Template
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Template Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="admin-input w-full"
                  placeholder="e.g., welcome_sms"
                  disabled={!!editingTemplate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input w-full"
                  placeholder="e.g., Welcome SMS"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">Message Body</label>
                  <span className={`text-sm ${charCount > 160 ? 'text-red-600' : 'text-gray-600'}`}>
                    {charCount} / 160 characters
                  </span>
                </div>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="admin-input w-full min-h-[100px]"
                  placeholder="Enter SMS message..."
                  maxLength={160}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600">Variables:</span>
                  {variables.map((variable) => (
                    <button
                      key={variable}
                      onClick={() => insertVariable(variable)}
                      className="px-2 py-1 text-xs bg-gray-50 text-purple-600 rounded hover:bg-blue-50 transition-colors"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} className="admin-btn admin-btn-primary flex-1">
                Save Template
              </button>
              <button onClick={() => setShowEditor(false)} className="admin-btn admin-btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

