import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
  MessageCircle
} from 'lucide-react';

export const TempLanding: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [testPayment, setTestPayment] = useState({
    amount: 100,
    email: '',
    name: ''
  });

  const handleSubscribe = async () => {
    if (email) {
      setIsSubscribed(true);
      // Here you can add newsletter signup logic
    }
  };

  const handleTestPayment = async () => {
    // This is where Paymob integration will go
    console.log('Test payment:', testPayment);
    alert('Paymob integration will be configured here!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            {/* Logo & Brand */}
            <div className="flex items-center justify-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SaleMate
              </h1>
            </div>

            {/* Tagline */}
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                The Future of
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Real Estate Leads
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Premium lead marketplace connecting real estate professionals with high-quality, verified prospects. 
                Powered by AI-driven matching and instant CRM integration.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg border-2 hover:bg-gray-50"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Book Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 text-gray-500">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-medium">1000+ Agents</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">500+ Projects</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SaleMate?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for the Egyptian real estate market with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Premium Quality Leads</h4>
              <p className="text-gray-600 leading-relaxed">
                Verified, high-intent prospects from Egypt's top real estate projects. 
                Each lead is validated and ready for conversion.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Instant Delivery</h4>
              <p className="text-gray-600 leading-relaxed">
                Leads appear in your CRM immediately after purchase. 
                No waiting, no delays - start calling within minutes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Secure & Reliable</h4>
              <p className="text-gray-600 leading-relaxed">
                Bank-level security, encrypted data, and 99.9% uptime. 
                Your business and client data is always protected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Paymob Test Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                🚀 Paymob Integration Test
              </h3>
              <p className="text-lg text-gray-600">
                Testing payment gateway integration for seamless transactions
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Test Payment Form */}
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-gray-900">Test Payment</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <Input
                      placeholder="Enter your full name"
                      value={testPayment.name}
                      onChange={(e) => setTestPayment(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={testPayment.email}
                      onChange={(e) => setTestPayment(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (EGP)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={testPayment.amount}
                      onChange={(e) => setTestPayment(prev => ({ ...prev, amount: parseInt(e.target.value) || 100 }))}
                    />
                  </div>

                  <Button 
                    onClick={handleTestPayment}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    size="lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Test Paymob Payment
                  </Button>
                </div>
              </div>

              {/* Integration Info */}
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-gray-900">Integration Features</h4>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">Multiple Payment Methods</h5>
                      <p className="text-sm text-gray-600">Credit cards, mobile wallets, bank transfers</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">Instant Processing</h5>
                      <p className="text-sm text-gray-600">Real-time payment confirmation and lead delivery</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">Secure Transactions</h5>
                      <p className="text-sm text-gray-600">PCI-compliant with fraud protection</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">Egyptian Market Focus</h5>
                      <p className="text-sm text-gray-600">Optimized for local payment preferences</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-2">Payment Methods Supported:</h5>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Visa</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Mastercard</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Vodafone Cash</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Orange Money</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Bank Transfer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Egypt's Top Real Estate Professionals
            </h3>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of successful agents who have transformed their business with SaleMate
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">1000+</div>
              <div className="text-gray-300">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">50K+</div>
              <div className="text-gray-300">Leads Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">500+</div>
              <div className="text-gray-300">Projects Listed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Get notified when we launch new features and premium projects
          </p>

          {!isSubscribed ? (
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSubscribe}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Subscribe
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span className="text-lg font-medium">Thank you for subscribing!</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h3>
            <p className="text-xl text-gray-600">
              Pay only for the leads you need. No hidden fees, no commitments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Starter</h4>
                <div className="text-4xl font-bold text-blue-600 mb-4">
                  EGP 25<span className="text-lg text-gray-500">/lead</span>
                </div>
                <p className="text-gray-600 mb-6">Perfect for individual agents</p>
                
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Verified contact information</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Basic CRM integration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Email support</span>
                  </li>
                </ul>

                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Professional</h4>
                <div className="text-4xl font-bold text-blue-600 mb-4">
                  EGP 20<span className="text-lg text-gray-500">/lead</span>
                </div>
                <p className="text-gray-600 mb-6">For growing teams</p>
                
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Everything in Starter</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Team management</span>
                  </li>
                </ul>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h4>
                <div className="text-4xl font-bold text-blue-600 mb-4">
                  Custom<span className="text-lg text-gray-500"> pricing</span>
                </div>
                <p className="text-gray-600 mb-6">For large organizations</p>
                
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>24/7 phone support</span>
                  </li>
                </ul>

                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">SaleMate</span>
            </div>
            <p className="text-gray-400 mb-6">
              Empowering real estate professionals across Egypt
            </p>
            <div className="flex justify-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-800 text-gray-500 text-sm">
              © 2025 SaleMate. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
