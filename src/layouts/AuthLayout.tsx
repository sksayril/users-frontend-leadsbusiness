import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Branding */}
      <motion.div 
        className="bg-gradient-to-br from-primary-400 to-primary-800 text-white md:w-1/2 p-8 flex flex-col justify-center items-center"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 text-primary-600" />
            <h1 className="text-3xl font-bold">DataHive</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Manage Your Business with Confidence</h2>
          <p className="text-primary-100 mb-6">
            Our premium dashboard gives you all the tools you need to track leads, analyze performance,
            and grow your business with AI-powered insights.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p>Advanced lead management and categorization</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p>AI-powered business consultant and insights</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p>Premium leads with higher conversion potential</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Right side - Auth Forms */}
      <motion.div 
        className="bg-white md:w-1/2 p-8 flex items-center justify-center"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;