/**
 * Utility functions for formatting currency and display values
 */

/**
 * Formats a number into Peruvian Soles (S/ 0.00)
 */
export function formatCurrency(amount: number | undefined | null): string {
  const numeric = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `S/ ${numeric.toFixed(2)}`;
}
