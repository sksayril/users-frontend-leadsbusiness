import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CreditCard, Wallet, ArrowRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { initRazorpayPayment, loadRazorpay, RazorpaySuccessResponse } from '../../utils/razorpay';
import { useAuth } from '../../contexts/AuthContext';

const RAZORPAY_KEY_ID = "rzp_test_BDT2TegS4Ax6Vp"; // Should come from env

// Recharge amounts in INR
const rechargeAmounts = [
  { value: 100, coins: 200, label: '₹100', featured: false },
  { value: 250, coins: 500, label: '₹250', featured: true },
  { value: 500, coins: 1000, label: '₹500', featured: false },
  { value: 1000, coins: 2000, label: '₹1000', featured: false },
];

interface RechargeWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  redirectToDashboard?: boolean;
  redirectToWallet?: boolean;
}

const RechargeWalletModal: React.FC<RechargeWalletModalProps> = ({ 
  isOpen, 
  onClose, 
  message = "Insufficient balance to complete this transaction",
  redirectToDashboard = false,
  redirectToWallet = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rechargeWallet, verifyRechargePayment, refreshWallet, loading } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number>(250);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [razorpayLoaded, setRazorpayLoaded] = useState<boolean>(false);
  const [autoStartRecharge, setAutoStartRecharge] = useState<boolean>(false);

  // Load Razorpay script on component mount
  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      
      // If message contains specific insufficient coins text, auto-trigger recharge
      const shouldAutoStart = message.includes("Failed to deduct coins") || 
                             message.includes("Insufficient coins") ||
                             message.includes("insufficient balance");
                             
      setAutoStartRecharge(shouldAutoStart);
    }
  }, [isOpen, message]);

  // Auto-trigger recharge if needed
  useEffect(() => {
    if (isOpen && razorpayLoaded && autoStartRecharge && !isProcessing) {
      console.log('Auto-triggering recharge process');
      handleRecharge();
    }
  }, [isOpen, razorpayLoaded, autoStartRecharge]);

  const loadRazorpayScript = async () => {
    try {
      const loaded = await loadRazorpay();
      setRazorpayLoaded(loaded);
      if (!loaded) {
        setStatusMessage('Failed to load payment gateway');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error loading Razorpay:', error);
      setStatusMessage('Failed to load payment gateway');
      setMessageType('error');
    }
  };

  // Handle payment verification
  const handlePaymentVerification = async (response: RazorpaySuccessResponse, amount: number) => {
    try {
      setProcessingMessage('Verifying payment...');
      
      // Verify the payment
      await verifyRechargePayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        amount: amount
      });

      // Calculate coins
      const coins = amount * 2;
      setStatusMessage(`Payment successful! Added ₹${amount} to your wallet (${coins} LeadsCoins)`);
      setMessageType('success');
      
      // Only refresh wallet after verification completes
      await refreshWallet();
      
      // Handle redirection
      if (redirectToWallet) {
        setStatusMessage(`Payment successful! Redirecting to wallet section...`);
        setTimeout(() => {
          onClose(); // Close modal before navigation
          navigate('/dashboard/wallet');
        }, 1500);
      } else if (redirectToDashboard) {
        setStatusMessage(`Payment successful! Redirecting to dashboard...`);
        setTimeout(() => {
          onClose(); // Close modal before navigation
          navigate('/dashboard');
        }, 1500);
      } else {
        // If no specific redirection is set, close the modal after success
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setStatusMessage('Payment verification failed. Please contact support.');
      setMessageType('error');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleRecharge = async () => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Creating recharge order...');
      setStatusMessage('');

      // Step 1: Create the recharge order
      const orderResponse = await rechargeWallet(selectedAmount);
      
      setProcessingMessage('Processing payment...');

      // Step 2: Initialize Razorpay payment
      await initRazorpayPayment({
        key: RAZORPAY_KEY_ID,
        amount: orderResponse.amount, // Already in paise
        currency: 'INR',
        name: 'Leads Generator',
        description: 'Wallet Recharge',
        order_id: orderResponse.orderId,
        handler: (response) => handlePaymentVerification(response, selectedAmount),
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: ""
        },
        notes: {
          purpose: "wallet_recharge",
          amount: selectedAmount.toString()
        },
        theme: {
          color: '#38bdf8' // Tailwind sky-500 color
        },
        modal: {
          ondismiss: () => {
            setStatusMessage('Payment cancelled');
            setMessageType('info');
            setIsProcessing(false);
            setProcessingMessage('');
            setAutoStartRecharge(false); // Reset auto-trigger flag if user cancels
          }
        }
      });
    } catch (error: any) {
      console.error('Recharge error:', error);
      setStatusMessage(error.message || 'Failed to process recharge');
      setMessageType('error');
      setIsProcessing(false);
      setProcessingMessage('');
      setAutoStartRecharge(false); // Reset auto-trigger flag on error
    }
  };

  // Get corresponding coins for selected amount
  const getCoinsForAmount = (amount: number): number => {
    return rechargeAmounts.find(option => option.value === amount)?.coins || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Recharge Your Wallet
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                    disabled={isProcessing}
                  >
                    <span className="sr-only">Close</span>
                    <X size={20} />
                  </button>
                </div>
                
                {/* Error message */}
                <div className="mt-4 bg-orange-50 border-l-4 border-orange-500 text-orange-700 p-3 rounded-md flex items-start text-sm">
                  <AlertCircle className="flex-shrink-0 mr-2 mt-0.5" size={16} />
                  <p>{message}</p>
                </div>
                
                {/* Auto-recharge message */}
                {autoStartRecharge && !isProcessing && !statusMessage && (
                  <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-3 rounded-md flex items-start text-sm">
                    <Wallet className="flex-shrink-0 mr-2 mt-0.5" size={16} />
                    <p>The recharge process will start automatically. Please select your preferred amount below.</p>
                  </div>
                )}
                
                {/* Status message */}
                {statusMessage && (
                  <div className={`mt-4 p-3 rounded text-sm ${
                    messageType === 'success' ? 'bg-green-50 text-green-700' : 
                    messageType === 'error' ? 'bg-red-50 text-red-700' : 
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {statusMessage}
                  </div>
                )}
                
                {/* Processing message */}
                {isProcessing && processingMessage && (
                  <div className="mt-4 flex justify-center items-center p-4 bg-blue-50 rounded-md">
                    <Loader className="animate-spin mr-2" size={18} />
                    <span className="text-blue-700">{processingMessage}</span>
                  </div>
                )}
                
                {/* Recharge options */}
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900">Select an amount to recharge</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {rechargeAmounts.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedAmount(option.value)}
                        className={`
                          py-2 rounded-md border text-center transition-all
                          ${selectedAmount === option.value 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                          }
                          ${option.featured ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                        `}
                        disabled={isProcessing}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.coins} coins</div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-sm mt-4">
                    <span className="text-gray-600">Selected amount:</span>
                    <span className="font-medium">₹{selectedAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Coins to receive:</span>
                    <span className="font-medium">{getCoinsForAmount(selectedAmount)} coins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleRecharge}
              disabled={loading || !razorpayLoaded || isProcessing}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading || isProcessing ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Processing...
                </>
              ) : (
                <>
                  Recharge Now <CreditCard size={16} className="ml-2" />
                </>
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RechargeWalletModal; 