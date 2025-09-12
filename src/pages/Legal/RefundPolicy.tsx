import React from 'react';
import { Button } from '../../components/ui/button';
import { ArrowLeft, RefreshCw, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RefundPolicy: React.FC = () => {
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
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Refund Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Refund Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: September 12, 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            {/* No Refund Policy */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Important Notice</h3>
                  <p className="text-red-800">
                    <strong>All lead purchases on SaleMate are final and non-refundable.</strong> 
                    Please read this policy carefully before making any purchases.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. No Refund Policy</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Due to the nature of our digital lead marketplace, <strong>all sales are final</strong>. 
              Once leads are delivered to your account, they cannot be returned, exchanged, or refunded. 
              This policy exists because:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Leads are digital products delivered instantly</li>
              <li>Contact information cannot be "returned" once accessed</li>
              <li>Leads may lose value if returned and resold</li>
              <li>Industry standard practice for lead marketplaces</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Quality Guarantee</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              While we cannot offer refunds, we guarantee the quality of our leads:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li><strong>Verified Contact Information:</strong> All phone numbers and emails are validated</li>
              <li><strong>Fresh Leads:</strong> Leads are no older than 30 days from initial capture</li>
              <li><strong>Accurate Project Matching:</strong> Leads are correctly categorized by project interest</li>
              <li><strong>No Duplicates:</strong> Each lead is sold only once to ensure exclusivity</li>
              <li><strong>Real Prospects:</strong> All leads come from genuine marketing campaigns</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Lead Replacement Policy</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              In exceptional circumstances, we may provide lead replacements (not refunds) if:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li><strong>Technical Error:</strong> Duplicate leads delivered due to system error</li>
              <li><strong>Data Corruption:</strong> Lead information is corrupted or incomplete</li>
              <li><strong>Wrong Project:</strong> Leads delivered for incorrect project due to our error</li>
            </ul>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Replacement requests must be submitted within <strong>24 hours</strong> of purchase with supporting evidence.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. What We Do NOT Guarantee</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-3">SaleMate does NOT guarantee:</h4>
              <ul className="list-disc list-inside text-yellow-800 space-y-2">
                <li>Lead conversion rates or sales success</li>
                <li>That prospects will answer phone calls</li>
                <li>That prospects are still actively looking to buy</li>
                <li>Specific lead quality metrics or demographics</li>
                <li>That leads have not been contacted by other sources</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment Disputes</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              For payment-related issues:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li><strong>Payment Failed:</strong> If payment fails, no leads will be delivered</li>
              <li><strong>Double Charging:</strong> Contact support immediately for investigation</li>
              <li><strong>Unauthorized Charges:</strong> Report within 48 hours for review</li>
              <li><strong>Bank Disputes:</strong> Must be resolved directly with your bank</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Account Suspension</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              If your account is suspended for policy violations, no refunds will be provided for:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Previously purchased leads</li>
              <li>Unused account credits</li>
              <li>Subscription fees</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Force Majeure</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              SaleMate is not liable for service interruptions or lead delivery delays caused by events beyond our control, 
              including but not limited to natural disasters, government actions, internet outages, or third-party service failures.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact for Support</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              For any questions or concerns about purchases, please contact our support team:
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">SaleMate Customer Support</h4>
              <div className="space-y-2 text-blue-800">
                <p><strong>Email:</strong> support@salemate-eg.com</p>
                <p><strong>Phone:</strong> +20 100 XXX XXXX</p>
                <p><strong>WhatsApp:</strong> +20 100 XXX XXXX</p>
                <p><strong>Hours:</strong> Sunday - Thursday, 9 AM - 6 PM (Cairo Time)</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. Policy Changes</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We reserve the right to modify this refund policy at any time. 
              Changes will be posted on this page with an updated "Last modified" date. 
              Continued use of the service after changes constitutes acceptance of the new policy.
            </p>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg border">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Our Commitment</h4>
                  <p className="text-gray-700">
                    While we maintain a no-refund policy, we are committed to providing high-quality leads 
                    and excellent customer service. Our support team is available to help resolve any issues 
                    and ensure you get the most value from your lead purchases.
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
