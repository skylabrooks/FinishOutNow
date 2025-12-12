import React from 'react';
import { getStatusColor } from '../../utils/colorMappings';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(status)} ${className}`}>
      {status.toUpperCase()}
    </span>
  );
};
