import React from 'react';
import { LeadCategory } from '../../types';
import { getCategoryColor } from '../../utils/colorMappings';

interface CategoryBadgeProps {
  category: LeadCategory;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(category)} ${className}`}>
      {category}
    </span>
  );
};
