// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "US$",
  ARS: "AR$",
};

/**
 * Formats a price with its currency symbol
 * @param price - The price value
 * @param currency - The currency code (e.g., "USD", "MXN")
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(price: number, currency?: string): string {
  const symbol = currency ? CURRENCY_SYMBOLS[currency] || "$" : "$";
  return `${symbol}${price.toLocaleString()}`;
}

