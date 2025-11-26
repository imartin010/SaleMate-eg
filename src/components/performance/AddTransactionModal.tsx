import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { useCreateTransaction, useUpdateTransaction, usePerformanceCommissionCuts } from '../../hooks/performance/usePerformanceData';
import { useProjects } from '../../hooks/performance/useProjects';
import type { TransactionStage, CommissionRole } from '../../types/performance';

import type { PerformanceTransaction } from '../../types/performance';

interface AddTransactionModalProps {
  franchiseId: string;
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: PerformanceTransaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  franchiseId,
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const isEditMode = !!transactionToEdit;
  
  const [projectId, setProjectId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<TransactionStage>('eoi');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  
  // Managerial roles checkboxes
  const [managerialRoles, setManagerialRoles] = useState<CommissionRole[]>([]);
  const availableRoles: { role: CommissionRole; label: string }[] = [
    { role: 'sales_agent', label: 'Sales Agent' },
    { role: 'team_leader', label: 'Team Leader' },
    { role: 'sales_director', label: 'Sales Manager' },
    { role: 'head_of_sales', label: 'Sales Director' },
  ];

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: commissionCuts } = usePerformanceCommissionCuts(franchiseId);

  // Initialize form with transaction data when editing
  useEffect(() => {
    if (transactionToEdit) {
      setProjectId(transactionToEdit.project_id?.toString() || '');
      setAmount(transactionToEdit.transaction_amount.toString());
      setStage(transactionToEdit.stage);
      setNotes(transactionToEdit.notes || '');
      setManagerialRoles(transactionToEdit.managerial_roles || []);
      // Set search term to show selected project
      const project = projects?.find(p => p.id === transactionToEdit.project_id);
      if (project) {
        setSearchTerm(`${project.compound} ${project.developer}`);
      }
    } else {
      // Reset form when adding new transaction
      setProjectId('');
      setSearchTerm('');
      setAmount('');
      setStage('eoi');
      setNotes('');
      setManagerialRoles([]);
    }
  }, [transactionToEdit, projects]);

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

  // Calculate commission cuts for selected managerial roles
  const calculateRoleCuts = useMemo(() => {
    if (!commissionCuts || !transactionAmountNum || managerialRoles.length === 0) {
      return { totalCuts: 0, roleBreakdown: [] };
    }

    const millions = transactionAmountNum / 1_000_000;
    const roleBreakdown: Array<{ role: CommissionRole; label: string; cut: number }> = [];
    let totalCuts = 0;

    managerialRoles.forEach(role => {
      const cutConfig = commissionCuts.find(c => c.role === role);
      if (cutConfig) {
        const cutAmount = cutConfig.cut_per_million * millions;
        totalCuts += cutAmount;
        const roleLabel = availableRoles.find(r => r.role === role)?.label || role;
        roleBreakdown.push({
          role,
          label: roleLabel,
          cut: cutAmount,
        });
      }
    });

    return { totalCuts, roleBreakdown };
  }, [commissionCuts, transactionAmountNum, managerialRoles, availableRoles]);

  const taxBreakdown = calculateTaxes(grossCommissionNum);
  
  // Final net commission after taxes and role cuts
  const finalNetCommission = taxBreakdown.netCommission - calculateRoleCuts.totalCuts;

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
    
    // Calculate role cuts
    const millions = transactionAmount / 1_000_000;
    let totalRoleCuts = 0;
    if (commissionCuts && managerialRoles.length > 0) {
      managerialRoles.forEach(role => {
        const cutConfig = commissionCuts.find(c => c.role === role);
        if (cutConfig) {
          totalRoleCuts += cutConfig.cut_per_million * millions;
        }
      });
    }
    
    const finalNetCommission = taxes.netCommission - totalRoleCuts;

