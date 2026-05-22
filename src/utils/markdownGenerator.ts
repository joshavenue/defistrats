import { getDisplayAssetName } from '@/lib/strategyUtils';

interface StrategyData {
  id: string;
  protocol: string;
  asset: string;
  asset1_name: string | null;
  asset2_name: string | null;
  asset1_logo: string | null;
  asset2_logo: string | null;
  apy: number;
  tvl: number | null;
  risk_level: string | null;
  strategy_type: string | null;
  strategy_description: string | null;
  audited_by: string | null;
  video_guide: string | null;
  cta_link: string | null;
  logo: string | null;
  chain: string | null;
}

export function generateStrategyMarkdown(strategy: StrategyData): string {
  const displayName = getDisplayAssetName(strategy);
  const riskLevel = strategy.risk_level ? strategy.risk_level.charAt(0).toUpperCase() + strategy.risk_level.slice(1) : 'Unknown';
  
  return `# ${displayName} on ${strategy.protocol}

## Overview
${displayName} is a DeFi staking strategy available on the ${strategy.protocol} protocol${strategy.chain ? ` on ${strategy.chain}` : ''}.

## Key Metrics
- **APY**: ${strategy.apy.toFixed(2)}%${strategy.tvl && strategy.tvl > 0 ? `\n- **TVL**: $${Number(strategy.tvl).toLocaleString()}` : ''}
- **Risk Level**: ${riskLevel}
- **Strategy Type**: ${strategy.strategy_type || 'General Staking'}
- **Assets**: ${strategy.asset1_name || strategy.asset}${strategy.asset2_name && strategy.strategy_type !== 'LST/Earn/Hold' && strategy.strategy_type !== 'On/Off Ramp' && strategy.strategy_type !== 'Crypto Card' ? ` + ${strategy.asset2_name}` : ''}

## Strategy Details
${strategy.strategy_description ? strategy.strategy_description.replace(/<[^>]*>/g, '') : 'This strategy allows users to stake their assets and earn rewards through the protocol.'}

## Security Information
- **Risk Level**: ${riskLevel} Risk${strategy.audited_by ? `\n- **Audited By**: ${strategy.audited_by}` : ''}

## How to Access
${strategy.cta_link ? `Visit the [${strategy.protocol} platform](${strategy.cta_link}) to start using this strategy.` : `Visit the ${strategy.protocol} platform to start using this strategy.`}

${strategy.video_guide ? `## Learn More\nWatch the [video guide](${strategy.video_guide}) to learn how to use this strategy effectively.` : ''}

## Protocol Information
- **Protocol**: ${strategy.protocol}
- **Blockchain**: ${strategy.chain || 'Multiple chains supported'}

---
*Last updated: ${new Date().toISOString().split('T')[0]}*
*Strategy ID: ${strategy.id}*
`;
}

export function generateStrategyFilename(strategy: StrategyData): string {
  const displayName = getDisplayAssetName(strategy);
  const filename = `${strategy.protocol}-${displayName}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${filename}.md`;
}