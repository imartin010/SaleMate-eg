import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Project } from '../../types';
import { useAuthStore } from '../../store/auth';
import { supabase } from "../../lib/supabaseClient"
import { LeadRequestDialog } from '../leads/LeadRequestDialog';
import { 
  MapPin, 
  Building, 
  ShoppingCart, 
  Star, 
  AlertCircle, 
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  onPurchaseSuccess?: () => void;
}


export const ImprovedProjectCard: React.FC<ProjectCardProps> = ({ project, onPurchaseSuccess }) => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showLeadRequestDialog, setShowLeadRequestDialog] = useState(false);
  const [quantity, setQuantity] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [currentAvailableLeads, setCurrentAvailableLeads] = useState(project.availableLeads);
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const pricePerLead = project.pricePerLead || 100;
  const totalAmount = quantity * pricePerLead;

  // Real-time availability check
  const checkProjectAvailability = async () => {
    if (!project.id) return;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('rpc_get_project_availability', {
        project_id: project.id
      });

      if (!error && data) {
        setCurrentAvailableLeads((data as any).available_leads); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (quantity > (data as any).available_leads) { // eslint-disable-line @typescript-eslint/no-explicit-any
          setQuantity(Math.min((data as any).available_leads, 30)); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      }
    } catch (err) {
      console.warn('Failed to check availability:', err);
    }
  };

  // Check availability when dialog opens
  useEffect(() => {
    if (showPurchaseDialog) {
      checkProjectAvailability();
    }
  }, [showPurchaseDialog]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProceedToCheckout = () => {
    if (!user) {
      setError('Please log in to make a purchase');
      return;
    }

    if (quantity < 30) {
      setError('Minimum order is 30 leads');
      return;
    }

    if (quantity > currentAvailableLeads) {
      setError(`Only ${currentAvailableLeads} leads available`);
      return;
    }

    // Close the dialog and navigate to checkout
    setShowPurchaseDialog(false);
    
    // Navigate to checkout with project data
    const checkoutParams = new URLSearchParams({
      projectId: project.id,
      projectName: project.name,
      developer: project.developer,
      region: project.region,
      availableLeads: currentAvailableLeads.toString(),
      pricePerLead: pricePerLead.toString(),
      quantity: quantity.toString(),
      totalPrice: totalAmount.toString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      image: (project as any).image || '/placeholder-project.svg'
    });

    navigate(`/checkout?${checkoutParams.toString()}`);
  };

  const quantityError = quantity < 30 ? 'Minimum order is 30 leads' : 
                       quantity > currentAvailableLeads ? `Only ${currentAvailableLeads} leads available` : 
                       null;

  // Generate hero image (deterministic placeholder)
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
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        input[type="range"]::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
        }
        
        input[type="range"]::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: transparent;
        }
      `}</style>
      <Card className="shop-project-card overflow-hidden group hover:shadow-lg transition-all duration-300">
        {/* Hero Photo Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={project.coverImage || getHeroImage(project.name)}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getHeroImage(project.name);
            }}
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
          
          {/* Minimum Order Badge */}
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-blue-600 text-white hover:bg-blue-700">
              Min 30 leads
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
          {currentAvailableLeads === 0 ? (
            <Button 
              className="w-full h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700" 
              onClick={() => setShowLeadRequestDialog(true)}
              disabled={!user}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              {!user ? 'Login to Request' : 'Request Leads'}
            </Button>
          ) : (
            <Button 
              className="w-full h-12 text-base font-semibold" 
              onClick={() => setShowPurchaseDialog(true)}
              disabled={!user}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {!user ? 'Login to Purchase' : 'Buy Leads'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Enhanced Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPurchaseDialog(false)}
              className="absolute top-0 right-0 h-8 w-8 p-0 hover:bg-gray-100 rounded-full z-10"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
            <DialogTitle className="text-center text-lg sm:text-xl font-semibold text-gray-900">
              Purchase Leads
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 text-sm">
              Select quantity and proceed to secure checkout
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Project Information */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h4>
                <p className="text-gray-600 mb-3 text-sm">{project.developer} • {project.region}</p>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">EGP {pricePerLead.toFixed(0)}</div>
                    <div className="text-xs text-gray-500">per lead</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{currentAvailableLeads}</div>
                    <div className="text-xs text-gray-500">available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Selection with Slider */}
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-base font-semibold">Select Quantity</h3>
                <p className="text-xs text-gray-500 mt-1">Minimum order: 30 leads</p>
              </div>
              
              {/* Quantity Display */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{quantity}</div>
                <div className="text-xs text-gray-500">leads selected</div>
              </div>
              
              {/* Range Slider */}
              <div className="px-2">
                <input
                  type="range"
                  min="30"
                  max={currentAvailableLeads}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((quantity - 30) / (currentAvailableLeads - 30)) * 100}%, #e5e7eb ${((quantity - 30) / (currentAvailableLeads - 30)) * 100}%, #e5e7eb 100%)`,
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>30</span>
                  <span>{currentAvailableLeads}</span>
                </div>
              </div>

              {/* Quick Selection Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[30, 50, 100, 200].map((qty) => (
                  <Button
                    key={qty}
                    variant={quantity === qty ? "default" : "outline"}
                    onClick={() => setQuantity(Math.min(qty, currentAvailableLeads))}
                    disabled={qty > currentAvailableLeads}
                    className="h-8 text-xs font-medium"
                  >
                    {qty}
                  </Button>
                ))}
              </div>

              {quantityError && (
                <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs font-medium">{quantityError}</span>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  EGP {totalAmount.toFixed(0)}
                </div>
                <div className="text-gray-600 mb-1 text-sm">
                  Total for {quantity} lead{quantity !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500">
                  EGP {pricePerLead.toFixed(0)} × {quantity} leads
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span className="text-xs font-medium">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full h-10 text-sm font-semibold"
                onClick={handleProceedToCheckout}
                disabled={quantity < 1 || quantity > currentAvailableLeads}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Proceed to Checkout
              </Button>
              <Button
                variant="outline"
                className="w-full h-8 text-sm"
                onClick={() => setShowPurchaseDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Request Dialog */}
      <LeadRequestDialog
        isOpen={showLeadRequestDialog}
        onClose={() => setShowLeadRequestDialog(false)}
        project={{
          id: project.id,
          name: project.name,
          developer: project.developer,
          region: project.region,
          pricePerLead: pricePerLead
        }}
        onSuccess={() => {
          onPurchaseSuccess?.();
          setShowLeadRequestDialog(false);
        }}
      />
    </>
  );
};

export default ImprovedProjectCard;
