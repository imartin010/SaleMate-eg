import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Project } from '../../types';
import { useAuthStore } from '../../store/auth';
import { useCartStore } from '../../store/cart';
import { supabase } from "../../lib/supabaseClient"
import { LeadRequestDialog } from '../leads/LeadRequestDialog';
import { 
  MapPin, 
  Building, 
  ShoppingCart, 
  Star, 
  AlertCircle, 
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  onPurchaseSuccess?: () => void;
}


export const ImprovedProjectCard: React.FC<ProjectCardProps> = ({ project, onPurchaseSuccess }) => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showLeadRequestDialog, setShowLeadRequestDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [currentAvailableLeads, setCurrentAvailableLeads] = useState(project.availableLeads);
  
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { addToCart, getCartItem } = useCartStore();

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
          setQuantity(Math.min((data as any).available_leads, 1)); // eslint-disable-line @typescript-eslint/no-explicit-any
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

  const handleAddToCart = () => {
    if (!user) {
      navigate('/auth/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }

    if (quantity < 1) {
      setError('Please select at least 1 lead');
      return;
    }

    if (quantity > currentAvailableLeads) {
      setError(`Only ${currentAvailableLeads} leads available`);
      return;
    }

    // Add to cart
    addToCart({
      projectId: project.id,
      projectName: project.name,
      developer: project.developer,
      region: project.region,
      pricePerLead: pricePerLead,
      availableLeads: currentAvailableLeads,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      image: (project as any).coverImage || (project as any).image,
      quantity: quantity
    });

    // Close dialog and show success
    setShowPurchaseDialog(false);
    setError(null);
    setQuantity(1); // Reset to 1 for next time
    onPurchaseSuccess?.();
  };

  // Check if item is already in cart
  const cartItem = getCartItem(project.id);
  const isInCart = !!cartItem;
  
  // Update quantity when dialog opens if item is in cart
  useEffect(() => {
    if (showPurchaseDialog && cartItem) {
      setQuantity(cartItem.quantity);
    } else if (showPurchaseDialog && !cartItem) {
      setQuantity(1);
    }
  }, [showPurchaseDialog, cartItem]);

  const quantityError = quantity > currentAvailableLeads ? `Only ${currentAvailableLeads} leads available` : null;

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
          background: #2563eb;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
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
      <Card className="shop-project-card overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0" style={{ padding: 0 }}>
        {/* Hero Photo Section */}
        <div className="relative h-52 w-full overflow-hidden">
          <img
            src={project.coverImage || getHeroImage(project.name)}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getHeroImage(project.name);
            }}
          />
          
          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          
          {/* Developer Badge - Minimal */}
          <div className="absolute top-2 left-2">
            <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm border border-gray-200/50">
              <Building className="h-2.5 w-2.5 inline mr-1 align-middle" />
              <span className="align-middle">{project.developer}</span>
            </div>
          </div>
          
          {/* Cart Indicator - Minimal */}
          {cartItem && (
            <div className="absolute top-2 right-2">
              <div className="bg-gray-900/90 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm">
                <ShoppingCart className="h-2.5 w-2.5 inline mr-1 align-middle" />
                <span className="align-middle">{cartItem.quantity}</span>
              </div>
            </div>
          )}
        </div>

        {/* Project Details - Clean & Minimal */}
        <CardContent className="px-3 pt-2 pb-1.5 space-y-1.5">
          {/* Project Name - Moved to white space */}
          <div>
            <div className="text-base font-semibold text-gray-900 line-clamp-1">{project.name}</div>
            <p className="text-xs text-gray-500 line-clamp-1">{project.description || 'Premium Real Estate Project'}</p>
          </div>
          
          {/* Location - Subtle */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <span className="truncate">{project.region}</span>
          </div>

          {/* Stats - Minimal Design */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-left p-2 bg-blue-50/50 rounded-lg">
              <div className="text-xs text-gray-500 mb-0.5 font-medium">Price</div>
              <div className="text-lg font-semibold text-blue-600">
                EGP {pricePerLead.toFixed(0)}
              </div>
            </div>
            
            <div className="text-left p-2 bg-green-50/50 rounded-lg">
              <div className="text-xs text-gray-500 mb-0.5 font-medium">Available</div>
              <div className="text-lg font-semibold text-green-700">
                {currentAvailableLeads.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Action Footer - Modern Button */}
        <CardFooter className="px-3 pb-2 pt-1">
          {currentAvailableLeads === 0 ? (
            <Button 
              className="w-full h-9 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white transition-all rounded-lg border-0" 
              onClick={() => setShowLeadRequestDialog(true)}
              disabled={!user}
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              {!user ? 'Login to Request' : 'Request Leads'}
            </Button>
          ) : (
            <Button 
              className="w-full h-9 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all rounded-lg border-0" 
              onClick={() => {
                if (!user) {
                  navigate('/auth/login', { state: { from: { pathname: window.location.pathname } } });
                } else {
                  setShowPurchaseDialog(true);
                }
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-1.5" />
              {!user ? 'Login to Purchase' : 'Buy Leads'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Enhanced Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md w-full h-full md:h-auto md:max-h-[90vh] md:w-[90vw] overflow-y-auto p-0 md:p-6">
          <DialogHeader className="relative pb-4 px-4 md:px-0 pt-4 md:pt-0 border-b md:border-b-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPurchaseDialog(false)}
              className="absolute top-2 md:top-0 right-2 md:right-0 h-9 w-9 md:h-8 md:w-8 p-0 hover:bg-gray-100 rounded-full z-10 touch-manipulation"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
            <DialogTitle className="text-center text-base md:text-lg lg:text-xl font-semibold text-gray-900 pr-10 md:pr-0">
              Purchase Leads
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 text-xs md:text-sm mt-1">
              Select quantity and add to cart (minimum 30 total to checkout)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 md:space-y-6 px-4 md:px-0 pb-4 md:pb-0">
            {/* Project Information */}
            <div className="bg-gray-50/50 p-3 md:p-4 rounded-xl border border-gray-100">
              <div className="text-center">
                <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-1">{project.name}</h4>
                <p className="text-gray-500 mb-3 text-xs md:text-sm">{project.developer} • {project.region}</p>
                <div className="flex justify-center gap-4 md:gap-6">
                  <div className="text-center">
                    <div className="text-lg md:text-xl font-semibold text-blue-600">EGP {pricePerLead.toFixed(0)}</div>
                    <div className="text-xs text-gray-500">per lead</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg md:text-xl font-semibold text-green-600">{currentAvailableLeads}</div>
                    <div className="text-xs text-gray-500">available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Selection with Slider */}
            <div className="space-y-3 md:space-y-4">
              <div className="text-center">
                <h3 className="text-sm md:text-base font-semibold">Select Quantity</h3>
                <p className="text-xs text-gray-500 mt-1 px-2">
                  {cartItem ? `Currently in cart: ${cartItem.quantity} leads` : 'Add any quantity to your cart (minimum 30 total to checkout)'}
                </p>
              </div>
              
              {/* Quantity Display */}
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold text-blue-600">{quantity}</div>
                <div className="text-xs md:text-sm text-gray-500 mt-1">leads selected</div>
              </div>
              
              {/* Range Slider */}
              <div className="px-2 md:px-4">
                <input
                  type="range"
                  min="1"
                  max={currentAvailableLeads}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full h-3 md:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer touch-manipulation"
                  style={{
                    background: currentAvailableLeads > 1 
                      ? `linear-gradient(to right, #2563eb 0%, #2563eb ${((quantity - 1) / (currentAvailableLeads - 1)) * 100}%, #e5e7eb ${((quantity - 1) / (currentAvailableLeads - 1)) * 100}%, #e5e7eb 100%)`
                      : '#2563eb',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1.5 md:mt-1">
                  <span>1</span>
                  <span>{currentAvailableLeads}</span>
                </div>
              </div>

              {/* Quick Selection Buttons */}
              <div className="grid grid-cols-4 gap-2 md:gap-2">
                {[1, 10, 50, 100].map((qty) => (
                  <Button
                    key={qty}
                    variant={quantity === qty ? "default" : "outline"}
                    onClick={() => setQuantity(Math.min(qty, currentAvailableLeads))}
                    disabled={qty > currentAvailableLeads}
                    className="h-10 md:h-8 text-xs md:text-xs font-medium touch-manipulation"
                    aria-label={`Select ${qty} leads`}
                  >
                    {qty}
                  </Button>
                ))}
              </div>

              {quantityError && (
                <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-2.5 md:p-2 rounded-lg text-xs md:text-xs">
                  <AlertCircle className="h-4 w-4 md:h-3 md:w-3 flex-shrink-0" />
                  <span className="font-medium">{quantityError}</span>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-blue-50/50 p-3 md:p-4 rounded-xl border border-blue-100">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-semibold text-blue-600 mb-1">
                  EGP {totalAmount.toFixed(0)}
                </div>
                <div className="text-gray-600 mb-1 text-sm md:text-base">
                  Total for {quantity} lead{quantity !== 1 ? 's' : ''}
                </div>
                <div className="text-xs md:text-sm text-gray-500">
                  EGP {pricePerLead.toFixed(0)} × {quantity} leads
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 md:p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs md:text-xs">
                <AlertCircle className="h-4 w-4 md:h-3 md:w-3 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 md:space-y-2 pb-2 md:pb-0">
              <Button
                className="w-full h-12 md:h-10 text-base md:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white touch-manipulation rounded-xl"
                onClick={handleAddToCart}
                disabled={quantity < 1 || quantity > currentAvailableLeads}
              >
                {isInCart ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                    Update Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 md:h-8 text-sm md:text-sm touch-manipulation border-gray-200 hover:bg-gray-50 rounded-xl"
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
