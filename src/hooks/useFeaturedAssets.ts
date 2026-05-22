
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StakingAsset {
  id: string;
  asset: string;
  symbol: string;
  apy: number;
  tvl: number | null;
  risk_level: 'low' | 'medium' | 'high';
  protocol: string;
  chain: string | null;
  description: string | null;
  strategy_description: string | null;
  featured: boolean;
  asset1_logo: string | null;
  asset2_logo: string | null;
  asset1_name: string | null;
  asset2_name: string | null;
  strategy_type: string | null;
  audited_by: string | null;
  video_guide: string | null;
  cta_link: string | null;
}

export const useFeaturedAssets = () => {
  return useQuery({
    queryKey: ['featured-assets-debug'],
    queryFn: async () => {
      console.log('🔍 Fetching featured assets...');
      const { data, error } = await supabase
        .from('staking_assets')
        .select('*')
        .eq('featured', true)
        // Temporarily removing status filter to debug
        .order('created_at', { ascending: false })
        .limit(3);
      console.log('⭐ Featured assets from database:', data);
      console.log('❌ Featured assets errors?', error);
      
      if (error) throw error;
      return data as StakingAsset[];
    }
  });
};

export type { StakingAsset };
