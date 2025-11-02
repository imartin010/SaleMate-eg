import React, { useState, useEffect } from 'react';
import { Mail, Plus, Edit2, Trash2, Copy, Eye, Send, Archive, ArchiveRestore } from 'lucide-react';
import { DataTable, Column } from '../../../components/admin/DataTable';
import { EmptyState } from '../../../components/admin/EmptyState';
import { RichTextEditor } from '../../../components/admin/RichTextEditor';
import { getAllEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, EmailTemplate } from '../../../lib/data/templates';
import { useAuthStore } from '../../../store/auth';
import { logAudit } from '../../../lib/data/audit';

export default function EmailTemplates() {
  const { profile } = useAuthStore();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    subject: '',
    html: '',
    variables: [] as string[],
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAllEmailTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({ key: '', name: '', subject: '', html: '', variables: [] });
    setShowEditor(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      key: template.key,
      name: template.name,
      subject: template.subject,
      html: template.html,
      variables: template.variables || [],
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await updateEmailTemplate(editingTemplate.id, formData, profile?.id);
      } else {
        await createEmailTemplate({ ...formData, status: 'active' }, profile?.id);
      }
      await loadTemplates();
      setShowEditor(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    await deleteEmailTemplate(id, profile?.id);
    await loadTemplates();
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    const duplicate = {
      key: `${template.key}_copy`,
      name: `${template.name} (Copy)`,
      subject: template.subject,
      html: template.html,
      variables: template.variables || [],
      status: 'active' as const,
    };
    await createEmailTemplate(duplicate, profile?.id);
    await loadTemplates();
  };

  const handleArchive = async (template: EmailTemplate) => {
    await updateEmailTemplate(
      template.id,
      { status: template.status === 'archived' ? 'active' : 'archived' },
      profile?.id
    );
    await loadTemplates();
  };

  const variables = ['name', 'email', 'phone', 'project', 'amount', 'date'];

  const columns: Column<EmailTemplate>[] = [
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
      key: 'subject',
      label: 'Subject',
      render: (value) => <span className="text-gray-900">{value}</span>,
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
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage email templates</p>
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
        emptyMessage="No email templates found"
        pagination
        pageSize={20}
      />

      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="admin-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingTemplate ? 'Edit' : 'Create'} Email Template
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Template Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="admin-input w-full"
                  placeholder="e.g., welcome_email"
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
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="admin-input w-full"
                  placeholder="Email subject line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">HTML Content</label>
                <RichTextEditor
                  content={formData.html}
                  onChange={(html) => setFormData({ ...formData, html })}
                  variables={variables}
                  placeholder="Enter email content..."
                />
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

