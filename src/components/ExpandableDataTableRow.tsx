import React from "react";
import { ChevronDown, Play } from "lucide-react";
import { SimpleRiskBadge } from "./RiskBadge";
import { TagBadge } from "./TagBadge";
import { TableActionButtons } from "./ActionButtons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { sanitizeRichTextHtml } from "@/lib/htmlSanitizer";

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
  apy: string;
  tlv: string;
  videoUrl?: string | null;
  exploreUrl?: string | null;
  strategyDescription?: string;
  auditedBy?: string;
  strategyType?: string;
}

interface ExpandableDataTableRowProps {
  row: TableRow;
  onVideoClick: (id: string) => void;
  onExploreClick: (id: string) => void;
  isExpanded: boolean;
  onToggleExpanded: (id: string) => void;
}

export const ExpandableDataTableRow: React.FC<ExpandableDataTableRowProps> = ({
  row,
  onVideoClick,
  onExploreClick,
  isExpanded,
  onToggleExpanded,
}) => {
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
    const protocolIcons: { [key: string]: string } = {
      'Lido': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
      'Rocket Pool': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/60f68463b2a1d46f9dc95a722922a671f1a93774?placeholderIfAbsent=true',
      'Aave': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
      'Compound': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/60f68463b2a1d46f9dc95a722922a671f1a93774?placeholderIfAbsent=true',
      'Uniswap': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
    };
    
    return protocolIcons[protocol] || 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
  };

  // Use protocol icon with fallback
  const protocolIconSrc = row.protocol.iconSrc && row.protocol.iconSrc.trim() !== '' 
    ? row.protocol.iconSrc 
    : getProtocolIcon(row.protocol.name);

  return (
    <TooltipProvider>
      <Collapsible open={isExpanded} onOpenChange={() => onToggleExpanded(row.id)}>
        <CollapsibleTrigger asChild>
          <div className="flex w-full flex-wrap max-md:max-w-full px-[16px] cursor-pointer hover:bg-[#13161B] transition-colors">
            {/* Protocol */}
            <div className="text-xs text-[#CECFD2] whitespace-nowrap w-[80px]">
              <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full justify-start pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
                <div className="flex items-center justify-start w-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <img
                        src={protocolIconSrc}
                        alt={row.protocol.name}
                        className="w-8 h-8 rounded-full cursor-help"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getProtocolIcon(row.protocol.name);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{row.protocol.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            {/* Assets */}
            <div className="min-w-60 text-[#F7F7F7] flex-1 shrink basis-[0%]">
              <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full gap-3 leading-none pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid px-0">
                <div className="relative w-[70px] h-[44px] flex items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <img
                        id="asset1"
                        src={row.company.iconSrc}
                        alt="Asset 1"
                        className="absolute left-0 w-8 h-8 rounded-full border-2 border-[#0C0E12] z-10 cursor-help"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{row.company.name.split(' / ')[0] || row.company.name.split(' + ')[0]}</p>
                    </TooltipContent>
                  </Tooltip>
                  {row.company.asset2IconSrc && row.strategyType !== 'LST/Earn/Hold' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <img
                          id="asset2"
                          src={row.company.asset2IconSrc}
                          alt="Asset 2"
                          className="absolute left-6 w-8 h-8 rounded-full border-2 border-[#0C0E12] cursor-help"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{row.company.name.split(' / ')[1] || row.company.name.split(' + ')[1] || 'Asset 2'}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <span className="text-[#F7F7F7] text-sm leading-[20px)]">
                  {row.company.name}
                </span>
              </div>
            </div>
            {/* Risk */}
            <div className="text-xs text-[#CECFD2] whitespace-nowrap w-[119px]">
              <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
                <SimpleRiskBadge level={row.risk} className="self-stretch my-auto" />
              </div>
            </div>
            {/* Tags */}
            <div className="min-w-60 text-xs w-[322px]">
              <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
                <div className="self-stretch flex min-w-60 gap-1 my-auto">
                  {displayTags.map((tag, index) => (
                    <TagBadge
                      key={index}
                      text={tag.text}
                      variant={tag.variant || "secondary"}
                    />
                  ))}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="font-semibold leading-none w-[168px]">
              <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full gap-3 pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
                <TableActionButtons
                  videoUrl={row.videoUrl}
                  exploreUrl={row.exploreUrl}
                />
                <ChevronDown 
                  className={`h-4 w-4 text-[#94979C] transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="px-[16px] py-4 bg-[#13161B] border-b border-[#22262F]">
            <div className="max-w-4xl">
              {/* Strategy Type Section */}
              {row.strategyType && (
                <div className="mb-4">
                  <h4 className="text-[#F7F7F7] text-sm font-semibold mb-2">Strategy Type</h4>
                  <p className="text-[#CECFD2] text-sm">
                    {row.strategyType}
                  </p>
                </div>
              )}

              <h4 className="text-[#F7F7F7] text-sm font-semibold mb-2">Strategy Description</h4>
              <div 
                className="rich-text-content mb-4"
                dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(row.strategyDescription || 'No strategy description available.') }}
              />

              {/* Audit Section */}
              <div className="mb-4">
                <h4 className="text-[#F7F7F7] text-sm font-semibold mb-2">Audited By</h4>
                <p className="text-[#CECFD2] text-sm">
                  {row.auditedBy || 'No audit information available.'}
                </p>
              </div>
              
              {/* Video CTA */}
              {row.videoUrl && (
                <div className="pt-3 border-t border-[#22262F]">
                  <a
                    href={row.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#22262F] hover:bg-[#2A2F38] text-[#F7F7F7] text-sm font-medium rounded-lg transition-colors"
                    aria-label="Watch video guide"
                  >
                    <Play className="w-4 h-4" />
                    Watch Video Guide
                  </a>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
};