    try {
      if (isEditMode && transactionToEdit) {
        // Update existing transaction
        await updateTransaction.mutateAsync({
          id: transactionToEdit.id,
          franchise_id: franchiseId,
          project_id: parseInt(projectId),
          transaction_amount: transactionAmount,
          gross_commission: grossCommissionAmount,
          tax_amount: taxes.tax,
          withholding_tax: taxes.withholdingTax,
          income_tax: taxes.incomeTax,
          net_commission: finalNetCommission,
          commission_amount: finalNetCommission, // Keep for backward compatibility
          managerial_roles: managerialRoles.length > 0 ? managerialRoles : null,
          stage,
          notes: notes || null,
        });
      } else {
        // Create new transaction
        await createTransaction.mutateAsync({
          franchise_id: franchiseId,
          project_id: parseInt(projectId),
          transaction_amount: transactionAmount,
          gross_commission: grossCommissionAmount,
          tax_amount: taxes.tax,
          withholding_tax: taxes.withholdingTax,
          income_tax: taxes.incomeTax,
          net_commission: finalNetCommission,
          commission_amount: finalNetCommission, // Keep for backward compatibility
          managerial_roles: managerialRoles.length > 0 ? managerialRoles : null,
          stage,
          notes: notes || null,
        });
      }

      // Reset form
      setProjectId('');
      setSearchTerm('');
      setAmount('');
      setStage('eoi');
      setNotes('');
      setManagerialRoles([]);
      onClose();
    } catch (err) {
      setError(isEditMode ? 'Failed to update transaction. Please try again.' : 'Failed to create transaction. Please try again.');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-none sm:rounded-3xl max-w-lg w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-300 hover:rotate-90 p-2 hover:bg-gray-100 rounded-2xl"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Project <span className="text-red-500">*</span>
            </label>
            
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Search projects..."
              />
            </div>

            {/* Selected Project Display */}
            {selectedProject && (
              <div className="mb-2 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm sm:text-base font-medium text-blue-900">{selectedProject.compound}</p>
                <p className="text-xs sm:text-sm text-blue-700">{selectedProject.developer} • {selectedProject.area}</p>
              </div>
            )}

            {/* Project Dropdown */}
            <div className="border border-gray-300 rounded-lg max-h-48 sm:max-h-60 overflow-y-auto">
              {projectsLoading ? (
                <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">Loading projects...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">
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
                      className={`w-full text-left p-2.5 sm:p-3 hover:bg-blue-50 transition-colors ${
                        projectId === project.id.toString() ? 'bg-blue-100' : ''
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{project.compound}</p>
                      <p className="text-[10px] sm:text-sm text-gray-600">{project.developer}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{project.area}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Transaction Amount (EGP) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="5000000"
              required
            />
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
              Commission will be calculated automatically at 3.5% of transaction amount
            </p>
          </div>

          {/* Commission & Tax Breakdown */}
          {transactionAmountNum > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 sm:p-4 space-y-2 border border-blue-100">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Commission Calculation & Tax Breakdown</h3>
              
              <div className="flex justify-between text-xs sm:text-sm mb-1">
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

              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-600">Commission Rate</span>
                <span className="font-medium text-gray-700">3.5%</span>
              </div>
              
              <div className="flex justify-between text-xs sm:text-sm border-t border-blue-200 pt-2 mt-2">
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
                <div className="flex justify-between text-xs sm:text-sm">
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

                <div className="flex justify-between text-xs sm:text-sm">
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

                <div className="flex justify-between text-xs sm:text-sm">
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

              <div className="border-t border-blue-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">Net Commission (After Tax)</span>
                  <span className="text-sm sm:text-base font-bold text-green-700">
                    {new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(taxBreakdown.netCommission)}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  Total tax deductions: 23% (14% + 5% + 4%)
                </div>
              </div>

              {/* Managerial Role Cuts */}
              {calculateRoleCuts.roleBreakdown.length > 0 && (
                <div className="border-t-2 border-orange-200 pt-2 mt-2 space-y-1">
                  <div className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">Managerial Role Cuts:</div>
                  {calculateRoleCuts.roleBreakdown.map((roleCut) => (
                    <div key={roleCut.role} className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">{roleCut.label}</span>
                      <span className="text-orange-600 font-medium">
                        -{new Intl.NumberFormat('en-EG', {
                          style: 'currency',
                          currency: 'EGP',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(roleCut.cut)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[10px] sm:text-xs pt-1 border-t border-orange-200">
                    <span className="text-gray-600 font-medium">Total Role Cuts</span>
                    <span className="text-orange-700 font-semibold">
                      -{new Intl.NumberFormat('en-EG', {
                        style: 'currency',
                        currency: 'EGP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(calculateRoleCuts.totalCuts)}
                    </span>
                  </div>
                </div>
              )}

              {/* Final Net Commission */}
              <div className="border-t-2 border-green-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">Final Net Commission</span>
                  <span className="text-sm sm:text-lg font-bold text-green-700">
                    {new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(finalNetCommission)}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  After taxes and role cuts
                </div>
              </div>
            </div>
          )}

          {/* Managerial Roles Checkboxes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Managerial Roles Involved (Optional)
            </label>
            <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
              Select which managerial roles are involved in this deal. Commission cuts will be calculated automatically.
            </p>
            <div className="space-y-2">
              {availableRoles.map((roleOption) => {
                const isChecked = managerialRoles.includes(roleOption.role);
                const cutConfig = commissionCuts?.find(c => c.role === roleOption.role);
                const cutAmount = cutConfig && transactionAmountNum > 0 
                  ? (cutConfig.cut_per_million * (transactionAmountNum / 1_000_000))
                  : 0;
                
                return (
                  <label
                    key={roleOption.role}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 sm:p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setManagerialRoles([...managerialRoles, roleOption.role]);
                          } else {
                            setManagerialRoles(managerialRoles.filter(r => r !== roleOption.role));
                          }
                        }}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        {roleOption.label}
                      </span>
                    </div>
                    {cutConfig && (
                      <span className="text-[10px] sm:text-xs text-gray-500 ml-5 sm:ml-0">
                        {cutConfig.cut_per_million.toLocaleString()} EGP/million
                        {isChecked && transactionAmountNum > 0 && (
                          <span className="ml-1 sm:ml-2 text-blue-600 font-medium">
                            (-{new Intl.NumberFormat('en-EG', {
                              style: 'currency',
                              currency: 'EGP',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(cutAmount)})
                          </span>
                        )}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {managerialRoles.length === 0 && (
              <p className="text-[10px] sm:text-xs text-gray-400 mt-2 italic">
                No managerial roles selected - no commission cuts will be applied
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Stage <span className="text-red-500">*</span>
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as TransactionStage)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="eoi">EOI (Expression of Interest)</option>
              <option value="reservation">Reservation</option>
              <option value="contracted">Contracted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              rows={3}
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTransaction.isPending || updateTransaction.isPending}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm sm:font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>
                {isEditMode 
                  ? (updateTransaction.isPending ? 'Updating...' : 'Update Transaction')
                  : (createTransaction.isPending ? 'Adding...' : 'Add Transaction')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

