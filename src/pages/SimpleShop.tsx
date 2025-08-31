import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ShoppingCart, Building, MapPin, Star } from 'lucide-react';

const mockProjects = [
  {
    id: '1',
    name: 'New Capital Towers',
    developer: 'Capital Group',
    region: 'New Cairo',
    availableLeads: 150,
    pricePerLead: 120
  },
  {
    id: '2',
    name: 'Marina Heights',
    developer: 'Marina Developments',
    region: 'North Coast',
    availableLeads: 200,
    pricePerLead: 150
  },
  {
    id: '3',
    name: 'Garden City Residences',
    developer: 'Green Developments',
    region: 'Sheikh Zayed',
    availableLeads: 100,
    pricePerLead: 100
  }
];

export const SimpleShop: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient mb-2">Leads Shop</h1>
        <p className="text-muted-foreground">Purchase high-quality leads from premium projects</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map(project => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                {project.developer}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {project.region}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    EGP {project.pricePerLead}
                  </div>
                  <div className="text-xs text-blue-600">Per Lead</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {project.availableLeads}
                  </div>
                  <div className="text-xs text-green-600">Available</div>
                </div>
              </div>

              <Button className="w-full" onClick={() => alert('Purchase functionality temporarily disabled for testing')}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Leads
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          🔧 Simple Shop Mode: Database queries disabled for stability testing
        </p>
      </div>
    </div>
  );
};
