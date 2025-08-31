import React, { useState, useEffect } from 'react';
import { useDealsStore } from '../../store/deals';
import { Plus, DollarSign, FileText, Handshake } from 'lucide-react';

const FastMyDeals: React.FC = () => {
  const { deals, loading, error, fetchDeals } = useDealsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Ultra-fast stats calculation
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Deals</h1>
        <p className="text-gray-600">Manage and track your real estate deals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Handshake className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Deals</p>
              <p className="text-2xl font-bold text-gray-900">{totalDeals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Active Deals</p>
              <p className="text-2xl font-bold text-gray-900">
                {deals.filter(d => d.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Deal Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Deal
        </button>
      </div>

      {/* Deals Grid */}
      {deals.length === 0 ? (
        <div className="text-center py-12">
          <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
          <p className="text-gray-600 mb-6">Create your first deal to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Deal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {deal.project_name}
                </h3>
                <p className="text-sm text-gray-600">{deal.developer_name}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Client:</span>
                  <span className="text-sm font-medium">{deal.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Value:</span>
                  <span className="text-sm font-medium">${deal.deal_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stage:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    deal.deal_stage === 'Ready to payout' ? 'bg-green-100 text-green-800' :
                    deal.deal_stage === 'Collected' ? 'bg-blue-100 text-blue-800' :
                    deal.deal_stage === 'Contracted' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {deal.deal_stage}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Created {new Date(deal.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Deal</h2>
            <p className="text-gray-600 mb-6">
              Deal creation functionality will be implemented here.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FastMyDeals;
