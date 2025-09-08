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
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  onPurchaseSuccess?: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Instapay', 'VodafoneCash', 'BankTransfer'];

export const ImprovedProjectCard: React.FC<ProjectCardProps> = ({ project, onPurchaseSuccess }) => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [quantity, setQuantity] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Instapay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentAvailableLeads, setCurrentAvailableLeads] = useState(project.availableLeads);
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
          setQuantity(Math.min(data.available_leads, 50));
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

      // Step 2: Simulate payment processing (in real app, this would be actual payment)
      setSuccess('Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment delay

      // Step 3: Confirm the order (assigns leads atomically)
      const { data: confirmResult, error: confirmError } = await supabase.rpc('rpc_confirm_order', {
        order_id: orderResult.order_id,
        payment_reference: `PAY-${Date.now()}-${user.id.slice(0, 8)}`
      });

      if (confirmError) {
        // Payment succeeded but lead assignment failed - need manual intervention
        console.error('❌ Order confirmation failed:', confirmError);
        
        // Try to fail the order gracefully
        try {
          await supabase.rpc('rpc_fail_order', {
            order_id: orderResult.order_id,
            reason: `Lead assignment failed: ${confirmError.message}`
          });
        } catch (failError) {
          console.error('Failed to mark order as failed:', failError);
        }
        
        throw new Error(`Purchase failed: ${confirmError.message}`);
      }

      if (!confirmResult?.success) {
        throw new Error('Order confirmation returned unsuccessful result');
      }

      console.log('🎉 Purchase successful:', confirmResult);

      // Step 4: Show success and update UI
      setSuccess(`Successfully purchased ${confirmResult.leads_assigned} leads!`);
      
      // Update local state
      setCurrentAvailableLeads(confirmResult.remaining_available_leads);
      
      // Close dialog after success
      setTimeout(() => {
        setShowPurchaseDialog(false);
        setSuccess(null);
        
        // Trigger parent refresh
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        
        // Show success message and redirect to CRM
        alert(`🎉 Purchase successful! ${confirmResult.leads_assigned} leads have been added to your CRM.`);
        navigate('/crm');
      }, 2000);

    } catch (err: any) {
      console.error('❌ Purchase error:', err);
      setError(err.message || 'Purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Validation
  const canPurchase = quantity >= 50 && 
                     quantity <= currentAvailableLeads && 
                     !isProcessing && 
                     user;

  const quantityError = quantity < 50 ? 'Minimum 50 leads required' : 
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
                Quantity (minimum 50, maximum {currentAvailableLeads})
              </label>
              <Input
                type="number"
                min={50}
                max={currentAvailableLeads}
                step={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(50, parseInt(e.target.value) || 50))}
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

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPurchaseDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handlePurchase}
                disabled={!canPurchase || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Confirm Purchase
                  </>
                )}
              </Button>
            </div>

            {/* Purchase Terms */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Minimum purchase: 50 leads</p>
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
