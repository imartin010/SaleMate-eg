import React, { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { useCreateTransaction } from '../../hooks/performance/usePerformanceData';
import { useProjects } from '../../hooks/performance/useProjects';
import type { TransactionStage } from '../../types/performance';

interface AddTransactionModalProps {
  franchiseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  franchiseId,
  isOpen,
  onClose,
}) => {
  const [projectId, setProjectId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<TransactionStage>('eoi');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const createTransaction = useCreateTransaction();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!projectId || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await createTransaction.mutateAsync({
        franchise_id: franchiseId,
        project_id: parseInt(projectId),
        transaction_amount: transactionAmount,
        stage,
        notes: notes || null,
      });

      // Reset form
      setProjectId('');
      setSearchTerm('');
      setAmount('');
      setStage('eoi');
      setNotes('');
      onClose();
    } catch (err) {
      setError('Failed to create transaction. Please try again.');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  // Filter projects based on search term
  const filteredProjects = projects?.filter(project => 
    project.compound.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.area.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedProject = projects?.find(p => p.id.toString() === projectId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-900">Add Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-300 hover:rotate-90 p-2 hover:bg-gray-100 rounded-2xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project <span className="text-red-500">*</span>
            </label>
            
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search projects..."
              />
            </div>

            {/* Selected Project Display */}
            {selectedProject && (
              <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-900">{selectedProject.compound}</p>
                <p className="text-sm text-blue-700">{selectedProject.developer} • {selectedProject.area}</p>
              </div>
            )}

            {/* Project Dropdown */}
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
              {projectsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading projects...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No projects found' : 'No projects available'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setProjectId(project.id.toString());
                        setSearchTerm('');
                      }}
                      className={`w-full text-left p-3 hover:bg-blue-50 transition-colors ${
                        projectId === project.id.toString() ? 'bg-blue-100' : ''
                      }`}
                    >
                      <p className="font-medium text-gray-900">{project.compound}</p>
                      <p className="text-sm text-gray-600">{project.developer}</p>
                      <p className="text-xs text-gray-500">{project.area}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Amount (EGP) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="5000000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage <span className="text-red-500">*</span>
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as TransactionStage)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="eoi">EOI (Expression of Interest)</option>
              <option value="reservation">Reservation</option>
              <option value="contracted">Contracted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTransaction.isPending}
              className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{createTransaction.isPending ? 'Adding...' : 'Add Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

