import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { initRazorpayPayment } from '../../utils/razorpay';
import { CreditCard, Check, Sparkles, Briefcase, Users, Award, Brain, Zap, Star, Shield, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';

const RAZORPAY_KEY_ID = "rzp_test_BDT2TegS4Ax6Vp"; // Ideally this should be in an environment variable

type PlanType = 'MONTHLY';

interface PlanFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Billing: React.FC = () => {
  const { user } = useAuth();
  const { subscription, createSubscription, verifySubscriptionPayment, refreshWallet, loading, error } = useWallet();
  const [processingPlan, setProcessingPlan] = useState<PlanType | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' }>({ text: '', type: 'info' });
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    if (error) {
      setMessage({ text: error, type: 'error' });
    }
  }, [error]);

  useEffect(() => {
    // Calculate days remaining in subscription
    if (subscription?.isActive && subscription.endDate) {
      const today = new Date();
      const endDate = new Date(subscription.endDate);
      const days = differenceInDays(endDate, today);
      setDaysRemaining(days);
    }
  }, [subscription]);

  // Function to handle subscription creation
  const handleSubscribe = async (plan: PlanType) => {
    try {
      setProcessingPlan(plan);
      setMessage({ text: 'Creating subscription order...', type: 'info' });
      
      // Step 1: Create subscription order
      const orderResponse = await createSubscription(plan);
      
      // Step 2: Open Razorpay
      await initRazorpayPayment({
        key: RAZORPAY_KEY_ID,
        amount: 399 * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'Leads Generator',
        description: 'Monthly Business Subscription',
        order_id: orderResponse.orderId,
        handler: async (response) => {
          try {
            setMessage({ text: 'Verifying payment...', type: 'info' });
            
            // Step 3: Verify payment
            await verifySubscriptionPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            setMessage({ text: 'Subscription activated successfully!', type: 'success' });
            // Refresh wallet data
            await refreshWallet();
          } catch (error) {
            setMessage({ text: 'Payment verification failed. Please contact support.', type: 'error' });
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: {
          color: '#3B82F6' // Tailwind blue-500 color
        },
        modal: {
          ondismiss: () => {
            setMessage({ text: 'Payment cancelled by user', type: 'info' });
            setProcessingPlan(null);
          }
        }
      });
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to process subscription', type: 'error' });
    } finally {
      setProcessingPlan(null);
    }
  };

  // Plan features
  const planFeatures: PlanFeature[] = [
    {
      title: "Unlimited Lead Previews",
      description: "Access all leads in our database with no viewing restrictions",
      icon: <Users className="text-blue-500" size={24} />
    },
    {
      title: "Lead Purchase Capability",
      description: "Purchase high-quality leads with detailed contact information",
      icon: <Award className="text-blue-500" size={24} />
    },
    {
      title: "5 Scraper Requests Daily",
      description: "Automatically scrape potential leads from various sources",
      icon: <Zap className="text-blue-500" size={24} />
    },
    {
      title: "Unlimited Business AI Access",
      description: "Get expert business advice and insights from our AI consultant",
      icon: <Brain className="text-blue-500" size={24} />
    },
    {
      title: "Email Technical Support",
      description: "Get help whenever you need it with our responsive support team",
      icon: <Briefcase className="text-blue-500" size={24} />
    }
  ];

  const showRenewButton = subscription?.isActive && daysRemaining <= 10;

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      <motion.div 
        className="flex items-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-blue-500 p-2 rounded-lg mr-4 shadow-lg">
          <CreditCard size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Premium Plans</h1>
          <p className="text-gray-600">Unlock our premium features to grow your business</p>
        </div>
      </motion.div>
      
      {message.text && (
        <motion.div 
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
            'bg-blue-50 text-blue-700 border border-blue-100'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {message.text}
        </motion.div>
      )}

      {/* Current Subscription Status */}
      <motion.div 
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold mb-3 flex items-center">
          <Shield size={20} className="mr-2 text-blue-500" />
          Subscription Status
        </h2>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {subscription?.isActive ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                      <Crown size={14} className="mr-1" /> 
                      Premium Active
                    </span>
                    
                    {daysRemaining <= 10 && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 rounded-full ml-2">
                        Expires Soon!
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium mt-2 flex items-center">
                    <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600">
                      {subscription.plan} Business Pro
                    </span>
                  </h3>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-600 flex items-center">
                      <Star size={16} className="text-amber-500 mr-1" /> 
                      Premium benefits unlocked
                    </p>
                    <p className="text-gray-600">
                      Expires on {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                    <p className="font-medium text-blue-600">
                      {daysRemaining} days remaining
                    </p>
                  </div>
                </div>
                
                {showRenewButton ? (
                  <div className="md:text-right">
                    <p className="text-amber-600 text-sm mb-2">Your subscription expires soon!</p>
                    <button 
                      className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md w-full md:w-auto"
                      onClick={() => handleSubscribe('MONTHLY')}
                    >
                      Renew Now
                    </button>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 md:max-w-xs">
                    <p className="text-blue-800 text-sm font-medium">
                      You're a premium subscriber! Enjoy all the benefits of our Business Pro plan.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Progress bar showing days remaining */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      daysRemaining <= 5 ? 'bg-red-500' : 
                      daysRemaining <= 10 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full flex items-center inline-block">
                  <Shield size={14} className="mr-1" /> 
                  No Active Subscription
                </span>
                <p className="text-gray-600 mt-2">
                  Subscribe to unlock premium features including AI business consultant, lead purchases, and more.
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <button 
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md w-full md:w-auto"
                  onClick={() => handleSubscribe('MONTHLY')}
                >
                  Subscribe Now
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Business Pro Plan */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Plan Card */}
        <div className="md:col-span-1">
          <motion.div 
            className="bg-white rounded-xl shadow-xl overflow-hidden border border-blue-100 h-full relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5 }}
          >
            {/* Popular badge */}
            <div className="absolute top-5 right-5 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full transform rotate-3">
              POPULAR
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full transform -translate-x-8 translate-y-8 blur-lg"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-2xl font-bold">Business Pro</h3>
                  <p className="text-blue-100 mt-1">Monthly Subscription</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Sparkles className="text-white" size={20} />
                </div>
              </div>
              <div className="mt-6 relative z-10">
                <div className="flex items-end">
                  <span className="text-4xl font-bold">₹399</span>
                  <span className="text-blue-100 ml-2">/month</span>
                </div>
                <p className="mt-3 text-blue-100">Billed monthly. Cancel anytime.</p>
              </div>
            </div>
            
            <div className="p-6">
              <button
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition shadow-md ${
                  processingPlan === 'MONTHLY'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
                onClick={() => handleSubscribe('MONTHLY')}
                disabled={processingPlan !== null || loading}
              >
                {processingPlan === 'MONTHLY' 
                  ? 'Processing...' 
                  : subscription?.plan === 'MONTHLY' && subscription.isActive 
                    ? (daysRemaining <= 10 ? 'Renew Now' : 'Already Subscribed')
                    : 'Subscribe Now'}
              </button>
              
              <p className="text-sm text-gray-500 mt-4 text-center">
                Secure payment processed by Razorpay
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Features */}
        <div className="md:col-span-2">
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Star className="text-amber-500 mr-2" size={20} />
              Everything You Need To Grow Your Business
            </h3>
            
            <div className="space-y-6">
              {planFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start bg-gray-50 p-4 rounded-lg hover:bg-blue-50 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex-shrink-0 p-2 bg-white rounded-lg mr-4 shadow-sm">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Shield className="text-blue-500 mr-2" size={18} /> 
                Why Choose Our Business Plan?
              </h4>
              <p className="text-gray-600 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                Our Business Pro plan gives you all the tools you need to identify, connect with, and convert 
                high-quality leads. With <span className="font-medium text-blue-700">unlimited access to our AI Business Consultant</span>, you'll get expert 
                advice on optimizing your business strategy - all for just ₹399 per month.
              </p>
              
              <div className="mt-4 bg-amber-50 p-4 rounded-lg border border-amber-100">
                <p className="text-amber-800 text-sm">
                  <span className="font-medium">✨ Special Offer:</span> Subscribe now and get your first AI consultation completely customized for your business needs!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Billing;