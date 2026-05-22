import React from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SimpleRiskBadge } from "./RiskBadge";
import { TagBadge } from "./TagBadge";
import { TableActionButtons } from "./ActionButtons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { isSingleAssetStrategy } from '@/lib/strategyUtils';
import { generateStrategyUrl } from '@/utils/urlUtils';
import { ScrambleText } from './ScrambleText';
interface TableRow {
  id: string;
  protocol: {
    name: string;
    iconSrc: string;
  };
  company: {
    name: string;
    iconSrc: string;
    asset2IconSrc?: string;
  };
  risk: "low" | "medium" | "high";
  tags: Array<{
    text: string;
    variant?: "primary" | "secondary" | "tertiary";
  }>;
  earn: string[] | null;
  points: boolean;
  apy: string;
  tlv: string;
  showApy?: boolean;
  showTvl?: boolean;
  videoUrl?: string | null;
  exploreUrl?: string | null;
  strategyDescription?: string;
  auditedBy?: string;
  strategyType?: string;
  apyNumeric: number;
  tlvNumeric: number;
  // Add fields needed for URL generation
  asset1_name?: string | null;
  asset2_name?: string | null;
  asset?: string;
}
interface ModalDataTableRowProps {
  row: TableRow;
  onViewDetails?: (row: TableRow) => void; // Make optional since we'll navigate instead
}
export const ModalDataTableRow: React.FC<ModalDataTableRowProps> = ({
  row,
  onViewDetails
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleRowClick = () => {
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
  // Create tags array including strategy type
  const displayTags = [...row.tags];
  if (row.strategyType) {
    displayTags.unshift({
      text: row.strategyType,
      variant: "secondary" as const
    });
  }

  // Protocol icon mapping function for fallback
  const getProtocolIcon = (protocol: string) => {
    const protocolIcons: {
      [key: string]: string;
    } = {
      'Lido': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
      'Rocket Pool': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/60f68463b2a1d46f9dc95a722922a671f1a93774?placeholderIfAbsent=true',
      'Aave': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
      'Compound': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/60f68463b2a1d46f9dc95a722922a671f1a93774?placeholderIfAbsent=true',
      'Uniswap': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true'
    };
    return protocolIcons[protocol] || 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
  };

  // Use protocol icon with fallback
  const protocolIconSrc = row.protocol.iconSrc && row.protocol.iconSrc.trim() !== '' ? row.protocol.iconSrc : getProtocolIcon(row.protocol.name);
  return <TooltipProvider>
      <div className="flex w-full flex-wrap max-md:max-w-full px-[16px] group hover:bg-[#13161B] transition-colors cursor-pointer justify-between border-b border-solid border-[#22262F]" onClick={handleRowClick}>
        {/* Protocol */}
        <div className="text-xs text-[#CECFD2] whitespace-nowrap w-[80px]">
          <div className="items-center flex min-h-[72px] w-full justify-start pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] max-md:px-5">
            <div className="flex items-center justify-start w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <img src={protocolIconSrc} alt={row.protocol.name} className="w-8 h-8 rounded-full cursor-help" onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.src = getProtocolIcon(row.protocol.name);
                }} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{row.protocol.name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* Assets */}
        <div className="text-[#F7F7F7] w-[200px]">
          <div className="items-center flex min-h-[72px] w-full gap-3 leading-none pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] px-0">
            <div className="relative w-[70px] h-[44px] flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <img src={row.company.iconSrc} alt="Asset 1" className="absolute left-0 w-8 h-8 rounded-full border-2 border-[#0C0E12] z-10 cursor-help" onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
                }} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{row.company.name.split(' / ')[0] || row.company.name.split(' + ')[0]}</p>
                </TooltipContent>
              </Tooltip>
              {row.company.asset2IconSrc && !isSingleAssetStrategy(row.strategyType) && <Tooltip>
                  <TooltipTrigger asChild>
                    <img src={row.company.asset2IconSrc} alt="Asset 2" className="absolute left-6 w-8 h-8 rounded-full border-2 border-[#0C0E12] cursor-help" onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
                }} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{row.company.name.split(' / ')[1] || row.company.name.split(' + ')[1] || 'Asset 2'}</p>
                  </TooltipContent>
                </Tooltip>}
            </div>
            <ScrambleText className="text-[#F7F7F7] text-sm leading-[20px]" duration={0.8} delay={Math.random() * 0.2} threshold={0.5} triggerOnce={false}>
              {row.company.name}
            </ScrambleText>
          </div>
        </div>
        
        {/* Earn Tags */}
        <div className="text-xs w-[100px]">
          <div className="justify-start flex min-h-[72px] w-full pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] px-0">
            <div className="self-stretch flex gap-1 my-auto justify-start overflow-hidden">
              {row.earn && row.earn.length > 0 ? <>
                  {/* Show first tag */}
                  <TagBadge text={row.earn[0]} variant="primary" />
                  {/* Show second tag if exists */}
                  {row.earn.length > 1 && <TagBadge text={row.earn[1]} variant="primary" />}
                  {/* Show count if more than 2 tags */}
                  {row.earn.length > 2 && <span className="text-[#75E0A7] text-xs self-center font-medium">
                      +{row.earn.length - 2}
                    </span>}
                </> : <span className="text-[#94979C] text-xs self-center">-</span>}
            </div>
          </div>
        </div>
        
        {/* Points */}
        <div className="text-xs text-[#CECFD2] whitespace-nowrap w-[80px]">
          <div className="items-center flex min-h-[72px] w-full text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] max-md:px-5">
            <div className="self-stretch flex items-center justify-center w-full">
              {row.points ? <span className="text-[#75E0A7] text-sm font-medium">✅</span> : <span className="text-[#94979C] text-sm">-</span>}
            </div>
          </div>
        </div>
        
        {/* Risk */}
        <div className="text-xs text-[#CECFD2] whitespace-nowrap w-[80px]">
          <div className="items-center flex min-h-[72px] w-full text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] max-md:px-5">
            <SimpleRiskBadge level={row.risk} className="self-stretch my-auto" />
          </div>
        </div>
        
        {/* Tags */}
        <div className="text-xs w-[120px]">
            <div className="items-center flex min-h-[72px] w-auto text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] max-md:px-5">
            <div className="self-stretch flex gap-1 my-auto">
              {displayTags.length > 0 && <TagBadge text={displayTags[0].text} variant={displayTags[0].variant || "secondary"} />}
              {displayTags.length > 1 && <span className="text-[#94979C] text-xs self-center">
                  (+{displayTags.length - 1})
                </span>}
            </div>
          </div>
        </div>

        {/* APY */}
        <div className="text-xs text-[#CECFD2] whitespace-nowrap w-[80px] hidden">
          <div className="items-center flex min-h-[72px] w-full text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] max-md:px-5">
            {row.showApy !== false && row.apy && row.apy !== '0' && <ScrambleText className="text-[#75E0A7] text-sm font-medium" duration={0.6} delay={Math.random() * 0.3} threshold={0.5} triggerOnce={false}>
                {row.apy}
              </ScrambleText>}
          </div>
        </div>

        {/* TVL */}
        <div className="text-xs text-[#CECFD2] whitespace-nowrap w-[120px] hidden">
          <div className="items-center flex min-h-[72px] w-full text-center pr-8 pl-[var(--spacing-3xl,] py-[16px)] max-md:px-5">
            {row.showTvl !== false && row.tlv && row.tlv !== '$0' && <ScrambleText className="text-[#F7F7F7] text-sm font-medium" duration={0.7} delay={Math.random() * 0.4} threshold={0.5} triggerOnce={false}>
                {row.tlv}
              </ScrambleText>}
          </div>
        </div>
        
        {/* Actions */}
        <div className="font-semibold leading-none w-[100px]">
          <div className="items-center flex min-h-[72px] w-full gap-3 pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] max-md:px-5">
            <div onClick={e => e.stopPropagation()}>
              <TableActionButtons videoUrl={row.videoUrl} exploreUrl={row.exploreUrl} />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>;
};