
import { StakingAsset } from '@/hooks/useFeaturedAssets';

export const handleVideoClick = (cardId: string) => {
  console.log(`Video guide clicked for card ${cardId}`);
  // Implement video modal or navigation logic
};

export const handleExploreClick = (cardId: string) => {
  console.log(`Explore clicked for card ${cardId}`);
  // Implement navigation to strategy details
};

export const formatTags = (asset: StakingAsset) => {
  const tags = [];
  if (asset.protocol) tags.push({
    text: asset.protocol,
    variant: 'secondary' as const
  });
  if (asset.chain) tags.push({
    text: asset.chain,
    variant: 'tertiary' as const
  });
  return tags;
};
