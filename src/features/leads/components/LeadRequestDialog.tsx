import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { AlertCircle, CheckCircle, Wallet, Users, DollarSign, CreditCard, Smartphone, Phone } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { supabase } from '../../lib/supabaseClient';
import { PaymentMethod } from '../../types';

interface Project {
  id: string;
  name: string;
  developer: string;
  region: string;
  pricePerLead: number;
}

interface LeadRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSuccess?: () => void;
}

export const LeadRequestDialog: React.FC<LeadRequestDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess
}) => {
  const { balance, addToWalletWithPayment } = useWallet();
  const [quantity, setQuantity] = useState(30);
  const [userNotes, setUserNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [walletAmount, setWalletAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Instapay');

  const totalAmount = quantity * project.pricePerLead;
  const hasEnoughBalance = balance >= totalAmount;

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setUserNotes('');
      setError(null);
      setSuccess(null);
      setWalletAmount(0);
    }
  }, [isOpen]);

  const handleQuantityChange = (value: number) => {
    setQuantity(Math.max(30, value));
  };

  const handleAddToWallet = async () => {
    if (walletAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const result = await addToWalletWithPayment(walletAmount, paymentMethod, `Wallet deposit via ${paymentMethod} for lead request`);
      
      if (result.success) {
        setError(null);
        setSuccess(`Successfully added EGP ${walletAmount} to your wallet via ${paymentMethod}`);
        setWalletAmount(0);
      } else {
        setError(result.error || 'Failed to add money to wallet');
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Payment processing failed');
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'Instapay':
        return <Smartphone className="h-4 w-4" />;
      case 'VodafoneCash':
        return <Phone className="h-4 w-4" />;
      case 'BankTransfer':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
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

  const handleSubmitRequest = async () => {
    if (quantity < 30) {
      setError('Minimum order is 30 leads');
      return;
    }

    if (!hasEnoughBalance) {
      setError('Insufficient wallet balance. Please add money to your wallet first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: requestError } = await (supabase as any).rpc('create_lead_request', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_project_id: project.id,
        p_requested_quantity: quantity,
        p_price_per_lead: project.pricePerLead,
        p_user_notes: userNotes || null
      });

      if (requestError) {
        throw new Error(requestError.message);
      }

      setSuccess('Lead request submitted successfully! You will be notified when it\'s approved.');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);

    } catch (err: unknown) {
      console.error('Error creating lead request:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to submit lead request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-0 right-0 h-8 w-8 p-0 hover:bg-gray-100 rounded-full z-10"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
          <DialogTitle className="text-center text-lg font-semibold text-gray-900">
            Request Leads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Information */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h4>
              <p className="text-gray-600 mb-3 text-sm">{project.developer} • {project.region}</p>
              <div className="text-xl font-bold text-blue-600">
                EGP {project.pricePerLead.toFixed(0)} per lead
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Wallet Balance</span>
              </div>
              <div className="text-xl font-bold text-blue-600">
                EGP {balance.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Add Money to Wallet */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Add Money to Wallet</Label>
            
            {/* Amount Input */}
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                step="1"
                value={walletAmount}
                onChange={(e) => setWalletAmount(Number(e.target.value))}
                placeholder="Enter amount"
                className="flex-1"
              />
              <Button
                onClick={handleAddToWallet}
                disabled={walletAmount <= 0}
                size="sm"
              >
                Add
              </Button>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['Instapay', 'VodafoneCash', 'BankTransfer'] as PaymentMethod[]).map((method) => (
                  <div
                    key={method}
                    className={`p-2 border rounded cursor-pointer transition-all text-xs ${
                      paymentMethod === method
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    <div className="flex items-center space-x-1">
                      <div className="text-blue-600">
                        {getPaymentMethodIcon(method)}
                      </div>
                      <span className="font-medium">{getPaymentMethodName(method)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Instructions */}
            {paymentMethod && (
              <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                {paymentMethod === 'Instapay' && 'Use your mobile wallet to send payment to our Instapay account.'}
                {paymentMethod === 'VodafoneCash' && 'Send payment to our Vodafone Cash number: 01234567890'}
                {paymentMethod === 'BankTransfer' && 'Transfer to our bank account and contact support with receipt.'}
              </div>
            )}
          </div>

          {/* Quantity Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">How many leads do you want?</Label>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 30}
                className="w-8 h-8 p-0"
              >
                -
              </Button>
              
              <div className="w-20">
                <Input
                  type="number"
                  min="30"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  className="text-center text-sm font-semibold"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-8 h-8 p-0"
              >
                +
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Any specific requirements or notes..."
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Order Summary */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                EGP {totalAmount.toFixed(0)}
              </div>
              <div className="text-gray-600 mb-1 text-sm">
                Total for {quantity} lead{quantity !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-500">
                EGP {project.pricePerLead.toFixed(0)} × {quantity} leads
              </div>
            </div>
          </div>

          {/* Balance Check */}
          {!hasEnoughBalance && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Insufficient balance. You need EGP {(totalAmount - balance).toFixed(0)} more.
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full h-10 text-sm font-semibold"
              onClick={handleSubmitRequest}
              disabled={!hasEnoughBalance || isSubmitting}
            >
              <Users className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting Request...' : 'Submit Lead Request'}
            </Button>
            <Button
              variant="outline"
              className="w-full h-8 text-sm"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
