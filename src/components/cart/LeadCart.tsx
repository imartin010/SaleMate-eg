import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useCartStore, MINIMUM_LEADS } from '../../store/cart';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LeadCart: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalLeads, totalPrice, updateQuantity, removeFromCart, canCheckout, clearCart } = useCartStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const progress = Math.min((totalLeads / MINIMUM_LEADS) * 100, 100);
  const leadsNeeded = Math.max(0, MINIMUM_LEADS - totalLeads);
  const canProceed = canCheckout();

  const handleCheckout = () => {
    if (canProceed) {
      setIsOpen(false);
      navigate('/checkout');
    }
  };

  const subtotal = totalPrice;
  const vat = Math.round(subtotal * 0.14);
  const grandTotal = subtotal + vat;

  return (
    <>
      {/* Cart Button with Badge */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Cart
        {totalLeads > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600 text-white">
            {totalLeads}
          </Badge>
        )}
      </Button>

      {/* Cart Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto p-0 md:p-6">
          <DialogHeader className="px-4 md:px-0 pt-4 md:pt-0 pb-4 border-b md:border-b-0">
            <DialogTitle className="flex items-center justify-between text-lg md:text-xl">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-base md:text-lg">Shopping Cart</span>
              </span>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-2 md:px-3 text-xs md:text-sm"
                >
                  <Trash2 className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Clear All</span>
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 md:space-y-6 mt-4 px-4 md:px-0 pb-4 md:pb-0">
            {/* Progress Bar */}
            <Card className="p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="font-medium text-gray-700">
                    Progress to Checkout
                  </span>
                  <span className={`font-bold text-sm md:text-base ${canProceed ? 'text-green-600' : 'text-blue-600'}`}>
                    {totalLeads} / {MINIMUM_LEADS} leads
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 md:h-3 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      canProceed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                {!canProceed && (
                  <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span>Add {leadsNeeded} more lead{leadsNeeded !== 1 ? 's' : ''} to proceed</span>
                  </p>
                )}
                {canProceed && (
                  <p className="text-xs md:text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span>Ready to checkout!</span>
                  </p>
                )}
              </div>
            </Card>

            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add leads from different projects to your cart
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.projectId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="p-4">
                        <div className="flex gap-4">
                          {/* Project Image */}
                          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.projectName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building className="h-8 w-8 text-gray-400" />
                            )}
                          </div>

                          {/* Project Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {item.projectName}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">
                              {item.developer} • {item.region}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-600">
                                EGP {item.pricePerLead.toFixed(0)} per lead
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {item.availableLeads} available
                              </Badge>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.projectId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-semibold">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.projectId, item.quantity + 1)}
                                disabled={item.quantity >= item.availableLeads}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              EGP {(item.quantity * item.pricePerLead).toFixed(0)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.projectId)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Order Summary */}
            {items.length > 0 && (
              <Card className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Leads:</span>
                    <span className="font-medium">{totalLeads} leads</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">EGP {subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT (14%):</span>
                    <span className="font-medium">EGP {vat.toFixed(0)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Grand Total:</span>
                      <span className="font-bold text-lg text-blue-600">EGP {grandTotal.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={!canProceed}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {canProceed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Add {leadsNeeded} More Lead{leadsNeeded !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

