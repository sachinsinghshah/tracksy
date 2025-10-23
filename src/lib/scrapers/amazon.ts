import puppeteer, { Browser, Page } from "puppeteer";
import type { ScrapedProduct, ScraperResult } from "@/types";

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
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log(`[Scraper] Starting scrape for: ${url}`);

    // Launch browser with stealth settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    page = await browser.newPage();

    // Set random user agent
    await page.setUserAgent(getRandomUserAgent());

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Block unnecessary resources to speed up
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (
        resourceType === "image" ||
        resourceType === "stylesheet" ||
        resourceType === "font" ||
        resourceType === "media"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Navigate to product page
    console.log("[Scraper] Navigating to page...");
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Random delay to appear more human
    await delay(1000 + Math.random() * 2000);

    // Extract product data
    console.log("[Scraper] Extracting product data...");
    const productData = await page.evaluate(() => {
      // Helper function to clean text
      const cleanText = (text: string | null): string => {
        return text?.trim().replace(/\s+/g, " ") || "";
      };

      // Extract title
      const title =
        document.querySelector("#productTitle")?.textContent ||
        document.querySelector("h1.product-title")?.textContent ||
        document.querySelector('[data-feature-name="title"]')?.textContent ||
        "";

      // Extract price - try multiple selectors
      let priceText = "";
      const priceSelectors = [
        ".a-price .a-offscreen",
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        ".a-price-whole",
        "#corePrice_feature_div .a-price .a-offscreen",
        ".a-section.a-spacing-none.aok-align-center .a-price .a-offscreen",
      ];

      for (const selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          priceText = element.textContent;
          break;
        }
      }

      // Extract image URL
      let imageUrl = "";
      const imageSelectors = [
        "#landingImage",
        "#imgBlkFront",
        "#main-image",
        ".a-dynamic-image",
      ];

      for (const selector of imageSelectors) {
        const img = document.querySelector(selector) as HTMLImageElement;
        if (img?.src) {
          imageUrl = img.src;
          break;
        }
        if (img?.dataset?.src) {
          imageUrl = img.dataset.src;
          break;
        }
      }

      // Check availability
      const availabilityText =
        document.querySelector("#availability span")?.textContent || "";
      const isAvailable = !availabilityText
        .toLowerCase()
        .includes("unavailable");

      return {
        title: cleanText(title),
        priceText: cleanText(priceText),
        imageUrl: imageUrl || "",
        isAvailable,
      };
    });

    console.log("[Scraper] Raw data extracted:", productData);

    // Process the extracted data
    if (!productData.title) {
      throw new Error("Could not extract product title from page");
    }

    // Parse price
    const price = extractPrice(productData.priceText);
    if (price === 0) {
      console.warn("[Scraper] Could not extract price, price text was:", productData.priceText);
    }

    // Determine currency (basic detection)
    const currency = detectCurrency(productData.priceText, url);

    const result: ScrapedProduct = {
      title: productData.title,
      price,
      imageUrl: productData.imageUrl,
      availability: productData.isAvailable,
      currency,
    };

    console.log("[Scraper] Successfully scraped product:", result);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[Scraper] Error scraping product:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during scraping",
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
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
  if (url.includes("amazon.in")) return "INR";
  if (url.includes("amazon.co.uk")) return "GBP";
  if (url.includes("amazon.ca")) return "CAD";
  if (url.includes("amazon.de") || url.includes("amazon.fr")) return "EUR";
  if (url.includes("amazon.co.jp")) return "JPY";

  return "USD"; // Default
}

// Retry scraping with exponential backoff
export async function scrapeAmazonProductWithRetry(
  url: string,
  maxRetries = 3
): Promise<ScraperResult> {
  let lastError: string = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Scraper] Attempt ${attempt} of ${maxRetries}`);

    const result = await scrapeAmazonProduct(url);

    if (result.success) {
      return result;
    }

    lastError = result.error || "Unknown error";

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`[Scraper] Waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
  };
}

