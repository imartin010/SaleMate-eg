import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Project, PaymentMethod } from '../../types';
import { getPaymentMethodIcon, calculateTotalAmount } from '../../lib/payments';
import { formatCurrency } from '../../lib/format';
import { useAuthStore } from '../../store/auth';
import { supabase } from "../../lib/supabaseClient"
import { 
  MapPin, 
  Building, 
  Users, 
  ShoppingCart, 
  Star, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Clock,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  onPurchaseSuccess?: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Instapay', 'VodafoneCash', 'BankTransfer'];

export const ImprovedProjectCard: React.FC<ProjectCardProps> = ({ project, onPurchaseSuccess }) => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Instapay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentAvailableLeads, setCurrentAvailableLeads] = useState(project.availableLeads);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const pricePerLead = project.pricePerLead || 100;
  const totalAmount = quantity * pricePerLead;

  // Real-time availability check
  const checkProjectAvailability = async () => {
    if (!project.id) return;
    
    setIsCheckingAvailability(true);
    try {
      const { data, error } = await supabase.rpc('rpc_get_project_availability', {
        project_id: project.id
      });

      if (!error && data) {
        setCurrentAvailableLeads(data.available_leads);
        if (quantity > data.available_leads) {
          setQuantity(Math.min(data.available_leads, 1));
        }
      }
    } catch (err) {
      console.warn('Failed to check availability:', err);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Check availability when dialog opens
  useEffect(() => {
    if (showPurchaseDialog) {
      checkProjectAvailability();
    }
  }, [showPurchaseDialog]);

  const handlePurchase = async () => {
    if (!user) {
      setError('Please log in to make a purchase');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🛒 Starting purchase:', { 
        projectId: project.id, 
        quantity, 
        paymentMethod, 
        userId: user.id 
      });

      // Step 1: Start the order (creates pending order)
      const { data: orderResult, error: orderError } = await supabase.rpc('rpc_start_order', {
        user_id: user.id,
        project_id: project.id,
        quantity,
        payment_method: paymentMethod
      });

      if (orderError) {
        throw new Error(orderError.message || 'Failed to create order');
      }

      if (!orderResult?.success || !orderResult?.order_id) {
        throw new Error('Invalid order response from server');
      }

      console.log('✅ Order created:', orderResult);

      // Step 2: Save order ID and show payment instructions
      setCurrentOrderId(orderResult.order_id);
      setShowPaymentInstructions(true);
      setSuccess(`Order created! Total: EGP ${orderResult.total_amount}`);

    } catch (err: any) {
      console.error('❌ Purchase error:', err);
      setError(err.message || 'Purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentOrderId || !receiptFile) {
      setError('Please upload a payment receipt');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Upload receipt to storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${receiptFile.name}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, receiptFile);

      if (uploadError) {
        throw new Error(`Failed to upload receipt: ${uploadError.message}`);
      }

      // Get public URL for the receipt
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      // Confirm the order with receipt
      const { data: confirmResult, error: confirmError } = await supabase.rpc('rpc_confirm_order', {
        order_id: currentOrderId,
        payment_reference: `PAY-${timestamp}-${user?.id.slice(0, 8)}`
      });

      if (confirmError) {
        throw new Error(`Confirmation failed: ${confirmError.message}`);
      }

      if (!confirmResult?.success) {
        throw new Error('Order confirmation failed');
      }

      console.log('🎉 Purchase confirmed:', confirmResult);

      // Show success and update UI
      setSuccess(`Payment confirmed! ${confirmResult.leads_assigned} leads added to your CRM.`);
      setCurrentAvailableLeads(confirmResult.remaining_available_leads);
      
      // Close dialog and redirect after success
      setTimeout(() => {
        setShowPurchaseDialog(false);
        setShowPaymentInstructions(false);
        setCurrentOrderId(null);
        setReceiptFile(null);
        setSuccess(null);
        
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        
        alert(`🎉 Purchase successful! ${confirmResult.leads_assigned} leads have been added to your CRM.`);
        navigate('/crm');
      }, 2000);

    } catch (err: any) {
      console.error('❌ Payment confirmation error:', err);
      setError(err.message || 'Payment confirmation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Validation
  const canPurchase = quantity >= 1 && 
                     quantity <= currentAvailableLeads && 
                     !isProcessing && 
                     user;

  const quantityError = quantity < 1 ? 'Minimum 1 lead required' : 
                       quantity > currentAvailableLeads ? `Only ${currentAvailableLeads} leads available` : 
                       null;

  // Generate hero image
  const getHeroImage = (projectName: string) => {
    const images = [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop',
    ];
    const index = projectName.charCodeAt(0) % images.length;
    return images[index];
  };

  return (
    <>
      <Card className="shop-project-card overflow-hidden group hover:shadow-lg transition-all duration-300">
        {/* Hero Photo Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={getHeroImage(project.name)}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Overlay with Project Name */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-xl font-bold mb-1">{project.name}</h3>
              <p className="text-sm opacity-90">{project.description || 'Premium Real Estate Project'}</p>
            </div>
          </div>
          
          {/* Developer Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-black hover:bg-white">
              <Building className="h-3 w-3 mr-1" />
              {project.developer}
            </Badge>
          </div>
          
          {/* Premium Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
              <Star className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </div>

        {/* Project Details */}
        <CardContent className="p-4 space-y-3">
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{project.region}</span>
          </div>

          {/* CPL and Leads Available */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                EGP {pricePerLead.toFixed(2)}
              </div>
              <div className="text-xs text-blue-600 font-medium">Cost Per Lead</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {currentAvailableLeads}
              </div>
              <div className="text-xs text-green-600 font-medium">Available</div>
            </div>
          </div>
        </CardContent>

        {/* Action Footer */}
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full h-12 text-base font-semibold" 
            onClick={() => setShowPurchaseDialog(true)}
            disabled={currentAvailableLeads === 0 || !user}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {currentAvailableLeads === 0 ? 'Sold Out' : 
             !user ? 'Login to Purchase' : 'Buy Leads'}
          </Button>
        </CardFooter>
      </Card>

      {/* Enhanced Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchase Leads
            </DialogTitle>
            <DialogDescription>
              Buy leads from {project.name} in {project.region}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Real-time availability check */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Current Availability:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600">{currentAvailableLeads} leads</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkProjectAvailability}
                  disabled={isCheckingAvailability}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${isCheckingAvailability ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Quantity Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Quantity (minimum 1, maximum {currentAvailableLeads})
              </label>
              <Input
                type="number"
                min={1}
                max={currentAvailableLeads}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isProcessing}
              />
              {quantityError && (
                <div className="flex items-center gap-2 mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {quantityError}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Payment Method
              </label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                disabled={isProcessing}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Order Summary</h4>
              <div className="flex justify-between text-sm">
                <span>Project:</span>
                <span className="font-medium">{project.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quantity:</span>
                <span className="font-medium">{quantity} leads</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Price per lead:</span>
                <span className="font-medium">EGP {pricePerLead.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment method:</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span className="text-lg">EGP {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                <span className="text-sm">
                  {success || 'Processing your purchase...'}
                </span>
              </div>
            )}

            {/* Payment Instructions */}
            {showPaymentInstructions && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    💳 Payment Instructions
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>1. Send payment via Instapay to:</strong></p>
                    <div className="bg-blue-100 p-3 rounded font-mono text-center text-lg font-bold">
                      imartin1@instapay
                    </div>
                    <p><strong>2. Amount:</strong> EGP {totalAmount.toFixed(2)}</p>
                    <p><strong>3. Reference:</strong> Order #{currentOrderId?.slice(-8)}</p>
                    
                    {/* Direct Instapay Button */}
                    <div className="mt-3">
                      <Button
                        onClick={() => {
                          const account = 'imartin1@instapay';
                          const amount = totalAmount;
                          const orderRef = currentOrderId?.slice(-8);
                          
                          // Try multiple URL schemes for Instapay
                          const urlSchemes = [
                            `instapay://transfer?to=${encodeURIComponent(account)}&amount=${amount}&reference=${encodeURIComponent(`Order ${orderRef}`)}`,
                            `instapay://send?to=${encodeURIComponent(account)}&amount=${amount}&note=${encodeURIComponent(`Order ${orderRef}`)}`,
                            `instapay://pay?recipient=${encodeURIComponent(account)}&amount=${amount}&memo=${encodeURIComponent(`Order ${orderRef}`)}`,
                            `instapay://app?action=send&to=${encodeURIComponent(account)}&amount=${amount}`,
                            `instapay://`
                          ];
                          
                          let attemptCount = 0;
                          
                          const tryNextScheme = () => {
                            if (attemptCount >= urlSchemes.length) {
                              // All schemes failed, show manual instructions
                              alert(`📱 Please open your Instapay app manually and send:\n\n` +
                                    `💰 Amount: EGP ${amount}\n` +
                                    `👤 To: ${account}\n` +
                                    `📝 Reference: Order ${orderRef}\n\n` +
                                    `Then come back and upload your receipt.`);
                              return;
                            }
                            
                            const currentScheme = urlSchemes[attemptCount];
                            attemptCount++;
                            
                            // Set up detection for this attempt
                            const timeout = setTimeout(() => {
                              if (document.visibilityState !== 'hidden') {
                                // This scheme didn't work, try next one
                                tryNextScheme();
                              }
                            }, 800);

                            const handleVisibilityChange = () => {
                              if (document.visibilityState === 'hidden') {
                                clearTimeout(timeout);
                                document.removeEventListener('visibilitychange', handleVisibilityChange);
                                // Success! App opened
                              }
                            };
                            
                            document.addEventListener('visibilitychange', handleVisibilityChange);
                            
                            // Try current scheme
                            try {
                              window.location.href = currentScheme;
                            } catch (error) {
                              clearTimeout(timeout);
                              tryNextScheme();
                            }
                          };
                          
                          // Start with first scheme
                          tryNextScheme();
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        size="lg"
                      >
                        <DollarSign className="h-5 w-5 mr-2" />
                        Open Instapay App
                      </Button>
                    </div>
                    
                    <p className="text-xs text-blue-600 mt-2 text-center">
                      Click above to open Instapay app directly (mobile) or get manual instructions
                    </p>
                    
                    {/* Alternative: Manual Instructions Button */}
                    <div className="mt-2">
                      <Button
                        onClick={() => {
                          const account = 'imartin1@instapay';
                          const amount = totalAmount;
                          const orderRef = currentOrderId?.slice(-8);
                          const paymentDetails = `Send EGP ${amount} to ${account}\nReference: Order ${orderRef}`;
                          
                          navigator.clipboard.writeText(paymentDetails).then(() => {
                            alert(`💳 Payment details copied to clipboard!\n\n` +
                                  `Manual Instructions:\n` +
                                  `1. Open your Instapay app\n` +
                                  `2. Choose "Send Money" or "Transfer"\n` +
                                  `3. Enter recipient: ${account}\n` +
                                  `4. Enter amount: EGP ${amount}\n` +
                                  `5. Add reference: Order ${orderRef}\n` +
                                  `6. Complete the payment\n` +
                                  `7. Come back and upload your receipt\n\n` +
                                  `Payment details have been copied to your clipboard for easy pasting.`);
                          }).catch(() => {
                            alert(`💳 Manual Payment Instructions:\n\n` +
                                  `1. Open your Instapay app\n` +
                                  `2. Choose "Send Money" or "Transfer"\n` +
                                  `3. Enter recipient: ${account}\n` +
                                  `4. Enter amount: EGP ${amount}\n` +
                                  `5. Add reference: Order ${orderRef}\n` +
                                  `6. Complete the payment\n` +
                                  `7. Come back and upload your receipt`);
                          });
                        }}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Manual Instructions
                      </Button>
                    </div>
                    
                    <p><strong>4. Upload your payment receipt below</strong></p>
                  </div>
                </div>

                {/* Receipt Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Payment Receipt *</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleReceiptUpload}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  {receiptFile && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">{receiptFile.name}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload screenshot or photo of your Instapay payment confirmation
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPurchaseDialog(false);
                  setShowPaymentInstructions(false);
                  setCurrentOrderId(null);
                  setReceiptFile(null);
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              {!showPaymentInstructions ? (
                <Button
                  className="flex-1"
                  onClick={handlePurchase}
                  disabled={!canPurchase || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Create Order
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={handleConfirmPayment}
                  disabled={!receiptFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Payment
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Purchase Terms */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Minimum purchase: 1 lead</p>
              <p>• Leads will appear in your CRM immediately after payment</p>
              <p>• All purchases are final - no refunds</p>
              <p>• Contact support for any issues</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImprovedProjectCard;
