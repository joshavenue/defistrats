import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!FIRECRAWL_API_KEY) {
  console.error("FIRECRAWL_API_KEY environment variable is not set");
}

interface FetchRequest {
  website: string;
  asset1: string;
  apyFieldName: string;
  tvlFieldName: string;
  tvlSuffix?: string;
  waitDelaySeconds?: number;
  apyPattern?: TextPattern;
  tvlPattern?: TextPattern;
}

interface TextPattern {
  pattern: string;
  contextBefore?: string;
  contextAfter?: string;
}

interface FetchResponse {
  success: boolean;
  data?: {
    apy?: number;
    tvl?: number;
    asset_found?: boolean;
  };
  error?: string;
  debug?: unknown;
  raw_content?: string;
  raw_html?: string;
  raw_markdown?: string;
}

function jsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

async function requireAdmin(req: Request, corsHeaders: Record<string, string>) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      response: jsonResponse(
        { success: false, error: "Server configuration error" },
        500,
        corsHeaders,
      ),
    };
  }

  const token = getBearerToken(req);
  if (!token) {
    return {
      ok: false,
      response: jsonResponse(
        { success: false, error: "Unauthorized" },
        401,
        corsHeaders,
      ),
    };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: callerData, error: callerError } =
    await supabase.auth.getUser(token);
  const caller = callerData.user;

  if (callerError || !caller) {
    return {
      ok: false,
      response: jsonResponse(
        { success: false, error: "Unauthorized" },
        401,
        corsHeaders,
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin,is_superadmin")
    .eq("id", caller.id)
    .single();

  if (profileError || (!profile?.is_admin && !profile?.is_superadmin)) {
    return {
      ok: false,
      response: jsonResponse(
        { success: false, error: "Forbidden" },
        403,
        corsHeaders,
      ),
    };
  }

  return { ok: true, response: null };
}

function normalizeContent(content: string) {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumericValue(
  text: string,
  isPercentage: boolean,
  suffix?: string,
) {
  const match = text.match(/([\d,]+\.?\d*)\s*([KMB%]?)/i);
  if (!match) return undefined;

  let value = Number.parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(value)) return undefined;

  const unit = (suffix || match[2] || "").toUpperCase();
  if (!isPercentage) {
    if (unit === "K") value *= 1_000;
    if (unit === "M") value *= 1_000_000;
    if (unit === "B") value *= 1_000_000_000;
  }

  return isPercentage ? value : Math.round(value);
}

function extractWithPattern(
  content: string,
  pattern: TextPattern | undefined,
  isPercentage: boolean,
  suffix?: string,
) {
  if (!pattern?.pattern) return undefined;

  const normalizedContent = normalizeContent(content);
  const normalizedPattern = normalizeContent(pattern.pattern);
  const patternValue = parseNumericValue(
    normalizedPattern,
    isPercentage,
    suffix,
  );

  if (patternValue === undefined) return undefined;

  if (pattern.contextBefore || pattern.contextAfter) {
    const before = pattern.contextBefore
      ? normalizeContent(pattern.contextBefore).toLowerCase()
      : "";
    const after = pattern.contextAfter
      ? normalizeContent(pattern.contextAfter).toLowerCase()
      : "";
    const lowerContent = normalizedContent.toLowerCase();
    const start = before ? lowerContent.indexOf(before) : 0;
    const end =
      after && start >= 0
        ? lowerContent.indexOf(after, start + before.length)
        : -1;

    if (start >= 0) {
      const section =
        end >= 0
          ? normalizedContent.slice(start, end + after.length)
          : normalizedContent.slice(start, start + 2_000);

      if (
        section.includes(normalizedPattern) ||
        section.includes(String(patternValue))
      ) {
        return patternValue;
      }
    }
  }

  return normalizedContent.includes(normalizedPattern)
    ? patternValue
    : undefined;
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await requireAdmin(req, corsHeaders);
    if (!auth.ok) {
      return auth.response;
    }

    const {
      website,
      asset1,
      apyFieldName,
      tvlFieldName,
      tvlSuffix,
      waitDelaySeconds,
      apyPattern,
      tvlPattern,
    }: FetchRequest = await req.json();

    if (!website || !asset1 || !apyFieldName || !tvlFieldName) {
      return jsonResponse(
        {
          success: false,
          error:
            "Missing required parameters: website, asset1, apyFieldName, tvlFieldName",
        },
        400,
        corsHeaders,
      );
    }

    if (!FIRECRAWL_API_KEY) {
      return jsonResponse(
        {
          success: false,
          error: "Firecrawl API key not configured",
        },
        500,
        corsHeaders,
      );
    }

    console.log(`Fetching APY & TVL for ${asset1} from ${website}`);

    // Step 1: First scrape with JavaScript rendering
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: website,
        formats: ["markdown", "html"],
        waitFor: Math.min(Math.max(waitDelaySeconds ?? 5, 0), 30) * 1000,
        timeout: 30000,
      }),
    });

    let scrapedContent = "";
    let scrapedHtml = "";
    if (scrapeResponse.ok) {
      const scrapeData = await scrapeResponse.json();
      scrapedContent = scrapeData.data?.markdown || scrapeData.data?.html || "";
      scrapedHtml = scrapeData.data?.html || "";
      console.log("Scraped content length:", scrapedContent.length);
    }

    // Step 2: Parse the markdown content directly since Firecrawl extraction is failing
    console.log("Parsing markdown content for asset data...");

    // Look for the asset in the scraped content
    const assetFound = scrapedContent.includes(asset1);
    console.log(`Asset ${asset1} found in content:`, assetFound);

    let extractedAPY: number | undefined;
    let extractedTVL: number | undefined;

    if (scrapedContent) {
      extractedAPY = extractWithPattern(scrapedContent, apyPattern, true);
      extractedTVL = extractWithPattern(
        scrapedContent,
        tvlPattern,
        false,
        tvlSuffix,
      );

      if (!extractedAPY && scrapedHtml) {
        extractedAPY = extractWithPattern(scrapedHtml, apyPattern, true);
      }

      if (!extractedTVL && scrapedHtml) {
        extractedTVL = extractWithPattern(
          scrapedHtml,
          tvlPattern,
          false,
          tvlSuffix,
        );
      }
    }

    if (assetFound && scrapedContent) {
      // Extract APY (looking for various APY patterns)
      const apyPatterns = extractedAPY
        ? []
        : [
            new RegExp(`${apyFieldName}\\s*([\\d,]+\\.?\\d*)%`, "i"),
            new RegExp(`${apyFieldName}\\s*([\\d,]+\\.?\\d*)`, "i"),
            /Borrow APY\s*([\d,]+\.?\d*)%/i,
            /Lend APY\s*([\d,]+\.?\d*)%/i,
            /APY\s*([\d,]+\.?\d*)%/i,
          ];

      for (const pattern of apyPatterns) {
        const match = scrapedContent.match(pattern);
        if (match && match[1]) {
          extractedAPY = parseFloat(match[1].replace(/,/g, ""));
          console.log(`Found APY: ${extractedAPY}% using pattern:`, pattern);
          break;
        }
      }

      // Extract TVL (looking for various TVL patterns)
      const tvlPatterns = extractedTVL
        ? []
        : [
            new RegExp(
              `${tvlFieldName}\\s*([\\d,]+\\.?\\d*)\\s*K\\s*${asset1}`,
              "i",
            ),
            new RegExp(
              `${tvlFieldName}\\s*([\\d,]+\\.?\\d*)\\s*M\\s*${asset1}`,
              "i",
            ),
            new RegExp(
              `${tvlFieldName}\\s*([\\d,]+\\.?\\d*)\\s*${asset1}`,
              "i",
            ),
            /Total deposited collateral\s*([\d,]+\.?\d*)\s*K\s*LHYPE/i,
            /Total deposited collateral\s*([\d,]+\.?\d*)\s*M\s*LHYPE/i,
            /\$([\d,]+\.?\d*)([KMB]?)/g,
          ];

      for (const pattern of tvlPatterns) {
        const match = scrapedContent.match(pattern);
        if (match && match[1]) {
          let value = parseFloat(match[1].replace(/,/g, ""));

          // Handle K, M, B suffixes
          if (pattern.source.includes("K")) {
            value *= 1000;
          } else if (pattern.source.includes("M")) {
            value *= 1000000;
          } else if (pattern.source.includes("B")) {
            value *= 1000000000;
          }

          extractedTVL = value;
          console.log(`Found TVL: ${extractedTVL} using pattern:`, pattern);
          break;
        }
      }

      // Special case for the specific format we see in the markdown
      if (!extractedTVL) {
        // Look for: "147.29K LHYPE\n\n$5.49M"
        const specificMatch = scrapedContent.match(
          /Total deposited collateral\s*([\d,]+\.?\d*)K\s*LHYPE\s*\$([\d,]+\.?\d*)M/i,
        );
        if (specificMatch) {
          // Use the dollar amount since it's more reliable
          extractedTVL =
            parseFloat(specificMatch[2].replace(/,/g, "")) * 1000000;
          console.log(
            `Found TVL from specific pattern: $${extractedTVL.toLocaleString()}`,
          );
        }
      }
    }

    // Build direct response from parsed data
    const response: FetchResponse = {
      success: true,
      data: {
        asset_found: assetFound,
        apy: extractedAPY,
        tvl: extractedTVL,
      },
      debug: {
        website,
        asset1,
        apyFieldName,
        tvlFieldName,
        scrapedContentLength: scrapedContent.length,
        assetFound,
        extractedAPY,
        extractedTVL,
        contentPreview: scrapedContent.substring(0, 500) + "...",
      },
      raw_content: scrapedContent.substring(0, 1000),
      raw_markdown: scrapedContent,
      raw_html: scrapedHtml,
    };

    console.log("Direct parsing result:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in scrape-apy-tvl function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
