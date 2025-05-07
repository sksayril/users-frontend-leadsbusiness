import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CreditCard, Wallet, ArrowRight, Loader, DollarSign, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { initRazorpayPayment, loadRazorpay, RazorpaySuccessResponse } from '../../utils/razorpay';
import { useAuth } from '../../contexts/AuthContext';

const RAZORPAY_KEY_ID = "rzp_live_ZIhLgmwBjbqzrF"; // Should come from env

// Recharge amounts in INR
const inrRechargeAmounts = [
  // { value: 10, coins: 20, label: '₹10', featured: false },
  { value: 1000, coins: 2000, label: '₹1000', featured: false },
  { value: 2000, coins: 4000, label: '₹2000', featured: false },
  { value: 4000, coins: 8000, label: '₹4000', featured: false },
  { value: 8000, coins: 16000, label: '₹8000', featured: false },
];

// Recharge amounts in USD
const usdRechargeAmounts = [
  { value: 50, coins: 2000, label: '$50', featured: false },
  { value: 100, coins: 4000, label: '$100', featured: false },
  { value: 200, coins: 8000, label: '$200', featured: false },
  { value: 400, coins: 16000, label: '$400', featured: false },
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
  const [selectedAmount, setSelectedAmount] = useState<number>(2000);
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USD'>('INR');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [razorpayLoaded, setRazorpayLoaded] = useState<boolean>(false);
  const [autoStartRecharge, setAutoStartRecharge] = useState<boolean>(false);

  // Get the appropriate recharge amounts based on currency
  const rechargeAmounts = selectedCurrency === 'INR' ? inrRechargeAmounts : usdRechargeAmounts;

  // When currency changes, set a default amount for that currency
  useEffect(() => {
    const defaultAmount = selectedCurrency === 'INR' ? 2000 : 10;
    setSelectedAmount(defaultAmount);
  }, [selectedCurrency]);

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
        amount: amount,
        currency: selectedCurrency
      });

      // Calculate coins
      const coins = getCoinsForAmount(amount);
      const currencySymbol = selectedCurrency === 'INR' ? '₹' : '$';
      setStatusMessage(`Payment successful! Added ${currencySymbol}${amount} to your wallet (${coins} LeadsCoins)`);
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
      const orderResponse = await rechargeWallet(selectedAmount, selectedCurrency);
      
      setProcessingMessage('Processing payment...');

      // Step 2: Initialize Razorpay payment
      await initRazorpayPayment({
        key: RAZORPAY_KEY_ID,
        amount: orderResponse.amount, // Already in paise/cents
        currency: orderResponse.currency,
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
          amount: selectedAmount.toString(),
          currency: selectedCurrency
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
                
                {/* Currency selector */}
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Select currency</h4>
                  <div className="flex space-x-2">
                    <button
                      className={`flex items-center px-4 py-2 rounded-lg border ${
                        selectedCurrency === 'INR' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCurrency('INR')}
                    >
                      <span className="mr-2">₹</span> Indian Rupee
                    </button>
                    <button
                      className={`flex items-center px-4 py-2 rounded-lg border ${
                        selectedCurrency === 'USD' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCurrency('USD')}
                    >
                      <DollarSign size={16} className="mr-1" /> US Dollar
                    </button>
                  </div>
                </div>
                
                {/* Recharge options */}
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900">Select an amount to recharge</h4>
                  <div className="grid grid-cols-2 gap-3 my-3">
                    {rechargeAmounts.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedAmount(option.value)}
                        className={`py-3 px-4 border rounded-lg transition relative ${
                          option.featured ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'
                        } ${
                          selectedAmount === option.value
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {option.featured && (
                          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                            Popular
                          </span>
                        )}
                        <p className="font-medium text-lg text-gray-900">{option.label}</p>
                        <p className="text-gray-500 text-sm flex items-center mt-1">
                          <Wallet size={12} className="mr-1" />
                          {option.coins} LeadCoins
                        </p>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    <div className="flex items-start">
                      <Globe size={16} className="text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-700">You'll get {getCoinsForAmount(selectedAmount)} LeadCoins</p>
                        <p>Use these coins to purchase leads, generate reports, and more.</p>
                      </div>
                    </div>
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