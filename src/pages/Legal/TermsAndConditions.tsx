import React from 'react';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Scale, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsAndConditions: React.FC = () => {
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
              <Scale className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Legal Documents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Terms and Conditions
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: September 12, 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              By accessing and using SaleMate ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
              SaleMate is a premium real estate lead marketplace operating in Egypt, connecting real estate professionals with verified prospects.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              SaleMate provides the following services:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Premium real estate lead marketplace</li>
              <li>Verified prospect contact information</li>
              <li>CRM integration and lead management tools</li>
              <li>Project-based lead categorization</li>
              <li>Secure payment processing</li>
              <li>Customer support and account management</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Registration and Accounts</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              To access our services, you must:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be at least 18 years old or the age of majority in Egypt</li>
              <li>Be a licensed real estate professional or authorized representative</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Lead Purchase and Usage</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              When purchasing leads through SaleMate:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>All lead purchases are final and non-refundable</li>
              <li>Leads are for your exclusive use and may not be resold or redistributed</li>
              <li>You must comply with Egyptian data protection and privacy laws</li>
              <li>Contact information must be used for legitimate real estate purposes only</li>
              <li>Spam, harassment, or misuse of lead data is strictly prohibited</li>
              <li>Leads are delivered instantly upon successful payment confirmation</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment Terms</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Payment for lead purchases:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Must be made in Egyptian Pounds (EGP)</li>
              <li>Processed through secure payment gateways (Paymob, Instapay, etc.)</li>
              <li>Prices are clearly displayed before purchase</li>
              <li>No hidden fees or additional charges</li>
              <li>Payment confirmation required before lead delivery</li>
              <li>Failed payments will not result in lead delivery</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Protection and Privacy</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              SaleMate is committed to protecting your privacy and the privacy of lead data:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>All data is encrypted and stored securely</li>
              <li>Lead information is obtained through legitimate marketing channels</li>
              <li>Users must comply with Egyptian Personal Data Protection Law</li>
              <li>We do not share or sell user account information</li>
              <li>Lead data is provided for legitimate business use only</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Prohibited Uses</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              You may not use SaleMate for:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Illegal activities or fraud</li>
              <li>Spam or unsolicited communications</li>
              <li>Harassment or abuse of prospects</li>
              <li>Reselling or redistributing purchased leads</li>
              <li>Reverse engineering or data scraping</li>
              <li>Violating any applicable laws or regulations</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Availability</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              While we strive for 99.9% uptime, SaleMate does not guarantee uninterrupted service. 
              We reserve the right to modify, suspend, or discontinue any aspect of the service with reasonable notice.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              SaleMate's liability is limited to the amount paid for leads in the specific transaction. 
              We are not responsible for the quality of leads beyond providing accurate contact information as received from our sources.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              These terms are governed by the laws of the Arab Republic of Egypt. 
              Any disputes will be resolved through arbitration in Cairo, Egypt.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              For questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-900 font-medium">SaleMate Support</p>
              <p className="text-blue-800">Email: legal@salemate-eg.com</p>
              <p className="text-blue-800">Phone: +20 100 XXX XXXX</p>
              <p className="text-blue-800">Address: Cairo, Egypt</p>
            </div>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 text-center">
                By using SaleMate, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
