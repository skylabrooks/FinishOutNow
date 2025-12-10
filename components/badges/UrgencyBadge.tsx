import React from 'react';
import { getUrgencyColor } from '../../utils/colorMappings';

interface UrgencyBadgeProps {
  urgency: string;
  showLabel?: boolean;
  className?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ 
  urgency, 
  showLabel = true,
  className = '' 
}) => {
  const bgColor = urgency === 'High' ? 'bg-red-500/20' : 
                  urgency === 'Medium' ? 'bg-yellow-500/20' : 'bg-slate-500/20';
  
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bgColor} ${getUrgencyColor(urgency)} ${className}`}>
      {urgency} {showLabel && 'Priority'}
    </span>
  );
};
