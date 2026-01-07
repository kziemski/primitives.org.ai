/**
 * Financial metrics and calculations
 */
/**
 * Calculate financial metrics from basic inputs
 *
 * @example
 * ```ts
 * const metrics = financials({
 *   revenue: 1000000,
 *   cogs: 300000,
 *   operatingExpenses: 500000,
 *   currency: 'USD',
 *   period: 'monthly',
 * })
 *
 * console.log(metrics.grossMargin) // 70%
 * console.log(metrics.operatingMargin) // 20%
 * console.log(metrics.netMargin) // 20%
 * ```
 */
export function financials(metrics) {
    const revenue = metrics.revenue || 0;
    const cogs = metrics.cogs || 0;
    const operatingExpenses = metrics.operatingExpenses || 0;
    // Calculate derived metrics
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const operatingIncome = grossProfit - operatingExpenses;
    const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;
    const netIncome = metrics.netIncome ?? operatingIncome;
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
    // EBITDA (simplified - would need D&A for accurate calculation)
    const ebitda = metrics.ebitda ?? operatingIncome;
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    return {
        ...metrics,
        revenue,
        cogs,
        grossProfit,
        grossMargin,
        operatingExpenses,
        operatingIncome,
        operatingMargin,
        netIncome,
        netMargin,
        ebitda,
        ebitdaMargin,
        currency: metrics.currency || 'USD',
        period: metrics.period || 'monthly',
    };
}
/**
 * Calculate gross margin
 */
export function calculateGrossMargin(revenue, cogs) {
    if (revenue === 0)
        return 0;
    return ((revenue - cogs) / revenue) * 100;
}
/**
 * Calculate operating margin
 */
export function calculateOperatingMargin(revenue, cogs, operatingExpenses) {
    if (revenue === 0)
        return 0;
    const operatingIncome = revenue - cogs - operatingExpenses;
    return (operatingIncome / revenue) * 100;
}
/**
 * Calculate net margin
 */
export function calculateNetMargin(revenue, netIncome) {
    if (revenue === 0)
        return 0;
    return (netIncome / revenue) * 100;
}
/**
 * Calculate EBITDA margin
 */
export function calculateEBITDAMargin(revenue, ebitda) {
    if (revenue === 0)
        return 0;
    return (ebitda / revenue) * 100;
}
/**
 * Calculate burn rate (monthly cash burn)
 */
export function calculateBurnRate(cashStart, cashEnd, months) {
    if (months === 0)
        return 0;
    return (cashStart - cashEnd) / months;
}
/**
 * Calculate runway (months until cash runs out)
 */
export function calculateRunway(cash, monthlyBurnRate) {
    if (monthlyBurnRate === 0)
        return Infinity;
    if (monthlyBurnRate < 0)
        return Infinity; // Company is profitable
    return cash / monthlyBurnRate;
}
/**
 * Calculate customer acquisition cost (CAC)
 */
export function calculateCAC(marketingSpend, newCustomers) {
    if (newCustomers === 0)
        return 0;
    return marketingSpend / newCustomers;
}
/**
 * Calculate customer lifetime value (LTV)
 */
export function calculateLTV(averageRevenuePerCustomer, averageCustomerLifetimeMonths, grossMarginPercent) {
    return averageRevenuePerCustomer * averageCustomerLifetimeMonths * (grossMarginPercent / 100);
}
/**
 * Calculate LTV:CAC ratio
 */
export function calculateLTVtoCAC(ltv, cac) {
    if (cac === 0)
        return 0;
    return ltv / cac;
}
/**
 * Calculate payback period (months to recover CAC)
 */
export function calculatePaybackPeriod(cac, monthlyRevPerCustomer) {
    if (monthlyRevPerCustomer === 0)
        return 0;
    return cac / monthlyRevPerCustomer;
}
/**
 * Calculate annual recurring revenue (ARR)
 */
