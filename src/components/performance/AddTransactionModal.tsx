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

  // Commission rate: 3.5% for all projects
  const COMMISSION_RATE = 0.035;
  
  // Tax calculations (14% + 5% + 4% = 23% total)
  const TAX_RATE = 0.14;
  const WITHHOLDING_TAX_RATE = 0.05;
  const INCOME_TAX_RATE = 0.04;
  const TOTAL_TAX_RATE = TAX_RATE + WITHHOLDING_TAX_RATE + INCOME_TAX_RATE; // 0.23

  // Calculate gross commission from transaction amount (3.5%)
  const transactionAmountNum = parseFloat(amount) || 0;
  const grossCommissionNum = transactionAmountNum * COMMISSION_RATE;

  // Calculate taxes and net commission
  const calculateTaxes = (gross: number) => {
    const tax = gross * TAX_RATE;
    const withholdingTax = gross * WITHHOLDING_TAX_RATE;
    const incomeTax = gross * INCOME_TAX_RATE;
    const netCommission = gross * (1 - TOTAL_TAX_RATE);
    
    return {
      tax,
      withholdingTax,
      incomeTax,
      netCommission,
    };
  };

  const taxBreakdown = calculateTaxes(grossCommissionNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!projectId || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    const transactionAmount = parseFloat(amount);
    
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      setError('Please enter a valid transaction amount');
      return;
    }

    // Calculate gross commission automatically (3.5% of transaction amount)
    const grossCommissionAmount = transactionAmount * COMMISSION_RATE;
    const taxes = calculateTaxes(grossCommissionAmount);

    try {
      await createTransaction.mutateAsync({
        franchise_id: franchiseId,
        project_id: parseInt(projectId),
        transaction_amount: transactionAmount,
        gross_commission: grossCommissionAmount,
        tax_amount: taxes.tax,
        withholding_tax: taxes.withholdingTax,
        income_tax: taxes.incomeTax,
        net_commission: taxes.netCommission,
        commission_amount: taxes.netCommission, // Keep for backward compatibility
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
            <p className="mt-1 text-xs text-gray-500">
              Commission will be calculated automatically at 3.5% of transaction amount
            </p>
          </div>

          {/* Commission & Tax Breakdown */}
          {transactionAmountNum > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 space-y-2 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2">Commission Calculation & Tax Breakdown</h3>
              
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Transaction Amount</span>
                <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat('en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(transactionAmountNum)}
                </span>
              </div>

              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Commission Rate</span>
                <span className="font-medium text-gray-700">3.5%</span>
              </div>
              
              <div className="flex justify-between text-sm border-t border-blue-200 pt-2 mt-2">
                <span className="text-gray-600 font-medium">Gross Commission (3.5%)</span>
                <span className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(grossCommissionNum)}
                </span>
              </div>

              <div className="border-t border-blue-200 pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">14% Tax</span>
                  <span className="text-red-600 font-medium">
                    -{new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(taxBreakdown.tax)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">5% Withholding Tax</span>
                  <span className="text-red-600 font-medium">
                    -{new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(taxBreakdown.withholdingTax)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">4% Income Tax</span>
                  <span className="text-red-600 font-medium">
                    -{new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(taxBreakdown.incomeTax)}
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-blue-300 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Net Commission (After Tax)</span>
                  <span className="font-bold text-green-700 text-lg">
                    {new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(taxBreakdown.netCommission)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Total deductions: 23% (14% + 5% + 4%)
                </div>
              </div>
            </div>
          )}

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

