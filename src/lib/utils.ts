import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to format currency
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "$--.--";
  // Ensure amount is treated as a number, especially if coming from string sources
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "$--.--"; // Handle cases where conversion fails

  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
};
