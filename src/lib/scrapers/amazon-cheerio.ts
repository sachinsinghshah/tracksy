import type { ScrapedProduct, ScraperResult } from "@/types";
import * as cheerio from "cheerio";

// User agents for rotation
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapeAmazonProduct(
  url: string
): Promise<ScraperResult> {
  try {
    console.log(`[Scraper] Starting scrape for: ${url}`);

    // Add random delay to avoid rate limiting
    await delay(Math.random() * 1000 + 500);

    // Fetch HTML with proper headers
    const response = await fetch(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log("[Scraper] HTML fetched successfully");

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $("#productTitle").text().trim() ||
      $("h1.a-size-large").first().text().trim() ||
      $("span#productTitle").text().trim() ||
      "";

    if (!title) {
      throw new Error("Product not found or page structure changed");
    }

    console.log(`[Scraper] Found title: ${title.substring(0, 50)}...`);

    // Extract price - try multiple selectors
    let price = 0;
    const priceSelectors = [
      ".a-price .a-offscreen",
      "span.a-price-whole",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      ".a-price-whole",
      "span#price_inside_buybox",
      "span.priceToPay",
    ];

    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText) {
        price = extractPrice(priceText);
        if (price > 0) {
          console.log(`[Scraper] Found price: ${price} from ${selector}`);
          break;
        }
      }
    }

    if (price === 0) {
      throw new Error("Price not found");
    }

    // Extract image URL
    const imageUrl =
      $("#landingImage").attr("src") ||
      $("#imgBlkFront").attr("src") ||
      $("img.a-dynamic-image").first().attr("src") ||
      $("img[data-old-hires]").first().attr("data-old-hires") ||
      "";

    console.log(`[Scraper] Image URL: ${imageUrl ? "Found" : "Not found"}`);

    // Detect currency
    const priceText =
      $(".a-price .a-offscreen").first().text() ||
      $("#priceblock_ourprice").text() ||
      "";
    const currency = detectCurrency(priceText, url);

    const result: ScrapedProduct = {
      title,
      price,
      imageUrl: imageUrl || undefined,
      currency,
      availability: "In Stock", // Cheerio version always assumes in stock
    };

    console.log("[Scraper] Scraping completed successfully");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[Scraper] Error during scraping:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during scraping",
    };
  }
}

// Extract numeric price from price text
function extractPrice(priceText: string): number {
  if (!priceText) return 0;

  // Remove currency symbols and extract numbers
  const cleaned = priceText
    .replace(/[₹$£€¥,\s]/g, "")
    .replace(/[^\d.]/g, "");

  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

// Detect currency from price text or URL
function detectCurrency(priceText: string, url: string): string {
  if (priceText.includes("₹")) return "INR";
  if (priceText.includes("$")) return "USD";
  if (priceText.includes("£")) return "GBP";
  if (priceText.includes("€")) return "EUR";
  if (priceText.includes("¥")) return "JPY";

  // Fallback: detect from URL
  if (url.includes(".in")) return "INR";
  if (url.includes(".co.uk")) return "GBP";
  if (url.includes(".de") || url.includes(".fr") || url.includes(".it") || url.includes(".es")) return "EUR";
  if (url.includes(".jp")) return "JPY";

  return "USD"; // Default
}

// Retry wrapper
export async function scrapeAmazonProductWithRetry(
  url: string,
  maxRetries: number = 3
): Promise<ScraperResult> {
  let lastError: string = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Scraper] Attempt ${attempt}/${maxRetries}`);

    const result = await scrapeAmazonProduct(url);

    if (result.success) {
      return result;
    }

    lastError = result.error || "Unknown error";
    console.error(`[Scraper] Attempt ${attempt} failed:`, lastError);

    if (attempt < maxRetries) {
      const delayMs = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
      console.log(`[Scraper] Waiting ${delayMs}ms before retry...`);
      await delay(delayMs);
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
  };
}

