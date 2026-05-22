// Utility functions for generating strategy URLs

/**
 * Generates a URL-safe slug from a string
 */
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generates strategy URL path from asset data
 */
export const generateStrategyUrl = (asset: {
  id?: string;
  protocol: string;
  asset1_name?: string | null;
  asset2_name?: string | null;
  asset?: string;
  strategy_type?: string | null;
}): string => {
  const protocol = createSlug(asset.protocol);
  
  // Create asset string based on strategy type and available names
  let assetString = '';
  
  if (asset.asset1_name) {
    assetString = createSlug(asset.asset1_name);
    
    // Add second asset if it exists and strategy type supports it
    if (asset.asset2_name && asset.strategy_type !== 'LST/Earn/Hold' && asset.strategy_type !== 'On/Off Ramp' && asset.strategy_type !== 'Crypto Card') {
      assetString += `-${createSlug(asset.asset2_name)}`;
    }
  } else if (asset.asset) {
    // Fallback to original asset field
    assetString = createSlug(asset.asset);
  } else {
    // Default fallback
    assetString = 'strategy';
  }
  
  // Add strategy type to help with identification
  if (asset.strategy_type) {
    assetString += `-${createSlug(asset.strategy_type)}`;
  }
  
  // Add strategy ID as the ultimate unique identifier
  if (asset.id) {
    // Use only the first 8 characters of the ID for cleaner URLs
    assetString += `-${asset.id.substring(0, 8)}`;
  }
  
  return `/strategy/${protocol}/${assetString}`;
};

/**
 * Parses strategy URL parameters back to readable format
 */
export const parseStrategyUrl = (protocol: string, assets: string) => {
  const protocolName = protocol.replace(/-/g, ' ');
  const assetParts = assets.split('-');
  
  // Strategy types that might appear at the end of the URL
  const strategyTypes = ['lst-earn-hold', 'borrow-lending', 'trading', 'yield-farming', 'on-off-ramp', 'crypto-card'];
  
  let strategyType = null;
  let strategyId = null;
  let assetNames = [...assetParts];
  
  // Check if the last part is a strategy ID (8 character alphanumeric)
  const lastPart = assetParts[assetParts.length - 1];
  if (lastPart && lastPart.length === 8 && /^[a-f0-9]{8}$/i.test(lastPart)) {
    strategyId = lastPart;
    assetNames = assetParts.slice(0, -1); // Remove strategy ID from asset names
  }
  
  // Check if the second-to-last part (or last if no ID) is a strategy type
  const potentialStrategyType = assetNames[assetNames.length - 1];
  if (strategyTypes.includes(potentialStrategyType)) {
    strategyType = potentialStrategyType.replace(/-/g, '/');
    assetNames = assetNames.slice(0, -1); // Remove strategy type from asset names
  }
  
  // Convert asset names back to readable format
  const readableAssetNames = assetNames.map(asset => 
    asset.replace(/-/g, ' ')
  );
  
  return {
    protocol: protocolName,
    assets: readableAssetNames,
    strategyType,
    strategyId
  };
};