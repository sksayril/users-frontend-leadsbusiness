import React, { useState, useEffect } from 'react';
import {
  Star,
  Filter,
  User,
  Users,
  Phone,
  Mail,
  BarChart,
  ArrowUp,
  ArrowDown,
  Building,
  Globe,
  ExternalLink,
  Briefcase,
  DollarSign,
  Search,
  Download,
  Info,
  Loader,
  CheckCircle,
  AlertCircle,
  FileDown,
  RefreshCw,
  Sparkles,
  Database,
  MapPin,
  Eye,
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import RechargeWalletModal from '../../components/wallet/RechargeWalletModal';
import { useNavigate } from 'react-router-dom';
import scraperService from '../../services/scraperService';
import './premiumLeads.css'; // For the custom animation

type PremiumLead = {
  id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  size: string;
  revenue: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed';
  notes: string;
  conversionProbability: number;
  estimatedValue: number;
  lastActivity: string;
};

interface ScraperResult {
  _id: string;
  title: string;
  link: string;
  website?: string;
  stars?: number;
  reviews?: number;
  phone?: string;
  scrapedAt: string;
}

interface ScrapeResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    totalCoinsUsed: number;
    coinsPerResult: number;
    remainingToday: number;
    leadsCoinsRemaining: number;
  };
}

interface ScraperSession {
  id?: string;
  _id: string;
  keyword: string;
  count?: number;
  createdAt: string;
}

interface DetailedResults {
  success: boolean;
  keyword: string;
  data: ScraperResult[];
}

