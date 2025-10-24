import { Resend } from "resend";
import { formatPrice } from "./utils";

const resend = new Resend(process.env.RESEND_API_KEY);

interface PriceDropEmailData {
  to: string;
  product: {
    title: string | null;
    url: string;
    image_url: string | null;
    currency: string | null;
  };
  oldPrice: number;
  newPrice: number;
}

export async function sendPriceDropEmail({
  to,
  product,
  oldPrice,
  newPrice,
}: PriceDropEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email not configured" };
  }

  const priceDrop = oldPrice - newPrice;
  const priceDropPercent = (priceDrop / oldPrice) * 100;
  const currency = product.currency || "USD";

  try {
    const { data, error } = await resend.emails.send({
      from: "Price Tracker <noreply@price-tracker.app>",
      to: [to],
      subject: `💰 Price Drop Alert: ${product.title || "Your Product"}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Price Drop Alert</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
              }
              .container {
                background: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e9ecef;
              }
              .price-drop {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
              }
              .price-old {
                font-size: 18px;
                text-decoration: line-through;
                opacity: 0.8;
                margin-bottom: 5px;
              }
              .price-new {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .savings {
                font-size: 16px;
                opacity: 0.9;
              }
              .product-info {
                display: flex;
                gap: 20px;
                margin: 30px 0;
                align-items: flex-start;
              }
              .product-image {
                width: 120px;
                height: 120px;
                object-fit: contain;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                background: #f8f9fa;
              }
              .product-details {
                flex: 1;
              }
              .product-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #2c3e50;
              }
              .cta-button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                transition: background-color 0.2s;
              }
              .cta-button:hover {
                background: #0056b3;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
              }
              .stats {
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                text-align: center;
              }
              .stat {
                flex: 1;
              }
              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #28a745;
              }
              .stat-label {
                font-size: 14px;
                color: #6c757d;
                margin-top: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Price Drop Alert!</h1>
                <p>Great news! The price of a product you're tracking has dropped.</p>
              </div>

              <div class="price-drop">
                <div class="price-old">${formatPrice(oldPrice, currency)}</div>
                <div class="price-new">${formatPrice(newPrice, currency)}</div>
                <div class="savings">
                  You save ${formatPrice(priceDrop, currency)} (${priceDropPercent.toFixed(1)}% off!)
                </div>
              </div>

              <div class="product-info">
                ${product.image_url ? `
                  <img src="${product.image_url}" alt="${product.title || 'Product'}" class="product-image">
                ` : ''}
                <div class="product-details">
                  <div class="product-title">${product.title || 'Untitled Product'}</div>
                  <p>Don't miss out on this great deal! The price has dropped significantly.</p>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${product.url}" class="cta-button">
                  View Product & Buy Now →
                </a>
              </div>

              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${formatPrice(priceDrop, currency)}</div>
                  <div class="stat-label">Total Savings</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${priceDropPercent.toFixed(1)}%</div>
                  <div class="stat-label">Discount</div>
                </div>
              </div>

              <div class="footer">
                <p>This alert was sent by Price Tracker because you're tracking this product.</p>
                <p>To manage your alerts, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">dashboard</a>.</p>
                <p style="margin-top: 15px; font-size: 12px;">
                  Price Tracker - Never miss a deal again! 🛒
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function sendWelcomeEmail(to: string, userName?: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping welcome email");
    return { success: false, error: "Email not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Price Tracker <noreply@price-tracker.app>",
      to: [to],
      subject: "Welcome to Price Tracker! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Price Tracker</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
              }
              .container {
                background: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .welcome-title {
                font-size: 28px;
                color: #2c3e50;
                margin-bottom: 10px;
              }
              .features {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 30px 0;
              }
              .feature {
                text-align: center;
                padding: 20px;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                background: #f8f9fa;
              }
              .feature-icon {
                font-size: 32px;
                margin-bottom: 10px;
              }
              .cta-button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="welcome-title">Welcome to Price Tracker! 🎉</h1>
                <p>Hi${userName ? ` ${userName}` : ''}, thanks for joining us!</p>
              </div>

              <p>You're now ready to start tracking prices and never miss a great deal again. Here's what you can do:</p>

              <div class="features">
                <div class="feature">
                  <div class="feature-icon">🛒</div>
                  <h3>Track Products</h3>
                  <p>Add Amazon products to track their prices automatically</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📊</div>
                  <h3>View Charts</h3>
                  <p>See price trends and history with beautiful charts</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🔔</div>
                  <h3>Get Alerts</h3>
                  <p>Receive email notifications when prices drop</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">❤️</div>
                  <h3>Wishlist</h3>
                  <p>Save products for later tracking</p>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">
                  Start Tracking Prices →
                </a>
              </div>

              <div class="footer">
                <p>Happy shopping! 🛍️</p>
                <p>Price Tracker Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}