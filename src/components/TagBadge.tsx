
import React from 'react';

interface TagBadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ text, variant = 'primary', className = '' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          textColor: 'text-[#D6BBFB]',
          borderColor: 'border-[#D6BBFB]/20',
          bgColor: 'bg-[#D6BBFB]/5'
        };
      case 'secondary':
        return {
          textColor: 'text-[#84CAFF]',
          borderColor: 'border-[#84CAFF]/20',
          bgColor: 'bg-[#84CAFF]/5'
        };
      case 'tertiary':
        return {
          textColor: 'text-[#A4BCFD]',
          borderColor: 'border-[#A4BCFD]/20',
          bgColor: 'bg-[#A4BCFD]/5'
        };
      default:
        return {
          textColor: 'text-[#84CAFF]',
          borderColor: 'border-[#84CAFF]/20',
          bgColor: 'bg-[#84CAFF]/5'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <span className={`inline-flex items-center justify-center px-2 py-2 rounded-full border border-solid ${styles.textColor} ${styles.borderColor} ${styles.bgColor} text-xs leading-[18px] font-medium ${className}`}>
      {text}
    </span>
  );
};
