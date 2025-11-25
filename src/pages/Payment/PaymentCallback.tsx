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

        // CRITICAL: Only process payment if we have explicit success confirmation
        // Never assume success - always verify from database first
        console.log('PaymentCallback: Checking payment status', { transactionId, paymentStatusToUse, transactionStatus });
        
        // If transaction is already completed in DB, webhook handled it - just refresh UI
        if (transactionStatus === 'completed' || transactionStatus === 'confirmed') {
          console.log('PaymentCallback: Transaction already completed by webhook, skipping RPC call');
          // Don't call RPC again - webhook already processed it
          // Just show success and refresh balance
          setStatus('success');
          setMessage('Payment successful! Your wallet has been topped up.');
          
          if (refreshBalance) {
            try {
              await refreshBalance();
              console.log('PaymentCallback: Balance refreshed');
            } catch (refreshError) {
              console.error('PaymentCallback: Error refreshing balance', refreshError);
            }
          }
          
          if (showSuccess) {
            try {
              showSuccess('Payment successful! Your wallet balance has been updated.');
            } catch (toastError) {
              console.error('PaymentCallback: Error showing toast', toastError);
            }
          }
          
          setTimeout(() => {
            navigate('/app/home', { replace: true }).catch(() => {
              navigate('/', { replace: true });
            });
          }, 1000);
          return;
        }
        
        // If transaction is already failed/cancelled in DB, don't process
        if (transactionStatus === 'failed' || transactionStatus === 'cancelled') {
          console.log('PaymentCallback: Transaction already marked as failed/cancelled in DB');
          setStatus('error');
          setMessage('Payment was cancelled. No charges were made.');
          if (showError) {
            try {
              showError('Payment cancelled');
            } catch (toastError) {
              console.error('PaymentCallback: Error showing error toast', toastError);
            }
          }
          setTimeout(() => {
            navigate('/app/home', { replace: true }).catch(() => {
              navigate('/', { replace: true });
            });
          }, 3000);
          return;
        }
        
        // Only call confirmPayment if we have explicit success status AND transaction is still pending/processing
        // This prevents crediting wallet for cancelled payments
        if (paymentStatusToUse === 'completed' && (transactionStatus === 'pending' || transactionStatus === 'processing' || !transactionStatus)) {
          console.log('PaymentCallback: Calling confirmPayment for pending transaction', { transactionId, paymentStatusToUse });
          let result;
          try {
            result = await PaymentGatewayService.confirmPayment(
              transactionId,
              paymentStatusToUse
            );
            console.log('PaymentCallback: confirmPayment result', result);
            
            if (!result.success) {
              // RPC failed - don't assume success, treat as failed
              console.error('PaymentCallback: confirmPayment RPC failed', result);
              setStatus('error');
              setMessage(result.error || 'Payment processing failed. Please contact support if the payment was deducted.');
              if (showError) {
                try {
                  showError(result.error || 'Payment processing failed');
                } catch (toastError) {
                  console.error('PaymentCallback: Error showing error toast', toastError);
                }
              }
              setTimeout(() => {
                navigate('/app/home', { replace: true }).catch(() => {
                  navigate('/', { replace: true });
                });
              }, 5000);
              return;
            }
          } catch (rpcError) {
            // RPC call failed - NEVER assume success, always treat as error
            console.error('PaymentCallback: RPC call exception', rpcError);
            setStatus('error');
            setMessage('Could not confirm payment status. Please contact support if the payment was deducted.');
            if (showError) {
              try {
                showError('Payment confirmation failed');
              } catch (toastError) {
                console.error('PaymentCallback: Error showing error toast', toastError);
              }
            }
            setTimeout(() => {
              navigate('/app/home', { replace: true }).catch(() => {
                navigate('/', { replace: true });
              });
            }, 5000);
            return;
          }
          
          // Only proceed to success if RPC confirmed success
          if (result.success) {
            console.log('PaymentCallback: Payment confirmed successful by RPC');
            setStatus('success');
            setMessage('Payment successful! Your wallet has been topped up.');
            
            if (refreshBalance) {
              try {
                await refreshBalance();
                console.log('PaymentCallback: Balance refreshed');
              } catch (refreshError) {
                console.error('PaymentCallback: Error refreshing balance', refreshError);
              }
            }
            
            if (showSuccess) {
              try {
                showSuccess('Payment successful! Your wallet balance has been updated.');
              } catch (toastError) {
                console.error('PaymentCallback: Error showing toast', toastError);
              }
            }
            
            setTimeout(() => {
              navigate('/app/home', { replace: true }).catch(() => {
                navigate('/', { replace: true });
              });
            }, 1000);
            return;
          }
        } else {
          // Payment was cancelled or failed - don't process
          console.log('PaymentCallback: Payment cancelled or failed, not processing', {
            paymentStatusToUse,
            transactionStatus
          });
          setStatus('error');
          setMessage('Payment was cancelled. No charges were made.');
          if (showError) {
            try {
              showError('Payment cancelled');
            } catch (toastError) {
              console.error('PaymentCallback: Error showing error toast', toastError);
            }
          }
          setTimeout(() => {
            navigate('/app/home', { replace: true }).catch(() => {
              navigate('/', { replace: true });
            });
          }, 3000);
          return;
        }
        
        // Fallback - should not reach here, but handle it
        console.warn('PaymentCallback: Unexpected state, treating as failed');
        setStatus('error');
        setMessage('Payment status could not be determined. Please contact support.');
        if (showError) {
          try {
            showError('Payment status unclear');
          } catch (toastError) {
            console.error('PaymentCallback: Error showing error toast', toastError);
          }
        }
        setTimeout(() => {
          navigate('/app/home', { replace: true }).catch(() => {
            navigate('/', { replace: true });
          });
        }, 3000);
        return;
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