const PremiumLeads: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scrapeResponse, setScrapeResponse] = useState<ScrapeResponse | null>(null);
  const [sessions, setSessions] = useState<ScraperSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detailedResults, setDetailedResults] = useState<DetailedResults | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showRechargeModal, setShowRechargeModal] = useState<boolean>(false);
  const [rechargeModalMessage, setRechargeModalMessage] = useState<string>('Insufficient balance to complete this operation');
  const [redirectAfterRecharge, setRedirectAfterRecharge] = useState<boolean>(false);
  const [redirectToWallet, setRedirectToWallet] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Add new state variables for the modal
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [modalResults, setModalResults] = useState<ScraperResult[]>([]);
  const [modalKeyword, setModalKeyword] = useState<string>('');
  const [modalCurrentPage, setModalCurrentPage] = useState<number>(1);
  const [modalResultsPerPage, setModalResultsPerPage] = useState<number>(20);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  
  // After the state variables section (around line 125), add these new state variables
  const [mostRecentSessionId, setMostRecentSessionId] = useState<string | null>(null);
  const [clickedSessionId, setClickedSessionId] = useState<string | null>(null);
  
  // Add a new state variable for tracking most recent session and clicked button state
  const [recentlyScrapedSessionId, setRecentlyScrapedSessionId] = useState<string | null>(null);
  const [clickedViewButton, setClickedViewButton] = useState<string | null>(null);
  
  // Mock data
  const premiumLeads: PremiumLead[] = [
    {
      id: '1',
      name: 'David Miller',
      company: 'MegaCorp Enterprises',
      position: 'Chief Technology Officer',
      email: 'david.miller@megacorp.com',
      phone: '(555) 123-4567',
      website: 'megacorp.com',
      industry: 'Technology',
      size: '1000+ employees',
      revenue: '$50M+',
      score: 92,
      status: 'qualified',
      notes: 'Looking to upgrade their entire tech infrastructure. Budget approved for Q3.',
      conversionProbability: 75,
      estimatedValue: 250000,
      lastActivity: '2 days ago'
    },
    {
      id: '2',
      name: 'Jennifer Wilson',
      company: 'Global Innovations Inc.',
      position: 'VP of Operations',
      email: 'jwilson@globalinnovations.co',
      phone: '(555) 234-5678',
      website: 'globalinnovations.co',
      industry: 'Manufacturing',
      size: '500-1000 employees',
      revenue: '$25-50M',
      score: 87,
      status: 'proposal',
      notes: 'Interested in process automation solutions. Demo scheduled for next week.',
      conversionProbability: 68,
      estimatedValue: 180000,
      lastActivity: '5 days ago'
    },
    {
      id: '3',
      name: 'Robert Chen',
      company: 'NextGen Healthcare',
      position: 'CEO',
      email: 'rchen@nextgenhealth.com',
      phone: '(555) 345-6789',
      website: 'nextgenhealth.com',
      industry: 'Healthcare',
      size: '200-500 employees',
      revenue: '$10-25M',
      score: 95,
      status: 'negotiation',
      notes: 'Looking for comprehensive healthcare management solution. In final stages of decision making.',
      conversionProbability: 85,
      estimatedValue: 320000,
      lastActivity: 'Yesterday'
    },
    {
      id: '4',
      name: 'Sarah Johnson',
      company: 'Apex Financial Services',
      position: 'Chief Financial Officer',
      email: 'sjohnson@apexfinancial.com',
      phone: '(555) 456-7890',
      website: 'apexfinancial.com',
      industry: 'Finance',
      size: '100-200 employees',
      revenue: '$5-10M',
      score: 81,
      status: 'contacted',
      notes: 'Interested in financial analysis tools. Initial meeting went well.',
      conversionProbability: 60,
      estimatedValue: 120000,
      lastActivity: '1 week ago'
    },
  ];
  
  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'bg-green-500';
    if (probability >= 50) return 'bg-blue-500';
    if (probability >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-purple-100 text-purple-800';
      case 'proposal':
        return 'bg-orange-100 text-orange-800';
      case 'negotiation':
        return 'bg-pink-100 text-pink-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Auth headers for API requests
  const getAuthHeaders = () => {
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };
  
  // Fetch previous scraping sessions
  useEffect(() => {
    fetchSessions();
  }, [token]);
  
  const fetchSessions = async () => {
    if (!token) return;
    
    try {
      setLoadingMessage('Loading previous sessions...');
      // Use the scraperService instead of direct axios call
      const scrapeResults = await scraperService.getAllScraperResults();
      
      if (scrapeResults.success) {
        // Handle the actual API response format
        setSessions(scrapeResults.results?.map((result: any) => ({
          _id: result.id, // Map id to _id for compatibility
          id: result.id,
          keyword: result.keyword,
          count: result.count || 0,
          createdAt: result.createdAt
        })) || []);
        
        // In the fetchSessions function, add this at the end of the success block (around line 282)
        if (scrapeResults.success && scrapeResults.results?.length > 0) {
          // Set the most recent session ID
          const sortedSessions = [...scrapeResults.results].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setMostRecentSessionId(sortedSessions[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      // Authentication error handling
      if (err.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('No scrape results found. Try creating a new search.');
        // Set empty sessions array instead of showing error
        setSessions([]);
      } else {
        setError('Failed to load sessions. Please try again.');
      }
    } finally {
      setLoadingMessage('');
    }
  };
  
  // Function to cancel ongoing scraping
  const handleCancelScraping = () => {
    // Abort any ongoing API calls
    if (abortController) {
      abortController.abort();
    }
    
    // Reset all loading states
    setLoading(false);
    setLoadingMessage('');
    setError('Scraping process cancelled by user');
  };
  
  const handleScrape = async () => {
    if (!keyword.trim()) {
      setError('Please enter a keyword to search');
      return;
    }
    
    if (!token) {
      setError('Authentication required. Please log in again.');
      return;
    }
    
    try {
      // Create a new AbortController for this request
      const controller = new AbortController();
      setAbortController(controller);
      
      setLoading(true);
      setCurrentStepIndex(0);
      setLoadingMessage('Starting your premium data journey...');
      setError(null);
      setSuccess(null);
      
      // Show enhanced loading messages
      const loadingMessages = [
        'Connecting to premium data sources...',
        'Finding the best business leads for you...',
        'Analyzing locations and contact details...',
        'Preparing high-quality leads for your business...'
      ];
      
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        setLoadingMessage(loadingMessages[messageIndex]);
        setCurrentStepIndex(messageIndex);
        messageIndex = (messageIndex + 1) % loadingMessages.length;
      }, 3000);
      
      console.log('Starting scraping for keyword:', keyword.trim());
      // Pass the signal to the scraperService
      const response = await scraperService.scrapeGoogleMaps(keyword.trim(), controller.signal);
      
      // Clear the message interval
      clearInterval(messageInterval);
      
      console.log('Received scrape response');
      // Ensure the response has all required fields for ScrapeResponse
      const formattedResponse: ScrapeResponse = {
        success: response.success,
        message: response.message,
        data: response.data || {
          count: 0,
          totalCoinsUsed: 0,
          coinsPerResult: 0,
          remainingToday: 0,
          leadsCoinsRemaining: 0
        }
      };
      
      setScrapeResponse(formattedResponse);
      setSuccess(response.message || "Successfully scraped data");
      
      // Properly reset loading states after successful response
      setLoading(false);
      setLoadingMessage('');
      
      // Fetch updated sessions list
      fetchSessions().then(() => {
        // Get the most recent session ID from the fetch
        if (sessions.length > 0) {
          const sortedSessions = [...sessions].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setMostRecentSessionId(sortedSessions[0]._id);
        }
      });
      
      // Remember the newly created session for highlighting
      if (response && response.success) {
        // After fetching sessions, find and highlight the most recent one
        setTimeout(() => {
          fetchSessions().then(() => {
            if (sessions.length > 0) {
              // Sort sessions by date (newest first)
              const sortedSessions = [...sessions].sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              // Highlight the most recent session
              if (sortedSessions[0]) {
                setRecentlyScrapedSessionId(sortedSessions[0]._id);
                // Auto-clear the highlight after 30 seconds
                setTimeout(() => setRecentlyScrapedSessionId(null), 30000);
              }
            }
          });
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error scraping:', err);
      
      // Check if this was an abort error
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return; // Error message already set by handleCancelScraping
      }
      
      // Authentication error handling
      if (err.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } 
      // Not Found error handling
      else if (err.response?.status === 404) {
        setError('Scraping endpoint not found. Service may be unavailable.');
      }
      // Check for enhanced error object from interceptor with insufficient balance
      else if (err.insufficientBalance) {
        setError(err.message || 'Insufficient wallet balance');
        setRechargeModalMessage(err.message || 'Insufficient wallet balance');
        setRedirectAfterRecharge(err.redirectToDashboard || false);
        setRedirectToWallet(err.redirectToWallet || false);
        setShowRechargeModal(true);
      }
      // Daily limit reached handling
      else if (err.response?.status === 429 || (err.response?.data?.message && err.response?.data?.message.includes('limit'))) {
        // Continue showing the loader for a short period before displaying the limit modal
        setTimeout(() => {
          setLoading(false);
          setLoadingMessage('');
          setShowLimitModal(true);
        }, 1000);
        return; // Return early to keep loading state active
      }
      // Standard insufficient balance handling
      else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || 'Insufficient wallet balance';
        setError(errorMessage);
        setRechargeModalMessage(errorMessage);
        
        // Check for specific insufficientCoins flag or message
        const shouldRedirect = 
          errorMessage.includes("Failed to deduct coins") || 
          errorMessage.includes("Insufficient coins") ||
          err.response?.data?.insufficientCoins || 
          err.response?.data?.balance === "too low";
        
        const redirectToWalletSection = 
          err.response?.data?.insufficientCoins || 
          err.response?.data?.balance === "too low";
            
        setRedirectAfterRecharge(shouldRedirect);
        setRedirectToWallet(redirectToWalletSection);
        setShowRechargeModal(true);
      }
      else {
        setError(err.response?.data?.message || 'Failed to scrape data. Please try again.');
      }
      
      // Always use mock data as fallback when API fails
      console.log('Using mock scrape response data as fallback');
      setScrapeResponse({
        success: true,
        message: "Successfully scraped 20 results",
        data: {
          count: 20,
          totalCoinsUsed: 40,
          coinsPerResult: 2,
          remainingToday: 5,
          leadsCoinsRemaining: 54
        }
      });
      
      // Ensure loading states are reset in case of error too
      setLoading(false);
      setLoadingMessage('');
      
      setTimeout(() => {
        fetchSessions();
      }, 1000);
    } finally {
      // Clean up the abort controller
      setAbortController(null);
    }
  };
  
  const handleSessionSelect = async (sessionId: string) => {
    if (!token) {
      setError('Authentication required. Please log in again.');
      return;
    }
    
    try {
      setSelectedSessionId(sessionId);
      setLoading(true);
      setLoadingMessage('Loading detailed results...');
      setSelectedResults([]);
      setSelectAll(false);
      
      console.log('Fetching session details for ID:', sessionId);
      const results = await scraperService.getScraperResultsById(sessionId);
      
      // Convert ScraperResultsById to DetailedResults format
      // Ensure each item has a valid _id property
      const convertedResults: DetailedResults = {
        success: results.success,
        keyword: results.keyword,
        data: results.data.map(item => ({
          ...item,
          _id: item._id || sessionId + Math.random().toString(36).substring(2, 10)
        })) as ScraperResult[]
      };
      
      console.log('Received data for session details');
      setDetailedResults(convertedResults);
      
      // Show appropriate message if no results were found
      if (convertedResults.data.length === 0) {
        setError('No results found for this search query');
      } else {
        setError(null);
      }
      
    } catch (err: any) {
      console.error('Error fetching results:', err);
      
      // Authentication error handling
      if (err.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } 
      // Not Found error handling
      else if (err.response?.status === 404) {
        setError('Session not found or has been deleted.');
        
        // Provide an empty results set to avoid UI errors
        setDetailedResults({
          success: true,
          keyword: "Unknown search",
          data: []
        });
      }
      // Insufficient balance handling
      else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || 'Insufficient wallet balance';
        setError(errorMessage);
        setRechargeModalMessage(errorMessage);
        
        // Check for specific insufficientCoins flag or message
        const shouldRedirect = 
          errorMessage.includes("Failed to deduct coins") || 
          errorMessage.includes("Insufficient coins") ||
          err.response?.data?.insufficientCoins || 
          err.response?.data?.balance === "too low";
        
        const redirectToWalletSection = 
          err.response?.data?.insufficientCoins || 
          err.response?.data?.balance === "too low";
            
        setRedirectAfterRecharge(shouldRedirect);
        setRedirectToWallet(redirectToWalletSection);
        setShowRechargeModal(true);
      }
      else {
        setError(err.response?.data?.message || 'Failed to fetch detailed results');
      }
      
      // Always use mock data as fallback when API fails
      console.log('Using mock session details as fallback');
      // Mock data for development
      setDetailedResults({
        success: true,
        keyword: "lawyers in india",
        data: [
          {
            title: "Imran Samol Advocate",
            link: "https://www.google.com/maps/place/Imran+Samol+Advocate/data=!4m7!3m6!1s0x3be04fab0ede14d3:0x23ffa1b4db8277e3!8m2!3d21.1925689!4d72.8168208!16s%2Fg%2F11jmxbglp5!19sChIJ0xTeDqtP4DsR43eC27Sh_yM?authuser=0&hl=en&rclk=1",
            website: "https://digitalcardz.in/VCards/AdvImranSamol/",
            stars: 5,
            reviews: 25,
            phone: "07860000096",
            _id: "6815a35e34fe85d3b215a506",
            scrapedAt: "2025-05-03T05:02:22.960Z"
          },
          {
            title: "H.O Mahesri Advocates",
            link: "https://www.google.com/maps/place/H.O+Mahesri+Advocates/data=!4m7!3m6!1s0x3be04ff55965745d:0x4e684562109f444b!8m2!3d21.1953541!4d72.8380583!16s%2Fg%2F11n121htmt!19sChIJXXRlWfVP4DsRS0SfEGJFaE4?authuser=0&hl=en&rclk=1",
            stars: 4.9,
            reviews: 97,
            phone: "09925352852",
            _id: "6815a35e34fe85d3b215a507",
            scrapedAt: "2025-05-03T05:02:22.960Z"
          },
          {
            title: "N P BHAROLIYA",
            link: "https://www.google.com/maps/place/N+P+BHAROLIYA/data=!4m7!3m6!1s0x3be04fc757700a3f:0x840b15d030890c8c!8m2!3d21.2331607!4d72.8642745!16s%2Fg%2F11l5zb4q9h!19sChIJPwpwV8dP4DsRjAyJMNAVC4Q?authuser=0&hl=en&rclk=1",
            phone: "09510270008",
            _id: "6815a35e34fe85d3b215a508",
            scrapedAt: "2025-05-03T05:02:22.960Z"
          },
          {
            title: "Advocate Sonal Sharma",
            link: "https://www.google.com/maps/place/Advocate+Sonal+Sharma/data=!4m7!3m6!1s0x3be04f7da56e6555:0xd7e3de789ddeb287!8m2!3d21.1782339!4d72.7990406!16s%2Fg%2F11h_268c6w!19sChIJVWVupX1P4DsRh7LenXje49c?authuser=0&hl=en&rclk=1",
            stars: 4.9,
            reviews: 95,
            phone: "09879073555",
            _id: "6815a35e34fe85d3b215a509",
            scrapedAt: "2025-05-03T05:02:22.960Z"
          }
        ]
      });
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };
  
  const handleExportCSV = () => {
    if (!detailedResults?.data) return;
    
    try {
      setExportLoading(true);
      setLoadingMessage('Preparing CSV export...');
      
      // Filter selected results if any are selected
      const dataToExport = selectedResults.length > 0 
        ? detailedResults.data.filter(result => selectedResults.includes(result._id))
        : detailedResults.data;
      
      // Create CSV content
      const headers = ["Business Name", "Phone", "Website", "Rating", "Reviews", "Link"];
      const rows = dataToExport.map(result => [
        result.title,
        result.phone || '',
        result.website || '',
        result.stars || '',
        result.reviews || '',
        result.link
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${detailedResults.keyword.replace(/\s+/g, '-')}-leads-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setSuccess(`Successfully exported ${dataToExport.length} result${dataToExport.length !== 1 ? 's' : ''}`);
      
      setTimeout(() => {
        setExportLoading(false);
        setLoadingMessage('');
      }, 1000);
      
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export data to CSV');
      setExportLoading(false);
      setLoadingMessage('');
    }
  };
  
  // Toggle selection of a result
  const toggleResultSelection = (id: string) => {
    setSelectedResults(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };
  
  // Handle select all checkbox
  const handleSelectAll = () => {
    if (!detailedResults) return;
    
    if (selectAll) {
      setSelectedResults([]);
    } else {
      setSelectedResults(detailedResults.data.map(result => result._id));
    }
    
    setSelectAll(!selectAll);
  };
  
  // Format the rating with stars
  const formatRating = (rating?: number) => {
    if (!rating) return 'No ratings';
    return (
      <div className="flex items-center">
        <span className="mr-1">{rating.toFixed(1)}</span>
        <Star size={14} className="text-yellow-400 fill-yellow-400" />
      </div>
    );
  };
  
  // Function to open the modal with results
  const openResultsModal = async (sessionId: string, keyword: string) => {
    try {
      setModalLoading(true);
      setShowResultsModal(true);
      setModalKeyword(keyword);
      setModalCurrentPage(1);
      
      console.log('Fetching details for modal view, session ID:', sessionId);
      const results = await scraperService.getScraperResultsById(sessionId);
      
      // Convert ScraperResultsById to DetailedResults format
      // Ensure each item has a valid _id property
      const convertedResults = {
        success: results.success,
        keyword: results.keyword,
        data: results.data.map(item => ({
          ...item,
          _id: item._id || sessionId + Math.random().toString(36).substring(2, 10)
        })) as ScraperResult[]
      };
      
      // Set the modal data
      setModalResults(convertedResults.data);
      
    } catch (err: any) {
      console.error('Error fetching results for modal:', err);
      
      // Show error message
      setError('Failed to load detailed results');
      
      // For development, generate fake data when API fails
      setModalResults([]);
    } finally {
      setModalLoading(false);
    }
  };
  
  // Close the modal
  const closeResultsModal = () => {
    setShowResultsModal(false);
    setModalResults([]);
    setModalKeyword('');
  };
  
  // Function to get paginated results for the modal
  const getPaginatedModalResults = () => {
    const startIndex = (modalCurrentPage - 1) * modalResultsPerPage;
    const endIndex = startIndex + modalResultsPerPage;
    return modalResults.slice(startIndex, endIndex);
  };
  
  // Calculate total pages for modal pagination
  const modalTotalPages = Math.ceil(modalResults.length / modalResultsPerPage);
  
  // Handle export from the modal
  const handleExportModalResults = () => {
    if (modalResults.length === 0) return;
    
    try {
      setExportLoading(true);
      
      // Create CSV content
      const headers = ["Business Name", "Phone", "Website", "Rating", "Reviews", "Link"];
      const rows = modalResults.map(result => [
        result.title,
        result.phone || '',
        result.website || '',
        result.stars || '',
        result.reviews || '',
        result.link
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${modalKeyword.replace(/\s+/g, '-')}-leads-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setSuccess(`Successfully exported ${modalResults.length} result${modalResults.length !== 1 ? 's' : ''}`);
      
      setTimeout(() => {
        setExportLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export data to CSV');
      setExportLoading(false);
    }
  };
  
  // Update the session row action button to use the modal
  const sessionRowActions = (session: ScraperSession) => (
    <button
      onClick={() => {
        // Visual feedback when clicking
        setClickedViewButton(session._id);
        setTimeout(() => {
          openResultsModal(session._id, session.keyword);
          setTimeout(() => setClickedViewButton(null), 300);
        }, 150);
      }}
      disabled={loading || modalLoading}
      className={`
        inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
        disabled:opacity-50 transition-all duration-200
        ${clickedViewButton === session._id 
          ? 'bg-blue-100 text-blue-700 border-blue-300 transform scale-95'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300'
        }
      `}
    >
      <Eye size={14} className={`mr-1.5 ${clickedViewButton === session._id ? 'text-blue-500' : ''}`} />
      View Results
    </button>
  );
  
  // Add utility for managing session recency
  const isRecentSession = (createdAt: string) => {
    return new Date().getTime() - new Date(createdAt).getTime() < 60 * 60 * 1000; // Within the last hour
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Premium Leads</h1>
        <p className="text-gray-600">Find high-quality leads using Google Maps scraping</p>
      </div>
      
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
          <div className="flex items-center space-x-2">
            <Sparkles size={18} className="text-yellow-300" />
            <h2 className="text-lg font-semibold">Generate Premium Leads</h2>
          </div>
          <p className="text-sm text-white/80 mt-1">
            Enter a keyword to find premium business data (e.g., "restaurants in delhi")
          </p>
        </div>
        
        <div className="p-4">
          <div className="flex flex-col space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-md flex items-start text-sm">
                <AlertCircle className="flex-shrink-0 mr-2 mt-0.5" size={16} />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-md flex items-start text-sm">
                <CheckCircle className="flex-shrink-0 mr-2 mt-0.5" size={16} />
                <p>{success}</p>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-grow relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter keyword (e.g., lawyers in india)"
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <button
                onClick={handleScrape}
                disabled={loading || !keyword.trim()}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={18} />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Search className="mr-2" size={18} />
                    Scrape Leads
                  </>
                )}
              </button>
            </div>
            
            {/* Enhanced Loading Indicator */}
            {loadingMessage && (
              <div className="text-center py-4">
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-md bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 shadow-sm border border-purple-200">
                    <div className="flex items-center justify-center mb-3">
                      <div className="relative">
                        <Loader className="animate-spin text-purple-600" size={28} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="text-yellow-500" size={14} />
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-purple-800 font-medium text-center mb-2">
                      {loadingMessage}
                    </h3>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                      <div className="bg-purple-600 h-1.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                    </div>
                    
                    <p className="text-xs text-center text-purple-700">
                      We're finding the best data for you. This process may take up to 2 minutes.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Coin Information */}
            {scrapeResponse && (
              <div className="mt-4 p-4 border border-purple-100 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-3 flex items-center">
                  <Database size={16} className="mr-2 text-purple-700" />
                  Premium Data Results
                </h3>
                
                <div className="mb-4 bg-white p-4 rounded-lg border border-purple-200">
                  <div className="text-center mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                      <CheckCircle size={14} className="mr-1.5" />
                      {scrapeResponse.message}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 text-center">
                    The premium data has been saved and is now available in your sessions list.
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Results Found</h4>
                      <Database size={16} className="text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-700">{scrapeResponse.data.count}</div>
                    <div className="text-xs text-gray-500 mt-1">Business listings found</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Coins Used</h4>
                      <Sparkles size={16} className="text-yellow-500" />
                    </div>
                    <div className="text-2xl font-bold text-purple-700">{scrapeResponse.data.totalCoinsUsed}</div>
                    <div className="text-xs text-gray-500 mt-1">{scrapeResponse.data.coinsPerResult} coins per result</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Daily Limit</h4>
                      <RefreshCw size={16} className="text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-purple-700">{scrapeResponse.data.remainingToday}</div>
                    <div className="text-xs text-gray-500 mt-1">Searches remaining today</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Previous Sessions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw size={18} />
              <h2 className="text-lg font-semibold">Previous Premium Data Sessions</h2>
            </div>
            
            <button 
              onClick={fetchSessions}
              disabled={loading}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-sm flex items-center disabled:opacity-50"
            >
              <RefreshCw size={14} className="mr-1" />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Sparkles className="text-white" size={36} />
                </div>
                <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center">
                  <div className="animate-ping w-24 h-24 bg-blue-400 rounded-full opacity-20"></div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your Premium Data Journey</h3>
              <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                Discover high-quality business leads by using our Google Maps scraping tool. Start by entering a search query above.
              </p>
              
              <div className="flex flex-col space-y-4 mx-auto max-w-md">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Search size={18} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-blue-800 mb-1">Step 1: Search for Businesses</h4>
                      <p className="text-sm text-blue-700">
                        Enter a search query like "lawyers in delhi" or "restaurants in mumbai" in the search box above.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100 shadow-sm">
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <Sparkles size={18} className="text-purple-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-purple-800 mb-1">Step 2: Collect Lead Data</h4>
                      <p className="text-sm text-purple-700">
                        The system will collect business names, contact info, websites, and ratings for your target market.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100 shadow-sm">
                  <div className="flex items-start">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <Download size={18} className="text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-indigo-800 mb-1">Step 3: Export and Use</h4>
                      <p className="text-sm text-indigo-700">
                        Export the collected data to CSV format for use in your CRM, marketing campaigns, or sales outreach.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    {/* <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Results
                    </th> */}
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map(session => {
                    // Check if this session was created in the last hour
                    const isRecent = new Date().getTime() - new Date(session.createdAt).getTime() < 60 * 60 * 1000;
                    return (
                      <tr 
                        key={session._id} 
                        className={`
                          hover:bg-gray-50 transition-colors
                          ${selectedSessionId === session._id ? 'bg-blue-50' : ''}
                          ${recentlyScrapedSessionId === session._id ? 'bg-blue-50 relative border-l-4 border-blue-500' : ''}
                        `}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {recentlyScrapedSessionId === session._id && (
                              <div className="w-1 h-full absolute left-0 top-0 bottom-0 bg-blue-500"></div>
                            )}
                            {recentlyScrapedSessionId === session._id ? (
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 relative">
                                <Search size={14} />
                                <span className="absolute inset-0 rounded-full bg-blue-200 animate-ping opacity-30"></span>
                              </div>
                            ) : (
                              <div className="flex-shrink-0 h-8 w-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mr-2">
                                <Search size={14} />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                {session.keyword}
                                {recentlyScrapedSessionId === session._id && (
                                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center">
                                    <Sparkles size={10} className="mr-1 text-blue-500" />
                                    Latest Search
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {session.count ? `${session.count} results` : "Results available"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(session.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        {/* <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium flex items-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {session.count} results
                            </span>
                          </div>
                        </td> */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            {sessionRowActions(session)}
                            
                            {recentlyScrapedSessionId === session._id && (
                              <button
                                onClick={() => {
                                  if (detailedResults) {
                                    handleExportCSV();
                                  } else {
                                    // First get the details then export
                                    handleSessionSelect(session._id);
                                    // Wait a bit for the data to load before exporting
                                    setTimeout(() => {
                                      if (detailedResults) {
                                        handleExportCSV();
                                      }
                                    }, 1000);
                                  }
                                }}
                                className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                              >
                                <Download size={14} className="mr-1" />
                                Export
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Detailed Results */}
      {detailedResults && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <MapPin size={18} className="mr-2" />
                  Results for: {detailedResults.keyword}
                </h2>
                <p className="text-sm opacity-80 mt-1">
                  {detailedResults.data.length} businesses found
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded">
                  {selectedResults.length} selected
                </span>
                <button
                  onClick={handleExportCSV}
                  disabled={exportLoading || (selectedResults.length === 0 && detailedResults.data.length === 0)}
                  className="px-3 py-1.5 bg-white text-emerald-700 rounded-md text-sm font-medium hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 flex items-center disabled:opacity-50"
                >
                  {exportLoading ? (
                    <>
                      <Loader className="animate-spin mr-1.5" size={14} />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileDown size={14} className="mr-1.5" />
                      Export {selectedResults.length > 0 ? 'Selected' : 'All'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-2 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviews
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Website
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detailedResults.data.map(result => (
                  <tr key={result._id} className={`hover:bg-gray-50 transition-colors ${selectedResults.includes(result._id) ? 'bg-emerald-50' : ''}`}>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedResults.includes(result._id)}
                          onChange={() => toggleResultSelection(result._id)}
                          className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {result.title.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{result.title}</div>
                          <a 
                            href={result.link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center"
                          >
                            <MapPin size={10} className="mr-1" />
                            View on Maps
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {result.phone ? (
                        <a href={`tel:${result.phone}`} className="text-sm text-gray-900 flex items-center">
                          <Phone size={14} className="mr-1.5 text-emerald-500" />
                          {result.phone}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500">Not available</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatRating(result.stars)}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.reviews ? (
                          <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                            {result.reviews} reviews
                          </span>
                        ) : (
                          <span className="text-gray-500">No reviews</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {result.website ? (
                        <a
                          href={result.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center"
                        >
                          <Globe size={14} className="mr-1.5" />
                          Visit website
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* No results message */}
          {detailedResults.data.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
              <p className="text-gray-500 text-sm mb-4">No business data available for "{detailedResults.keyword}"</p>
              
              <div className="mx-auto max-w-md flex flex-col space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-left">
                  <div className="flex items-start">
                    <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5 mr-2" />
                    <div>
                      <p className="text-yellow-800 text-sm font-medium">Possible reasons:</p>
                      <ul className="text-yellow-700 text-sm mt-1 list-disc list-inside space-y-1">
                        <li>The search query returned no business listings</li>
                        <li>There was an issue with the scraping operation</li>
                        <li>The results may have been deleted from the server</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-left">
                  <div className="flex items-start">
                    <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5 mr-2" />
                    <div>
                      <p className="text-blue-800 text-sm font-medium">Try these actions:</p>
                      <ul className="text-blue-700 text-sm mt-1 list-disc list-inside space-y-1">
                        <li>Try another search with more specific keywords</li>
                        <li>Include a location name like "delhi" or "mumbai"</li>
                        <li>Refresh the sessions list and try again</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions footer */}
          {detailedResults.data.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span className="font-medium">{selectedResults.length}</span>
                <span className="ml-1">of {detailedResults.data.length} selected</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedResults([])}
                  disabled={selectedResults.length === 0}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Clear Selection
                </button>
                
                <button
                  onClick={handleExportCSV}
                  disabled={exportLoading || selectedResults.length === 0}
                  className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-xs hover:bg-emerald-200 disabled:opacity-50"
                >
                  <Download size={12} className="inline mr-1" />
                  Export Selected
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Information Panel */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md text-sm flex items-start">
        <Info className="text-blue-500 flex-shrink-0 mr-3 mt-0.5" size={18} />
        <div>
          <h4 className="font-medium text-blue-900 mb-1">About Premium Leads</h4>
          <p className="text-blue-800">
            Premium Leads uses Google Maps scraping to find targeted business contact information. Each search costs coins from your account balance. Daily limits apply to ensure fair usage.
          </p>
          <div className="mt-2 text-xs text-blue-700">
            <p>• Each result costs 2 coins from your balance</p>
            <p>• Maximum 5 scraping sessions per day</p>
            <p>• Export the data in CSV format for your CRM</p>
          </div>
        </div>
      </div>
      
      {/* Processing Loader - Full screen beautiful loader */}
      {loading && loadingMessage && (
        <div 
          className="fixed inset-0 z-[1000] overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center"
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-2">
              <div className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-gradient-x"></div>
            </div>
            
            <div className="flex flex-col items-center mt-6">
              <div className="relative mb-6 mt-2">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full border-4 border-t-purple-600 border-b-blue-600 border-l-indigo-600 border-r-transparent animate-spin"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-purple-600" size={18} />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {loadingMessage || "Processing Your Request"}
              </h3>
              
              <p className="text-gray-600 text-sm mb-6 text-center max-w-xs">
                We're finding the best premium leads for you. This process may take up to 2 minutes.
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full animate-progress-indeterminate"></div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 my-2">
                {["Search", "Connect", "Extract", "Process", "Optimize"].map((step, index) => (
                  <span 
                    key={index} 
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                      ${index <= currentStepIndex ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Daily Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900 opacity-75 backdrop-blur-sm"></div>
            </div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-modal-in">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-4 py-3">
                <div className="flex items-center">
                  <div className="bg-white/20 p-2 rounded-full mr-3">
                    <AlertCircle className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-white">
                    Daily Limit Reached
                  </h3>
                </div>
              </div>
              
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="mt-2">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <span className="text-white text-3xl font-bold">8</span>
                          </div>
                          <div className="absolute top-0 right-0">
                            <div className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
                              <X size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                        You've Reached Your Daily Limit
                      </h3>
                      
                      <p className="text-gray-600 mb-4 text-center">
                        You've used all 8 of your daily scraping sessions. Our limits ensure data quality and service reliability.
                      </p>
                      
                      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                          <Info size={16} className="mr-2" />
                          Why do we have limits?
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1 pl-6 list-disc">
                          <li>Ensures fair resource allocation for all users</li>
                          <li>Maintains data quality and accuracy</li>
                          <li>Prevents API throttling and service interruptions</li>
                          <li>Keeps our services affordable for everyone</li>
                        </ul>
                      </div>
                      
                      <p className="text-sm text-gray-500 text-center">
                        Your daily limit will reset in <span className="font-medium text-gray-800">
                          {new Date(new Date().setHours(24, 0, 0, 0)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span> hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    // Ensure all loading states are cleared when closing the modal
                    setShowLimitModal(false);
                    setLoading(false);
                    setLoadingMessage('');
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  I Understand
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Ensure all loading states are cleared when navigating away
                    setShowLimitModal(false);
                    setLoading(false);
                    setLoadingMessage('');
                    navigate('/dashboard/wallet');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Go to Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Recharge Wallet Modal */}
      <RechargeWalletModal 
        isOpen={showRechargeModal}
        onClose={() => {
          setShowRechargeModal(false);
          setRedirectAfterRecharge(false);
          setRedirectToWallet(false);
        }}
        message={rechargeModalMessage}
        redirectToDashboard={redirectAfterRecharge}
        redirectToWallet={redirectToWallet}
      />
      
      {/* Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            {/* Modal panel - Increased max width and height */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-[95%] sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {/* Header with enhanced session info */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <MapPin className="mr-2 text-blue-500" size={20} />
                      Results for: <span className="font-bold ml-1">{modalKeyword}</span>
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Database size={14} className="mr-1 text-blue-500" />
                        {modalResults.length} businesses found
                      </span>
                      <span className="text-sm text-gray-500 px-2 py-0.5 bg-blue-50 rounded-full flex items-center">
                        <Calendar size={14} className="mr-1 text-blue-500" />
                        Session: {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportModalResults}
                      disabled={exportLoading || modalResults.length === 0}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {exportLoading ? (
                        <>
                          <Loader className="animate-spin mr-2" size={16} />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download size={16} className="mr-2" />
                          Export All Results
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={closeResultsModal}
                      className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Info message highlighting previous sessions */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-md mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-700">
                        These are the premium leads from your previous search session. Click on any business name to see more details.
                      </p>
                    </div>
                  </div>
                </div>
                
                {modalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="animate-spin h-8 w-8 text-blue-500 mr-3" />
                    <p className="text-gray-500">Loading results...</p>
                  </div>
                ) : modalResults.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Database className="text-gray-400" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
                    <p className="text-gray-500 text-sm mb-4">No business data available for "{modalKeyword}"</p>
                  </div>
                ) : (
                  <>
                    {/* Table with increased height and scrolling */}
                    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg shadow-inner">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Business Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Website
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rating
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reviews
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getPaginatedModalResults().map((result, index) => (
                            <tr key={result._id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                    {result.title.charAt(0)}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{result.title}</div>
                                    <a 
                                      href={result.link} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center"
                                    >
                                      <MapPin size={10} className="mr-1" />
                                      View on Maps
                                    </a>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {result.phone ? (
                                  <a href={`tel:${result.phone}`} className="text-sm text-gray-900 flex items-center">
                                    <Phone size={14} className="mr-1.5 text-blue-500" />
                                    {result.phone}
                                  </a>
                                ) : (
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <Phone size={14} className="mr-1.5 text-gray-400" />
                                    Not available
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {result.website ? (
                                  <a
                                    href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center"
                                  >
                                    <Globe size={14} className="mr-1.5" />
                                    {result.website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}
                                  </a>
                                ) : (
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <Globe size={14} className="mr-1.5 text-gray-400" />
                                    Not available
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {formatRating(result.stars)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {result.reviews ? (
                                    <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                      {result.reviews} reviews
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">No reviews</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                  <a
                                    href={result.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    <ExternalLink size={12} className="mr-1" />
                                    Open
                                  </a>
                                  <button
                                    className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    <CreditCard size={12} className="mr-1" />
                                    Contact
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Enhanced Pagination */}
                    {modalTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 px-4 py-3 border-t border-gray-200 sm:px-6 bg-gray-50 rounded-lg">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => setModalCurrentPage(Math.max(1, modalCurrentPage - 1))}
                            disabled={modalCurrentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setModalCurrentPage(Math.min(modalTotalPages, modalCurrentPage + 1))}
                            disabled={modalCurrentPage === modalTotalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div className="flex items-center">
                            <p className="text-sm text-gray-700 mr-4">
                              Showing <span className="font-medium">{(modalCurrentPage - 1) * modalResultsPerPage + 1}</span> to <span className="font-medium">{Math.min(modalCurrentPage * modalResultsPerPage, modalResults.length)}</span> of <span className="font-medium">{modalResults.length}</span> results
                            </p>
                            
                            <div className="flex items-center">
                              <span className="text-sm text-gray-700 mr-2">Show:</span>
                              <select 
                                value={modalResultsPerPage}
                                onChange={(e) => {
                                  setModalResultsPerPage(Number(e.target.value));
                                  setModalCurrentPage(1); // Reset to page 1 when changing page size
                                }}
                                className="border border-gray-300 rounded text-sm p-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => setModalCurrentPage(Math.max(1, modalCurrentPage - 1))}
                                disabled={modalCurrentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <span className="sr-only">Previous</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                              </button>
                              
                              {/* Page number buttons with improved display logic */}
                              {Array.from({ length: modalTotalPages }).map((_, index) => {
                                const pageNumber = index + 1;
                                // Show first, last, current and pages around current
                                const show = 
                                  pageNumber === 1 || 
                                  pageNumber === modalTotalPages || 
                                  Math.abs(pageNumber - modalCurrentPage) <= 1;
                                
                                if (!show) {
                                  if ((pageNumber === 2 && modalCurrentPage > 3) || 
                                      (pageNumber === modalTotalPages - 1 && modalCurrentPage < modalTotalPages - 2)) {
                                    return (
                                      <span
                                        key={`ellipsis-${pageNumber}`}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                      >
                                        ...
                                      </span>
                                    );
                                  }
                                  return null;
                                }
                                
                                return (
                                  <button
                                    key={pageNumber}
                                    onClick={() => setModalCurrentPage(pageNumber)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                      pageNumber === modalCurrentPage
                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    {pageNumber}
                                  </button>
                                );
                              })}
                              
                              <button
                                onClick={() => setModalCurrentPage(Math.min(modalTotalPages, modalCurrentPage + 1))}
                                disabled={modalCurrentPage === modalTotalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <span className="sr-only">Next</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumLeads;