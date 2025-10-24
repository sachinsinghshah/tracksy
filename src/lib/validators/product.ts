import { z } from "zod";

// Amazon URL validation schema for form input
export const addProductFormSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .refine(
      (url) => {
        try {
          const urlObj = new URL(url);
          return (
            urlObj.hostname.includes("amazon.") ||
            urlObj.hostname.includes("amzn.")
          );
        } catch {
          return false;
        }
      },
      {
        message: "Please enter a valid Amazon product URL",
      }
    ),
  targetPrice: z
    .string()
    .optional()
    .refine((val) => !val || parseFloat(val) > 0, {
      message: "Target price must be greater than 0",
    }),
  category: z.string().nullable().optional(),
});

// Schema with transformation for API
export const addProductSchema = addProductFormSchema.transform((data) => ({
  url: data.url,
  targetPrice: data.targetPrice ? parseFloat(data.targetPrice) : undefined,
  category: data.category || null,
}));

export type AddProductFormInput = z.infer<typeof addProductFormSchema>;
export type AddProductInput = z.infer<typeof addProductSchema>;

// Extract Amazon product ID from URL
export function extractAmazonProductId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Amazon product URLs typically have the format:
    // https://www.amazon.com/product-name/dp/B01234567/
    // or https://www.amazon.com/dp/B01234567/
    // or https://www.amazon.com/gp/product/B01234567/
    
    const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
    if (dpMatch) return dpMatch[1];
    
    const productMatch = url.match(/\/product\/([A-Z0-9]{10})/i);
    if (productMatch) return productMatch[1];
    
    const gpMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    if (gpMatch) return gpMatch[1];
    
    // ASIN parameter in query string
    const asinMatch = url.match(/[?&]ASIN=([A-Z0-9]{10})/i);
    if (asinMatch) return asinMatch[1];
    
    return null;
  } catch {
    return null;
  }
}

// Determine Amazon site from URL
export function getAmazonSite(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (hostname.includes("amazon.com")) return "amazon.com";
    if (hostname.includes("amazon.co.uk")) return "amazon.co.uk";
    if (hostname.includes("amazon.ca")) return "amazon.ca";
    if (hostname.includes("amazon.de")) return "amazon.de";
    if (hostname.includes("amazon.fr")) return "amazon.fr";
    if (hostname.includes("amazon.in")) return "amazon.in";
    if (hostname.includes("amazon.it")) return "amazon.it";
    if (hostname.includes("amazon.es")) return "amazon.es";
    if (hostname.includes("amazon.co.jp")) return "amazon.co.jp";
    
    return "amazon";
  } catch {
    return "amazon";
  }
}

// Clean and normalize Amazon URL
export function normalizeAmazonUrl(url: string): string {
  try {
    const productId = extractAmazonProductId(url);
    const urlObj = new URL(url);
    
    if (productId) {
      // Return a clean URL with just the product ID
      return `${urlObj.protocol}//${urlObj.hostname}/dp/${productId}`;
    }
    
    return url;
  } catch {
    return url;
  }
}

