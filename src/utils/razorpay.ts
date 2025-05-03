// This is a TypeScript declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}

// This function loads the Razorpay script if it's not loaded already
export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Return true immediately if Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      // If script is already loading, wait for it
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => {
        console.error('Failed to load Razorpay SDK (existing script)');
        resolve(false);
      });
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay SDK loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Create a Razorpay instance for payment
export const initRazorpayPayment = async (options: RazorpayOptions): Promise<void> => {
  // Ensure Razorpay is loaded
  const isLoaded = await loadRazorpay();
  
  if (!isLoaded) {
    throw new Error('Failed to load Razorpay SDK');
  }

  try {
    const razorpay = new window.Razorpay(options);
    
    // Add error handler for payment failures
    razorpay.on('payment.failed', function(response: { error: RazorpayError }) {
      console.error('Payment failed:', response.error);
      if (options.modal?.ondismiss) {
        options.modal.ondismiss();
      }
    });
    
    razorpay.open();
  } catch (error) {
    console.error('Error initializing Razorpay:', error);
    throw new Error('Failed to initialize payment gateway');
  }
};

// Helper function to generate a transaction ID
export const generateTransactionId = (): string => {
  return 'txn_' + Math.random().toString(36).substr(2, 9);
}; 