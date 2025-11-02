import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { DataTable, Column } from '../../components/admin/DataTable';
import { EmptyState } from '../../components/admin/EmptyState';
import { ImagePicker } from '../../components/admin/ImagePicker';
import { supabase } from '../../lib/supabaseClient';
import { logAudit } from '../../lib/data/audit';
import { useAuthStore } from '../../store/auth';

interface Project {
  id: string;
  name: string;
  developer: string;
  region: string;
  available_leads: number;
  price_per_lead: number;
  description?: string;
  image_url?: string;
  project_code?: string;
  created_at: string;
}

export default function Projects() {
  const { profile } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    developer: '',
    region: '',
    available_leads: 0,
    price_per_lead: 0,
    description: '',
    image_url: '',
    project_code: '',
  });

  useEffect(() => {
    loadProjects();
    
    const channel = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        loadProjects();
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.developer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      developer: '',
      region: '',
      available_leads: 0,
      price_per_lead: 0,
      description: '',
      image_url: '',
      project_code: '',
    });
    setShowEditor(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      developer: project.developer,
      region: project.region,
      available_leads: project.available_leads || 0,
      price_per_lead: project.price_per_lead || 0,
      description: project.description || '',
      image_url: project.image_url || '',
      project_code: project.project_code || '',
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(formData)
          .eq('id', editingProject.id);

        if (error) throw error;

        await logAudit({
          actor_id: profile?.id || '',
          action: 'update',
          entity: 'projects',
          entity_id: editingProject.id,
          changes: formData,
        });
      } else {
        const { error } = await supabase.from('projects').insert(formData);

        if (error) throw error;
      }

      await loadProjects();
      setShowEditor(false);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;

      await logAudit({
        actor_id: profile?.id || '',
        action: 'delete',
        entity: 'projects',
        entity_id: id,
      });

      await loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Project',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          {row.image_url && (
            <img
              src={row.image_url}
              alt={value as string}
              className="h-12 w-12 rounded-xl object-cover"
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-600">{row.developer} • {row.region}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'available_leads',
      label: 'Available Leads',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'price_per_lead',
      label: 'Price/Lead',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-purple-600">
          EGP {Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-purple-600 hover:bg-blue-50 rounded-xl"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
          >
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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage real estate projects</p>
        </div>
        <button onClick={handleCreate} className="admin-btn admin-btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </div>

      {/* Search */}
      <div className="admin-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input w-full pl-10"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredProjects}
        loading={loading}
        emptyMessage="No projects found"
        pagination
        pageSize={20}
      />

      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="admin-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingProject ? 'Edit' : 'Create'} Project
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="admin-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Developer</label>
                  <input
                    type="text"
                    value={formData.developer}
                    onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                    className="admin-input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="admin-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Project Code</label>
                  <input
                    type="text"
                    value={formData.project_code}
                    onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                    className="admin-input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Available Leads</label>
                  <input
                    type="number"
                    value={formData.available_leads}
                    onChange={(e) => setFormData({ ...formData, available_leads: Number(e.target.value) })}
                    className="admin-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Price per Lead</label>
                  <input
                    type="number"
                    value={formData.price_per_lead}
                    onChange={(e) => setFormData({ ...formData, price_per_lead: Number(e.target.value) })}
                    className="admin-input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-input w-full"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Project Image</label>
                <ImagePicker
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  bucket="public"
                  folder="projects"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} className="admin-btn admin-btn-primary flex-1">
                Save Project
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

