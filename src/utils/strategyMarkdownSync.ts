import { supabase } from '@/integrations/supabase/client';
import { generateStrategyMarkdown, generateStrategyFilename } from './markdownGenerator';

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

/**
 * Generates markdown file for a single strategy and uploads to Supabase storage
 */
export async function generateStrategyMarkdownFile(strategy: StrategyData): Promise<void> {
  try {
    const markdown = generateStrategyMarkdown(strategy);
    const filename = generateStrategyFilename(strategy);
    
    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from('asset-logos') // Reusing existing bucket
      .upload(`strategies/${filename}`, new Blob([markdown], { type: 'text/markdown' }), {
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading strategy markdown:', error);
      throw error;
    }
    
    console.log(`Strategy markdown generated: ${filename}`);
  } catch (error) {
    console.error('Error generating strategy markdown:', error);
    throw error;
  }
}

/**
 * Generates markdown files for all published strategies
 */
export async function generateAllStrategyMarkdowns(): Promise<string[]> {
  try {
    // Fetch all published strategies
    const { data: strategies, error } = await supabase
      .from('staking_assets')
      .select('*')
      .eq('status', 'published');
    
    if (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }
    
    if (!strategies || strategies.length === 0) {
      console.log('No published strategies found');
      return [];
    }
    
    const filenames: string[] = [];
    
    // Generate markdown for each strategy
    for (const strategy of strategies) {
      await generateStrategyMarkdownFile(strategy);
      filenames.push(generateStrategyFilename(strategy));
    }
    
    return filenames;
  } catch (error) {
    console.error('Error generating all strategy markdowns:', error);
    throw error;
  }
}

/**
 * Generates the llms.txt file with links to all strategy markdowns
 */
export async function generateLLMSTxt(strategyFilenames: string[]): Promise<void> {
  try {
    const baseUrl = window.location.origin;
    
    let llmsContent = '# DeFi Staking Strategies\n\n## Available Strategies\n\n';
    
    // Add each strategy as a link
    for (const filename of strategyFilenames) {
      const strategyName = filename
        .replace('.md', '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      llmsContent += `- [${strategyName}](${baseUrl}/strategies/${filename})\n`;
    }
    
    llmsContent += `\n---\n*Total strategies: ${strategyFilenames.length}*\n`;
    llmsContent += `*Last updated: ${new Date().toISOString().split('T')[0]}*\n`;
    
    // Upload llms.txt to storage
    const { error } = await supabase.storage
      .from('asset-logos')
      .upload('llms.txt', new Blob([llmsContent], { type: 'text/plain' }), {
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading llms.txt:', error);
      throw error;
    }
    
    console.log('llms.txt generated successfully');
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    throw error;
  }
}

/**
 * Complete sync process - generates all markdowns and llms.txt
 */
export async function syncAllStrategyMarkdowns(): Promise<void> {
  try {
    console.log('Starting strategy markdown sync...');
    
    const filenames = await generateAllStrategyMarkdowns();
    await generateLLMSTxt(filenames);
    
    console.log('Strategy markdown sync completed successfully');
  } catch (error) {
    console.error('Error during strategy markdown sync:', error);
    throw error;
  }
}