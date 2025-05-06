import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  Brain, 
  CreditCard, 
  LogOut, 
  Menu, 
  X,
  Briefcase,
  Lock,
  ChevronRight,
  UserCircle,
  Mail,
  Headphones,
  MessageSquare,
  TicketIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import authService, { UserProfile } from '../services/authService';
import UserProfilePopup from '../components/UserProfilePopup';

const DashboardLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const { subscription } = useWallet();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionPopupOpen, setSubscriptionPopupOpen] = useState(false);
  const [supportPopupOpen, setSupportPopupOpen] = useState(false);
  const [supportType, setSupportType] = useState<'ticket' | 'chat' | null>(null);
  
  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);
  
  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      setSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPremiumRoute = (path: string) => {
    return ['/categorized-leads', '/premium-leads', '/ai-consultant'].includes(path);
  };

  const handleNavigation = (path: string, e: React.MouseEvent) => {
    if (isPremiumRoute(path) && (!subscription || !subscription.isActive)) {
      e.preventDefault();
      setSubscriptionPopupOpen(true);
    }
  };

  const handleSupportAction = (type: 'ticket' | 'chat') => {
    setSupportType(type);
    setSupportPopupOpen(true);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, premium: false },
    { path: '/categorized-leads', label: 'Categorized Leads', icon: <Users size={20} />, premium: true },
    { path: '/premium-leads', label: 'Premium Leads', icon: <Award size={20} />, premium: true },
    { path: '/ai-consultant', label: 'AI Business Consultant', icon: <Brain size={20} />, premium: true },
    { path: '/billing', label: 'Plans', icon: <CreditCard size={20} />, premium: false },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2.5 rounded-lg bg-white shadow-lg text-primary-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mobileMenuOpen ? 'close' : 'menu'}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>
      
      {/* Sidebar for mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            ></motion.div>
            <motion.div
              className="absolute top-0 left-0 w-72 h-full"
              initial={{ x: -280, opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="h-full sidebar rounded-r-xl shadow-2xl">
                <SidebarContent 
                  navItems={navItems} 
                  handleLogout={handleLogout} 
                  user={user}
                  subscription={subscription}
                  handleNavigation={handleNavigation}
                  handleSupportAction={handleSupportAction}
                  closeMobileMenu={() => setMobileMenuOpen(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Desktop Sidebar */}
      <div 
        className={`hidden lg:block relative z-10 ${sidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 ease-in-out`}
      >
        <div className="h-full sidebar">
          <SidebarContent 
            navItems={navItems} 
            handleLogout={handleLogout} 
            user={user}
            subscription={subscription}
            handleNavigation={handleNavigation}
            handleSupportAction={handleSupportAction}
            minimized={!sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="py-6 px-8 flex-1">
          <Outlet />
        </div>
        
        {/* Footer */}
        <footer className="border-t border-gray-200 py-4 px-6 bg-white mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-3 sm:mb-0">
              <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} Datahiv. All rights reserved.</p>
            </div>
            <div className="flex items-center space-x-4">
              <a href="mailto:info.cripcocode@gmail.com" className="text-sm text-gray-600 hover:text-blue-600 flex items-center">
                <Mail size={16} className="mr-1.5 text-gray-500" />
                info.cripcocode@gmail.com
              </a>
              <span className="text-gray-300">|</span>
              <a href="#" className="text-sm text-gray-600 hover:text-blue-600">Support</a>
              <span className="text-gray-300">|</span>
              <a href="#" className="text-sm text-gray-600 hover:text-blue-600">Privacy Policy</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Subscription Popup */}
      <AnimatePresence>
        {subscriptionPopupOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSubscriptionPopupOpen(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                  <Lock className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Required</h3>
                <p className="text-gray-600 mb-6">
                  You need an active subscription to access this feature. Subscribe now to unlock all premium features.
                </p>
                <div className="bg-white rounded-lg shadow overflow-hidden border mb-6">
                  <div className="bg-sky-500 text-white text-center py-1.5 text-sm font-medium">
                    Monthly Plan
                  </div>
                  <div className="p-4">
                    <div className="flex flex-col items-center justify-center mb-2">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold">₹399</span>
                        <span className="text-gray-500 ml-1 text-sm">/month</span>
                      </div>
                      <div className="flex items-baseline mt-1">
                        <span className="text-xl font-bold text-gray-700">$5.99</span>
                        <span className="text-gray-500 ml-1 text-sm">USD</span>
                      </div>
                    </div>
                    <ul className="mb-4 space-y-2 text-sm text-gray-600">
                      <li className="flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Unlimited lead previews
                      </li>
                      <li className="flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Lead purchase capability
                      </li>
                      <li className="flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        5 scraper requests per day
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                      setSubscriptionPopupOpen(false);
                      navigate('/billing');
                    }}
                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Subscribe Now
                  </button>
                  <button 
                    onClick={() => setSubscriptionPopupOpen(false)}
                    className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Support Popup */}
      <AnimatePresence>
        {supportPopupOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSupportPopupOpen(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  {supportType === 'ticket' ? (
                    <TicketIcon className="h-8 w-8 text-blue-600" />
                  ) : (
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {supportType === 'ticket' ? 'Submit Support Ticket' : 'Chat with Admin'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {supportType === 'ticket' 
                    ? 'Describe your issue and our support team will get back to you as soon as possible.' 
                    : 'Start a conversation with our admin team for quick assistance.'}
                </p>
                
                {supportType === 'ticket' ? (
                  <div className="mb-6">
                    <div className="mb-4">
                      <input 
                        type="text" 
                        placeholder="Subject" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <textarea 
                        placeholder="Describe your issue in detail..." 
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                    <p className="text-gray-600 text-sm">
                      Our admin team is available Monday to Friday, 9 AM to 6 PM. 
                      Average response time: 15 minutes.
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                      // Here would be the logic to submit ticket or start chat
                      setSupportPopupOpen(false);
                      // Show confirmation message
                      alert(supportType === 'ticket' ? 'Ticket submitted successfully!' : 'Chat request sent!');
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    {supportType === 'ticket' ? 'Submit Ticket' : 'Start Chat'}
                  </button>
                  <button 
                    onClick={() => setSupportPopupOpen(false)}
                    className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type SidebarContentProps = {
  navItems: { path: string; label: string; icon: React.ReactNode; premium: boolean }[];
  handleLogout: () => void;
  user: { name: string; email: string } | null;
  subscription: { isActive: boolean } | null;
  handleNavigation: (path: string, e: React.MouseEvent) => void;
  handleSupportAction: (type: 'ticket' | 'chat') => void;
  minimized?: boolean;
  toggleSidebar?: () => void;
  closeMobileMenu?: () => void;
};

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  navItems, 
  handleLogout, 
  user,
  subscription,
  handleNavigation,
  handleSupportAction,
  minimized = false,
  toggleSidebar,
  closeMobileMenu
}) => {
  const isSubscriptionActive = subscription?.isActive || false;
  const location = useLocation();
  
  // User profile popup state
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const handleProfileClick = async () => {
    setShowProfilePopup(true);
    
    if (!userProfile && !profileLoading) {
      try {
        setProfileLoading(true);
        setProfileError(null);
        const profile = await authService.getUserProfile();
        setUserProfile(profile);
        setProfileLoading(false);
      } catch (error: any) {
        setProfileError(error.response?.data?.message || 'Failed to load profile data');
        setProfileLoading(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="flex items-center py-6 px-4 border-b border-white/10">
        <div className="flex items-center">
          <div className="bg-white rounded-lg p-1.5 shadow-lg">
          <img src="/logo2.jpg" alt="Logo" className="w-12 h-12 text-primary-600" />

          </div>
          {!minimized && (
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-3 text-xl font-bold text-white"
            >
              DataHive
            </motion.h1>
          )}
        </div>
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar} 
            className="ml-auto lg:block hidden p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            {minimized ? <ChevronRight size={18} /> : <X size={18} />}
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-6 px-2 overflow-y-auto">
        <div className={`mb-6 ${minimized ? 'px-2' : 'px-3'}`}>
          <p className={`text-xs uppercase font-semibold text-white/50 mb-3 ${minimized ? 'text-center' : ''}`}>
            {minimized ? 'Menu' : 'Main Menu'}
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              const isPremiumFeature = item.premium && !isSubscriptionActive;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    if (closeMobileMenu) closeMobileMenu();
                    handleNavigation(item.path, e);
                  }}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 
                    ${isActive 
                      ? "bg-white/20 text-white font-medium" 
                      : "text-white/70 hover:text-white hover:bg-white/10"} 
                    ${minimized ? "justify-center" : ""}`}
                >
                  <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                    {item.icon}
                  </div>
                  
                  {!minimized && (
                    <span className="flex-1 transition-all">
                      {item.label}
                    </span>
                  )}
                  
                  {isPremiumFeature && !minimized && (
                    <div className="bg-amber-500/20 rounded-full p-1">
                      <Lock size={14} className="text-amber-300" />
                    </div>
                  )}
                  
                  {isPremiumFeature && minimized && (
                    <div className="absolute -top-1 -right-1 bg-amber-500/20 rounded-full p-1">
                      <Lock size={12} className="text-amber-300" />
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
        
        {/* Support Section */}
        <div className={`mb-6 ${minimized ? 'px-2' : 'px-3'}`}>
          <p className={`text-xs uppercase font-semibold text-white/50 mb-3 ${minimized ? 'text-center' : ''}`}>
            {minimized ? 'Help' : 'Support & Help'}
          </p>
          <div className="space-y-1.5">
            <button
              onClick={() => handleSupportAction('ticket')}
              className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 
                text-white/70 hover:text-white hover:bg-white/10
                ${minimized ? "justify-center" : ""}`}
            >
              <div className="flex-shrink-0 text-white/70 group-hover:text-white">
                <TicketIcon size={20} />
              </div>
              
              {!minimized && (
                <span className="flex-1 transition-all text-left">
                  Raise Support Ticket
                </span>
              )}
            </button>
            
            <button
              onClick={() => handleSupportAction('chat')}
              className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 
                text-white/70 hover:text-white hover:bg-white/10
                ${minimized ? "justify-center" : ""}`}
            >
              <div className="flex-shrink-0 text-white/70 group-hover:text-white">
                <MessageSquare size={20} />
              </div>
              
              {!minimized && (
                <span className="flex-1 transition-all text-left">
                  Chat with Admin
                </span>
              )}
            </button>
            
            <a 
              href="mailto:info.cripcocode@gmail.com"
              className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 
                text-white/70 hover:text-white hover:bg-white/10
                ${minimized ? "justify-center" : ""}`}
            >
              <div className="flex-shrink-0 text-white/70 group-hover:text-white">
                <Mail size={20} />
              </div>
              
              {!minimized && (
                <span className="flex-1 transition-all text-left">
                  Email Support
                </span>
              )}
            </a>
          </div>
        </div>
      </div>
      
      {/* User profile */}
      <div className={`mt-auto border-t border-white/10 pt-4 pb-2 ${minimized ? "text-center px-2" : "px-4"}`}>
        {!minimized && user && (
          <div 
            className="flex items-center mb-4 py-2 px-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
            onClick={handleProfileClick}
          >
            <div className="p-1 rounded-full bg-white/10 mr-3">
              <UserCircle size={28} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/60 truncate">{user.email}</p>
            </div>
          </div>
        )}
        
        {minimized && user && (
          <div 
            className="mb-4 cursor-pointer"
            onClick={handleProfileClick}
          >
            <div className="mx-auto p-1.5 rounded-full bg-white/10 w-fit hover:bg-white/20 transition-colors">
              <UserCircle size={24} className="text-white" />
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`flex items-center text-white/70 hover:text-white px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors w-full ${minimized ? "justify-center" : ""}`}
        >
          <LogOut size={20} />
          {!minimized && <span className="ml-3">Logout</span>}
        </button>
      </div>

      {/* User Profile Popup */}
      <AnimatePresence>
        {showProfilePopup && (
          <UserProfilePopup
            profile={userProfile}
            isLoading={profileLoading}
            error={profileError}
            onClose={() => setShowProfilePopup(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;