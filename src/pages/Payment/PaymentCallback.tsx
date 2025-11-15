import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import PaymentGatewayService from '../../services/paymentGateway';
import { useWallet } from '../../contexts/WalletContext';
import { useToast } from '../../contexts/ToastContext';

/**
 * Payment Callback Page
 * Handles redirects from payment gateways (Kashier, Stripe, Paymob)
 */
export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshBalance } = useWallet();
  const { showSuccess, showError } = useToast();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Processing payment...');
  
  const transactionId = searchParams.get('transactionId');
  const statusParam = searchParams.get('status'); // 'success' or 'failed' from Kashier
  const paymentStatusParam = searchParams.get('paymentStatus'); // 'SUCCESS' or 'FAILED' from Kashier
  const orderId = searchParams.get('orderId'); // From Kashier
  const paymentId = searchParams.get('paymentId'); // From Kashier

  useEffect(() => {
    const processPayment = async () => {
      if (!transactionId) {
        setStatus('error');
        setMessage('Transaction ID not found');
        return;
      }

      try {
        // Determine payment status from URL params
        // Kashier returns 'status=success' or 'paymentStatus=SUCCESS' in the redirect URL
        let paymentStatusToUse: 'completed' | 'failed' = 'failed';
        
        // Check both status and paymentStatus parameters (Kashier uses both)
        const isSuccess = 
          statusParam?.toLowerCase() === 'success' || 
          statusParam?.toLowerCase() === 'completed' ||
          paymentStatusParam?.toUpperCase() === 'SUCCESS';
        
        const isFailed = 
          statusParam?.toLowerCase() === 'failed' || 
          statusParam?.toLowerCase() === 'error' ||
          paymentStatusParam?.toUpperCase() === 'FAILED';
        
        if (isSuccess) {
          paymentStatusToUse = 'completed';
        } else if (isFailed) {
          paymentStatusToUse = 'failed';
        } else {
          // If no status in URL, check if paymentId or orderId exists (Kashier success indicator)
          if (paymentId || orderId) {
            paymentStatusToUse = 'completed';
          }
        }

        // Confirm payment via RPC
        const result = await PaymentGatewayService.confirmPayment(
          transactionId,
          paymentStatusToUse
        );

        // Check if payment was successful (either newly processed or already processed)
        // The RPC may return success=true even if transaction was already processed
        if (result.success && paymentStatusToUse === 'completed') {
          setStatus('success');
          setMessage('Payment successful! Your wallet has been topped up.');
          
          // Refresh wallet balance
          await refreshBalance();
          
          // Show success toast
          showSuccess('Payment successful! Your wallet balance has been updated.');
          
          // Redirect to home after 2 seconds (reduced for better UX)
          setTimeout(() => {
            navigate('/app/home');
          }, 2000);
        } else {
          // Only show error if payment actually failed
          setStatus('error');
          setMessage(result.error || 'Payment processing failed. Please contact support if the payment was deducted.');
          showError(result.error || 'Payment processing failed');
          
          // Redirect to home after 5 seconds
          setTimeout(() => {
            navigate('/app/home');
          }, 5000);
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('error');
        setMessage(
          error instanceof Error 
            ? error.message 
            : 'An error occurred while processing your payment. Please contact support if the payment was deducted.'
        );
        showError('Payment processing error');
        
        // Redirect to home after 5 seconds
        setTimeout(() => {
          navigate('/app/home');
        }, 5000);
      }
    };

    processPayment();
  }, [transactionId, statusParam, paymentStatusParam, orderId, paymentId, navigate, refreshBalance, showSuccess, showError]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          {status === 'processing' && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Processing Payment</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-100 p-4">
                  <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">Redirecting you back to home...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-4">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => navigate('/app/home')}
                className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

