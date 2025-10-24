// Re-export the Cheerio-based scraper (works on Vercel)
export {
  scrapeAmazonProduct,
  scrapeAmazonProductWithRetry,
} from "./amazon-cheerio";