export function calculateARR(mrr) {
    return mrr * 12;
}
/**
 * Calculate monthly recurring revenue (MRR)
 */
export function calculateMRR(arr) {
    return arr / 12;
}
/**
 * Calculate revenue growth rate
 */
export function calculateGrowthRate(currentRevenue, previousRevenue) {
    if (previousRevenue === 0)
        return 0;
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}
/**
 * Calculate compound annual growth rate (CAGR)
 */
export function calculateCAGR(beginningValue, endingValue, years) {
    if (beginningValue === 0 || years === 0)
        return 0;
    return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
}
/**
 * Calculate return on investment (ROI)
 */
export function calculateROI(gain, cost) {
    if (cost === 0)
        return 0;
    return ((gain - cost) / cost) * 100;
}
/**
 * Calculate return on equity (ROE)
 */
export function calculateROE(netIncome, shareholderEquity) {
    if (shareholderEquity === 0)
        return 0;
    return (netIncome / shareholderEquity) * 100;
}
/**
 * Calculate return on assets (ROA)
 */
export function calculateROA(netIncome, totalAssets) {
    if (totalAssets === 0)
        return 0;
    return (netIncome / totalAssets) * 100;
}
/**
 * Calculate quick ratio (liquidity)
 */
export function calculateQuickRatio(currentAssets, inventory, currentLiabilities) {
    if (currentLiabilities === 0)
        return 0;
    return (currentAssets - inventory) / currentLiabilities;
}
/**
 * Calculate current ratio (liquidity)
 */
export function calculateCurrentRatio(currentAssets, currentLiabilities) {
    if (currentLiabilities === 0)
        return 0;
    return currentAssets / currentLiabilities;
}
/**
 * Calculate debt-to-equity ratio
 */
export function calculateDebtToEquity(totalDebt, totalEquity) {
    if (totalEquity === 0)
        return 0;
    return totalDebt / totalEquity;
}
/**
 * Format currency value
 */
export function formatCurrency(amount, currency = 'USD') {
    const symbol = getCurrencySymbol(currency);
    const formatted = Math.abs(amount).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    const sign = amount < 0 ? '-' : '';
    return `${sign}${symbol}${formatted}`;
}
/**
 * Get currency symbol
 */
function getCurrencySymbol(currency) {
    const symbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CNY: '¥',
        CAD: 'C$',
        AUD: 'A$',
    };
    return symbols[currency] || currency + ' ';
}
/**
 * Create a financial statement
 */
export function createStatement(type, period, lineItems, currency = 'USD') {
    return {
        type,
        period,
        lineItems,
        currency,
    };
}
/**
 * Get line item from financial statement
 */
export function getLineItem(statement, name) {
    return statement.lineItems[name] || 0;
}
/**
 * Compare financial metrics between periods
 */
export function compareMetrics(current, previous) {
    const comparison = {};
    const keys = [
        'revenue',
        'grossProfit',
        'operatingIncome',
        'netIncome',
        'ebitda',
    ];
    for (const key of keys) {
        const currentVal = current[key] || 0;
        const previousVal = previous[key] || 0;
        const change = currentVal - previousVal;
        const changePercent = previousVal !== 0 ? (change / previousVal) * 100 : 0;
        comparison[key] = { change, changePercent };
    }
    return comparison;
}
/**
 * Validate financial metrics
 */
export function validateFinancials(metrics) {
    const errors = [];
    if (metrics.revenue && metrics.revenue < 0) {
        errors.push('Revenue cannot be negative');
    }
    if (metrics.cogs && metrics.cogs < 0) {
        errors.push('COGS cannot be negative');
    }
    if (metrics.operatingExpenses && metrics.operatingExpenses < 0) {
        errors.push('Operating expenses cannot be negative');
    }
    if (metrics.revenue && metrics.cogs && metrics.cogs > metrics.revenue) {
        errors.push('COGS cannot exceed revenue');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
