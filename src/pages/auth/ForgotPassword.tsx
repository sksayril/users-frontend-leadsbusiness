import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setIsSuccess(false);
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setIsSuccess(false);
      setMessage('Password must be at least 8 characters long');
      return;
    }
    
    try {
      await resetPassword({
        email,
        securityAnswer,
        newPassword
      });
      setIsSuccess(true);
      setMessage('Password reset successful. You can now login with your new password.');
    } catch (error: any) {
      setIsSuccess(false);
      setMessage(error.response?.data?.message || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to="/login" className="inline-flex items-center text-primary-600 hover:text-primary-500 mb-6">
        <ArrowLeft size={16} className="mr-2" />
        Back to login
      </Link>
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
        <p className="text-gray-600 mt-2">
          Enter your email and security answer to reset your password
        </p>
      </div>
      
      {message && (
        <div className={`p-4 rounded-md mb-6 ${
          isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
        }`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="securityAnswer" className="form-label">
            Security Answer
          </label>
          <input
            id="securityAnswer"
            type="text"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            className="form-input"
            placeholder="Answer to your security question"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the answer to the security question you provided during signup
          </p>
        </div>

        <div>
          <label htmlFor="newPassword" className="form-label">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="form-input"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="form-label">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
            placeholder="••••••••"
            required
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : null}
            {loading ? 'Resetting password...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ForgotPassword;