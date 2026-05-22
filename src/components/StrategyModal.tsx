import React from 'react';
import { X, Play, ExternalLink, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { SimpleRiskBadge } from './RiskBadge';
import { TagBadge } from './TagBadge';
import { normalizeUrl } from '@/lib/urlUtils';
import { sanitizeRichTextHtml } from '@/lib/htmlSanitizer';
import { trackLinkClick } from '@/lib/analytics';

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
  apyNumeric: number;
  tlvNumeric: number;
}

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: TableRow | null;
}

export const StrategyModal: React.FC<StrategyModalProps> = ({
  isOpen,
  onClose,
  strategy,
}) => {
  if (!strategy) return null;

  const handleVideoClick = async () => {
    if (strategy.videoUrl) {
      const normalizedUrl = normalizeUrl(strategy.videoUrl);
      if (normalizedUrl) {
        await trackLinkClick(normalizedUrl, 'video', window.location.pathname);
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleExploreClick = async () => {
    if (strategy.exploreUrl) {
      const normalizedUrl = normalizeUrl(strategy.exploreUrl);
      if (normalizedUrl) {
        await trackLinkClick(normalizedUrl, 'explore', window.location.pathname);
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const getRiskColor = () => {
    switch (strategy.risk) {
      case 'low':
        return 'text-green-400';
      case 'medium':
        return 'text-orange-400';
      case 'high':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskText = () => {
    switch (strategy.risk) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      default:
        return 'Unknown Risk';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0C0E12] border-[#22262F] text-[#F7F7F7] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-[#22262F] pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Protocol Logo */}
              <div className="flex items-center gap-3">
                <img
                  src={strategy.protocol.iconSrc}
                  alt={strategy.protocol.name}
                  className="w-12 h-12 rounded-full border-2 border-[#22262F]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
                  }}
                />
                <div>
                  <DialogTitle className="text-xl font-bold text-[#F7F7F7]">
                    {strategy.protocol.name}
                  </DialogTitle>
                  <p className="text-sm text-[#94979C]">{strategy.company.name}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#94979C] hover:text-[#F7F7F7] transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">

          {/* Asset Icons */}
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-[#F7F7F7]">Assets</h3>
            <div className="flex items-center">
              <img
                src={strategy.company.iconSrc}
                alt="Asset 1"
                className="w-8 h-8 rounded-full border-2 border-[#0C0E12]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
                }}
              />
              {strategy.company.asset2IconSrc && strategy.strategyType !== 'LST/Earn/Hold' && (
                <img
                  src={strategy.company.asset2IconSrc}
                  alt="Asset 2"
                  className="w-8 h-8 rounded-full border-2 border-[#0C0E12] -ml-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
                  }}
                />
              )}
            </div>
          </div>

          {/* Risk & Tags */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#94979C]" />
                <span className="text-sm text-[#94979C]">Risk Level:</span>
              </div>
              <SimpleRiskBadge level={strategy.risk} />
            </div>

            {strategy.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[#F7F7F7]">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {strategy.strategyType && (
                    <TagBadge text={strategy.strategyType} variant="secondary" />
                  )}
                  {strategy.tags.map((tag, index) => (
                    <TagBadge
                      key={index}
                      text={tag.text}
                      variant={tag.variant || 'tertiary'}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Strategy Description */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-[#F7F7F7]">Strategy Description</h4>
            <div className="bg-[#181B20] border border-[#22262F] rounded-lg p-4">
              <div 
                className="text-[#CECFD2] text-sm leading-relaxed rich-text-content"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeRichTextHtml(strategy.strategyDescription || 'No strategy description available.')
                }}
              />
            </div>
          </div>

          {/* Audit Information */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-[#F7F7F7]">Security & Audits</h4>
            <div className="bg-[#181B20] border border-[#22262F] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#75E0A7]" />
                <span className="text-sm font-medium text-[#F7F7F7]">Audited by:</span>
              </div>
              <p className="text-[#CECFD2] text-sm">
                {strategy.auditedBy || 'No audit information available.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#22262F]">
            {strategy.videoUrl && (
              <button
                onClick={handleVideoClick}
                className="flex items-center gap-2 px-4 py-3 bg-[#22262F] hover:bg-[#2A2F38] text-[#F7F7F7] rounded-lg transition-colors flex-1"
              >
                <Play className="w-4 h-4" />
                <span className="font-medium">Watch Guide</span>
              </button>
            )}
            {strategy.exploreUrl && (
              <button
                onClick={handleExploreClick}
                className="flex items-center gap-2 px-4 py-3 bg-[#75E0A7] hover:bg-[#6BC995] text-[#0C0E12] rounded-lg transition-colors flex-1 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Explore {strategy.protocol.name}</span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
