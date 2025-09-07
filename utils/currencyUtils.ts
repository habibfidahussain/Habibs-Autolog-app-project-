import { Currency, type ExchangeRates } from '../types';

/**
 * Converts an amount from the base currency (PKR) to the target currency
 * and formats it as a currency string (e.g., "$12.34", "€56.78", "₨ 9,012").
 * @param amountPkr The amount in the base currency, Pakistan Rupee.
 * @param targetCurrency The currency to convert to.
 * @param rates The exchange rates relative to PKR.
 * @param fractionDigits The number of decimal places to show.
 * @returns A formatted currency string.
 */
export function formatCurrency(amountPkr: number, targetCurrency: Currency, rates: ExchangeRates, fractionDigits: number = 0): string {
    const rate = rates[targetCurrency] || 1;
    const convertedAmount = amountPkr / rate;

    // Use Intl.NumberFormat for robust, locale-aware currency formatting.
    try {
        // Special handling for PKR to use the Rupee symbol if needed, though 'PKR' is standard.
        // For this app, we'll use a custom prefix for PKR.
        if (targetCurrency === Currency.PKR) {
             const options = {
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
            };
            return `₨ ${amountPkr.toLocaleString('en-IN', options)}`;
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: targetCurrency,
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        }).format(convertedAmount);
    } catch (error) {
        console.error(`Failed to format currency ${targetCurrency}`, error);
        // Fallback for invalid currency codes
        return `${targetCurrency} ${convertedAmount.toFixed(fractionDigits)}`;
    }
}