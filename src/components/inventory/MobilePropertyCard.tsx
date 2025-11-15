import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRDataProperty } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/format';
import {
  Bed,
  Bath,
  MapPin,
  Building,
  DollarSign,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
  Palette,
  Armchair,
  PieChart,
  Waves,
  Construction,
  Home,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';

interface MobilePropertyCardProps {
  property: BRDataProperty;
  onViewDetails: (property: BRDataProperty) => void;
  index: number;
}

export const MobilePropertyCard: React.FC<MobilePropertyCardProps> = ({
  property,
  onViewDetails,
  index,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract compound name
  const getCompoundName = () => {
    const compound = property.compound as Record<string, unknown>;
    if (compound?.name) return compound.name;
    if (typeof property.compound === 'string') {
      try {
        const parsed = JSON.parse((property.compound as string).replace(/'/g, '"'));
        return parsed.name || '-';
      } catch {
        return property.compound;
      }
    }
    return '-';
  };

  // Extract area name
  const getAreaName = () => {
    const area = property.area as Record<string, unknown>;
    if (area?.name) return area.name;
    if (typeof property.area === 'string') {
      try {
        const parsed = JSON.parse((property.area as string).replace(/'/g, '"'));
        return parsed.name || '-';
      } catch {
        return property.area;
      }
    }
    return '-';
  };

  // Extract developer name
  const getDeveloperName = () => {
    const developer = property.developer as Record<string, unknown>;
    if (developer?.name) return developer.name;
    if (typeof property.developer === 'string') {
      try {
        const parsed = JSON.parse((property.developer as string).replace(/'/g, '"'));
        return parsed.name || '-';
      } catch {
        return property.developer;
      }
    }
    return '-';
  };

  // Extract property type
  const getPropertyType = () => {
    const propertyType = property.property_type as Record<string, unknown>;
    if (propertyType?.name) return propertyType.name;
    if (typeof property.property_type === 'string') {
      try {
        const parsed = JSON.parse((property.property_type as string).replace(/'/g, '"'));
        return parsed.name;
      } catch {
        return property.property_type;
      }
    }
    return null;
  };

  const compoundName = getCompoundName();
  const areaName = getAreaName();
  const developerName = getDeveloperName();
  const propertyType = getPropertyType();
  const price = property.price_in_egp
    ? formatCurrency(property.price_in_egp, property.currency || 'EGP')
    : 'On Request';
  const pricePerMeter = property.price_per_meter
    ? formatCurrency(property.price_per_meter, property.currency || 'EGP')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -100 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Hero Image Section */}
        <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-teal-100 via-blue-100 to-purple-100">
          {property.image ? (
            <img
              src={property.image}
              alt={`${compoundName} - ${property.unit_number || property.unit_id}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-20 w-20 text-teal-300" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Price Badge - Floating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 right-4"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-xl">
              <div className="text-xs text-gray-600 font-medium mb-0.5">Price</div>
              <div className="text-lg font-bold text-teal-700">{price}</div>
            </div>
          </motion.div>

          {/* Status Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {property.is_launch && (
              <Badge className="bg-orange-500 text-white border-0 shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Launch
              </Badge>
            )}
            {property.offers && (
              <Badge className="bg-green-500 text-white border-0 shadow-lg">
                Offer
              </Badge>
            )}
          </div>

          {/* Expand/Collapse Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute bottom-4 right-4 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="up"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                >
                  <ChevronUp className="h-5 w-5 text-teal-600" />
                </motion.div>
              ) : (
                <motion.div
                  key="down"
                  initial={{ rotate: 180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -180, opacity: 0 }}
                >
                  <ChevronDown className="h-5 w-5 text-teal-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Main Content */}
        <div className="p-5 space-y-4">
          {/* Title Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {compoundName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-teal-600" />
              <span>{areaName}</span>
            </div>
          </div>

          {/* Key Stats - Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-teal-50 rounded-xl p-3 text-center">
              <Bed className="h-5 w-5 text-teal-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {property.number_of_bedrooms ?? '-'}
              </div>
              <div className="text-xs text-gray-600">Bedrooms</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <Bath className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {property.number_of_bathrooms ?? '-'}
              </div>
              <div className="text-xs text-gray-600">Bathrooms</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <Maximize2 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {property.unit_area ? formatNumber(property.unit_area) : '-'}
              </div>
              <div className="text-xs text-gray-600">m²</div>
            </div>
          </div>

          {/* Quick Info Row */}
          <div className="flex flex-wrap gap-2">
            {propertyType && (
              <Badge variant="secondary" className="text-xs">
                {propertyType}
              </Badge>
            )}
            {property.finishing && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs flex items-center gap-1',
                  property.finishing.toLowerCase() === 'finished'
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : property.finishing.toLowerCase() === 'furnished'
                    ? 'border-purple-500 text-purple-700 bg-purple-50'
                    : property.finishing.toLowerCase() === 'semi finished' ||
                      property.finishing.toLowerCase() === 'semi-finished' ||
                      property.finishing.toLowerCase() === 'semi_finished'
                    ? 'border-orange-500 text-orange-700 bg-orange-50'
                    : property.finishing.toLowerCase() === 'flexi finished' ||
                      property.finishing.toLowerCase() === 'flexi_finished'
                    ? 'border-blue-500 text-blue-700 bg-blue-50'
                    : property.finishing.toLowerCase() === 'not finished' ||
                      property.finishing.toLowerCase() === 'not_finished'
                    ? 'border-red-500 text-red-700 bg-red-50'
                    : ''
                )}
              >
                {property.finishing.toLowerCase() === 'finished' && (
                  <Palette className="h-3 w-3" />
                )}
                {property.finishing.toLowerCase() === 'furnished' && (
                  <Armchair className="h-3 w-3" />
                )}
                {(property.finishing.toLowerCase() === 'semi finished' ||
                  property.finishing.toLowerCase() === 'semi-finished' ||
                  property.finishing.toLowerCase() === 'semi_finished') && (
                  <PieChart className="h-3 w-3" />
                )}
                {(property.finishing.toLowerCase() === 'flexi finished' ||
                  property.finishing.toLowerCase() === 'flexi_finished') && (
                  <Waves className="h-3 w-3" />
                )}
                {(property.finishing.toLowerCase() === 'not finished' ||
                  property.finishing.toLowerCase() === 'not_finished') && (
                  <Construction className="h-3 w-3" />
                )}
                {property.finishing}
              </Badge>
            )}
            {property.sale_type && (
              <Badge variant="outline" className="text-xs">
                {property.sale_type}
              </Badge>
            )}
          </div>

          {/* Expandable Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  {/* Developer */}
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Developer</div>
                      <div className="text-sm font-medium text-gray-900">
                        {developerName}
                      </div>
                    </div>
                  </div>

                  {/* Unit Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Unit</div>
                      <div className="text-sm font-medium text-gray-900">
                        {property.unit_number || property.unit_id || 'N/A'}
                      </div>
                    </div>
                    {property.building_number && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Building</div>
                        <div className="text-sm font-medium text-gray-900">
                          {property.building_number}
                        </div>
                      </div>
                    )}
                    {property.floor_number !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Floor</div>
                        <div className="text-sm font-medium text-gray-900">
                          {property.floor_number}
                        </div>
                      </div>
                    )}
                    {pricePerMeter && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Price/m²</div>
                        <div className="text-sm font-medium text-gray-900">
                          {pricePerMeter}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ready By */}
                  {property.ready_by && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Ready By</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(property.ready_by).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <Button
            onClick={() => onViewDetails(property)}
            className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold rounded-xl shadow-lg"
            size="lg"
          >
            <Eye className="h-5 w-5 mr-2" />
            View Full Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

