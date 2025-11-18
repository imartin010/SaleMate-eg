import React from 'react';

/**
 * Performance Program Home Page
 * This is the main entry point for the performance.salemate-eg.com subdomain
 * 
 * TODO: Implement the actual performance program features
 */
const PerformanceHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Salemate Performance
            </h1>
            <p className="text-xl text-gray-600">
              Welcome to the Performance Program
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
                  <svg
                    className="w-10 h-10 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Performance Program
              </h2>
              <p className="text-gray-600 mb-8">
                This program is currently being set up. The subdomain connection is active and ready for implementation.
              </p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-left">
                <p className="text-sm text-indigo-800">
                  <strong>Status:</strong> Subdomain routing configured successfully
                </p>
                <p className="text-sm text-indigo-800 mt-2">
                  <strong>Domain:</strong> performance.salemate-eg.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceHome;

