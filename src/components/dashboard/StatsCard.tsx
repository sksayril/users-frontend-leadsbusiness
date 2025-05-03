import React from 'react';
import { motion } from 'framer-motion';

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, change, className = '' }) => {
  return (
    <motion.div
      className={`card hover:shadow-lg ${className}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {change.isPositive ? '+' : ''}{change.value}%
              </span>
              <span className="text-gray-500 text-xs ml-1">from last month</span>
            </div>
          )}
        </div>
        
        <div className="p-3 rounded-full bg-primary-50">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;