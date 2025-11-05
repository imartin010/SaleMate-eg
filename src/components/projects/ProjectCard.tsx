import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Project, PaymentMethod } from '../../types';
import { useAuthStore } from '../../store/auth';
import { startOrder, supabase } from "../../lib/supabaseClient"
import { MapPin, Building, ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Instapay', 'VodafoneCash', 'BankTransfer'];

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Instapay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const pricePerLead = project.pricePerLead || 25; // Use project's CPL or default
  const totalAmount = quantity * pricePerLead;

  const handlePurchase = async () => {
    if (!user) {
      navigate('/auth/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starting order:', { projectId: project.id, quantity, paymentMethod, userId: user.id });
      
      // Use the actual logged-in user ID
      const userId = user.id;
      console.log('Using user ID for purchase:', userId);
      
      // Use real backend order function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await startOrder(userId, project.id, quantity, paymentMethod) as any;
      console.log('Order result:', result);

      if (result && result.order_id) {
        setShowPurchaseDialog(false);
        
        console.log('💳 Simulating payment processing...');
        setError(null);
        
        // Simulate payment delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Confirm the order with the backend
        try {
          console.log('✅ Order created successfully, confirming purchase...');
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: confirmResult, error: confirmError } = await (supabase as any).rpc('rpc_confirm_order', {
            order_id: result.order_id,
            payment_reference: `PAY-${Date.now()}-${user.id.slice(0, 8)}`
          });
          
          if (!confirmError && confirmResult) {
            console.log('🎉 Purchase confirmed:', confirmResult);
            
            if (confirmResult.success && confirmResult.leads_assigned > 0) {
              setShowPurchaseDialog(false);
              alert(`🎉 Purchase successful! ${confirmResult.leads_assigned} leads have been added to your CRM.\n\nOrder ID: ${confirmResult.order_id}\nTotal: EGP ${confirmResult.total_amount}`);
              
              // Navigate to CRM to see the new leads
              navigate('/crm');
            } else {
              console.warn('No leads were assigned:', confirmResult);
              setError('Order processed but no leads were available. Your payment will be refunded.');
            }
          } else {
            console.error('Order confirmation failed:', confirmError);
            setError(`Purchase failed: ${confirmError?.message || 'Unknown error'}. Please contact support.`);
          }
        } catch (confirmErr: unknown) {
          console.error('Confirmation error:', confirmErr);
          setError(`Purchase confirmation failed: ${(confirmErr instanceof Error ? confirmErr.message : String(confirmErr))}. Please contact support.`);
        }
      } else {
        setError('Failed to create order');
      }
    } catch (err: unknown) {
      console.error('Purchase error:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const canPurchase = quantity >= 1 && quantity <= project.availableLeads;
  const quantityError = quantity < 1 ? 'Minimum 1 lead required' : 
                      quantity > project.availableLeads ? 'Not enough leads available' : null;

  // Generate a placeholder hero image based on project name
  const getHeroImage = (projectName: string) => {
    const images = [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=400&h=250&fit=crop'
    ];
    
    // Use project name to consistently select the same image
    const index = projectName.charCodeAt(0) % images.length;
    return images[index];
  };

  return (
    <>
      <Card className="shop-project-card overflow-hidden group">
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
              <div className="text-xs text-blue-600 font-medium">CPL</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {project.availableLeads}
              </div>
              <div className="text-xs text-green-600 font-medium">Leads Available</div>
            </div>
          </div>

          {/* Project Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </CardContent>

        {/* Action Footer */}
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full h-12 text-base font-semibold" 
            onClick={() => {
              if (!user) {
                navigate('/auth/login', { state: { from: { pathname: window.location.pathname } } });
              } else {
                setShowPurchaseDialog(true);
              }
            }}
            disabled={project.availableLeads === 0}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {!user ? 'Login to Purchase' : (project.availableLeads === 0 ? 'Sold Out' : 'Buy Leads')}
          </Button>
        </CardFooter>
      </Card>

      {/* Purchase Dialog - Keep existing implementation */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Leads</DialogTitle>
            <DialogDescription>
              Buy leads from {project.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Quantity (minimum 1)
              </label>
              <Input
                type="number"
                min={1}
                max={project.availableLeads}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              {quantityError && (
                <p className="text-sm text-destructive mt-1">{quantityError}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2 border rounded"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-accent/50 p-3 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span>Quantity:</span>
                <span>{quantity} leads</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Price per lead:</span>
                <span>EGP {pricePerLead.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total:</span>
                <span>EGP {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

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
                {isProcessing ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
