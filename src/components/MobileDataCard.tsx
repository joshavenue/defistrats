import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SimpleRiskBadge } from './RiskBadge';
import { TagBadge } from './TagBadge';
import { TableActionButtons } from './ActionButtons';
import { isSingleAssetStrategy } from '@/lib/strategyUtils';
import { TableRow } from '@/hooks/useStakingAssets';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { sanitizeRichTextHtml } from '@/lib/htmlSanitizer';
import { OptimizedImage } from './OptimizedImage';
import { generateStrategyUrl } from '@/utils/urlUtils';


interface MobileDataCardProps {
  row: TableRow;
  onViewDetails?: (row: TableRow) => void;
}

export const MobileDataCard: React.FC<MobileDataCardProps> = ({ row, onViewDetails }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleCardClick = () => {
    const url = generateStrategyUrl({
      protocol: row.protocol.name,
      asset1_name: row.asset1_name,
      asset2_name: row.asset2_name,
      asset: row.asset,
      strategy_type: row.strategyType
    });
    
    // Preserve current search parameters (filters, pagination) in the state
    const currentParams = searchParams.toString();
    navigate(url, { 
      state: { 
        returnUrl: `${window.location.pathname}${currentParams ? `?${currentParams}` : ''}` 
      } 
    });
  };

  return (
    <TooltipProvider>
      <div 
        className="bg-[#13161B] border border-[#22262F] rounded-lg p-4 space-y-3 cursor-pointer hover:bg-[#181B20] transition-colors"
        onClick={handleCardClick}
      >
        {/* Asset Header */}
        <div className="flex items-center gap-3">
          <div className={`relative ${isSingleAssetStrategy(row.strategyType) ? 'w-[32px]' : 'w-[56px]'} h-[32px] flex-shrink-0`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute left-0 w-8 h-8 z-10">
                  <OptimizedImage
                    src={row.company.iconSrc}
                    alt={row.company.name}
                    className="w-8 h-8 rounded-full border-2 border-[#13161B] cursor-help"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{row.company.name.split(' / ')[0] || row.company.name.split(' + ')[0]}</p>
              </TooltipContent>
            </Tooltip>
            {row.company.asset2IconSrc && !isSingleAssetStrategy(row.strategyType) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute left-[24px] w-8 h-8">
                    <OptimizedImage
                      src={row.company.asset2IconSrc}
                      alt="Asset 2"
                      className="w-8 h-8 rounded-full border-2 border-[#13161B] cursor-help"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{row.company.name.split(' / ')[1] || row.company.name.split(' + ')[1] || 'Asset 2'}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-[#F7F7F7] text-sm font-medium">
              {row.company.name}
            </h4>
          </div>
          <div className="w-8 h-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <OptimizedImage
                  src={row.protocol.iconSrc}
                  alt={row.protocol.name}
                  className="w-8 h-8 rounded-full cursor-help"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{row.protocol.name}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Tags with Risk and Strategy */}
        <div className="flex flex-wrap gap-1">
          <SimpleRiskBadge level={row.risk} />
          {row.strategyType && (
            <TagBadge
              text={row.strategyType}
              variant="secondary"
            />
          )}
          {row.earn && row.earn.map((earnTag, index) => (
            <TagBadge
              key={`earn-${index}`}
              text={earnTag}
              variant="primary"
            />
          ))}
          {row.tags.map((tag, index) => (
            <TagBadge
              key={index}
              text={tag.text}
              variant={tag.variant || "secondary"}
            />
          ))}
        </div>

        {/* APY, TVL, and Points */}
        <div className="flex gap-4">
          {row.showApy !== false && row.apy && row.apy !== '0' && (
            <div className="flex-1">
              <p className="text-[#94979C] text-xs mb-1">APY</p>
              <p className="text-[#75E0A7] text-sm font-medium">
                {row.apy}
              </p>
            </div>
          )}
          {row.showTvl !== false && row.tlv && row.tlv !== '$0' && (
            <div className="flex-1">
              <p className="text-[#94979C] text-xs mb-1">TVL</p>
              <p className="text-[#F7F7F7] text-sm font-medium">
                {row.tlv}
              </p>
            </div>
          )}
          <div className="flex-shrink-0">
            <p className="text-[#94979C] text-xs mb-1">Points</p>
            <p className="text-center">
              {row.points ? (
                <span className="text-[#75E0A7] text-sm font-medium">✓</span>
              ) : (
                <span className="text-[#94979C] text-sm">-</span>
              )}
            </p>
          </div>
        </div>

        {/* Strategy Description - Mobile */}
        {row.strategyDescription && (
          <div className="pt-2 border-t border-[#22262F]">
            <h5 className="text-xs text-[#94979C] mb-1">Strategy</h5>
            <div 
              className="rich-text-content text-xs"
              dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(row.strategyDescription) }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-[#22262F]">
          <div onClick={(e) => e.stopPropagation()}>
            <TableActionButtons
              videoUrl={row.videoUrl}
              exploreUrl={row.exploreUrl}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
