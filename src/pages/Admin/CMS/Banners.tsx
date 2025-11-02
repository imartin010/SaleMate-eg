import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Copy, Eye } from 'lucide-react';
import { 
  getAllBanners, 
  createBanner, 
  updateBanner, 
  deleteBanner, 
  duplicateBanner,
  DashboardBanner 
} from '../../../lib/data/banners';
import { useAuthStore } from '../../../store/auth';
import { uploadCMSImage } from '../../../lib/storage';

export default function Banners() {
  const [banners, setBanners] = useState<DashboardBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBanner, setEditingBanner] = useState<DashboardBanner | null>(null);
  const { profile } = useAuthStore();

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    const data = await getAllBanners();
    setBanners(data as DashboardBanner[]);
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setShowEditor(true);
  };

  const handleEdit = (banner: DashboardBanner) => {
    setEditingBanner(banner);
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    const success = await deleteBanner(id, profile?.id);
    if (success) {
      loadBanners();
    }
  };

  const handleDuplicate = async (id: string) => {
    const duplicate = await duplicateBanner(id, profile?.id);
    if (duplicate) {
      loadBanners();
    }
  };

  const handleSave = async (bannerData: Partial<DashboardBanner>) => {
    if (editingBanner) {
      await updateBanner(editingBanner.id, bannerData, profile?.id);
    } else {
      await createBanner(bannerData as Omit<DashboardBanner, 'id' | 'created_at' | 'updated_at'>, profile?.id);
    }
    setShowEditor(false);
    loadBanners();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Banners</h1>
          <p className="text-gray-600 mt-1">Manage promotional banners shown on user dashboards</p>
        </div>
        <button
          onClick={handleCreate}
          className="admin-btn admin-btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Banner
        </button>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <Megaphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No banners yet</h3>
            <p className="text-gray-600 mb-4">Create your first banner to get started</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Create Banner
            </button>
          </div>
        ) : (
          banners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={() => handleEdit(banner)}
              onDelete={() => handleDelete(banner.id)}
              onDuplicate={() => handleDuplicate(banner.id)}
            />
          ))
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <BannerEditor
          banner={editingBanner}
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}

// Banner Card Component
interface BannerCardProps {
  banner: DashboardBanner;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const BannerCard: React.FC<BannerCardProps> = ({ banner, onEdit, onDelete, onDuplicate }) => {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
    live: 'bg-green-100 text-green-800',
    archived: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex gap-6">
        {/* Image */}
        {banner.image_url && (
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-48 h-32 object-cover rounded-xl"
          />
        )}

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
              {banner.subtitle && (
                <p className="text-sm text-gray-600 mt-1">{banner.subtitle}</p>
              )}
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[banner.status]}`}>
              {banner.status}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="px-2 py-1 bg-gray-100 rounded">
              {banner.placement}
            </span>
            {banner.audience.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {banner.audience.join(', ')}
              </span>
            )}
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
              Priority: {banner.priority}
            </span>
          </div>

          {(banner.start_at || banner.end_at) && (
            <div className="mt-2 text-xs text-gray-500">
              {banner.start_at && `Starts: ${new Date(banner.start_at).toLocaleDateString()}`}
              {banner.start_at && banner.end_at && ' • '}
              {banner.end_at && `Ends: ${new Date(banner.end_at).toLocaleDateString()}`}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Banner Editor Modal
interface BannerEditorProps {
  banner: DashboardBanner | null;
  onSave: (banner: Partial<DashboardBanner>) => void;
  onClose: () => void;
}

const BannerEditor: React.FC<BannerEditorProps> = ({ banner, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<DashboardBanner>>({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    cta_label: banner?.cta_label || '',
    cta_url: banner?.cta_url || '',
    image_url: banner?.image_url || '',
    placement: banner?.placement || 'dashboard_top',
    audience: banner?.audience || [],
    visibility_rules: banner?.visibility_rules || {},
    status: banner?.status || 'draft',
    start_at: banner?.start_at || undefined,
    end_at: banner?.end_at || undefined,
    priority: banner?.priority || 100,
  });
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuthStore();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadCMSImage(file, formData.title, profile?.id);
    setUploading(false);

    if (result.success && result.url) {
      setFormData({ ...formData, image_url: result.url });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleAudience = (role: string) => {
    const current = formData.audience || [];
    if (current.includes(role)) {
      setFormData({ ...formData, audience: current.filter(r => r !== role) });
    } else {
      setFormData({ ...formData, audience: [...current, role] });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {banner ? 'Edit Banner' : 'Create Banner'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CTA Label
              </label>
              <input
                type="text"
                value={formData.cta_label || ''}
                onChange={(e) => setFormData({ ...formData, cta_label: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CTA URL
              </label>
              <input
                type="url"
                value={formData.cta_url || ''}
                onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="https://"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Image
            </label>
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Banner preview"
                className="w-full h-48 object-cover rounded-xl mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl"
            />
            {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
          </div>

          {/* Placement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placement *
            </label>
            <select
              value={formData.placement}
              onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="dashboard_top">Dashboard Top (Hero)</option>
              <option value="dashboard_grid">Dashboard Grid (Cards)</option>
              <option value="shop_top">Shop Top</option>
              <option value="crm_sidebar">CRM Sidebar</option>
            </select>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience (Roles)
            </label>
            <div className="flex gap-3">
              {['admin', 'support', 'manager', 'user'].map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.audience?.includes(role)}
                    onChange={() => toggleAudience(role)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm capitalize">{role}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave empty to show to all roles</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.start_at ? new Date(formData.start_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.end_at ? new Date(formData.end_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority (lower = higher priority)
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              min="1"
              max="999"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700"
            >
              {banner ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add missing import
import { Megaphone } from 'lucide-react';

