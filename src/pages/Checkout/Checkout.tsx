import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { CreditCardMockup } from '../../components/checkout/CreditCardMockup';
import { useCartStore, MINIMUM_LEADS } from '../../store/cart';
import { useWallet } from '../../contexts/WalletContext';
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
  X,
  Wallet,
  Landmark,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface BuyerInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalLeads, totalPrice, canCheckout, clearCart } = useCartStore();
  const { balance, refreshBalance } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
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

  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  // Redirect if cart is empty or doesn't meet minimum
  useEffect(() => {
    if (items.length === 0) {
      navigate('/app/shop');
      return;
    }
    if (!canCheckout()) {
      navigate('/app/shop');
    }
  }, [items, canCheckout, navigate]);

  const subtotal = totalPrice;
  const vat = Math.round(subtotal * 0.14);
  const grandTotal = subtotal + vat;
  const hasEnoughWalletBalance = balance >= grandTotal;

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
        setBuyerInfo({
          name: profile?.name || '',
          email: user?.email || '',
          phone: profile?.phone || '',
          company: profile?.company || ''
        });
      }
      refreshBalance();
    };
    
    fetchUserProfile();
  }, [refreshBalance]);

  const handleInputChange = (field: keyof BuyerInfo, value: string) => {
    setBuyerInfo(prev => ({
      ...prev,
      [field]: value
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
    // Validate minimum leads
    if (!canCheckout()) {
      alert(`Minimum order is ${MINIMUM_LEADS} leads. You have ${totalLeads} leads selected.`);
      return;
    }

    // For InstaPay and Bank Transfer, require receipt upload
    if ((paymentMethod === 'instapay' || paymentMethod === 'bank_transfer') && !receiptFile) {
      alert('Please upload your payment receipt to confirm payment');
      return;
    }

    // For Wallet, check balance
    if (paymentMethod === 'wallet' && !hasEnoughWalletBalance) {
      alert(`Insufficient wallet balance. You need EGP ${(grandTotal - balance).toFixed(0)} more.`);
      return;
    }

    setIsProcessing(true);
    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to complete your purchase');
        setIsProcessing(false);
        setIsUploading(false);
        return;
      }

      let receiptPath = '';
      
      // Upload receipt to Supabase Storage if InstaPay or Bank Transfer
      if ((paymentMethod === 'instapay' || paymentMethod === 'bank_transfer') && receiptFile) {
        // Get file extension
        const fileExtension = receiptFile.name.split('.').pop() || 'png';
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        
        // Create a completely clean filename: userId/timestamp_random.ext
        const filePath = `${user.id}/receipt_${timestamp}_${randomString}.${fileExtension}`;
        receiptPath = filePath;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-receipts')
          .upload(filePath, receiptFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: receiptFile.type
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

      // Process payment based on method
      if (paymentMethod === 'wallet') {
        // Deduct from wallet using the wallet context
        // This would need to be implemented in the wallet context
        // For now, we'll create purchase requests for each project
      } else if (paymentMethod === 'kashier') {
        // Redirect to Kashier payment gateway
        // This would integrate with Kashier API
        // For now, we'll create purchase requests
      }

      // Create purchase requests for each project
      const fileName = receiptPath ? receiptPath.split('/').pop() || receiptFile?.name || '' : '';
      const paymentMethodName = paymentMethod === 'instapay' ? 'Instapay' : 
                                 paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                                 paymentMethod === 'kashier' ? 'Kashier' : 'Wallet';

      // Create purchase requests for all projects
      const purchaseRequests = items.map(item => ({
        user_id: user.id,
        project_id: item.projectId,
        project_name: item.projectName,
        quantity: item.quantity,
        total_amount: item.quantity * item.pricePerLead,
        receipt_url: receiptPath || null,
        receipt_file_name: fileName || null,
        payment_method: paymentMethodName,
        status: paymentMethod === 'wallet' ? 'confirmed' : 'pending'
      }));

      const { error: requestError } = await supabase
        .from('purchase_requests')
        .insert(purchaseRequests);

      if (requestError) {
        console.error('Error creating purchase requests:', requestError);
        alert('Failed to create purchase requests. Please contact support.');
        setIsProcessing(false);
        setIsUploading(false);
        return;
      }

      // If wallet payment, process wallet deduction
      if (paymentMethod === 'wallet') {
        // Call wallet deduction function
        // This would need to be implemented
        console.log('Processing wallet payment...');
      }

      console.log('Purchase requests created successfully');
      
      // Clear cart on success
      clearCart();
      
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
                    {/* Wallet Payment */}
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'wallet'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!hasEnoughWalletBalance ? 'opacity-60' : ''}`}
                      onClick={() => hasEnoughWalletBalance && handlePaymentMethodChange('wallet')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'wallet' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Wallet className={`h-5 w-5 ${paymentMethod === 'wallet' ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Wallet</h3>
                          <p className="text-sm text-gray-600">
                            Balance: EGP {balance.toFixed(0)}
                            {!hasEnoughWalletBalance && (
                              <span className="text-red-600 ml-1">(Insufficient)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Kashier Payment */}
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'kashier'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentMethodChange('kashier')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'kashier' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <CreditCard className={`h-5 w-5 ${paymentMethod === 'kashier' ? 'text-purple-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">Kashier</h3>
                          <p className="text-sm text-gray-600">Credit/Debit Card</p>
                        </div>
                      </div>
                    </div>

                    {/* InstaPay Payment */}
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'instapay'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentMethodChange('instapay')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'instapay' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Smartphone className={`h-5 w-5 ${paymentMethod === 'instapay' ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">InstaPay</h3>
                          <p className="text-sm text-gray-600">Instant mobile payment</p>
                        </div>
                      </div>
                    </div>

                    {/* Bank Transfer */}
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentMethodChange('bank_transfer')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'bank_transfer' ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          <Landmark className={`h-5 w-5 ${paymentMethod === 'bank_transfer' ? 'text-orange-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">Bank Transfer</h3>
                          <p className="text-sm text-gray-600">Direct bank transfer</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Payment Details */}
                  {paymentMethod === 'wallet' && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                        <Wallet className="h-5 w-5 mr-2" />
                        Wallet Payment
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Current Balance:</span>
                            <span className="font-bold text-lg text-blue-600">EGP {balance.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Amount:</span>
                            <span className="font-bold text-lg text-gray-900">EGP {grandTotal.toFixed(0)}</span>
                          </div>
                          {!hasEnoughWalletBalance && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Insufficient balance. You need EGP {(grandTotal - balance).toFixed(0)} more.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kashier Payment Details */}
                  {paymentMethod === 'kashier' && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border-2 border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-4 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Kashier Payment Gateway
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600 mb-4">
                            You will be redirected to Kashier's secure payment page to complete your transaction.
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Shield className="h-4 w-4" />
                            <span>Secure payment processing by Kashier</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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

                  {/* Bank Transfer Details */}
                  {paymentMethod === 'bank_transfer' && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border-2 border-orange-200">
                      <h4 className="font-semibold text-orange-900 mb-4 flex items-center">
                        <Landmark className="h-5 w-5 mr-2" />
                        Bank Transfer Details
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Bank Name:</p>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <span className="font-mono font-bold">CIB Bank</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard('CIB Bank')}
                              >
                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Account Number:</p>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <span className="font-mono font-bold text-lg">1000123456789</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard('1000123456789')}
                              >
                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Account Name:</p>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <span className="font-semibold">SaleMate</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard('SaleMate')}
                              >
                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-800">
                              <strong>Important:</strong> After transferring, please upload your receipt to confirm payment.
                            </p>
                          </div>
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
                  {/* Wallet Payment */}
                  {paymentMethod === 'wallet' && (
                    <div className="py-6">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Wallet className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Pay with Wallet</h3>
                        <p className="text-gray-600">
                          Your wallet balance will be deducted to complete this purchase.
                        </p>
                      </div>

                      <div className="max-w-md mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Wallet Balance:</span>
                            <span className="font-bold text-lg text-blue-600">EGP {balance.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-bold text-lg text-gray-900">EGP {grandTotal.toFixed(0)}</span>
                          </div>
                          <div className="border-t border-blue-200 pt-3 mt-3">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Remaining Balance:</span>
                              <span className={`font-bold text-lg ${hasEnoughWalletBalance ? 'text-green-600' : 'text-red-600'}`}>
                                EGP {(balance - grandTotal).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="max-w-md mx-auto">
                        <Button 
                          onClick={handlePayment}
                          disabled={isProcessing || !hasEnoughWalletBalance}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          {isProcessing ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <Wallet className="h-4 w-4 mr-2" />
                              Pay EGP {grandTotal.toFixed(0)} from Wallet
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Kashier Payment */}
                  {paymentMethod === 'kashier' && (
                    <div className="py-6">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Pay with Kashier</h3>
                        <p className="text-gray-600">
                          You will be redirected to Kashier's secure payment page.
                        </p>
                      </div>

                      <div className="max-w-md mx-auto mb-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-4">
                            Total Amount: <span className="font-bold text-lg text-purple-600">EGP {grandTotal.toFixed(0)}</span>
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
                            <Shield className="h-4 w-4" />
                            <span>Secure payment processing by Kashier</span>
                          </div>
                        </div>
                      </div>

                      <div className="max-w-md mx-auto">
                        <Button 
                          onClick={handlePayment}
                          disabled={isProcessing}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          size="lg"
                        >
                          {isProcessing ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Redirecting to Kashier...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Proceed to Kashier Payment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* InstaPay Payment */}
                  {paymentMethod === 'instapay' && (
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
                  )}

                  {/* Bank Transfer Payment */}
                  {paymentMethod === 'bank_transfer' && (
                    <div className="py-6">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Landmark className="h-8 w-8 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Complete Your Bank Transfer</h3>
                        <p className="text-gray-600">
                          After completing the bank transfer, upload your receipt to confirm.
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
                          className="w-full bg-orange-600 hover:bg-orange-700"
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

                  {/* Credit Card Payment (Legacy - can be removed if not needed) */}
                  {paymentMethod === 'credit_card' && (
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
                            Pay {grandTotal.toFixed(0)} EGP
                          </>
                        )}
                      </Button>
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
                {/* Projects List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.projectId} className="flex space-x-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.projectName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{item.projectName}</h4>
                        <p className="text-xs text-gray-600 truncate">{item.developer}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{item.quantity} leads</span>
                          <span className="text-xs font-medium">EGP {(item.quantity * item.pricePerLead).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 my-4" />

                {/* Order Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Leads:</span>
                    <span className="font-medium">{totalLeads} leads</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{subtotal.toFixed(0)} EGP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (14%):</span>
                    <span className="font-medium">{vat.toFixed(0)} EGP</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4" />

                <div className="flex justify-between font-semibold">
                  <span>Grand Total:</span>
                  <span className="text-lg text-blue-600">{grandTotal.toFixed(0)} EGP</span>
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
