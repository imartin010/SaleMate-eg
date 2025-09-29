import React from 'react';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: September 12, 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <Eye className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Privacy Matters</h3>
                  <p className="text-blue-800">
                    SaleMate is committed to protecting your privacy and the privacy of all users. 
                    This policy explains how we collect, use, and safeguard your information.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">1.1 Account Information</h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Full name and email address</li>
              <li>Phone number and business information</li>
              <li>Real estate license details (if applicable)</li>
              <li>Company name and position</li>
              <li>Profile preferences and settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">1.2 Lead Data</h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Lead information we provide includes:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Prospect contact information (name, phone, email)</li>
              <li>Project interest and preferences</li>
              <li>Lead source and acquisition date</li>
              <li>Geographic location and demographics</li>
              <li>Communication history and notes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">1.3 Usage Data</h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We automatically collect:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Website usage patterns and analytics</li>
              <li>Device information and browser type</li>
              <li>IP address and location data</li>
              <li>Login times and session duration</li>
              <li>Feature usage and interaction data</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Service Provision</h3>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Deliver purchased leads to your account</li>
              <li>Process payments and manage subscriptions</li>
              <li>Provide customer support and assistance</li>
              <li>Send important service notifications</li>
              <li>Maintain and improve platform functionality</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Communication</h3>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Send order confirmations and receipts</li>
              <li>Provide lead delivery notifications</li>
              <li>Share important platform updates</li>
              <li>Respond to support requests</li>
              <li>Send marketing communications (with consent)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Analytics and Improvement</h3>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Analyze usage patterns to improve services</li>
              <li>Monitor platform performance and security</li>
              <li>Develop new features and capabilities</li>
              <li>Conduct research and market analysis</li>
              <li>Ensure compliance with regulations</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Protection and Security</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Security Measures</h3>
              <ul className="list-disc list-inside text-green-800 space-y-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                <li><strong>Access Controls:</strong> Strict role-based access to sensitive data</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Secure Infrastructure:</strong> Cloud-based security with enterprise-grade protection</li>
                <li><strong>Data Backup:</strong> Regular backups with disaster recovery procedures</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Data Retention</h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Provide ongoing services and support</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Maintain business records and analytics</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 We Do NOT Share</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <ul className="list-disc list-inside text-red-800 space-y-2">
                <li>Your personal account information</li>
                <li>Lead data with unauthorized parties</li>
                <li>Payment information or financial data</li>
                <li>Usage patterns or analytics data</li>
                <li>Any information for marketing purposes (without consent)</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Limited Sharing</h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We may share information only in these circumstances:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li><strong>Legal Requirements:</strong> When required by law or court order</li>
              <li><strong>Service Providers:</strong> Trusted partners who help operate our platform</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
              <li><strong>Protection:</strong> To protect rights, property, or safety</li>
              <li><strong>Consent:</strong> When you explicitly authorize sharing</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Access and Control</h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> View and download your personal data</li>
              <li><strong>Correct:</strong> Update or correct inaccurate information</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
              <li><strong>Port:</strong> Export your data in a portable format</li>
              <li><strong>Restrict:</strong> Limit how we process your information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Communication Preferences</h3>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Opt out of marketing emails</li>
              <li>Choose notification preferences</li>
              <li>Control data sharing settings</li>
              <li>Manage cookie preferences</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Remember your login status and preferences</li>
              <li>Analyze website usage and performance</li>
              <li>Provide personalized content and features</li>
              <li>Ensure security and prevent fraud</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Services</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We integrate with trusted third-party services:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li><strong>Payment Processing:</strong> Card payments, Instapay for secure transactions</li>
              <li><strong>Analytics:</strong> Google Analytics for usage insights</li>
              <li><strong>Communication:</strong> Email and SMS service providers</li>
              <li><strong>Infrastructure:</strong> Supabase for database and authentication</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Your data may be processed in Egypt and other countries where our service providers operate. 
              We ensure appropriate safeguards are in place to protect your information in accordance with 
              Egyptian data protection laws and international standards.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              SaleMate is not intended for users under 18 years of age. We do not knowingly collect 
              personal information from children. If we become aware that we have collected data from 
              a child, we will take steps to delete such information promptly.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Policy Updates</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices or 
              legal requirements. We will notify you of significant changes via email or platform 
              notification. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              For questions about this Privacy Policy or to exercise your rights, contact us:
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">SaleMate Privacy Team</h4>
              <div className="space-y-2 text-blue-800">
                <p><strong>Email:</strong> privacy@salemate-eg.com</p>
                <p><strong>Phone:</strong> +20 100 XXX XXXX</p>
                <p><strong>Address:</strong> Cairo, Egypt</p>
                <p><strong>Data Protection Officer:</strong> dpo@salemate-eg.com</p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg border">
              <div className="flex items-start space-x-3">
                <Database className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Data Protection Compliance</h4>
                  <p className="text-gray-700">
                    SaleMate complies with Egyptian Personal Data Protection Law and implements 
                    industry-standard security measures to protect your privacy and data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
