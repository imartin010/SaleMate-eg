import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
// import { Separator } from '../../components/ui/separator';
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  Building,
  User,
  CreditCard as PaymentIcon,
  Smartphone,
  Globe
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  developer: string;
  region: string;
  availableLeads: number;
  pricePerLead: number;
  image: string;
  rating: number;
  totalSold: number;
}

interface CheckoutData {
  project: Project;
  quantity: number;
  totalPrice: number;
  buyerInfo: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paymob');
  
  // Get project data from URL params or use mock data
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    project: {
      id: searchParams.get('projectId') || '1',
      name: searchParams.get('projectName') || 'New Capital City',
      developer: searchParams.get('developer') || 'Talaat Moustafa Group',
      region: searchParams.get('region') || 'New Administrative Capital',
      availableLeads: parseInt(searchParams.get('availableLeads') || '150'),
      pricePerLead: parseInt(searchParams.get('pricePerLead') || '25'),
      image: searchParams.get('image') || '/api/placeholder/400/300',
      rating: 4.8,
      totalSold: 1250
    },
    quantity: parseInt(searchParams.get('quantity') || '1'),
    totalPrice: parseInt(searchParams.get('totalPrice') || '25'),
    buyerInfo: {
      name: '',
      email: '',
      phone: '',
      company: ''
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setCheckoutData(prev => ({
      ...prev,
      buyerInfo: {
        ...prev.buyerInfo,
        [field]: value
      }
    }));
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handleProceedToPayment = () => {
    if (currentStep === 1) {
      // Validate buyer information
      if (!checkoutData.buyerInfo.name || !checkoutData.buyerInfo.email || !checkoutData.buyerInfo.phone) {
        alert('Please fill in all required fields');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Here you would integrate with Paymob
    console.log('Processing payment with Paymob:', {
      amount: checkoutData.totalPrice,
      currency: 'EGP',
      paymentMethod,
      buyerInfo: checkoutData.buyerInfo,
      project: checkoutData.project
    });
    
    // Simulate successful payment
    setIsProcessing(false);
    setCurrentStep(4);
  };

  const steps = [
    { number: 1, title: 'Buyer Information', description: 'Enter your details' },
    { number: 2, title: 'Payment Method', description: 'Choose payment option' },
    { number: 3, title: 'Payment', description: 'Complete your purchase' },
    { number: 4, title: 'Confirmation', description: 'Order confirmed' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      currentStep >= step.number 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > step.number ? <CheckCircle className="h-4 w-4" /> : step.number}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Buyer Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Buyer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={checkoutData.buyerInfo.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={checkoutData.buyerInfo.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={checkoutData.buyerInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+20 100 XXX XXXX"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={checkoutData.buyerInfo.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Enter your company name"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Why do we need this information?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• To deliver leads directly to your account</li>
                      <li>• To send order confirmations and receipts</li>
                      <li>• To provide customer support when needed</li>
                      <li>• To comply with Egyptian business regulations</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PaymentIcon className="h-5 w-5 mr-2" />
                    Choose Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'paymob'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentMethodChange('paymob')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Paymob</h3>
                          <p className="text-sm text-gray-600">Credit/Debit Cards, Fawry, Valu</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'instapay'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentMethodChange('instapay')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Instapay</h3>
                          <p className="text-sm text-gray-600">Mobile wallet payment</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentMethodChange('bank_transfer')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Bank Transfer</h3>
                          <p className="text-sm text-gray-600">Direct bank transfer</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'cash_on_delivery'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentMethodChange('cash_on_delivery')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Cash on Delivery</h3>
                          <p className="text-sm text-gray-600">Pay when leads are delivered</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Secure Payment</h4>
                    <p className="text-sm text-green-800">
                      All payments are processed securely through certified payment gateways. 
                      Your financial information is encrypted and protected.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment Processing */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Complete Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Pay</h3>
                    <p className="text-gray-600 mb-6">
                      You will be redirected to {paymentMethod === 'paymob' ? 'Paymob' : 'Instapay'} to complete your payment securely.
                    </p>
                    
                    <Button 
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full max-w-md"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay {checkoutData.totalPrice} EGP
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Payment Successful!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Order Confirmed</h3>
                    <p className="text-gray-600 mb-6">
                      Your leads have been delivered to your account. Check your CRM to access them.
                    </p>
                    
                    <div className="space-y-4">
                      <Button 
                        onClick={() => navigate('/app/crm')}
                        className="w-full max-w-md"
                        size="lg"
                      >
                        View Leads in CRM
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/app/shop')}
                        className="w-full max-w-md"
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate(-1)}
                >
                  {currentStep > 1 ? 'Previous' : 'Back to Shop'}
                </Button>
                <Button
                  onClick={handleProceedToPayment}
                  disabled={currentStep === 1 && (!checkoutData.buyerInfo.name || !checkoutData.buyerInfo.email || !checkoutData.buyerInfo.phone)}
                >
                  {currentStep === 1 ? 'Continue to Payment' : 
                   currentStep === 2 ? 'Proceed to Payment' : 
                   'Complete Order'}
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Info */}
                <div className="flex space-x-4">
                  <img
                    src={checkoutData.project.image}
                    alt={checkoutData.project.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{checkoutData.project.name}</h3>
                    <p className="text-xs text-gray-600">{checkoutData.project.developer}</p>
                    <p className="text-xs text-gray-500">{checkoutData.project.region}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4" />

                {/* Order Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span>{checkoutData.quantity} leads</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price per lead:</span>
                    <span>{checkoutData.project.pricePerLead} EGP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{checkoutData.quantity * checkoutData.project.pricePerLead} EGP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (14%):</span>
                    <span>{Math.round(checkoutData.quantity * checkoutData.project.pricePerLead * 0.14)} EGP</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4" />

                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{checkoutData.totalPrice} EGP</span>
                </div>

                {/* Security Badges */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Shield className="h-3 w-3" />
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Instant Delivery</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
