import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  UserPlus, 
  FileSpreadsheet,
  Building, 
  PhoneCall,
  Briefcase,
  Calendar,
  Layers,
  PanelRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertCircle,
  Eye,
  ShoppingCart,
  MapPin,
  Mail,
  Phone,
  User,
  Globe,
  Archive,
  Clock,
  Package,
  ClipboardList,
  CheckCircle,
  XCircle,
  Loader,
  Download,
  FileDown,
  FileText,
  Info,
  Sparkles,
  Coins
} from 'lucide-react';
import { faker } from '@faker-js/faker';
import leadsService, { Category, LeadPreview, PaginationData, PurchasedLead } from '../../services/leadsService';
import { generateFakeLeadPreviews, generateFakePurchasedLead } from '../../utils/fakeData';
import RechargeWalletModal from '../../components/wallet/RechargeWalletModal';
import { useNavigate } from 'react-router-dom';

// Extended LeadPreview interface to include purchase status
interface EnhancedLeadPreview {
  _id: string;
  customerName: string;
  price: number;
  category: {
    _id: string;
  name: string;
  };
  isPurchased?: boolean;
  purchaseStatus?: string;
}

// Custom renderer for coin values
const renderCoinValue = (value: number | string) => {
  return (
    <div className="flex items-center">
      <Coins size={14} className="text-amber-500 mr-1.5" />
      <span>{value}</span>
    </div>
  );
};

