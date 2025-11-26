import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useCreateExpense } from '../../hooks/performance/usePerformanceData';
import type { ExpenseType, ExpenseCategory } from '../../types/performance';

interface AddExpenseModalProps {
  franchiseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  franchiseId,
  isOpen,
  onClose,
}) => {
  const [expenseType, setExpenseType] = useState<ExpenseType>('fixed');
  const [category, setCategory] = useState<ExpenseCategory>('rent');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const createExpense = useCreateExpense();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await createExpense.mutateAsync({
        franchise_id: franchiseId,
        expense_type: expenseType,
        category,
        description: description || null,
        amount: expenseAmount,
        date,
      });

      // Reset form
      setExpenseType('fixed');
      setCategory('rent');
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err) {
      setError('Failed to create expense. Please try again.');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-none sm:rounded-3xl max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50 sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expense Type <span className="text-red-500">*</span>
            </label>
            <select
              value={expenseType}
              onChange={(e) => {
                setExpenseType(e.target.value as ExpenseType);
                // Reset category when type changes
                if (e.target.value === 'fixed') {
                  setCategory('rent');
                } else {
                  setCategory('marketing');
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fixed">Fixed</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {expenseType === 'fixed' ? (
                <>
                  <option value="rent">Rent</option>
                  <option value="salaries">Salaries</option>
                </>
              ) : (
                <>
                  <option value="marketing">Marketing</option>
                  <option value="phone_bills">Phone Bills</option>
                  <option value="other">Other</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Monthly office rent - New Cairo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (EGP) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="50000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
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
              disabled={createExpense.isPending}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs sm:text-sm sm:font-semibold rounded-2xl hover:from-rose-700 hover:to-pink-700 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{createExpense.isPending ? 'Adding...' : 'Add Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

