import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { 
  Zap, 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle, 
  Star,
  ArrowRight,
  DollarSign,
  Shield,
  Clock,
  Target,
  CreditCard,
  Smartphone,
  Globe,
  Award,
  BarChart3,
  MessageCircle,
  ShoppingCart,
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
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    quantity: 1,
    paymentMethod: 'card',
    buyerName: '',
    buyerEmail: '',
    buyerPhone: ''
  });

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

  const openPurchaseDialog = (project: any) => {
    setSelectedProject(project);
    setShowPurchaseDialog(true);
  };

  const handlePurchase = async () => {
    // This is where Paymob integration will go
    console.log('Purchase with Paymob:', {
      project: selectedProject,
      form: purchaseForm,
      total: selectedProject.pricePerLead * purchaseForm.quantity
    });
    alert(`Paymob payment integration will be configured here!\n\nOrder Details:\nProject: ${selectedProject.name}\nQuantity: ${purchaseForm.quantity} leads\nTotal: EGP ${selectedProject.pricePerLead * purchaseForm.quantity}`);
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
              <Button size="sm">
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
              <Input
                placeholder="Search projects by name, developer, or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
                    onClick={() => openPurchaseDialog(project)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase Leads
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase Dialog with Paymob Integration */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchase Leads
            </DialogTitle>
            <DialogDescription>
              {selectedProject?.name} - {selectedProject?.developer}
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-900">Available Leads</span>
                  <span className="text-lg font-bold text-blue-600">{selectedProject.availableLeads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Price per lead</span>
                  <span className="text-sm font-bold text-blue-800">EGP {selectedProject.pricePerLead}</span>
                </div>
              </div>

              {/* Buyer Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Buyer Information</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <Input
                      placeholder="Your name"
                      value={purchaseForm.buyerName}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, buyerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input
                      placeholder="+20 1XX XXX XXXX"
                      value={purchaseForm.buyerPhone}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, buyerPhone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={purchaseForm.buyerEmail}
                    onChange={(e) => setPurchaseForm(prev => ({ ...prev, buyerEmail: e.target.value }))}
                  />
                </div>
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Leads (1 - {selectedProject.availableLeads})
                </label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProject.availableLeads}
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm(prev => ({ 
                    ...prev, 
                    quantity: Math.min(parseInt(e.target.value) || 1, selectedProject.availableLeads)
                  }))}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-gray-900">Order Summary</h4>
                <div className="flex justify-between text-sm">
                  <span>Project:</span>
                  <span className="font-medium">{selectedProject.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quantity:</span>
                  <span className="font-medium">{purchaseForm.quantity} leads</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price per lead:</span>
                  <span className="font-medium">EGP {selectedProject.pricePerLead}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-lg text-green-600">
                    EGP {(selectedProject.pricePerLead * purchaseForm.quantity).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Button - Paymob Integration Point */}
              <div className="space-y-3">
                <Button 
                  onClick={handlePurchase}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg font-semibold"
                  disabled={!purchaseForm.buyerName || !purchaseForm.buyerEmail || !purchaseForm.buyerPhone}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay EGP {(selectedProject.pricePerLead * purchaseForm.quantity).toLocaleString()}
                </Button>
                
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Instant Delivery</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Leads will be delivered instantly to your email</p>
                <p>• All sales are final - no refunds</p>
                <p>• Contact support for any issues</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
};
