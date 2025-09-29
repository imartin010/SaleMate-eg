import React from 'react';
import { BRDataProperty } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/format';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Home,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Bed,
  Bath,
  Square,
  Sparkles,
  Info,
  Image as ImageIcon,
} from 'lucide-react';

interface PropertyDetailsModalProps {
  property: BRDataProperty | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  if (!property) return null;

  // Helper function to parse JSON strings
  const parseJsonField = (field: unknown) => {
    if (typeof field === 'object' && field !== null) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field.replace(/'/g, '"'));
      } catch {
        return null;
      }
    }
    return null;
  };

  // Helper function to parse payment plans
  const parsePaymentPlans = (plans: string) => {
    try {
      if (!plans) return [];
      const cleaned = plans.replace(/'/g, '"').replace(/None/g, 'null');
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  };

  const compound = parseJsonField(property.compound);
  const area = parseJsonField(property.area);
  const developer = parseJsonField(property.developer);
  const phase = parseJsonField(property.phase);
  const propertyType = parseJsonField(property.property_type);
  const paymentPlans = parsePaymentPlans(property.payment_plans || '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Home className="h-6 w-6 text-primary" />
            Property Details - {property.unit_number || property.unit_id || 'N/A'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Image */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                {property.image ? (
                  <img
                    src={property.image}
                    alt={`Unit ${property.unit_number || property.unit_id}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                    <span className="sr-only">No image available</span>
                  </div>
                )}
              </div>

              {/* Key Highlights */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Key Highlights</h3>
                <div className="flex flex-wrap gap-2">
                  {property.is_launch && (
                    <Badge className="bg-orange-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Launch Property
                    </Badge>
                  )}
                  {property.offers && (
                    <Badge className="bg-green-500 text-white">
                      Special Offer
                    </Badge>
                  )}
                  {property.sale_type && (
                    <Badge variant="outline" className="capitalize">
                      {property.sale_type}
                    </Badge>
                  )}
                  {property.finishing && (
                    <Badge variant="secondary">
                      {property.finishing}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Basic Information
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit ID:</span>
                    <span className="font-medium">{property.unit_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Number:</span>
                    <span className="font-medium">{property.unit_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Building:</span>
                    <span className="font-medium">{property.building_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floor:</span>
                    <span className="font-medium">{property.floor_number ?? 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compound:</span>
                    <span className="font-medium">{compound?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area:</span>
                    <span className="font-medium">{area?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phase:</span>
                    <span className="font-medium">{phase?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Developer:</span>
                    <span className="font-medium">{developer?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Specifications
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      Unit Area:
                    </span>
                    <span className="font-medium">
                      {property.unit_area ? `${formatNumber(property.unit_area)} m²` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      Garden Area:
                    </span>
                    <span className="font-medium">
                      {property.garden_area ? `${formatNumber(property.garden_area)} m²` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      Roof Area:
                    </span>
                    <span className="font-medium">
                      {property.roof_area ? `${formatNumber(property.roof_area)} m²` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Bed className="h-4 w-4" />
                      Bedrooms:
                    </span>
                    <span className="font-medium">{property.number_of_bedrooms ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Bath className="h-4 w-4" />
                      Bathrooms:
                    </span>
                    <span className="font-medium">{property.number_of_bathrooms ?? 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Pricing
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-bold text-lg text-primary">
                      {property.price_in_egp ? 
                        formatCurrency(property.price_in_egp, property.currency || 'EGP') : 
                        'On Request'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per m²:</span>
                    <span className="font-medium">
                      {property.price_per_meter ? 
                        formatCurrency(property.price_per_meter, property.currency || 'EGP') : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Type:</span>
                    <span className="font-medium">{propertyType?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currency:</span>
                    <span className="font-medium">{property.currency || 'EGP'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Timeline
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ready By:</span>
                  <span className="font-medium">
                    {property.ready_by ? 
                      new Date(property.ready_by).toLocaleDateString() : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {property.last_inventory_update ? 
                      new Date(property.last_inventory_update).toLocaleDateString() : 
                      'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Plans */}
            {paymentPlans.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payment Plans ({paymentPlans.length} options)
                </h3>
                
                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                  {paymentPlans.slice(0, 5).map((plan: Record<string, unknown>, index: number) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Years:</span>
                          <div className="font-medium">{String(plan.years) || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Down Payment:</span>
                          <div className="font-medium">{plan.down_payment ? `${String(plan.down_payment)}%` : 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Down Amount:</span>
                          <div className="font-medium">
                            {plan.down_payment_value ? 
                              formatCurrency(Number(plan.down_payment_value), property.currency || 'EGP') : 
                              'N/A'
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Installment:</span>
                          <div className="font-medium">
                            {plan.equal_installments_value ? 
                              formatCurrency(Number(plan.equal_installments_value), property.currency || 'EGP') : 
                              'N/A'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {paymentPlans.length > 5 && (
                    <div className="text-center text-gray-600 text-sm">
                      ... and {paymentPlans.length - 5} more payment plans
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information */}
            {property.offers && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Special Offers
                </h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">{property.offers}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
