
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayAssetName, isLSTStrategy } from '@/lib/strategyUtils';

interface StakingAssetData {
  id: string;
  protocol: string;
  asset: string;
  symbol: string;
  apy: number;
  tvl: number | null;
  risk_level: string | null;
  chain: string | null;
  featured: boolean;
  asset1_logo: string | null;
  asset2_logo: string | null;
  asset1_name: string | null;
  asset2_name: string | null;
  strategy_type: string | null;
  logo: string | null;
  strategy_description: string | null;
  audited_by: string | null;
  video_guide: string | null;
  cta_link: string | null;
  earn: string[] | null;
  points: string | null;
  created_at: string;
  status: string;
}

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
  risk: 'low' | 'medium' | 'high';
  tags: Array<{
    text: string;
    variant?: 'primary' | 'secondary' | 'tertiary';
  }>;
  earn: string[] | null;
  points: boolean;
  apy: string;
  tlv: string;
  videoUrl?: string | null;
  exploreUrl?: string | null;
  strategyDescription?: string;
  auditedBy?: string;
  apyNumeric: number;
  tlvNumeric: number;
  strategyType?: string;
  asset1_name?: string | null;
  asset2_name?: string | null;
  asset?: string;
  showApy: boolean;
  showTvl: boolean;
}

export const useStakingAssets = (limit?: number) => {
  return useQuery({
    queryKey: ['staking-assets', limit],
    queryFn: async () => {
      try {
        let query = supabase
          .from('staking_assets')
          .select('id, protocol, asset, symbol, apy, tvl, risk_level, chain, featured, asset1_logo, asset2_logo, asset1_name, asset2_name, strategy_type, logo, strategy_description, audited_by, video_guide, cta_link, earn, points, status')
          .eq('status', 'published')
          .order('featured', { ascending: false })
          .order('apy', { ascending: false });
        
        if (limit) {
          query = query.limit(limit);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (err) {
        console.error('Error fetching staking assets:', err);
        throw err;
      }
    },
    select: (stakingAssets) => {
      console.log('🔄 Transforming assets, count:', stakingAssets?.length);
      if (!stakingAssets) return [];
      
      return stakingAssets.map((asset): TableRow => {
        const apyNumeric = asset.apy !== undefined && asset.apy !== null ? Number(asset.apy) : 0;
        const tlvNumeric = asset.tvl !== undefined && asset.tvl !== null ? Number(asset.tvl) : 0;
        
        return {
          id: asset.id,
          protocol: {
            name: asset.protocol,
            iconSrc: asset.logo || 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
          },
          company: {
            name: getDisplayAssetName(asset),
            iconSrc:
              asset.asset1_logo ||
              'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true',
            asset2IconSrc: !isLSTStrategy(asset.strategy_type) ? (asset.asset2_logo || undefined) : undefined
          },
          risk:
            asset.risk_level === 'high'
              ? 'high'
              : asset.risk_level === 'medium'
              ? 'medium'
              : 'low',
          tags: [
            asset.chain
              ? { text: asset.chain, variant: 'tertiary' as const }
              : undefined,
          ].filter((tag): tag is { text: string; variant: 'tertiary' } => Boolean(tag)),
          earn: asset.earn || null,
          points: Boolean(asset.points && asset.points.trim() !== ''),
          apy: apyNumeric > 0 ? `${apyNumeric}%` : '-',
          tlv: tlvNumeric > 0 ? `$${tlvNumeric.toLocaleString()}` : '$0',
          showApy: true,
          showTvl: tlvNumeric > 0,
          videoUrl: asset.video_guide || null,
          exploreUrl: asset.cta_link || null,
          strategyDescription: asset.strategy_description || undefined,
          auditedBy: asset.audited_by || undefined,
          apyNumeric,
          tlvNumeric,
          strategyType: asset.strategy_type || undefined,
          asset1_name: asset.asset1_name,
          asset2_name: asset.asset2_name,
          asset: asset.asset,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export type { TableRow };
