import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Lead, UpdateLeadInput } from '../../hooks/crm/useLeads';

interface EditLeadDialogProps {
  lead: Lead;
  onClose: () => void;
  onSave: (leadId: string, updates: UpdateLeadInput) => Promise<void>;
}

export const EditLeadDialog: React.FC<EditLeadDialogProps> = ({
  lead,
  onClose,
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_name: lead.client_name,
    client_phone: lead.client_phone,
    client_phone2: lead.client_phone2 || '',
    client_phone3: lead.client_phone3 || '',
    client_email: lead.client_email || '',
    client_job_title: lead.client_job_title || '',
    company_name: lead.company_name || '',
    budget: lead.budget?.toString() || '',
    feedback: lead.feedback || '',
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updates: UpdateLeadInput = {
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_phone2: formData.client_phone2 || null,
        client_phone3: formData.client_phone3 || null,
        client_email: formData.client_email || null,
        client_job_title: formData.client_job_title || null,
        company_name: formData.company_name || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        feedback: formData.feedback || null,
      };

      await onSave(lead.id, updates);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h3 className="text-xl font-bold text-gray-900">Edit Lead Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={formData.client_job_title}
                onChange={(e) => setFormData({ ...formData, client_job_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone 1 *
              </label>
              <input
                type="tel"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone 2
              </label>
              <input
                type="tel"
                value={formData.client_phone2}
                onChange={(e) => setFormData({ ...formData, client_phone2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone 3
              </label>
              <input
                type="tel"
                value={formData.client_phone3}
                onChange={(e) => setFormData({ ...formData, client_phone3: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.client_email}
              onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Budget (EGP)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter client's budget"
              min="0"
              step="1000"
            />
            <p className="text-xs text-gray-500 mt-1">Fill this after contacting the client</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes / Feedback
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add notes about this lead..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving || !formData.client_name || !formData.client_phone}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

