import React from 'react';
import { Button } from '../components/ui/button';
import {Building} from 'lucide-react';


export const SimpleShop: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient mb-2">Leads Shop</h1>
        <p className="text-muted-foreground">Purchase high-quality leads from premium projects</p>
      </div>

      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Lead Packages Available</h3>
        <p className="text-muted-foreground mb-4">
          There are currently no lead packages available for purchase. Please check back later or contact support for assistance.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline">
            Contact Support
          </Button>
          <Button variant="outline">
            Check Back Later
          </Button>
        </div>
      </div>

      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          🔧 Simple Shop Mode: Sample data has been removed for production use
        </p>
      </div>
    </div>
  );
};
