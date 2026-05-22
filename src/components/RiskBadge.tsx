
import React from 'react';

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const getRiskConfig = () => {
    switch (level) {
      case 'low':
        return {
          text: 'Risk: Low',
          textColor: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          dotColor: 'bg-green-500'
        };
      case 'medium':
        return {
          text: 'Risk: Medium',
          textColor: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          dotColor: 'bg-orange-500'
        };
      case 'high':
        return {
          text: 'Risk: High',
          textColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          dotColor: 'bg-red-500'
        };
      default:
        return {
          text: 'Risk: Low',
          textColor: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          dotColor: 'bg-green-500'
        };
    }
  };

  const config = getRiskConfig();

  return (
    <div className={`items-center border ${config.borderColor} flex gap-1 text-xs ${config.textColor} font-medium text-center ${config.bgColor} rounded-full border-solid p-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <span className={`${config.textColor} text-xs leading-[18px]`}>
        {config.text}
      </span>
    </div>
  );
};

export const SimpleRiskBadge: React.FC<{ level: 'low' | 'medium' | 'high'; className?: string; showSuffix?: boolean }> = ({ level, className = '', showSuffix = false }) => {
  const getRiskConfig = () => {
    switch (level) {
      case 'low':
        return {
          text: showSuffix ? 'Low Risk' : 'Low',
          textColor: 'text-green-500',
          dotColor: 'bg-green-500'
        };
      case 'medium':
        return {
          text: showSuffix ? 'Medium Risk' : 'Medium',
          textColor: 'text-orange-500',
          dotColor: 'bg-orange-500'
        };
      case 'high':
        return {
          text: showSuffix ? 'High Risk' : 'High',
          textColor: 'text-red-500',
          dotColor: 'bg-red-500'
        };
      default:
        return {
          text: showSuffix ? 'Low Risk' : 'Low',
          textColor: 'text-green-500',
          dotColor: 'bg-green-500'
        };
    }
  };

  const config = getRiskConfig();

  return (
    <div className={`items-center border border-[color:var(--Colors-Border-border-primary,#373A41)] shadow-[0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] flex gap-1 bg-[#0C0E12] rounded-[19px] border-solid p-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <span className={`${config.textColor} text-xs leading-[18px]`}>
        {config.text}
      </span>
    </div>
  );
};
