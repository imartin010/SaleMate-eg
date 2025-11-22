import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Wallet, Plus, RefreshCw, DollarSign, Smartphone, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { PaymentMethod } from '../../types';

export const WalletDisplay: React.FC = () => {
  const { balance, loading, error, refreshBalance, addToWalletWithPayment } = useWallet();
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Instapay');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleAddMoney = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAddError('Please enter a valid amount');
      return;
    }

    if (paymentMethod === 'BankTransfer' && !receiptFile) {
      setAddError('Please upload a receipt for bank transfer');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const result = await addToWalletWithPayment(numAmount, paymentMethod, `Wallet deposit via ${paymentMethod}`);
      
      if (result.success) {
        setAddSuccess(`Successfully added EGP ${numAmount.toFixed(0)} to your wallet via ${paymentMethod}`);
        setAmount('');
        setReceiptFile(null);
        setTimeout(() => {
          setShowAddMoney(false);
          setAddSuccess(null);
        }, 3000);
      } else {
        setAddError(result.error || 'Failed to add money to wallet');
      }
    } catch (err: unknown) {
      setAddError((err instanceof Error ? err.message : String(err)) || 'Payment processing failed');
    } finally {
      setIsAdding(false);
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'Instapay':
        return <Smartphone className="h-5 w-5" />;
      case 'VodafoneCash':
        return <Phone className="h-5 w-5" />;
      case 'BankTransfer':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Smartphone className="h-5 w-5" />;
    }
  };

  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method) {
      case 'Instapay':
        return 'Instapay';
      case 'VodafoneCash':
        return 'Vodafone Cash';
      case 'BankTransfer':
        return 'Bank Transfer';
      default:
        return 'Instapay';
    }
  };

  if (loading) {
    return (
      <Card className="shop-project-card overflow-hidden bg-white rounded-lg border-0" style={{ padding: 0 }}>
        <CardContent className="px-3 pt-2 pb-1.5">
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2 text-gray-400" />
            <span className="text-sm text-gray-600">Loading wallet...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shop-project-card overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0" style={{ padding: 0 }}>
        {/* Wallet Details - Minimal */}
        <CardContent className="px-3 pt-2 pb-1.5">
          {/* Compact Balance Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500 font-medium">Wallet Balance</div>
                <div className="text-lg font-semibold text-blue-600">
                  EGP {balance.toFixed(0)}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshBalance}
                className="h-7 w-7 p-0 hover:bg-gray-100 transition-all rounded"
                aria-label="Refresh balance"
              >
                <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddMoney(true)}
                className="h-7 px-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all rounded border-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="mt-1.5 p-1.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Add Money to Wallet
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount (EGP)
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to add"
              />
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['Instapay', 'VodafoneCash', 'BankTransfer'] as PaymentMethod[]).map((method) => (
                  <div
                    key={method}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === method
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="text-blue-600">
                        {getPaymentMethodIcon(method)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{getPaymentMethodName(method)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Receipt Upload for Bank Transfer */}
            {paymentMethod === 'BankTransfer' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Receipt
                </label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {receiptFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {receiptFile.name}
                  </div>
                )}
              </div>
            )}

            {/* Payment Instructions */}
            {paymentMethod && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Payment Instructions
                </div>
                <div className="text-xs text-blue-700">
                  {paymentMethod === 'Instapay' && 'Use your mobile wallet to send payment to our Instapay account.'}
                  {paymentMethod === 'VodafoneCash' && 'Send payment to our Vodafone Cash number: 01234567890'}
                  {paymentMethod === 'BankTransfer' && 'Transfer to our bank account and upload the receipt.'}
                </div>
              </div>
            )}

            {addError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircle className="h-4 w-4" />
                {addSuccess}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleAddMoney}
                disabled={isAdding || !amount}
              >
                {isAdding ? 'Processing Payment...' : `Add EGP ${amount || '0'}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddMoney(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
