/* eslint-disable react-refresh/only-export-components */
// React import not needed for this minimal component
import ReactDOM from 'react-dom/client';
import './index.css';

// Minimal test app
const MinimalApp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">SaleMate</h1>
        <p className="text-gray-600 mb-6">Development Server Test</p>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✅ React is working</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✅ Tailwind CSS is working</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✅ Vite dev server is working</p>
          </div>
          <a 
            href="/dashboard" 
            className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

console.log('🚀 Minimal SaleMate app starting...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(<MinimalApp />);

console.log('✅ Minimal app rendered successfully');
