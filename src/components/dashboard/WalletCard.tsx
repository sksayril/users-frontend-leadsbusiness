import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, CreditCard, ArrowRight, Lock, DollarSign, Globe } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { initRazorpayPayment, loadRazorpay, RazorpaySuccessResponse } from '../../utils/razorpay';
import WalletProcessor from './WalletProcessor';
import SubscriptionRequiredPopup from '../SubscriptionRequiredPopup';
import { AnimatePresence, motion } from 'framer-motion';

const RAZORPAY_KEY_ID = "rzp_test_BDT2TegS4Ax6Vp"; // Ideally from env variable

// Recharge amounts in INR
const inrRechargeAmounts = [
  { value: 100, coins: 200, label: '₹100', featured: false },
  { value: 250, coins: 500, label: '₹250', featured: true },
  { value: 500, coins: 1000, label: '₹500', featured: false },
  { value: 1000, coins: 2000, label: '₹1000', featured: false },
];

// Recharge amounts in USD
const usdRechargeAmounts = [
  { value: 5, coins: 200, label: '$5', featured: false },
  { value: 10, coins: 500, label: '$10', featured: true },
  { value: 20, coins: 1000, label: '$20', featured: false },
  { value: 50, coins: 2500, label: '$50', featured: false },
];

const WalletCard: React.FC = () => {
  const { user } = useAuth();
  const { wallet, subscription, rechargeWallet, verifyRechargePayment, refreshWallet, loading } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number>(250);
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USD'>('INR');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [razorpayLoaded, setRazorpayLoaded] = useState<boolean>(false);
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState<boolean>(false);

  const isSubscriptionActive = subscription?.isActive || false;
  
  // Get the appropriate recharge amounts based on currency
  const rechargeAmounts = selectedCurrency === 'INR' ? inrRechargeAmounts : usdRechargeAmounts;

  // When currency changes, set a default amount for that currency
  useEffect(() => {
    const defaultAmount = selectedCurrency === 'INR' ? 250 : 10;
    setSelectedAmount(defaultAmount);
  }, [selectedCurrency]);

  // Load Razorpay script on component mount
  useEffect(() => {
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
    
    loadRazorpayScript();
  }, []);

  // Handle payment verification as a memoized function to prevent recreation
  const handlePaymentVerification = useCallback(async (response: RazorpaySuccessResponse, amount: number) => {
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
    } catch (error) {
      setStatusMessage('Payment verification failed. Please contact support.');
      setMessageType('error');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  }, [verifyRechargePayment, refreshWallet, selectedCurrency]);

  const handleRecharge = async () => {
    // Check if user has an active subscription
    if (!isSubscriptionActive) {
      setShowSubscriptionPopup(true);
      return;
    }
    
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
          color: '#3B82F6' // Tailwind blue-500 color
        },
        modal: {
          ondismiss: () => {
            setStatusMessage('Payment cancelled');
            setMessageType('info');
            setIsProcessing(false);
            setProcessingMessage('');
          }
        }
      });
    } catch (error: any) {
      setStatusMessage(error.message || 'Failed to process recharge');
      setMessageType('error');
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  // Get corresponding coins for selected amount
  const getCoinsForAmount = (amount: number): number => {
    return rechargeAmounts.find(option => option.value === amount)?.coins || 0;
  };

  // If processing, show the processor component
  if (isProcessing) {
    return <WalletProcessor message={processingMessage} />;
  }

  return (
    <>
      <motion.div 
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full transform translate-x-20 -translate-y-20 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full transform -translate-x-20 translate-y-20 blur-xl"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h3 className="text-xl font-semibold flex items-center">
                <Wallet className="mr-2" size={20} />
                My Wallet
              </h3>
              <div className="mt-4 flex items-baseline space-x-2">
                <span className="text-3xl font-bold">₹{wallet?.balance || 0}</span>
                <span>|</span>
                <span className="text-xl">{wallet?.leadsCoins || 0} Coins</span>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <CreditCard size={32} />
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-medium text-gray-900">Recharge Wallet</h4>
              <p className="text-gray-600 text-sm">Select an amount to recharge your wallet</p>
            </div>
            
            {!isSubscriptionActive && (
              <div className="bg-amber-100 rounded-full px-3 py-1 text-amber-800 text-xs font-medium flex items-center">
                <Lock size={14} className="mr-1" />
                Subscription Required
              </div>
            )}
          </div>
          
          {statusMessage && (
            <div id="messageBox" className={`mb-4 p-3 rounded-lg text-sm ${
              messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 
              messageType === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 
              'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              {statusMessage}
            </div>
          )}
          
          {/* Currency selector */}
          <div className="mb-4">
            <div className="flex space-x-2">
              <button
                className={`flex items-center px-3 py-1.5 rounded-lg border ${
                  selectedCurrency === 'INR' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCurrency('INR')}
              >
                <span className="mr-2">₹</span> INR
              </button>
              <button
                className={`flex items-center px-3 py-1.5 rounded-lg border ${
                  selectedCurrency === 'USD' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCurrency('USD')}
              >
                <DollarSign size={14} className="mr-1" /> USD
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {rechargeAmounts.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedAmount(option.value)}
                className={`
                  py-2 rounded-lg border text-center transition-all
                  ${selectedAmount === option.value 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                  }
                  ${option.featured ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                `}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500">{option.coins} coins</div>
              </button>
            ))}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Selected amount:</span>
              <span className="font-medium" id="amount">
                {selectedCurrency === 'INR' ? '₹' : '$'}{selectedAmount}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Coins to receive:</span>
              <span className="font-medium" id="coinsToReceive">{getCoinsForAmount(selectedAmount)} coins</span>
            </div>
          </div>
          
          <button
            id="payButton"
            onClick={handleRecharge}
            disabled={loading || !razorpayLoaded}
            className={`w-full py-2.5 rounded-lg flex items-center justify-center transition
              ${!isSubscriptionActive 
                ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
              } shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                Recharge Now <ArrowRight className="ml-2" size={16} />
              </>
            )}
          </button>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {showSubscriptionPopup && (
          <SubscriptionRequiredPopup onClose={() => setShowSubscriptionPopup(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default WalletCard; 