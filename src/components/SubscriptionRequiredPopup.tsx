import React from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionRequiredPopupProps {
  onClose: () => void;
}

const SubscriptionRequiredPopup: React.FC<SubscriptionRequiredPopupProps> = ({ onClose }) => {
  const navigate = useNavigate();
  
  const handleSubscribeClick = () => {
    navigate('/billing');
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full transform -translate-x-8 translate-y-8 blur-xl"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <h2 className="text-xl font-semibold">Subscription Required</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-white/70 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex items-center mt-4 relative z-10">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm mr-4">
              <Lock size={24} className="text-white" />
            </div>
            <p className="text-white/90">
              Unlock premium features to recharge your wallet
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard size={36} className="text-blue-600" />
            </div>
          </div>
          
          <h3 className="text-center text-lg font-semibold mb-3">Subscribe to Recharge</h3>
          
          <p className="text-gray-600 text-center mb-6">
            You need an active subscription to recharge your wallet and access premium features.
          </p>
          
          {/* Add pricing information */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
            <div className="bg-blue-500 text-white text-center py-1.5 text-sm font-medium">
              Monthly Plan
            </div>
            <div className="p-4 text-center">
              <div className="flex flex-col items-center justify-center mb-3">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">₹399</span>
                  <span className="text-gray-500 ml-1 text-sm">/month</span>
                </div>
                <div className="flex items-baseline mt-1">
                  <span className="text-xl font-bold text-gray-700">$5.99</span>
                  <span className="text-gray-500 ml-1 text-sm">USD</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">Get access to all premium features</div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-800 mb-2">Premium Benefits:</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 text-blue-500">•</div>
                <span className="ml-2 text-blue-700">Wallet recharge capability</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 text-blue-500">•</div>
                <span className="ml-2 text-blue-700">Unlimited AI Business Consultant</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 text-blue-500">•</div>
                <span className="ml-2 text-blue-700">Lead purchase and scraping features</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Footer with action buttons */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubscribeClick}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center justify-center"
          >
            Subscribe Now <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionRequiredPopup; 