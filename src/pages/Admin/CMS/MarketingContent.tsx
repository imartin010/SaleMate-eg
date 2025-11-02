import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Eye, Globe, EyeOff } from 'lucide-react';
import { DataTable, Column } from '../../../components/admin/DataTable';
import { EmptyState } from '../../../components/admin/EmptyState';
import { RichTextEditor } from '../../../components/admin/RichTextEditor';
import { getAllCMSPages, createCMSPage, updateCMSPage, deleteCMSPage, CMSPage } from '../../../lib/data/cms';
import { useAuthStore } from '../../../store/auth';

export default function MarketingContent() {
  const { profile } = useAuthStore();
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content_json: {},
    meta: {
      description: '',
      keywords: '',
    },
    status: 'draft' as 'draft' | 'published',
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await getAllCMSPages();
      setPages(data);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      title: '',
      content_json: {},
      meta: { description: '', keywords: '' },
      status: 'draft',
    });
    setShowEditor(true);
  };

  const handleEdit = (page: CMSPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content_json: page.content_json || {},
      meta: (page.meta as any) || { description: '', keywords: '' },
      status: page.status,
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      if (editingPage) {
        await updateCMSPage(editingPage.id, formData, profile?.id);
      } else {
        await createCMSPage(formData, profile?.id);
      }
      await loadPages();
      setShowEditor(false);
    } catch (error) {
      console.error('Error saving page:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    await deleteCMSPage(id, profile?.id);
    await loadPages();
  };

  const handlePublish = async (page: CMSPage) => {
    await updateCMSPage(
      page.id,
      {
        status: page.status === 'published' ? 'draft' : 'published',
        published_at: page.status === 'draft' ? new Date().toISOString() : undefined,
      },
      profile?.id
    );
    await loadPages();
  };

  const columns: Column<CMSPage>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">/{row.slug}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value === 'published' ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handlePublish(row)} className="p-2 text-purple-600 hover:bg-blue-50 rounded-xl">
            {row.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
          </button>
          <button onClick={() => handleEdit(row)} className="p-2 text-purple-600 hover:bg-blue-50 rounded-xl">
            <Edit2 className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold text-gray-900">Marketing Content</h1>
          <p className="text-gray-600 mt-1">Create and manage landing pages</p>
        </div>
        <button onClick={handleCreate} className="admin-btn admin-btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Page
        </button>
      </div>

      <DataTable
        columns={columns}
        data={pages}
        loading={loading}
        emptyMessage="No marketing pages found"
        pagination
        pageSize={20}
      />

      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="admin-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingPage ? 'Edit' : 'Create'} Marketing Page
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Page Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="admin-input w-full"
                  placeholder="e.g., about-us"
                  disabled={!!editingPage}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Page Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="admin-input w-full"
                  placeholder="Page title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">SEO Description</label>
                <textarea
                  value={formData.meta.description || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      meta: { ...formData.meta, description: e.target.value },
                    })
                  }
                  className="admin-input w-full"
                  rows={2}
                  placeholder="Meta description for SEO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Content</label>
                <RichTextEditor
                  content={JSON.stringify(formData.content_json)}
                  onChange={(html) => {
                    try {
                      setFormData({ ...formData, content_json: { html } });
                    } catch (e) {
                      // Handle error
                    }
                  }}
                  placeholder="Enter page content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="admin-input w-full"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} className="admin-btn admin-btn-primary flex-1">
                Save Page
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