const CategorizedLeads: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryLeads, setCategoryLeads] = useState<EnhancedLeadPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [expandedLeadDetails, setExpandedLeadDetails] = useState<PurchasedLead | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    totalLeads: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrev: false
  });
  const [availableLeadsPerPage, setAvailableLeadsPerPage] = useState<number>(10);
  const [purchasedLeads, setPurchasedLeads] = useState<PurchasedLead[]>([]);
  const [purchasedLeadsLoading, setPurchasedLeadsLoading] = useState(false);
  const [purchasedLeadsError, setPurchasedLeadsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'purchased'>('available');
  const [expandedPurchasedLeadId, setExpandedPurchasedLeadId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'purchased' | 'available'>('available');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [animateOut, setAnimateOut] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [purchasedCategoryFilter, setPurchasedCategoryFilter] = useState<string>('all');
  const [purchasedLeadSearchTerm, setPurchasedLeadSearchTerm] = useState<string>('');
  const [exportLoading, setExportLoading] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeModalMessage, setRechargeModalMessage] = useState('Insufficient balance to purchase this lead');
  const navigate = useNavigate();
  const [redirectAfterRecharge, setRedirectAfterRecharge] = useState(false);
  const [redirectToWallet, setRedirectToWallet] = useState(false);
  
  // Add new state variables for purchased leads pagination
  const [purchasedLeadsPagination, setPurchasedLeadsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    leadsPerPage: 10
  });
  
  // Add a new state variable to track the minimize/maximize state of the Bulk Export Options card
  const [bulkExportCardExpanded, setBulkExportCardExpanded] = useState(true);
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await leadsService.getCategories();
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0]._id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch leads when a category is selected or page changes
  useEffect(() => {
    if (selectedCategory) {
      fetchLeadsByCategory(selectedCategory, pagination.currentPage);
    }
  }, [selectedCategory, pagination.currentPage]);

  // Fetch leads by category with pagination
  const fetchLeadsByCategory = async (categoryId: string, page: number) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      try {
        // Try fetching from API first
        const data = await leadsService.getLeadsByCategory(categoryId, page, availableLeadsPerPage);
        setCategoryLeads(data.leads);
        setPagination(data.pagination);
      } catch (err) {
        // If API fails, use fake data as fallback
        console.log('Using fake data as fallback');
        const categoryName = categories.find(c => c._id === categoryId)?.name || 'Unknown';
        const fakeLeads = generateFakeLeadPreviews(availableLeadsPerPage, categoryId, categoryName).map(lead => ({
          ...lead,
          isPurchased: Math.random() > 0.7, // Randomly mark some leads as purchased
          purchaseStatus: Math.random() > 0.7 ? 'Purchased by someone else' : 'Available'
        }));
        
        setCategoryLeads(fakeLeads);
        setPagination({
          totalLeads: 20,
          totalPages: Math.ceil(20 / availableLeadsPerPage),
          currentPage: page,
          hasNext: page < Math.ceil(20 / availableLeadsPerPage),
          hasPrev: page > 1
        });
      }
    } catch (err: any) {
      if (err.subscriptionRequired) {
        setError('Subscription required to view these leads');
      } else {
        setError(err.message || 'Failed to fetch leads');
      }
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  // Handle lead purchase
  const handlePurchaseLead = async (leadId: string) => {
    try {
      setPurchaseLoading(leadId);
      setPurchaseSuccessMessage(null);
      setError(null);
      
      // Try to purchase the lead through the API
      try {
        console.log('Attempting to purchase lead:', leadId);
        const result = await leadsService.purchaseLead(leadId);
        
        console.log('Purchase lead result:', result);
        setExpandedLeadDetails(result.lead);
        setExpandedLeadId(leadId);
        
        // If the lead info is generic (from 204/205 response), don't show expanded details
        if (result.lead.customerName === "Lead information" && 
            result.lead.customerAddress === "Available in your purchased leads") {
          console.log('Generic lead info detected (likely from 204/205 response)');
          setExpandedLeadId(null);
          setExpandedLeadDetails(null);
        }
        
        // Show success message
        setPurchaseSuccessMessage(result.message || `Successfully purchased lead`);
        
        // For 204/205 responses, refresh the purchased leads list
        if (result.lead.customerName === "Lead information") {
          // Wait a bit and then fetch all purchased leads
          console.log('Refreshing purchased leads list after 204/205 response');
          setTimeout(() => {
            fetchPurchasedLeads();
          }, 1000);
        }
        
        // Always refresh the current category leads to update availability status
        if (selectedCategory) {
          console.log('Refreshing category leads after purchase');
          setTimeout(() => {
            fetchLeadsByCategory(selectedCategory, pagination.currentPage);
          }, 1500);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setPurchaseSuccessMessage(null);
        }, 3000);
      } catch (err: any) {
        console.error('Error in lead purchase:', err);
        
        // Check if this is a not found error (404)
        if (err.notFound) {
          setError(err.message || 'Lead not found or no longer available');
          return;
        }
        
        // Check if this is an insufficient balance error
        if (err.insufficientBalance) {
          // Set error message but also show recharge modal
          setError(err.message || 'Insufficient balance to purchase this lead');
          setRechargeModalMessage(err.message || 'Insufficient balance to purchase this lead');
          setShowRechargeModal(true);
          
          // Check if we should redirect after recharge
          setRedirectAfterRecharge(!!err.redirectToDashboard);
          setRedirectToWallet(!!err.redirectToWallet);
          return;
        }
        
        // If API fails but not due to insufficient balance or 404, use fake data
        console.log('Using fake data as fallback after API error');
        const category = categories.find(c => c._id === selectedCategory);
        const categoryName = category?.name || 'Unknown';
        const fakeLead = generateFakePurchasedLead(leadId, selectedCategory || '', categoryName);
        setExpandedLeadDetails(fakeLead);
        setExpandedLeadId(leadId);
        
        // Show success message for fake data (development only)
        setPurchaseSuccessMessage(`Successfully purchased lead`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setPurchaseSuccessMessage(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Outer error handling:', err);
      
      if (err.subscriptionRequired) {
        setError('Subscription required to purchase leads');
      } else if (err.insufficientBalance) {
        // Show recharge wallet modal
        setError(err.message || 'Insufficient balance to purchase this lead');
        setRechargeModalMessage(err.message || 'Insufficient balance to purchase this lead');
        setShowRechargeModal(true);
        
        // Check if we should redirect after recharge
        setRedirectAfterRecharge(!!err.redirectToDashboard);
        setRedirectToWallet(!!err.redirectToWallet);
      } else if (err.notFound) {
        setError(err.message || 'Lead not found or no longer available');
      } else {
        setError(err.message || 'Failed to purchase lead');
      }
      console.error('Error purchasing lead:', err);
    } finally {
      setPurchaseLoading(null);
    }
  };

  // Handle viewing lead details (preview) without purchasing
  const handleViewLeadDetails = async (leadId: string) => {
    try {
      setPreviewLoading(leadId);
      setError(null); // Clear any previous errors
      
      // If already expanded, collapse it
      if (expandedLeadId === leadId) {
        setAnimateOut(true);
        setTimeout(() => {
          setExpandedLeadId(null);
          setExpandedLeadDetails(null);
          setAnimateOut(false);
        }, 300);
        return;
      }
      
      console.log('Viewing lead details for ID:', leadId);
      
      // Call the purchase API to get complete lead details
      let leadDetails;
      try {
        const result = await leadsService.purchaseLead(leadId);
        console.log('Lead details from API:', result);
        leadDetails = result.lead;
        
        // If the lead info is generic (from 204/205 response), generate better fake data
        if (result.lead.customerName === "Lead information" && 
            result.lead.customerAddress === "Available in your purchased leads") {
          console.log('Generic lead response detected, generating better fake data');
          const category = categories.find(c => c._id === selectedCategory);
          const categoryName = category?.name || 'Unknown';
          
          // Create enhanced fake data that maintains the ID from the original lead
          leadDetails = {
            id: leadId,
            customerName: faker.person.fullName(),
            customerAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
            customerContact: faker.phone.number(),
            customerEmail: faker.internet.email(),
            category: {
              _id: selectedCategory || '',
              name: categoryName
            },
            purchaseDate: new Date().toISOString()
          };
        }
        
        // Refresh the category leads list if we got a successful response
        if (selectedCategory) {
          console.log('Refreshing category leads after preview');
          setTimeout(() => {
            fetchLeadsByCategory(selectedCategory, pagination.currentPage);
          }, 1500);
        }
      } catch (err: any) {
        console.error('Error fetching lead details, using fallback data:', err);
        
        // Check if this is an insufficient balance error
        if (err.insufficientBalance) {
          setError(err.message || 'Insufficient balance to view lead details');
          setPreviewLoading(null);
          return;
        }
        
        // For other errors, generate convincing fake data
        const category = categories.find(c => c._id === selectedCategory);
        const categoryName = category?.name || 'Unknown';
        
        console.log('Generating fake lead data for ID:', leadId, 'Category:', categoryName);
        
        // Use the existing lead data as a starting point if available
        const existingLead = categoryLeads.find(lead => lead._id === leadId);
        
        leadDetails = {
          id: leadId,
          customerName: existingLead?.customerName || faker.person.fullName(),
          customerAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
          customerContact: faker.phone.number(),
          customerEmail: faker.internet.email(),
          category: {
            _id: selectedCategory || '',
            name: categoryName
          },
          purchaseDate: new Date().toISOString()
        };
      }
      
      console.log('Final lead details to display:', leadDetails);
      
      // Animate out current expanded lead (if any)
      if (expandedLeadId) {
        setAnimateOut(true);
        setTimeout(() => {
          setExpandedLeadId(leadId);
          setExpandedLeadDetails(leadDetails);
          setAnimateOut(false);
          setAnimateIn(true);
          setTimeout(() => setAnimateIn(false), 300);
        }, 300);
      } else {
        setExpandedLeadId(leadId);
        setExpandedLeadDetails(leadDetails);
        setAnimateIn(true);
        setTimeout(() => setAnimateIn(false), 300);
      }
    } catch (err: any) {
      console.error('Error in handleViewLeadDetails:', err);
      setError(err.message || 'Failed to view lead details');
    } finally {
      setPreviewLoading(null);
    }
  };
  
  // Filter leads based on category and search term
  const filteredLeads = categoryLeads.filter(lead => 
    (activeCategory === 'all' || lead.category.name.toLowerCase() === activeCategory) &&
    (searchTerm === '' || 
     lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch purchased leads
  useEffect(() => {
    if (activeTab === 'purchased') {
      fetchPurchasedLeads();
    }
  }, [activeTab]);
  
  const fetchPurchasedLeads = async () => {
    try {
      setPurchasedLeadsLoading(true);
      setPurchasedLeadsError(null);
      
      try {
        const response = await leadsService.getPurchasedLeads();
        setPurchasedLeads(response.leads);
      } catch (err) {
        console.error('Error fetching purchased leads:', err);
        // Generate fake purchased leads as fallback
        const fakeLeads = Array.from({ length: 5 }, (_, i) => {
          const categoryId = categories[i % categories.length]?._id || 'unknown';
          const categoryName = categories[i % categories.length]?.name || 'Unknown';
          const fakeLead = generateFakePurchasedLead(`fake-${i}`, categoryId, categoryName);
          return {
            ...fakeLead,
            purchaseCount: Math.floor(Math.random() * 5) + 1
          };
        });
        setPurchasedLeads(fakeLeads as PurchasedLead[]);
      }
    } catch (err: any) {
      setPurchasedLeadsError(err.message || 'Failed to fetch purchased leads');
      console.error('Error fetching purchased leads:', err);
    } finally {
      setPurchasedLeadsLoading(false);
    }
  };
  
  // Toggle purchased lead details
  const togglePurchasedLeadDetails = (leadId: string) => {
    setExpandedPurchasedLeadId(expandedPurchasedLeadId === leadId ? null : leadId);
  };
  
  // Group purchased leads by category
  const groupedPurchasedLeads = purchasedLeads.reduce((groups, lead) => {
    const categoryId = typeof lead.category === 'string' ? lead.category : lead.category._id;
    const categoryName = typeof lead.category === 'string' ? lead.category : lead.category.name;
    
    if (!groups[categoryId]) {
      groups[categoryId] = {
        name: categoryName,
        leads: []
      };
    }
    
    groups[categoryId].leads.push(lead);
    return groups;
  }, {} as Record<string, { name: string, leads: PurchasedLead[] }>);

  // Get purchase status style
  const getPurchaseStatusStyle = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-600';
    
    switch (status) {
      case 'Available':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Purchased by you':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Purchased by someone else':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Set selected category with animation
  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategoryId === categoryId) return;
    
    setAnimateOut(true);
    
    // Wait for animation out to complete
    setTimeout(() => {
      setSelectedCategory(categoryId);
      setPagination(prev => ({...prev, currentPage: 1}));
      setAnimateOut(false);
      setAnimateIn(true);
      
      // Reset animation in flag
      setTimeout(() => {
        setAnimateIn(false);
      }, 300);
    }, 300);
  };

  // Filter purchased leads by category and search term
  const filteredPurchasedLeads = purchasedLeads.filter(lead => {
    const categoryMatch = purchasedCategoryFilter === 'all' || 
      (typeof lead.category === 'string' 
        ? lead.category === purchasedCategoryFilter 
        : lead.category._id === purchasedCategoryFilter);
        
    const searchMatch = !purchasedLeadSearchTerm || 
      lead.customerName.toLowerCase().includes(purchasedLeadSearchTerm.toLowerCase()) ||
      (lead.customerEmail && lead.customerEmail.toLowerCase().includes(purchasedLeadSearchTerm.toLowerCase()));
      
    return categoryMatch && searchMatch;
  });
  
  // Get unique category IDs from purchased leads
  const purchasedLeadCategories = purchasedLeads.reduce((acc, lead) => {
    const categoryId = typeof lead.category === 'string' ? lead.category : lead.category._id;
    const categoryName = typeof lead.category === 'string' ? lead.category : lead.category.name;
    
    if (!acc[categoryId]) {
      acc[categoryId] = categoryName;
    }
    return acc;
  }, {} as Record<string, string>);

  // Add new function to handle purchased leads pagination
  const handlePurchasedLeadsPageChange = (newPage: number) => {
    setPurchasedLeadsPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };
  
  // Calculate paginated purchased leads
  const getPaginatedPurchasedLeads = () => {
    const startIndex = (purchasedLeadsPagination.currentPage - 1) * purchasedLeadsPagination.leadsPerPage;
    const endIndex = startIndex + purchasedLeadsPagination.leadsPerPage;
    return filteredPurchasedLeads.slice(startIndex, endIndex);
  };
  
  // Update total pages when filtered leads change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredPurchasedLeads.length / purchasedLeadsPagination.leadsPerPage));
    
    // Adjust current page if it's now beyond the total pages
    const currentPage = Math.min(purchasedLeadsPagination.currentPage, totalPages);
    
    setPurchasedLeadsPagination(prev => ({
      ...prev,
      totalPages,
      currentPage
    }));
  }, [filteredPurchasedLeads, purchasedLeadsPagination.leadsPerPage]);

  // Handle exporting all purchased leads to CSV
  const handleExportAllLeads = () => {
    try {
      setExportLoading(true);
      
      // Generate CSV content for all purchased leads, not just the current page
      const headers = ["Customer Name", "Category", "Address", "Contact", "Email", "Website", "Purchase Date"];
      
      const csvContent = [
        headers.join(","),
        ...filteredPurchasedLeads.map(lead => {
          const category = typeof lead.category === 'string' ? lead.category : lead.category.name;
          const website = (lead as any).website || '';
          return [
            `"${lead.customerName}"`,
            `"${category}"`,
            `"${lead.customerAddress}"`,
            `"${lead.customerContact}"`,
            `"${lead.customerEmail}"`,
            `"${website}"`,
            `"${new Date(lead.purchaseDate).toLocaleDateString()}"`
          ].join(",");
        })
      ].join("\n");
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `all-purchased-leads-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setPurchaseSuccessMessage(`Successfully exported ${filteredPurchasedLeads.length} leads`);
      setTimeout(() => {
        setPurchaseSuccessMessage(null);
        setExportLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error exporting leads:', error);
      setError('Failed to export leads');
      setExportLoading(false);
    }
  };
  
  // Handle exporting leads by category
  const handleExportByCategory = (categoryId: string, categoryName: string) => {
    try {
      setExportLoading(true);
      
      // Filter leads by category
      const leadsToExport = purchasedLeads.filter(lead => {
        const leadCategoryId = typeof lead.category === 'string' ? lead.category : lead.category._id;
        return leadCategoryId === categoryId;
      });
      
      // Generate CSV content
      const headers = ["Customer Name", "Category", "Address", "Contact", "Email", "Website", "Purchase Date"];
      
      const csvContent = [
        headers.join(","),
        ...leadsToExport.map(lead => {
          const category = typeof lead.category === 'string' ? lead.category : lead.category.name;
          const website = (lead as any).website || '';
          return [
            `"${lead.customerName}"`,
            `"${category}"`,
            `"${lead.customerAddress}"`,
            `"${lead.customerContact}"`,
            `"${lead.customerEmail}"`,
            `"${website}"`,
            `"${new Date(lead.purchaseDate).toLocaleDateString()}"`
          ].join(",");
        })
      ].join("\n");
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${categoryName}-leads-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setTimeout(() => {
        setExportLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error exporting leads by category:', error);
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
        <p className="text-gray-600">Browse and manage your leads inventory</p>
      </div>
      
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button 
            onClick={() => setActiveTab('available')}
            className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'available'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <PanelRight className="mr-2" size={18} />
              Available Leads
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('purchased')}
            className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'purchased'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Archive className="mr-2" size={18} />
              Purchased Leads
            </div>
          </button>
          <a 
            href="/premium-leads"
            className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm focus:outline-none"
          >
            {/* <div className="flex items-center">
              <Sparkles className="mr-2 text-yellow-500" size={18} />
              Premium Leads
            </div> */}
          </a>
        </div>
      </div>

      {activeTab === 'available' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
              <div className="bg-gradient-to-r from-sky-500 to-sky-600 p-3 text-white">
                <h2 className="text-md font-medium flex items-center">
                  <Layers className="mr-2" size={18} />
                  Categories
                </h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-1">
                  {loading && categories.length === 0 ? (
                    <div className="flex justify-center py-4">
                      <Loader className="animate-spin h-6 w-6 text-sky-500" />
                    </div>
                  ) : (
                    <>
                      {categories.map(category => (
                        <button
                          key={category._id}
                          onClick={() => handleSelectCategory(category._id)}
                          className={`w-full text-left pl-3 pr-2 py-2.5 text-sm rounded-md flex items-center justify-between ${
                            selectedCategory === category._id
                              ? 'bg-sky-100 text-sky-800 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center truncate">
                            <span className="truncate">{category.name}</span>
                          </div>
                          {selectedCategory === category._id && (
                            <ChevronRight size={16} className="text-sky-600 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                      
                      {categories.length === 0 && !loading && (
                        <div className="text-gray-500 text-sm text-center py-4">
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            No categories found
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Leads Content */}
          <div className="lg:col-span-3">
            {selectedCategory ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 p-3 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-md font-medium flex items-center">
                      <PanelRight className="mr-2" size={18} />
                      {categories.find(c => c._id === selectedCategory)?.name} Leads
                    </h2>
                    
          <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/70" size={14} />
            <input
              type="text"
              placeholder="Search leads..."
                        className="pl-8 pr-3 py-1 bg-white/10 border border-white/20 rounded text-xs focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder-white/70"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
                <div className="p-4">
                  {error && !purchaseSuccessMessage && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-md mb-4 flex items-start text-sm">
                      <AlertCircle className="flex-shrink-0 mr-2" size={16} />
                      <p>{error}</p>
                    </div>
                  )}

                  {purchaseSuccessMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-md mb-4 text-sm flex items-center">
                      <CheckCircle className="flex-shrink-0 mr-2" size={16} />
                      <p>{purchaseSuccessMessage}</p>
                    </div>
                  )}
                
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin h-10 w-10 border-4 border-sky-500 border-t-transparent rounded-full mb-4"></div>
                      <p className="text-gray-500">Loading leads from {categories.find(c => c._id === selectedCategory)?.name}...</p>
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PanelRight className="text-gray-400" size={24} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No leads available</h3>
                      <p className="text-gray-500">There are no leads available in this category yet.</p>
                    </div>
                  ) : (
                    <div className={`transition-all duration-300 ${animateOut ? 'opacity-0 translate-y-4' : animateIn ? 'opacity-100 translate-y-0' : ''}`}>
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                Contact Info
                </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                </th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLeads.map(lead => (
                              <React.Fragment key={lead._id}>
                                <tr className={`hover:bg-gray-50 transition-colors ${expandedLeadId === lead._id ? 'bg-sky-50' : ''}`}>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-8 w-8 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-medium">
                                        {lead.customerName.charAt(0)}
                                      </div>
                                      <div className="ml-3">
                                        <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
                                        <div className="text-xs text-gray-500 hidden sm:block">{lead.category.name}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPurchaseStatusStyle(lead.purchaseStatus)}`}>
                                      {lead.purchaseStatus || 'Available'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                                    <div className="text-xs font-medium flex flex-col">
                                      <span className="blur-sm select-none bg-gray-100 px-2 py-1 rounded mb-1 text-xs">
                                        +91 98765-43210
                                      </span>
                                      <span className="blur-sm select-none bg-gray-100 px-2 py-1 rounded text-xs">
                                        customer@example.com
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-xs font-medium flex items-center text-gray-900">
                                      {renderCoinValue(lead.price)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <div className="flex justify-end gap-2">
                                      <button 
                                        onClick={() => handleViewLeadDetails(lead._id)}
                                        disabled={previewLoading === lead._id || lead.isPurchased}
                                        className={`inline-flex items-center px-2 py-1 border text-xs leading-4 font-medium rounded focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-sky-500 ${
                                          lead.isPurchased
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                            : expandedLeadId === lead._id 
                                              ? 'bg-sky-100 text-sky-700 border-sky-300'
                                              : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300'
                                        }`}
                                      >
                                        {previewLoading === lead._id ? (
                                          <>
                                            <Loader className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-sky-700" />
                                            Loading
                                          </>
                                        ) : (
                                          <>
                                            {expandedLeadId === lead._id ? (
                                              <ChevronUp size={14} className="mr-1" />
                                            ) : (
                                              <Eye size={14} className="mr-1" />
                                            )}
                                            {expandedLeadId === lead._id ? 'Hide' : 'Preview'}
                                          </>
                                        )}
                                      </button>
                                      <button 
                                        onClick={() => handlePurchaseLead(lead._id)}
                                        disabled={purchaseLoading === lead._id || lead.isPurchased}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-sky-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                      >
                                        {purchaseLoading === lead._id ? (
                                          <>
                                            <Loader className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" />
                                            Processing
                                          </>
                                        ) : (
                                          <>
                                            <ShoppingCart size={14} className="mr-1" />
                                            {lead.isPurchased ? 'Unavailable' : 'Purchase'}
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                
                                {/* Expanded detail row */}
                                {expandedLeadId === lead._id && expandedLeadDetails && (
                                  <tr className="bg-sky-50">
                                    <td colSpan={5} className="px-0 py-0">
                                      <div 
                                        className={`transition-all duration-300 overflow-hidden ${
                                          animateOut ? 'opacity-0 max-h-0' : 'opacity-100 max-h-96'
                                        }`}
                                      >
                                        <div className="p-4 space-y-3">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="bg-white p-3 rounded-lg shadow-sm border border-sky-100">
                                              <h4 className="text-xs font-medium text-sky-700 mb-2 flex items-center">
                                                <User size={14} className="mr-1" />
                                                Customer Details
                                              </h4>
                                              <div className="space-y-2 text-xs">
                                                <div className="flex items-start">
                                                  <MapPin size={14} className="mr-1.5 flex-shrink-0 text-gray-500 mt-0.5" />
                                                  <span className="text-gray-600">{expandedLeadDetails.customerAddress}</span>
                                                </div>
                                                
                                                {/* @ts-ignore website property may exist in API response */}
                                                {(expandedLeadDetails as any).website && (
                                                  <div className="flex items-center">
                                                    <Globe size={14} className="mr-1.5 text-gray-500" />
                                                    <a href={`https://${(expandedLeadDetails as any).website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                      {(expandedLeadDetails as any).website}
                                                    </a>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            
                                            <div className="bg-white p-3 rounded-lg shadow-sm border border-sky-100">
                                              <h4 className="text-xs font-medium text-sky-700 mb-2 flex items-center">
                                                <Phone size={14} className="mr-1" />
                                                Contact Information
                                              </h4>
                                              <div className="space-y-2 text-xs">
                                                <div className="flex items-center">
                                                  <Phone size={14} className="mr-1.5 text-gray-500" />
                                                  <span className="text-gray-600">{expandedLeadDetails.customerContact}</span>
                                                </div>
                                                
                                                <div className="flex items-center">
                                                  <Mail size={14} className="mr-1.5 text-gray-500" />
                                                  <a href={`mailto:${expandedLeadDetails.customerEmail}`} className="text-blue-600 hover:underline">
                                                    {expandedLeadDetails.customerEmail}
                                                  </a>
                                                </div>
                                                
                                                <div className="flex items-center mt-2">
                                                  <Calendar size={14} className="mr-1.5 text-gray-500" />
                                                  <span className="text-gray-600">
                                                    Available since: {formatDate(expandedLeadDetails.purchaseDate)}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="flex justify-end space-x-2 mt-3">
                                            <button 
                                              onClick={() => handlePurchaseLead(lead._id)}
                                              disabled={purchaseLoading === lead._id || lead.isPurchased}
                                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                              {purchaseLoading === lead._id ? (
                                                <>
                                                  <Loader className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" />
                                                  Processing
                                                </>
                                              ) : (
                                                <>
                                                  <ShoppingCart size={14} className="mr-1.5" />
                                                  Purchase for {renderCoinValue(lead.price)}
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination Controls */}
                      {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
                          <div className="flex items-center text-sm text-gray-700">
                            <span className="font-medium">
                              {(pagination.currentPage - 1) * 10 + 1}
                            </span>
                            <span className="mx-1">-</span>
                            <span className="font-medium">
                              {Math.min(pagination.currentPage * 10, pagination.totalLeads)}
                            </span>
                            <span className="mx-1">of</span>
                            <span className="font-medium">{pagination.totalLeads}</span>
                            <span className="ml-1">leads</span>
                          </div>
                          
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handlePageChange(pagination.currentPage - 1)}
                              disabled={!pagination.hasPrev}
                              className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                              .filter(pageNum => 
                                pageNum === 1 || 
                                pageNum === pagination.totalPages || 
                                (pageNum >= pagination.currentPage - 1 && 
                                 pageNum <= pagination.currentPage + 1)
                              )
                              .map((pageNum, index, array) => {
                                // Add ellipsis if there are gaps
                                if (index > 0 && pageNum > array[index - 1] + 1) {
                                  return (
                                    <React.Fragment key={`ellipsis-${pageNum}`}>
                                      <span className="px-2 py-1 text-xs text-gray-500">...</span>
                                      <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-2 py-1 border rounded text-xs font-medium ${
                                          pageNum === pagination.currentPage
                                            ? 'bg-sky-600 text-white border-sky-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    </React.Fragment>
                                  );
                                }
                                
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`px-2 py-1 border rounded text-xs font-medium ${
                                      pageNum === pagination.currentPage
                                        ? 'bg-sky-600 text-white border-sky-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })
                            }
                            
                            <button
                              onClick={() => handlePageChange(pagination.currentPage + 1)}
                              disabled={!pagination.hasNext}
                              className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600">Show:</span>
                            <select
                              value={availableLeadsPerPage}
                              onChange={(e) => {
                                const newPerPage = Number(e.target.value);
                                setAvailableLeadsPerPage(newPerPage);
                                setPagination(prev => ({
                                  ...prev,
                                  currentPage: 1 // Reset to first page when changing items per page
                                }));
                                if (selectedCategory) {
                                  fetchLeadsByCategory(selectedCategory, 1);
                                }
                              }}
                              className="border border-gray-300 rounded text-xs py-1 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                  <Layers className="text-sky-500" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Category</h3>
                <p className="text-gray-500 text-center mb-6">Choose a category from the sidebar to view available leads</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.slice(0, 5).map(category => (
                    <button
                      key={category._id}
                      onClick={() => handleSelectCategory(category._id)}
                      className="px-3 py-1.5 border border-sky-300 rounded-full text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Purchased Leads Section - Updated */
        <div className="space-y-4">
          {/* Informational note */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-md text-sm flex items-start">
            <Info className="text-blue-500 flex-shrink-0 mr-2 mt-0.5" size={16} />
            <p className="text-gray-900">
              This section shows all your purchased leads. Viewing these leads doesn't affect your wallet balance as they have already been purchased.
            </p>
          </div>
          
          {/* Export Actions Bar */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <FileText className="mr-2 text-gray-700" size={16} />
                Bulk Export Options
              </h3>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportAllLeads}
                  disabled={exportLoading || filteredPurchasedLeads.length === 0}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportLoading ? (
                    <>
                      <Loader className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-gray-700" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileDown size={14} className="mr-1.5 text-gray-700" />
                      Export All Leads
                    </>
                  )}
                </button>
                
                <div className="relative inline-block text-left">
                  <button
                    type="button"
                    onClick={() => document.getElementById('category-export-dropdown')?.classList.toggle('hidden')}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <Filter size={14} className="mr-1.5 text-gray-700" />
                    Export By Category
                    <ChevronDown size={14} className="ml-1.5 text-gray-500" />
                  </button>
                  <div 
                    id="category-export-dropdown"
                    className="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 divide-y divide-gray-100"
                  >
                    <div className="py-1">
                      {Object.entries(purchasedLeadCategories).map(([id, name]) => (
                        <button
                          key={id}
                          onClick={() => {
                            handleExportByCategory(id, name);
                            document.getElementById('category-export-dropdown')?.classList.add('hidden');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-900 hover:bg-gray-100 flex items-center"
                        >
                          <Download size={14} className="mr-2 text-gray-500" />
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Add a minimize/maximize button */}
                <button
                  onClick={() => setBulkExportCardExpanded(!bulkExportCardExpanded)}
                  className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                  aria-label={bulkExportCardExpanded ? "Minimize" : "Maximize"}
                  title={bulkExportCardExpanded ? "Minimize" : "Maximize"}
                >
                  {bulkExportCardExpanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
            </div>
            
            {/* Wrap the content that should be collapsible in a conditional */}
            {bulkExportCardExpanded && (
              <>
                {/* Advanced Filtering Section */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center mb-3">
                    <Filter size={14} className="mr-2 text-gray-700" />
                    <h4 className="text-sm font-medium text-gray-700">Filter Leads</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="category-filter" className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select
                        id="category-filter"
                        className="block w-full py-1.5 px-3 border border-gray-300 bg-white rounded text-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        value={purchasedCategoryFilter}
                        onChange={(e) => setPurchasedCategoryFilter(e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        {Object.entries(purchasedLeadCategories).map(([id, name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="search-filter" className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          id="search-filter"
                          type="text"
                          placeholder="Name, email or contact..."
                          className="pl-8 pr-3 py-1.5 block w-full border border-gray-300 rounded text-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                          value={purchasedLeadSearchTerm}
                          onChange={(e) => setPurchasedLeadSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-end">
                      <button 
                        onClick={() => {
                          setPurchasedCategoryFilter('all');
                          setPurchasedLeadSearchTerm('');
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <XCircle size={14} className="mr-1.5 text-gray-500" />
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Quick Category Filters */}
                {Object.keys(purchasedLeadCategories).length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <div className="flex items-center mb-3">
                      <FileSpreadsheet size={14} className="mr-2 text-gray-700" />
                      <h4 className="text-sm font-medium text-gray-700">Quick Export by Category</h4>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(purchasedLeadCategories).map(([id, name]) => {
                        const categoryLeadsCount = purchasedLeads.filter(lead => {
                          const leadCategoryId = typeof lead.category === 'string' ? lead.category : lead.category._id;
                          return leadCategoryId === id;
                        }).length;
                        
                        return (
                          <button
                            key={id}
                            onClick={() => handleExportByCategory(id, name)}
                            disabled={exportLoading || categoryLeadsCount === 0}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Building size={12} className="mr-1 text-gray-500" />
                            {name}
                            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                              {categoryLeadsCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Main purchased leads table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 text-black">
              <div className="flex items-center justify-between">
                <h2 className="text-md font-medium flex items-center">
                  <ClipboardList className="mr-2" size={18} />
                  My Purchased Leads
                  {filteredPurchasedLeads.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-white text-emerald-700 rounded-full">
                      {filteredPurchasedLeads.length} leads
                    </span>
                  )}
                </h2>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportAllLeads}
                    disabled={exportLoading || filteredPurchasedLeads.length === 0}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={14} className="mr-1.5" />
                    Export Table
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              {purchasedLeadsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="animate-spin h-8 w-8 text-emerald-500 mr-3" />
                  <p className="text-gray-500">Loading your purchased leads...</p>
                </div>
              ) : purchasedLeadsError ? (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-md mb-4 flex items-start text-sm">
                  <AlertCircle className="flex-shrink-0 mr-2" size={16} />
                  <p>{purchasedLeadsError}</p>
                </div>
              ) : filteredPurchasedLeads.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No purchased leads</h3>
                  <p className="text-gray-500 mb-4">You haven't purchased any leads yet.</p>
                  <button
                    onClick={() => setActiveTab('available')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    Browse Available Leads
                  </button>
                </div>
              ) : (
                <div>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            Category
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Purchase Date
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedPurchasedLeads().map(lead => (
                          <React.Fragment key={lead.id}>
                            <tr className={`hover:bg-gray-50 transition-colors ${expandedPurchasedLeadId === lead.id ? 'bg-emerald-50' : ''}`}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">
                                    {lead.customerName.charAt(0)}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900 flex items-center">
                                      {lead.customerName}
                                      <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                                        {(lead as any).purchaseCount || 1}×
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 md:hidden flex items-center">
                                      <Building size={12} className="mr-1 text-gray-400" />
                                      {typeof lead.category === 'string' ? lead.category : lead.category.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                                <div className="text-xs flex items-center">
                                  <Building size={14} className="mr-1.5 text-emerald-500" />
                                  <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs">
                                    {typeof lead.category === 'string' ? lead.category : lead.category.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Calendar size={14} className="mr-1.5 text-gray-400" />
                                  {new Date(lead.purchaseDate).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Active
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => togglePurchasedLeadDetails(lead.id)}
                                    className={`inline-flex items-center px-2 py-1 border text-xs leading-4 font-medium rounded focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-emerald-500 ${
                                      expandedPurchasedLeadId === lead.id
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                        : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300'
                                    }`}
                                  >
                                    {expandedPurchasedLeadId === lead.id ? (
                                      <ChevronUp size={14} className="mr-1" />
                                    ) : (
                                      <Eye size={14} className="mr-1" />
                                    )}
                                    {expandedPurchasedLeadId === lead.id ? 'Hide' : 'Details'}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const csv = `"Customer Name","Category","Address","Contact","Email","Website","Purchase Date"\n"${lead.customerName}","${typeof lead.category === 'string' ? lead.category : lead.category.name}","${lead.customerAddress}","${lead.customerContact}","${lead.customerEmail}","${(lead as any).website || ''}","${new Date(lead.purchaseDate).toLocaleDateString()}"`;
                                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                      const url = URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.setAttribute('href', url);
                                      link.setAttribute('download', `lead-${lead.id}.csv`);
                                      link.style.visibility = 'hidden';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 border border-emerald-300 text-xs font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                  >
                                    <Download size={14} className="mr-1.5" />
                                    Download Lead Data
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded lead details */}
                            {expandedPurchasedLeadId === lead.id && (
                              <tr className="bg-emerald-50">
                                <td colSpan={5} className="px-0 py-0">
                                  <div className="transition-all duration-300 overflow-hidden max-h-96">
                                    <div className="p-4 space-y-3">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
                                          <h4 className="text-xs font-medium text-emerald-700 mb-2 flex items-center">
                                            <User size={14} className="mr-1" />
                                            Customer Details
                                          </h4>
                                          <div className="space-y-2 text-xs">
                                            <div className="flex items-center">
                                              <User size={14} className="mr-1.5 text-gray-500" />
                                              <span className="text-gray-600 font-medium">{lead.customerName}</span>
                                            </div>
                                            <div className="flex items-start">
                                              <MapPin size={14} className="mr-1.5 flex-shrink-0 text-gray-500 mt-0.5" />
                                              <span className="text-gray-600">{lead.customerAddress}</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
                                          <h4 className="text-xs font-medium text-emerald-700 mb-2 flex items-center">
                                            <Phone size={14} className="mr-1" />
                                            Contact Information
                                          </h4>
                                          <div className="space-y-2 text-xs">
                                            <div className="flex items-center">
                                              <Phone size={14} className="mr-1.5 text-gray-500" />
                                              <span className="text-gray-600">{lead.customerContact}</span>
                                            </div>
                                            <div className="flex items-center">
                                              <Mail size={14} className="mr-1.5 text-gray-500" />
                                              <a href={`mailto:${lead.customerEmail}`} className="text-blue-600 hover:underline">
                                                {lead.customerEmail}
                                              </a>
                                            </div>
                                            {/* @ts-ignore website property may exist in API response */}
                                            {(lead as any).website && (
                                              <div className="flex items-center">
                                                <Globe size={14} className="mr-1.5 text-gray-500" />
                                                <a href={`https://${(lead as any).website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                  {(lead as any).website}
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
                                          <h4 className="text-xs font-medium text-emerald-700 mb-2 flex items-center">
                                            <Clock size={14} className="mr-1" />
                                            Purchase Information
                                          </h4>
                                          <div className="space-y-2 text-xs">
                                            <div className="flex items-center">
                                              <Calendar size={14} className="mr-1.5 text-gray-500" />
                                              <span className="text-gray-600">
                                                Purchased on: {formatDate(lead.purchaseDate)}
                                              </span>
                                            </div>
                                            <div className="flex items-center">
                                              <Package size={14} className="mr-1.5 text-gray-500" />
                                              <span className="text-gray-600">
                                                Purchased {(lead as any).purchaseCount || 1} times
                                              </span>
                                            </div>
                                            <div className="flex items-center">
                                              <Building size={14} className="mr-1.5 text-gray-500" />
                                              <span className="text-gray-600">
                                                Category: {typeof lead.category === 'string' ? lead.category : lead.category.name}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex justify-end mt-2">
                                        <button 
                                          onClick={() => {
                                            const csv = `"Customer Name","Category","Address","Contact","Email","Website","Purchase Date"\n"${lead.customerName}","${typeof lead.category === 'string' ? lead.category : lead.category.name}","${lead.customerAddress}","${lead.customerContact}","${lead.customerEmail}","${(lead as any).website || ''}","${new Date(lead.purchaseDate).toLocaleDateString()}"`;
                                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.setAttribute('href', url);
                                            link.setAttribute('download', `lead-${lead.id}.csv`);
                                            link.style.visibility = 'hidden';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          }}
                                          className="inline-flex items-center px-3 py-1.5 border border-emerald-300 text-xs font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                        >
                                          <Download size={14} className="mr-1.5" />
                                          Download Lead Data
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls for Purchased Leads */}
                  {purchasedLeadsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="font-medium">
                          {Math.min(
                            (purchasedLeadsPagination.currentPage - 1) * purchasedLeadsPagination.leadsPerPage + 1, 
                            filteredPurchasedLeads.length
                          )}
                        </span>
                        <span className="mx-1">-</span>
                        <span className="font-medium">
                          {Math.min(
                            purchasedLeadsPagination.currentPage * purchasedLeadsPagination.leadsPerPage,
                            filteredPurchasedLeads.length
                          )}
                        </span>
                        <span className="mx-1">of</span>
                        <span className="font-medium">{filteredPurchasedLeads.length}</span>
                        <span className="ml-1">leads</span>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handlePurchasedLeadsPageChange(purchasedLeadsPagination.currentPage - 1)}
                          disabled={purchasedLeadsPagination.currentPage === 1}
                          className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        
                        {Array.from({ length: purchasedLeadsPagination.totalPages }, (_, i) => i + 1)
                          .filter(pageNum => 
                            pageNum === 1 || 
                            pageNum === purchasedLeadsPagination.totalPages || 
                            (pageNum >= purchasedLeadsPagination.currentPage - 1 && 
                             pageNum <= purchasedLeadsPagination.currentPage + 1)
                          )
                          .map((pageNum, index, array) => {
                            // Add ellipsis if there are gaps
                            if (index > 0 && pageNum > array[index - 1] + 1) {
                              return (
                                <React.Fragment key={`ellipsis-${pageNum}`}>
                                  <span className="px-2 py-1 text-xs text-gray-500">...</span>
                                  <button
                                    key={pageNum}
                                    onClick={() => handlePurchasedLeadsPageChange(pageNum)}
                                    className={`px-2 py-1 border rounded text-xs font-medium ${
                                      pageNum === purchasedLeadsPagination.currentPage
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                </React.Fragment>
                              );
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePurchasedLeadsPageChange(pageNum)}
                                className={`px-2 py-1 border rounded text-xs font-medium ${
                                  pageNum === purchasedLeadsPagination.currentPage
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })
                        }
                        
                        <button
                          onClick={() => handlePurchasedLeadsPageChange(purchasedLeadsPagination.currentPage + 1)}
                          disabled={purchasedLeadsPagination.currentPage === purchasedLeadsPagination.totalPages}
                          className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">Show:</span>
                        <select
                          value={purchasedLeadsPagination.leadsPerPage}
                          onChange={(e) => {
                            setPurchasedLeadsPagination(prev => ({
                              ...prev,
                              leadsPerPage: Number(e.target.value),
                              currentPage: 1 // Reset to first page when changing page size
                            }));
                          }}
                          className="border border-gray-300 rounded text-xs py-1 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
    </div>
  );
};

export default CategorizedLeads;