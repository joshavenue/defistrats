import { supabase } from "@/integrations/supabase/client";

interface ScrapedData {
  apy?: number;
  tvl?: number;
  asset_found?: boolean;
  raw_content?: string;
  raw_html?: string;
  raw_markdown?: string;
  error?: string;
}

interface TextPattern {
  pattern: string;
  contextBefore?: string;
  contextAfter?: string;
}

export const scrapeWebsiteForAPYTVL = async (
  url: string,
  targetAsset: string,
  apyFieldName: string = "APY",
  tvlFieldName: string = "TVL",
  tvlSuffix?: string,
  waitDelaySeconds?: number,
  apyPattern?: TextPattern,
  tvlPattern?: TextPattern,
): Promise<ScrapedData> => {
  try {
    const { data, error } = await supabase.functions.invoke("scrape-apy-tvl", {
      body: {
        website: url,
        asset1: targetAsset,
        apyFieldName,
        tvlFieldName,
        tvlSuffix,
        waitDelaySeconds,
        apyPattern,
        tvlPattern,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (!data?.success) {
      return { error: data?.error ?? "Failed to scrape website content" };
    }

    return {
      apy: data.data?.apy,
      tvl: data.data?.tvl,
      asset_found: data.data?.asset_found,
      raw_content: data.raw_content,
      raw_html: data.raw_html,
      raw_markdown: data.raw_markdown,
    };
  } catch (error) {
    console.error("Server-side scraping error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown scraping error",
    };
  }
};
