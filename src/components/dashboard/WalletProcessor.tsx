import React from 'react';

interface WalletProcessorProps {
  message: string;
}

/**
 * WalletProcessor component to display processing state during Razorpay payment
 */
const WalletProcessor: React.FC<WalletProcessorProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <div className="w-16 h-16 mb-4 relative">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-opacity-50"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Processing...</h3>
      <p className="text-gray-600 text-center">{message}</p>
      <p className="text-sm text-gray-500 mt-4">Please do not close this window</p>
    </div>
  );
};

export default WalletProcessor; 