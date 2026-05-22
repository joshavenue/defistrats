// Test strategy types and separators
const testAssets = [
  {
    asset1_name: 'ETH',
    asset2_name: 'USDC',
    strategy_type: 'LP'
  },
  {
    asset1_name: 'ETH',
    asset2_name: 'BTC',
    strategy_type: 'Bridge'
  },
  {
    asset1_name: 'BTC',
    asset2_name: 'USDT',
    strategy_type: 'Trading'
  },
  {
    asset1_name: 'MATIC',
    asset2_name: 'USDC',
    strategy_type: 'Borrow/Lending'
  },
  {
    asset1_name: 'stETH',
    asset2_name: null,
    strategy_type: 'LST/Earn/Hold'
  }
];

// Simulate the logic from strategyUtils.ts
function getDisplayAssetName(asset) {
  const { asset1_name, asset2_name, strategy_type } = asset;
  
  // Helper function to clean asset names
  const cleanAssetName = (name) => {
    if (!name || name.toLowerCase() === 'unknown' || name.trim() === '') {
      return null;
    }
    return name;
  };
  
  const cleanAsset1 = cleanAssetName(asset1_name);
  const cleanAsset2 = cleanAssetName(asset2_name);
  
  // Fallback to original asset field if no asset names are provided
  if (!cleanAsset1 && !cleanAsset2) {
    return 'Asset';
  }
  
  // For single-asset strategies, only show the first asset name without separator
  const singleAssetStrategies = ['LST', 'LST/Earn/Hold', 'On/Off Ramp', 'Crypto Card'];
  if (singleAssetStrategies.includes(strategy_type)) {
    return cleanAsset1 || 'Asset';
  }
  
  // If only one asset name is provided, return it
  if (!cleanAsset1) return cleanAsset2 || 'Asset';
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
}

console.log('🧪 Testing Strategy Types and Separators...\n');

testAssets.forEach((asset, index) => {
  const displayName = getDisplayAssetName(asset);
  console.log(`${index + 1}. ${asset.strategy_type}: ${displayName}`);
});

console.log('\n✅ Strategy type testing complete!');
console.log('\n📋 Expected results:');
console.log('1. LP: ETH / USDC');
console.log('2. Bridge: ETH → BTC');
console.log('3. Trading: BTC / USDT');
console.log('4. Borrow/Lending: MATIC + USDC');
console.log('5. LST/Earn/Hold: stETH');