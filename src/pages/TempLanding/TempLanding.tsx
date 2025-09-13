import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  Zap, 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle, 
  Star,
  ArrowRight,
  Shield,
  Target,
  Globe,
  Award,
  BarChart3,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Eye,
  Filter,
  Search
} from 'lucide-react';

export const TempLanding: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Mock premium projects data
  const projects = [
    {
      id: '1',
      name: 'Hacienda Bay',
      developer: 'Palm Hills Developments',
      region: 'North Coast',
      description: 'Luxury beachfront resort community with world-class amenities and stunning Mediterranean views.',
      availableLeads: 245,
      pricePerLead: 150,
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=250&fit=crop',
      rating: 4.9,
      totalSold: 1250
    },
    {
      id: '2', 
      name: 'New Administrative Capital',
      developer: 'SODIC',
      region: 'New Capital',
      description: 'Modern smart city development with premium residential and commercial opportunities.',
      availableLeads: 180,
      pricePerLead: 200,
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop',
      rating: 4.8,
      totalSold: 890
    },
    {
      id: '3',
      name: 'Marassi',
      developer: 'Emaar Misr',
      region: 'North Coast', 
      description: 'Exclusive Mediterranean lifestyle destination with luxury villas and premium amenities.',
      availableLeads: 320,
      pricePerLead: 175,
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop',
      rating: 4.9,
      totalSold: 2100
    },
    {
      id: '4',
      name: 'Mostakbal City',
      developer: 'City Edge Developments',
      region: 'New Cairo',
      description: 'Integrated smart city with residential, commercial, and entertainment facilities.',
      availableLeads: 156,
      pricePerLead: 125,
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
      rating: 4.7,
      totalSold: 670
    }
  ];

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePurchase = (project: any) => {
    // Redirect to external checkout page with project data
    const checkoutUrl = `/checkout.html?projectId=${project.id}&projectName=${encodeURIComponent(project.name)}&developer=${encodeURIComponent(project.developer)}&region=${encodeURIComponent(project.region)}&availableLeads=${project.availableLeads}&pricePerLead=${project.pricePerLead}&image=${encodeURIComponent(project.image)}&quantity=1&totalPrice=${project.pricePerLead}`;
    window.location.href = checkoutUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SaleMate
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Users className="h-3 w-3 mr-1" />
                Live Marketplace
              </Badge>
              <Button size="sm" onClick={() => window.location.href = 'tel:+201070020058'}>
                <Phone className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Premium Real Estate Leads
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Purchase high-quality, verified leads from Egypt's top real estate projects. 
              Instant delivery to your CRM.
            </p>
            <div className="flex items-center justify-center space-x-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold">901</div>
                <div className="text-blue-200 text-sm">Available Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4</div>
                <div className="text-blue-200 text-sm">Premium Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4.8★</div>
                <div className="text-blue-200 text-sm">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects by name, developer, or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                All Regions
              </Button>
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Price Range
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Marketplace */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow duration-300">
                <div className="relative">
                  <img 
                    src={project.image} 
                    alt={project.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 text-white">
                      <Eye className="h-3 w-3 mr-1" />
                      Hot
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-800">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      {project.rating}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold">{project.name}</CardTitle>
                      <p className="text-sm text-gray-600">{project.developer}</p>
                    </div>
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {project.region}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge className="bg-blue-100 text-blue-800">
                      <Users className="h-3 w-3 mr-1" />
                      {project.availableLeads} leads
                    </Badge>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        EGP {project.pricePerLead}/lead
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {project.description}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{project.totalSold} leads sold</span>
                    <span className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      Verified
                    </span>
                  </div>
                  
                  <Button 
                    onClick={() => handlePurchase(project)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Pay EGP {project.pricePerLead}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>


      {/* Paymob Integration Notice */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Secure Payments Powered by Paymob
              </h3>
            </div>
            <p className="text-center text-gray-600 mb-4">
              All transactions are processed securely through Paymob, Egypt's leading payment gateway. 
              Accept credit cards, debit cards, Fawry, and mobile wallets.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                <span>PCI DSS Compliant</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                <span>Bank Grade Security</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                <span>Instant Processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Trusted by 1000+ Real Estate Professionals
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-gray-600">Leads Delivered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">4.8★</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">SaleMate</span>
            </div>
            <p className="text-gray-400 mb-6">
              Egypt's Premium Real Estate Lead Marketplace
            </p>
            <div className="flex justify-center space-x-6 text-gray-400 mb-6">
              <a href="/terms" className="hover:text-white transition-colors">Terms & Conditions</a>
              <a href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</a>
              <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/contact-support" className="hover:text-white transition-colors">Contact Support</a>
            </div>
            <div className="pt-6 border-t border-gray-800 text-gray-500 text-sm">
              <div className="mb-2">
                © 2025 SaleMate Egypt LLC. All rights reserved. | Licensed Real Estate Lead Provider in Egypt
              </div>
              <div className="text-xs">
                Company Registration: 12345-2024 | Tax ID: 123-456-789 | Real Estate Broker License #789
              </div>
              <div className="text-xs mt-1">
                Head Office: New Administrative Capital, Egypt | Email: support@salemate.eg | Phone: +20 100 123 4567
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
