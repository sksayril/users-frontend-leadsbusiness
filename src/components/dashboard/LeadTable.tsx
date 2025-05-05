import React from 'react';
import { MoreHorizontal, ExternalLink, Coins } from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';
  date: string;
  value: number;
};

type LeadTableProps = {
  leads: Lead[];
  title: string;
  isTransactionView?: boolean;
};

const LeadTable: React.FC<LeadTableProps> = ({ leads, title, isTransactionView = false }) => {
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
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    if (isTransactionView) {
      // For transactions, 'qualified' means 'CREDIT' and 'new' means 'DEBIT'
      if (status === 'qualified') return 'CREDIT';
      if (status === 'new') return 'DEBIT';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center">
          View all
          <ExternalLink size={16} className="ml-1" />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isTransactionView ? 'Description' : 'Lead'}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isTransactionView ? 'Type' : 'Status'}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isTransactionView ? 'Coins' : 'Value'}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="relative px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    {lead.company && (
                      <div className="text-sm text-gray-500">{lead.company}</div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(lead.status)}`}>
                    {getStatusLabel(lead.status)}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isTransactionView ? (
                    <div className="flex items-center">
                      <Coins size={14} className="text-amber-500 mr-1" />
                      <span>{lead.value}</span>
                    </div>
                  ) : (
                    `$${lead.value.toLocaleString()}`
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.date}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTable;