import React, { useEffect, useState } from 'react';
import { Users, Briefcase, LineChart, TrendingUp, DollarSign, Loader } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart as RechartLineChart } from 'recharts';
import StatsCard from '../../components/dashboard/StatsCard';
import LeadTable from '../../components/dashboard/LeadTable';
import WalletCard from '../../components/dashboard/WalletCard';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import dashboardService, { DashboardData } from '../../services/dashboardService';
import { format } from 'date-fns';

// Define the Lead type to match what LeadTable expects
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: LeadStatus;
  date: string;
  value: number;
}

// Interface for transaction data that can be displayed in the table
interface Transaction {
  id: string;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  coins: number;
  date: string;
}

const Dashboard: React.FC = () => {
  const { subscription, refreshWallet } = useWallet();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
    refreshWallet();
  }, [refreshWallet]);

  // Process lead stats data for charts
  const processLeadStats = () => {
    if (!dashboardData) return [];
    
    return dashboardData.leads.dailyStats.map(stat => ({
      name: format(new Date(stat.date), 'MMM dd'),
      count: stat.count,
      coins: stat.coinsSpent
    })).reverse(); // Reverse to show oldest first
  };

  // Convert transactions to leads table format
  const transactionsToLeads = (): Lead[] => {
    if (!dashboardData) return [];
    
    return dashboardData.recentTransactions.map(transaction => ({
      id: transaction._id,
      name: transaction.description,
      email: '', // Not available in transaction data
      company: '', // Not available in transaction data
      status: transaction.type === 'CREDIT' ? 'qualified' : 'new',
      date: format(new Date(transaction.date), 'MMM dd, yyyy'),
      value: transaction.coins
    }));
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // If error, show error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
              <button
                onClick={() => window.location.reload()}
                className="ml-2 font-medium underline text-red-700 hover:text-red-600"
              >
                Retry
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const leadsData = processLeadStats();
  
  // Use subscription data from the dashboard API if available
  const activeSubscription = dashboardData?.subscription?.isActive || subscription?.isActive || false;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {dashboardData?.user?.name || user?.name}! Here's an overview of your account</p>
      </div>
      
      {/* Subscription Alert */}
      {!activeSubscription && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Subscription required</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Subscribe to a plan to unlock all features including lead purchases and advanced search.
                  <Link to="/billing" className="font-medium text-amber-800 underline hover:text-amber-600 ml-2">
                    Subscribe now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscription Info */}
      {dashboardData?.subscription?.isActive && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Active Subscription</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your {dashboardData.subscription.plan.toLowerCase()} plan is active. 
                  <span className="ml-2 font-medium">
                    {dashboardData.subscription.daysRemaining} days remaining
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Wallet and Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WalletCard />
        </div>
        
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatsCard 
              title="Total Leads" 
              value={dashboardData?.leads?.totalPurchased?.toString() || "0"} 
              icon={<Users size={24} className="text-primary-600" />}
              change={{ value: 0, isPositive: true }}
            />
            <StatsCard 
              title="Leads Coins" 
              value={dashboardData?.wallet?.leadsCoins?.toString() || "0"} 
              icon={<Briefcase size={24} className="text-primary-600" />}
              change={{ value: 0, isPositive: true }}
            />
            <StatsCard 
              title="Spent Coins" 
              value={dashboardData?.wallet?.totalSpentCoins?.toString() || "0"} 
              icon={<LineChart size={24} className="text-primary-600" />}
              change={{ value: 0, isPositive: false }}
            />
            <StatsCard 
              title="Account Balance" 
              value={`₹${dashboardData?.wallet?.balance || 0}`} 
              icon={<DollarSign size={24} className="text-primary-600" />}
              change={{ value: 0, isPositive: true }}
            />
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Lead Acquisition</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={leadsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Coins Spent</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartLineChart
                data={leadsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="coins" 
                  name="Coins" 
                  stroke="#F59E0B" 
                  strokeWidth={3} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }}
                />
              </RechartLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
        </div>
        <div className="p-6">
          {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentTransactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.coins}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent transactions found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;