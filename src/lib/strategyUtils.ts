
// Utility functions for strategy type handling
export const isLSTStrategy = (strategyType: string | null): boolean => {
  if (!strategyType) return false;
  return strategyType === 'LST' || strategyType === 'LST/Earn/Hold';
};

// Check if strategy type should show only single asset (like LST)
export const isSingleAssetStrategy = (strategyType: string | null): boolean => {
  if (!strategyType) return false;
  return strategyType === 'LST' || 
         strategyType === 'LST/Earn/Hold' || 
         strategyType === 'On/Off Ramp' || 
         strategyType === 'Crypto Card';
};

export const getDisplayAssetName = (asset: {
  asset: string;
  asset1_name: string | null;
  asset2_name: string | null;
  strategy_type: string | null;
}): string => {
  const { asset1_name, asset2_name, strategy_type } = asset;
  
  // Helper function to clean asset names
  const cleanAssetName = (name: string | null): string | null => {
    if (!name || name.toLowerCase() === 'unknown' || name.trim() === '') {
      return null;
    }
    return name;
  };
  
  const cleanAsset1 = cleanAssetName(asset1_name);
  const cleanAsset2 = cleanAssetName(asset2_name);
  const cleanAsset = cleanAssetName(asset.asset);
  
  // Fallback to original asset field if no asset names are provided
  if (!cleanAsset1 && !cleanAsset2) {
    return cleanAsset || 'Asset';
  }
  
  // For single-asset strategies, only show the first asset name without separator
  if (isSingleAssetStrategy(strategy_type)) {
    return cleanAsset1 || cleanAsset || 'Asset';
  }
  
  // If only one asset name is provided, return it
  if (!cleanAsset1) return cleanAsset2 || cleanAsset || 'Asset';
  if (!cleanAsset2) return cleanAsset1;

  // Use strategy_type to determine separator for other strategies
  if (strategy_type === 'LP') {
    return `${cleanAsset1} / ${cleanAsset2}`;
  } else if (strategy_type === 'Bridge') {
    return `${cleanAsset1} → ${cleanAsset2}`;
  } else if (strategy_type === 'Trading') {
    return `${cleanAsset1} / ${cleanAsset2}`;
  } else {
    return `${cleanAsset1} + ${cleanAsset2}`;
  }
};
