export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: readonly CurrencyConfig[] = [
  { code: "USD", symbol: "$", label: "USD ($ - United States Dollar)", decimals: 2 },
  { code: "PKR", symbol: "Rs.", label: "PKR (Rs. - Pakistani Rupee)", decimals: 0 },
  { code: "INR", symbol: "₹", label: "INR (₹ - Indian Rupee)", decimals: 0 },
  { code: "GBP", symbol: "£", label: "GBP (£ - British Pound)", decimals: 2 },
] as const;

export type SupportedCurrency = "USD" | "PKR" | "INR" | "GBP";

/**
 * Formats a monetary amount according to the restaurant's active currency.
 * - USD: $12.50 (2 decimals)
 * - PKR: Rs. 1,250 (0 decimals, comma-separated)
 * - INR: ₹450 (0 decimals, comma-separated)
 * - GBP: £14.95 (2 decimals)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = "USD"
): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
  const upperCode = (currency || "USD").toUpperCase();

  switch (upperCode) {
    case "PKR":
      return `Rs. ${Math.round(safeAmount).toLocaleString("en-US")}`;
    case "INR":
      return `₹${Math.round(safeAmount).toLocaleString("en-IN")}`;
    case "GBP":
      return `£${safeAmount.toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    case "USD":
    default:
      return `$${safeAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
  }
}

/**
 * Returns the currency symbol for an input currency code.
 */
export function getCurrencySymbol(currency: string = "USD"): string {
  const upper = (currency || "USD").toUpperCase();
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === upper);
  return found ? found.symbol : "$";
}
