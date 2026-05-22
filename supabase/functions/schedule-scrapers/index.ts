import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-scraper-cron-secret",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hasValidCronSecret(req: Request) {
  const configuredSecret = Deno.env.get("SCRAPER_CRON_SECRET");
  const providedSecret = req.headers.get("x-scraper-cron-secret");

  return Boolean(
    configuredSecret && providedSecret && providedSecret === configuredSecret,
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!hasValidCronSecret(req)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const cronSecret = Deno.env.get("SCRAPER_CRON_SECRET") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !cronSecret) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log("Starting scheduled scraping job...");

    // Get all active scraper configs that need scraping
    const { data: configs, error: configError } = await supabase
      .from("scraper_configs")
      .select("*")
      .eq("is_active", true);

    if (configError) {
      console.error("Failed to fetch scraper configs:", configError);
      return jsonResponse({ error: "Failed to fetch configurations" }, 500);
    }

    if (!configs || configs.length === 0) {
      console.log("No active scraper configurations found");
      return jsonResponse(
        { message: "No active configurations found", processed: 0 },
        200,
      );
    }

    const now = new Date();
    const assetsToScrape = [];

    // Check which assets need scraping based on their interval
    for (const config of configs) {
      const lastScraped = config.last_scraped_at
        ? new Date(config.last_scraped_at)
        : null;
      const intervalMs = config.scraping_interval_hours * 60 * 60 * 1000;

      if (!lastScraped || now.getTime() - lastScraped.getTime() >= intervalMs) {
        assetsToScrape.push(config.asset_id);
        console.log(
          `Asset ${config.asset_id} needs scraping (last scraped: ${lastScraped})`,
        );
      }
    }

    if (assetsToScrape.length === 0) {
      console.log("No assets need scraping at this time");
      return jsonResponse(
        { message: "No assets need scraping", processed: 0 },
        200,
      );
    }

    console.log(`Processing ${assetsToScrape.length} assets for scraping`);

    // Process each asset with rate limiting
    const results = [];
    for (let i = 0; i < assetsToScrape.length; i++) {
      const assetId = assetsToScrape[i];

      try {
        console.log(
          `Scraping asset ${i + 1}/${assetsToScrape.length}: ${assetId}`,
        );

        // Call the scrape-data function
        const { data: result, error } = await supabase.functions.invoke(
          "scrape-data",
          {
            body: { assetId },
            headers: {
              "x-scraper-cron-secret": cronSecret,
            },
          },
        );

        if (error) {
          console.error(`Failed to scrape asset ${assetId}:`, error);
          results.push({ assetId, success: false, error: error.message });
        } else {
          console.log(`Successfully scraped asset ${assetId}:`, result);
          results.push({ assetId, success: true, result });
        }

        // Rate limiting: wait 2 seconds between requests to be respectful
        if (i < assetsToScrape.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error processing asset ${assetId}:`, error);
        results.push({ assetId, success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    console.log(
      `Scraping job completed. Success: ${successCount}, Failures: ${failureCount}`,
    );

    return jsonResponse(
      {
        message: "Scraping job completed",
        processed: results.length,
        successful: successCount,
        failed: failureCount,
        results,
      },
      200,
    );
  } catch (error) {
    console.error("Scheduler error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});
