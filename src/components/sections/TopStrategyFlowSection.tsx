
import React from 'react';
import { MetricCard } from '@/components/MetricCard';
import { useFeaturedAssets } from '@/hooks/useFeaturedAssets';
import { getDisplayAssetName } from '@/lib/strategyUtils';
import { handleVideoClick, handleExploreClick, formatTags } from '@/utils/strategyHandlers';

export const TopStrategyFlowSection: React.FC = () => {
  const { data: featuredAssets = [], isLoading } = useFeaturedAssets();

  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-[#F7F7F7] text-xl sm:text-2xl font-semibold">
            Top Strategy Flow
          </h1>
        </div>
        
        {/* Metric Cards - Responsive Grid */}
        <div className="mb-8 lg:mb-12">
          {isLoading ? (
            <div className="text-[#F7F7F7] text-center py-8">Loading featured strategies...</div>
          ) : featuredAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" role="region" aria-label="Strategy metrics">
              {featuredAssets.map(asset => (
                <MetricCard
                  key={asset.id}
                  title={getDisplayAssetName(asset)}
                  apy={`${asset.apy}%`}
                  tlv={`$${asset.tvl?.toLocaleString() || '0'}`}
                  showApy={true}
                  showTvl={asset.tvl !== null && asset.tvl > 0}
                  riskLevel={asset.risk_level}
                  tags={formatTags(asset)}
                  description={asset.strategy_description || ''}
                  iconSrc={asset.asset1_logo || 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/9f5029859eaeee7331e7fc2e4194a855badca233?placeholderIfAbsent=true'}
                  asset2IconSrc={asset.asset2_logo || undefined}
                  auditedBy={asset.audited_by || 'XYZ'}
                  onVideoClick={() => handleVideoClick(asset.id)}
                  onExploreClick={() => handleExploreClick(asset.id)}
                  videoUrl={asset.video_guide || undefined}
                  exploreUrl={asset.cta_link || undefined}
                  strategyType={asset.strategy_type || undefined}
                  protocol={asset.protocol}
                  asset1_name={asset.asset1_name}
                  asset2_name={asset.asset2_name}
                  asset={asset.asset}
                />
              ))}
            </div>
          ) : (
            <div className="text-[#F7F7F7] text-center py-8">No featured strategies available</div>
          )}
        </div>
      </div>
    </section>
  );
};
