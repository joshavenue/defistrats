import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RiskBadge } from './RiskBadge';
import { TagBadge } from './TagBadge';
import { ActionButtons } from './ActionButtons';
import { isSingleAssetStrategy } from '@/lib/strategyUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { generateStrategyUrl } from '@/utils/urlUtils';
import { sanitizeRichTextHtml } from '@/lib/htmlSanitizer';

interface MetricCardProps {
  title: string;
  apy: string;
  tlv: string;
  showApy?: boolean;
  showTvl?: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  tags: Array<{ text: string; variant?: 'primary' | 'secondary' | 'tertiary' }>;
  description: string;
  iconSrc: string;
  asset2IconSrc?: string;
  auditedBy?: string;
  onVideoClick?: () => void;
  onExploreClick?: () => void;
  videoUrl?: string | null;
  exploreUrl?: string | null;
  className?: string;
  strategyType?: string;
  protocol?: string;
  // Additional fields for URL generation
  asset1_name?: string | null;
  asset2_name?: string | null;
  asset?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  apy,
  tlv,
  showApy = true,
  showTvl = true,
  riskLevel,
  tags,
  description,
  iconSrc,
  asset2IconSrc,
  auditedBy = "XYZ",
  onVideoClick,
  onExploreClick,
  videoUrl,
  exploreUrl,
  className = '',
  strategyType,
  protocol,
  asset1_name,
  asset2_name,
  asset
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleCardClick = () => {
    if (protocol) {
      const url = generateStrategyUrl({
        protocol,
        asset1_name,
        asset2_name,
        asset,
        strategy_type: strategyType
      });
      
      // Preserve current search parameters (filters, pagination) in the state
      const currentParams = searchParams.toString();
      navigate(url, { 
        state: { 
          returnUrl: `${window.location.pathname}${currentParams ? `?${currentParams}` : ''}` 
        } 
      });
    }
  };
  // Create display tags with strategy type as second item
  const displayTags = [...tags];
  if (strategyType) {
    displayTags.splice(1, 0, { text: strategyType, variant: 'secondary' as const });
  }

  // Check if strategy is single-asset to conditionally hide asset2 icon
  const isSingleAsset = isSingleAssetStrategy(strategyType);

  return (
    <TooltipProvider>
      <article 
        className={`w-full items-stretch border border-[color:var(--Colors-Border-border-secondary,#22262F)] shadow-[0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] flex flex-col gap-2 bg-[#13161B] p-4 sm:p-5 rounded-xl border-solid cursor-pointer hover:bg-[#181B20] transition-colors ${className}`}
        onClick={handleCardClick}
      >
        <header className="flex w-full gap-2 sm:gap-3">
          <div className={`relative ${isSingleAsset ? 'w-[32px] sm:w-[44px]' : 'w-[50px] sm:w-[70px]'} h-[32px] sm:h-[44px] flex items-center flex-shrink-0`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <img
                  id="asset1"
                  src={iconSrc}
                  alt="Asset 1"
                  className="absolute left-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[#13161B] z-10 cursor-help"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{title.split(' / ')[0] || title.split(' + ')[0]}</p>
              </TooltipContent>
            </Tooltip>
            {!isSingleAsset && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <img
                    id="asset2"
                    src={asset2IconSrc || "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/60f68463b2a1d46f9dc95a722922a671f1a93774?placeholderIfAbsent=true"}
                    alt="Asset 2"
                    className="absolute left-4 sm:left-6 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[#13161B] cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{title.split(' / ')[1] || title.split(' + ')[1] || 'Asset 2'}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex flex-col items-stretch justify-center flex-1 min-w-0">
            <h3 className="text-[#F7F7F7] text-sm sm:text-base font-semibold leading-tight truncate">
              {title}
            </h3>
          </div>
          <div className="flex-shrink-0">
            <RiskBadge level={riskLevel} />
          </div>
        </header>
        
        {/* APY and TVL */}
        <div className="flex gap-4 mt-3">
          {showApy && (
            <div className="flex-1">
              <p className="text-[#94979C] text-xs mb-1">APY</p>
              <p className="text-[#75E0A7] text-sm font-semibold">
                {apy && apy !== '0%' ? apy : '-'}
              </p>
            </div>
          )}
          {showTvl && (
            <div className="flex-1">
              <p className="text-[#94979C] text-xs mb-1">TVL</p>
              <p className="text-[#F7F7F7] text-sm font-semibold">
                {tlv && tlv !== '$0' ? tlv : '-'}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 text-xs text-[#84CAFF] font-medium mt-3 sm:mt-5">
          {displayTags.map((tag, index) => (
            <TagBadge 
              key={index} 
              text={tag.text} 
              variant={tag.variant || 'secondary'} 
            />
          ))}
        </div>
        
        <div 
          className="text-[#94979C] text-xs sm:text-sm leading-4 sm:leading-5 font-normal mt-3 sm:mt-5 rich-text-content"
          dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(description) }}
        />
        
        <ActionButtons
          onVideoClick={onVideoClick}
          onExploreClick={onExploreClick}
          videoUrl={videoUrl}
          exploreUrl={exploreUrl}
          auditedBy={auditedBy}
          protocol={protocol}
          className="mt-3 sm:mt-5"
        />
      </article>
    </TooltipProvider>
  );
};
