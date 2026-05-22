import React from 'react';
import { normalizeUrl } from '@/lib/urlUtils';
import { trackLinkClick } from '@/lib/analytics';

interface ActionButtonsProps {
  onVideoClick?: () => void;
  onExploreClick?: () => void;
  videoUrl?: string | null;
  exploreUrl?: string | null;
  auditedBy?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  className?: string;
  protocol?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onVideoClick,
  onExploreClick,
  videoUrl,
  exploreUrl,
  auditedBy = "XYZ",
  riskLevel,
  className = '',
  protocol = "Protocol"
}) => {
  const handleVideoClick = () => {
    if (onVideoClick) {
      onVideoClick();
    }
  };
  const handleExploreClick = () => {
    if (onExploreClick) {
      onExploreClick();
    }
  };
  const handleVideoLinkClick = async (url: string) => {
    await trackLinkClick(url, 'video', window.location.pathname);
  };
  const handleExploreLinkClick = async (url: string) => {
    await trackLinkClick(url, 'explore', window.location.pathname);
  };
  const getRiskText = () => {
    switch (riskLevel) {
      case 'low':
        return 'Risk: Low';
      case 'medium':
        return 'Risk: Medium';
      case 'high':
        return 'Risk: High';
      default:
        return '';
    }
  };
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-500';
      case 'medium':
        return 'text-orange-500';
      case 'high':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  // Protocol icon mapping function
  const getProtocolIcon = (protocol: string) => {
    const protocolIcons: { [key: string]: string } = {
      'Lido': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
      'Rocket Pool': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/60f68463b2a1d46f9dc95a722922a671f1a93774?placeholderIfAbsent=true',
      'Aave': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
      'Compound': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/60f68463b2a1d46f9dc95a722922a671f1a93774?placeholderIfAbsent=true',
      'Uniswap': 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
    };
    
    return protocolIcons[protocol] || 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/fb9276de70ac35d433dae8cdd9ad72d0d1d82647?placeholderIfAbsent=true';
  };
  // Normalize URLs to ensure they have proper protocol
  const normalizedVideoUrl = normalizeUrl(videoUrl);
  const normalizedExploreUrl = normalizeUrl(exploreUrl);

  return <div className={`flex w-full max-w-[349px] flex-col h-full ${className}`}>
      <div className="flex w-full gap-2 text-sm font-semibold leading-none py-[8px] mt-auto">
        {normalizedVideoUrl && (
          normalizedVideoUrl ? <a 
            href={normalizedVideoUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="justify-center items-center border border-[color:var(--Colors-Border-border-primary,#373A41)] shadow-[0px_0px_0px_1px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner-border,rgba(12,14,18,0.18))_inset,0px_-2px_0px_0px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner,rgba(12,14,18,0.05))_inset,0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] flex gap-1 overflow-hidden text-[#CECFD2] flex-1 shrink basis-[0%] px-3.5 py-2.5 rounded-lg border-solid hover:bg-[#22262F] transition-colors" 
            aria-label="Watch video guide"
            onClick={() => handleVideoLinkClick(normalizedVideoUrl)}
          >
            <img src="https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/6c8d9233c1e09de061643943424f337551c679e8?placeholderIfAbsent=true" alt="Video icon" className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto" />
            <span className="text-[#CECFD2] text-sm leading-[20px)]">
              Video Guide
            </span>
          </a> : <button onClick={handleVideoClick} className="justify-center items-center border border-[color:var(--Colors-Border-border-primary,#373A41)] shadow-[0px_0px_0px_1px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner-border,rgba(12,14,18,0.18))_inset,0px_-2px_0px_0px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner,rgba(12,14,18,0.05))_inset,0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] flex gap-1 overflow-hidden text-[#CECFD2] flex-1 shrink basis-[0%] px-3.5 py-2.5 rounded-lg border-solid hover:bg-[#22262F] transition-colors" aria-label="Watch video guide" disabled={!onVideoClick}>
            <img src="https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/6c8d9233c1e09de061643943424f337551c679e8?placeholderIfAbsent=true" alt="Video icon" className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto" />
            <span className="text-[#CECFD2] text-sm leading-[20px)]">
              Video Guide
            </span>
          </button>
        )}
        {normalizedExploreUrl ? <a 
            href={normalizedExploreUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`justify-center items-center border-[color:var(--Gradient-skeuemorphic-gradient-border,rgba(255,255,255,0.12))] shadow-[0px_0px_0px_1px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner-border,rgba(12,14,18,0.18))_inset,0px_-2px_0px_0px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner,rgba(12,14,18,0.05))_inset,0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] bg-[#75E0A7] flex gap-1 overflow-hidden text-black whitespace-nowrap ${normalizedVideoUrl ? 'flex-1 shrink basis-[0%]' : 'w-full'} px-3.5 py-2.5 rounded-lg border-2 border-solid hover:bg-[#6BC995] transition-colors`}
            aria-label="Explore strategy"
            onClick={() => handleExploreLinkClick(normalizedExploreUrl)}
          >
            <img src={getProtocolIcon(protocol)} alt="Protocol icon" className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto rounded-full" />
            <span className="text-sm leading-[20px)]">
              Explore {protocol} now
            </span>
          </a> : <button onClick={handleExploreClick} className={`justify-center items-center border-[color:var(--Gradient-skeuemorphic-gradient-border,rgba(255,255,255,0.12))] shadow-[0px_0px_0px_1px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner-border,rgba(12,14,18,0.18))_inset,0px_-2px_0px_0px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner,rgba(12,14,18,0.05))_inset,0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] bg-[#75E0A7] flex gap-1 overflow-hidden text-black whitespace-nowrap ${normalizedVideoUrl ? 'flex-1 shrink basis-[0%]' : 'w-full'} px-3.5 py-2.5 rounded-lg border-2 border-solid hover:bg-[#6BC995] transition-colors`} aria-label="Explore strategy" disabled={!onExploreClick}>
            <img src={getProtocolIcon(protocol)} alt="Protocol icon" className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto rounded-full" />
            <span className="text-sm leading-[20px)]">
              Explore {protocol} now
            </span>
          </button>}
      </div>
      <div className="flex flex-col w-full gap-1 text-xs text-center">
        <span className="text-[#75E0A7] text-xs leading-[18px)] w-full">
          Audited by: {auditedBy}
        </span>
        {riskLevel && <span className={`text-xs leading-[18px)] w-full ${getRiskColor()}`}>
            {getRiskText()}
          </span>}
      </div>
    </div>;
};

interface TableActionButtonsProps {
  videoUrl?: string | null;
  exploreUrl?: string | null;
}

export const TableActionButtons: React.FC<TableActionButtonsProps> = ({
  exploreUrl
}) => {
  const normalizedExploreUrl = normalizeUrl(exploreUrl);
  
  const handleExploreLinkClick = async () => {
    if (normalizedExploreUrl) {
      await trackLinkClick(normalizedExploreUrl, 'explore', window.location.pathname);
    }
  };
  
  return <div className="items-center flex">
      <a 
        href={normalizedExploreUrl ?? undefined} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`justify-center items-center border border-[#373A41] shadow-[0px_0px_0px_1px_rgba(12,14,18,0.18)_inset,0px_-2px_0px_0px_rgba(12,14,18,0.05)_inset,0px_1px_2px_0px_rgba(255,255,255,0.00)] bg-[#22262F] flex gap-1 overflow-hidden text-[#F7F7F7] whitespace-nowrap px-3 py-2 rounded-lg border-solid hover:bg-[#2A2E37] transition-colors ${!normalizedExploreUrl ? 'pointer-events-none opacity-50' : ''}`} 
        aria-label="Explore strategy" 
        tabIndex={normalizedExploreUrl ? 0 : -1}
        onClick={handleExploreLinkClick}
      >
        <span className="text-sm leading-[20px)]">
          Explore →
        </span>
      </a>
    </div>;
};
