import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CreditCardMockup } from '../../components/checkout/CreditCardMockup';
// import { Separator } from '../../components/ui/separator';
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Clock, 
  Building,
  CreditCard as PaymentIcon,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

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
  const [paymentMethod, setPaymentMethod] = useState('instapay');
  const [imageError, setImageError] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Credit card form state
  const [cardDetails, setCardDetails] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });
  
  // Get project data from URL params or use mock data
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    project: {
      id: searchParams.get('projectId') || '1',
      name: searchParams.get('projectName') || 'New Capital City',
      developer: searchParams.get('developer') || 'Talaat Moustafa Group',
      region: searchParams.get('region') || 'New Administrative Capital',
      availableLeads: parseInt(searchParams.get('availableLeads') || '150'),
      pricePerLead: parseInt(searchParams.get('pricePerLead') || '25'),
      image: searchParams.get('image') || '/placeholder-project.svg',
      rating: 4.8,
      totalSold: 1250
    },
    quantity: Math.max(30, parseInt(searchParams.get('quantity') || '30')),
    totalPrice: (() => {
      const quantity = Math.max(30, parseInt(searchParams.get('quantity') || '30'));
      const pricePerLead = parseInt(searchParams.get('pricePerLead') || '25');
      const subtotal = quantity * pricePerLead;
      const vat = Math.round(subtotal * 0.14);
      return subtotal + vat;
    })(),
    buyerInfo: {
      name: '',
      email: '',
      phone: '',
      company: ''
    }
  });

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
        // Auto-fill buyer info from profile
        setCheckoutData(prev => ({
          ...prev,
          buyerInfo: {
            name: profile?.name || '',
            email: user?.email || '',
            phone: profile?.phone || '',
            company: profile?.company || ''
          }
        }));
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setCheckoutData(prev => ({
      ...prev,
      buyerInfo: {
        ...prev.buyerInfo,
        [field]: value
      }
    }));
  };

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    // Format card number with spaces
    if (field === 'number') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return; // Max 16 digits + 3 spaces
    }
    
    // Format expiry date as MM/YY
    if (field === 'expiry') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
      if (formattedValue.length > 5) return;
    }
    
    // Limit CVV to 3-4 digits
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) return;
    }
    
    // Card holder name to uppercase
    if (field === 'holder') {
      formattedValue = value.toUpperCase();
    }
    
    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setReceiptFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handleProceedToPayment = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handlePayment = async () => {
    // For InstaPay, require receipt upload
    if (paymentMethod === 'instapay' && !receiptFile) {
      alert('Please upload your InstaPay receipt to confirm payment');
      return;
    }

    setIsProcessing(true);
    setIsUploading(true);
    
    try {
      // Upload receipt to Supabase Storage if InstaPay
      if (paymentMethod === 'instapay' && receiptFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Clean filename - remove spaces and special characters
          const cleanFileName = receiptFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const timestamp = Date.now();
          // Structure: userId/receipt_timestamp_filename
          const filePath = `${user.id}/receipt_${timestamp}_${cleanFileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-receipts')
            .upload(filePath, receiptFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading receipt:', uploadError);
            alert(`Failed to upload receipt: ${uploadError.message}. Please try again.`);
            setIsProcessing(false);
            setIsUploading(false);
            return;
          }

          console.log('Receipt uploaded successfully:', uploadData);
        }
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would integrate with payment gateway or save order
      console.log('Processing payment:', {
        amount: checkoutData.totalPrice,
        currency: 'EGP',
        paymentMethod,
        buyerInfo: checkoutData.buyerInfo,
        project: checkoutData.project,
        receiptUploaded: !!receiptFile
      });
      
      // Success
      setIsProcessing(false);
      setIsUploading(false);
      setCurrentStep(3);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Payment Method', description: 'Choose payment option' },
    { number: 2, title: 'Payment', description: 'Complete your purchase' },
    { number: 3, title: 'Confirmation', description: 'Order confirmed' }
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

            {/* Step 1: Payment Method */}
            {currentStep === 1 && (
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
                        paymentMethod === 'instapay'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentMethodChange('instapay')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">InstaPay</h3>
                          <p className="text-sm text-gray-600">Instant mobile payment</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-4 border-2 rounded-lg cursor-not-allowed transition-all border-gray-200 bg-gray-100 opacity-60 relative"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-600">Debit/Credit Card</h3>
                            <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full border border-yellow-300">
                              Coming Soon
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* InstaPay Details */}
                  {paymentMethod === 'instapay' && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                      <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                        <Smartphone className="h-5 w-5 mr-2" />
                        InstaPay Payment Details
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600 mb-2">Click the link to send money:</p>
                          <a 
                            href="https://ipn.eg/S/imartin/instapay/1zMdPx" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 p-3 rounded-lg"
                          >
                            <span>Open InstaPay Payment Link</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600 mb-2">Or send directly to:</p>
                          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <span className="font-mono font-bold text-lg">imartin@instapay</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('imartin@instapay')}
                              className="ml-2"
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 text-center pt-2">
                          Powered by InstaPay
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Secure Payment
                    </h4>
                    <p className="text-sm text-blue-800">
                      All payments are processed securely through certified payment gateways. 
                      Your financial information is encrypted and protected.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment Processing */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Complete Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {paymentMethod === 'credit_card' ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-6 text-center">Enter Your Card Details</h3>
                      
                      {/* Credit Card Mockup */}
                      <CreditCardMockup
                        cardNumber={cardDetails.number}
                        cardHolder={cardDetails.holder}
                        expiryDate={cardDetails.expiry}
                        cvv={cardDetails.cvv}
                      />

                      {/* Card Form */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            value={cardDetails.number}
                            onChange={(e) => handleCardInputChange('number', e.target.value)}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="font-mono text-lg"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="cardHolder">Card Holder Name</Label>
                          <Input
                            id="cardHolder"
                            value={cardDetails.holder}
                            onChange={(e) => handleCardInputChange('holder', e.target.value)}
                            placeholder="JOHN DOE"
                            className="uppercase"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              value={cardDetails.expiry}
                              onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="font-mono"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              type="password"
                              value={cardDetails.cvv}
                              onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                              placeholder="123"
                              maxLength={4}
                              className="font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handlePayment}
                        disabled={isProcessing || !cardDetails.number || !cardDetails.holder || !cardDetails.expiry || !cardDetails.cvv}
                        className="w-full mt-6"
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
                  ) : (
                    <div className="py-6">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Smartphone className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Complete Your InstaPay Payment</h3>
                        <p className="text-gray-600">
                          After completing the payment via InstaPay, upload your receipt to confirm.
                        </p>
                      </div>

                      {/* Receipt Upload Section */}
                      <div className="max-w-md mx-auto mb-6">
                        <Label className="text-base font-semibold mb-3 block">
                          Upload Payment Receipt *
                        </Label>
                        
                        {!receiptPreview ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReceiptUpload}
                              className="hidden"
                              id="receipt-upload"
                            />
                            <label
                              htmlFor="receipt-upload"
                              className="cursor-pointer flex flex-col items-center"
                            >
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">
                                Click to upload receipt
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG or JPEG (max 5MB)
                              </p>
                            </label>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={receiptPreview}
                              alt="Receipt preview"
                              className="w-full rounded-lg border-2 border-green-500 shadow-lg"
                            />
                            <button
                              onClick={handleRemoveReceipt}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="mt-2 flex items-center justify-center text-sm text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Receipt uploaded successfully
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info Box */}
                      <div className="max-w-md mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">What happens next?</p>
                            <ul className="space-y-1 text-xs">
                              <li>• We will validate your payment receipt</li>
                              <li>• Leads will be delivered to your CRM ASAP</li>
                              <li>• You'll receive email confirmation</li>
                              <li>• Usually takes 5-15 minutes</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="max-w-md mx-auto">
                        <Button 
                          onClick={handlePayment}
                          disabled={isProcessing || !receiptFile}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          {isProcessing ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              {isUploading ? 'Uploading Receipt...' : 'Confirming Payment...'}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm Payment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {paymentMethod === 'instapay' ? 'Receipt Uploaded!' : 'Payment Successful!'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    
                    {paymentMethod === 'instapay' ? (
                      <>
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">
                          Thank You for Your Purchase!
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Your payment receipt has been received successfully.
                        </p>

                        {/* Validation Process Box */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 max-w-lg mx-auto mb-6">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4 text-left">
                              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                                What happens next?
                              </h4>
                              <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-start">
                                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                  <span>We will validate your payment receipt</span>
                                </li>
                                <li className="flex items-start">
                                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                  <span>Leads will be delivered to your CRM ASAP</span>
                                </li>
                                <li className="flex items-start">
                                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                  <span>You'll receive email confirmation</span>
                                </li>
                                <li className="flex items-start">
                                  <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="font-semibold">Processing time: 5-15 minutes</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> You'll receive a notification once your leads are available in your CRM.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold mb-2">Order Confirmed</h3>
                        <p className="text-gray-600 mb-6">
                          Your leads have been delivered to your account. Check your CRM to access them.
                        </p>
                      </>
                    )}
                    
                    <div className="space-y-4">
                      <Button 
                        onClick={() => navigate('/app/crm')}
                        className="w-full max-w-md bg-[#257CFF] hover:bg-[#1a5fd4]"
                        size="lg"
                      >
                        Go to CRM
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
            {currentStep < 3 && (
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Back to Shop
                </Button>
                {currentStep === 1 && (
                  <Button onClick={handleProceedToPayment}>
                    Proceed to Payment
                  </Button>
                )}
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
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {!imageError ? (
                      <img
                        src={checkoutData.project.image}
                        alt={checkoutData.project.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <Building className="h-8 w-8 text-blue-600" />
                      </div>
                    )}
                  </div>
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
                  <span>{checkoutData.quantity * checkoutData.project.pricePerLead + Math.round(checkoutData.quantity * checkoutData.project.pricePerLead * 0.14)} EGP</span>
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
