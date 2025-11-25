import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import PaymentGatewayService from '../../services/paymentGateway';
import { useWallet } from '../../contexts/WalletContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabaseClient';

/**
 * Payment Callback Page
 * Handles redirects from payment gateways (Kashier, Stripe, Paymob)
 */
export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Processing payment...');
  
  // Get wallet and toast hooks with error handling
  let refreshBalance: (() => Promise<void>) | undefined;
  let showSuccess: ((message: string) => void) | undefined;
  let showError: ((message: string) => void) | undefined;
  
  try {
    const wallet = useWallet();
    refreshBalance = wallet.refreshBalance;
  } catch (error) {
    console.error('PaymentCallback: Error getting wallet context', error);
  }
  
  try {
    const toast = useToast();
    showSuccess = toast.showSuccess;
    showError = toast.showError;
  } catch (error) {
    console.error('PaymentCallback: Error getting toast context', error);
  }
  
  const transactionId = searchParams.get('transactionId');
  const statusParam = searchParams.get('status'); // 'success' or 'failed' from Kashier
  const paymentStatusParam = searchParams.get('paymentStatus'); // 'SUCCESS' or 'FAILED' from Kashier
  const orderId = searchParams.get('orderId'); // From Kashier
  const paymentId = searchParams.get('paymentId'); // From Kashier

  useEffect(() => {
    const processPayment = async () => {
      console.log('PaymentCallback: Starting payment processing', {
        transactionId,
        statusParam,
        paymentStatusParam,
        orderId,
        paymentId
      });

      if (!transactionId) {
        console.error('PaymentCallback: Transaction ID not found');
        setStatus('error');
        setMessage('Transaction ID not found');
        // Redirect anyway after 3 seconds - try app home, fallback to public home
        setTimeout(() => {
          console.log('PaymentCallback: No transaction ID, redirecting');
          navigate('/app/home', { replace: true }).catch(() => {
            navigate('/', { replace: true });
          });
        }, 3000);
        return;
      }

      try {
        // First, check the actual transaction status in the database
        // This is the source of truth - webhook may have already processed it
        let transactionStatus: string | null = null;
        try {
          const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select('status, processed_at')
            .eq('id', transactionId)
            .eq('transaction_type', 'payment')
            .single();
          
          if (!txError && transaction) {
            transactionStatus = transaction.status;
            console.log('PaymentCallback: Transaction status from DB', {
              transactionId,
              status: transactionStatus,
              processed_at: transaction.processed_at
            });
          }
        } catch (dbError) {
          console.warn('PaymentCallback: Could not fetch transaction status from DB', dbError);
        }

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
          statusParam?.toLowerCase() === 'cancelled' ||
          statusParam?.toLowerCase() === 'canceled' ||
          paymentStatusParam?.toUpperCase() === 'FAILED' ||
          paymentStatusParam?.toUpperCase() === 'CANCELLED';
        
        if (isSuccess) {
          // Explicit success status in URL
          paymentStatusToUse = 'completed';
        } else if (isFailed) {
          // Explicit failed/cancelled status in URL
          paymentStatusToUse = 'failed';
        } else if (transactionStatus === 'completed' || transactionStatus === 'confirmed') {
          // Transaction already processed successfully (webhook handled it)
          paymentStatusToUse = 'completed';
          console.log('PaymentCallback: Transaction already completed in DB, treating as success');
        } else if (transactionStatus === 'failed' || transactionStatus === 'cancelled') {
          // Transaction already marked as failed/cancelled
          paymentStatusToUse = 'failed';
          console.log('PaymentCallback: Transaction already failed/cancelled in DB');
        } else {
          // No explicit status in URL and transaction not yet processed
          // If paymentId or orderId exists but no status, check if transaction is processing
          // Otherwise, default to failed (user likely cancelled by closing modal)
          if (paymentId || orderId) {
            // Check if transaction is still processing (might be pending webhook)
            if (transactionStatus === 'processing' || transactionStatus === 'pending') {
              // Wait a bit and check again, or default to failed for safety
              console.warn('PaymentCallback: Payment has orderId/paymentId but no explicit status and transaction is still pending. Treating as cancelled/failed for safety.');
              paymentStatusToUse = 'failed';
            } else {
              // Transaction exists but status is unclear - default to failed for safety
              paymentStatusToUse = 'failed';
            }
          } else {
            // No paymentId, orderId, or status - definitely cancelled/failed
            paymentStatusToUse = 'failed';
          }
        }

        // Confirm payment via RPC
        // Note: Webhook already processes payment, so this is mainly for UX
        // If RPC fails due to auth, that's okay - webhook handled it
        console.log('PaymentCallback: Calling confirmPayment', { transactionId, paymentStatusToUse });
        let result;
        try {
          result = await PaymentGatewayService.confirmPayment(
            transactionId,
            paymentStatusToUse
          );
          console.log('PaymentCallback: confirmPayment result', result);
        } catch (rpcError) {
          // If RPC fails (e.g., auth error), assume webhook processed it
          // Still show success if URL indicates success
          console.warn('PaymentCallback: RPC call failed, webhook may have processed payment', rpcError);
          if (paymentStatusToUse === 'completed') {
            result = { success: true }; // Assume success if URL says success
          } else {
            result = { success: false, error: 'Could not confirm payment status' };
          }
        }

        // Check if payment was successful (either newly processed or already processed)
        // The RPC may return success=true even if transaction was already processed
        if (result.success && paymentStatusToUse === 'completed') {
          console.log('PaymentCallback: Payment successful, refreshing balance and redirecting');
          setStatus('success');
          setMessage('Payment successful! Your wallet has been topped up.');
          
          // Refresh wallet balance
          if (refreshBalance) {
            try {
              await refreshBalance();
              console.log('PaymentCallback: Balance refreshed');
            } catch (refreshError) {
              console.error('PaymentCallback: Error refreshing balance', refreshError);
              // Continue anyway - balance will update on next page load
            }
          }
          
          // Show success toast
          if (showSuccess) {
            try {
              showSuccess('Payment successful! Your wallet balance has been updated.');
            } catch (toastError) {
              console.error('PaymentCallback: Error showing toast', toastError);
            }
          }
          
          // Redirect to home immediately after balance refresh (better UX)
          setTimeout(() => {
            console.log('PaymentCallback: Redirecting to /app/home');
            navigate('/app/home', { replace: true }).catch(() => {
              // Fallback to public home if not authenticated
              navigate('/', { replace: true });
            });
          }, 1000); // 1 second - just enough to see success message
        } else {
          // Payment failed or was cancelled
          console.error('PaymentCallback: Payment failed or cancelled', result);
          setStatus('error');
          
          // Determine if it was cancelled vs failed
          const wasCancelled = !isSuccess && !isFailed && !transactionStatus;
          const message = wasCancelled 
            ? 'Payment was cancelled. No charges were made.'
            : (result.error || 'Payment processing failed. Please contact support if the payment was deducted.');
          
          setMessage(message);
          if (showError) {
            try {
              showError(wasCancelled ? 'Payment cancelled' : (result.error || 'Payment processing failed'));
            } catch (toastError) {
              console.error('PaymentCallback: Error showing error toast', toastError);
            }
          }
          
          // Redirect to home after 5 seconds
          setTimeout(() => {
            console.log('PaymentCallback: Redirecting to /app/home (error case)');
            navigate('/app/home', { replace: true }).catch(() => {
              // Fallback to public home if not authenticated
              navigate('/', { replace: true });
            });
          }, 5000);
        }
      } catch (error) {
        console.error('PaymentCallback: Payment callback error:', error);
        setStatus('error');
        setMessage(
          error instanceof Error 
            ? error.message 
            : 'An error occurred while processing your payment. Please contact support if the payment was deducted.'
        );
        if (showError) {
          try {
            showError('Payment processing error');
          } catch (toastError) {
            console.error('PaymentCallback: Error showing error toast', toastError);
          }
        }
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          console.log('PaymentCallback: Error occurred, redirecting to home');
          navigate('/app/home', { replace: true }).catch(() => {
            // Fallback to public home if not authenticated
            navigate('/', { replace: true });
          });
        }, 3000);
      }
    };

    // Add a safety timeout - if nothing happens after 10 seconds, redirect anyway
    const safetyTimeout = setTimeout(() => {
      console.warn('PaymentCallback: Safety timeout triggered, redirecting to home');
      navigate('/app/home', { replace: true }).catch(() => {
        // Fallback to public home if not authenticated
        navigate('/', { replace: true });
      });
    }, 10000);

    processPayment().finally(() => {
      clearTimeout(safetyTimeout);
    });
  }, [transactionId, statusParam, paymentStatusParam, orderId, paymentId, navigate]);

  // Always render something, even if there's an error
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
                onClick={() => {
                  navigate('/app/home').catch(() => {
                    navigate('/', { replace: true });
                  });
                }}
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

