import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Phone, Mail, Globe, Calendar, Tag } from 'lucide-react';

interface PurchasedLeadModalProps {
  lead: {
    id: string;
    customerName: string;
    customerAddress: string;
    customerContact: string;
    customerEmail: string;
    website?: string;
    category: string | { _id: string; name: string };
    purchaseDate: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const PurchasedLeadModal: React.FC<PurchasedLeadModalProps> = ({ lead, isOpen, onClose }) => {
  const [revealed, setRevealed] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Add a short delay before revealing data for animation effect
      const timer = setTimeout(() => {
        setRevealed(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRevealed(false);
    }
  }, [isOpen]);

  if (!isOpen || !lead) return null;

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

  // Handle category that could be either a string or an object
  const categoryName = typeof lead.category === 'string' 
    ? lead.category 
    : lead.category.name;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Lead Details
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X size={20} />
                  </button>
                </div>
                
                <div className={`mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 transition-all duration-500 ${revealed ? 'opacity-100' : 'opacity-50 blur-sm'}`}>
                  <div className="text-lg font-bold text-blue-700 mb-2 flex items-center">
                    <User size={20} className="mr-2" />
                    {lead.customerName}
                  </div>
                  
                  <div className="space-y-3 text-gray-600">
                    <div className="flex items-start">
                      <MapPin size={18} className="mr-2 flex-shrink-0 text-blue-500 mt-0.5" />
                      <span>{lead.customerAddress}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone size={18} className="mr-2 text-blue-500" />
                      <span>{lead.customerContact}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Mail size={18} className="mr-2 text-blue-500" />
                      <a href={`mailto:${lead.customerEmail}`} className="text-blue-600 hover:underline">
                        {lead.customerEmail}
                      </a>
                    </div>
                    
                    {lead.website && (
                      <div className="flex items-center">
                        <Globe size={18} className="mr-2 text-blue-500" />
                        <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {lead.website}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Tag size={18} className="mr-2 text-blue-500" />
                      <span>Category: {categoryName}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar size={18} className="mr-2 text-blue-500" />
                      <span>Purchased on: {formatDate(lead.purchaseDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasedLeadModal; 