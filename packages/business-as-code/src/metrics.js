/**
 * Standardized SaaS Metrics
 *
 * First-class types for common SaaS/subscription business metrics
 * with auto-calculation over time periods.
 *
 * @packageDocumentation
 */
// =============================================================================
// Calculation Functions
// =============================================================================
/**
 * Calculate MRR from components
 */
export function calculateMRR(input) {
    const reactivationMRR = input.reactivationMRR || 0;
    const netNewMRR = input.newMRR + input.expansionMRR - input.contractionMRR - input.churnedMRR + reactivationMRR;
    const total = input.previousMRR + netNewMRR;
    return {
        total,
        newMRR: input.newMRR,
        expansionMRR: input.expansionMRR,
        contractionMRR: input.contractionMRR,
        churnedMRR: input.churnedMRR,
        reactivationMRR,
        netNewMRR,
        currency: input.currency || 'USD',
        period: input.period,
    };
}
/**
 * Calculate ARR from MRR
 */
export function calculateARRFromMRR(mrr, currency = 'USD') {
    return {
        total: mrr * 12,
        fromMRR: mrr * 12,
        currency,
        asOf: new Date(),
    };
}
/**
 * Calculate NRR
 */
export function calculateNRR(input) {
    const endingMRR = input.startingMRR + input.expansion - input.contraction - input.churn;
    const rate = input.startingMRR > 0 ? (endingMRR / input.startingMRR) * 100 : 0;
    return {
        rate,
        startingMRR: input.startingMRR,
        endingMRR,
        expansion: input.expansion,
        contraction: input.contraction,
        churn: input.churn,
        period: input.period,
    };
}
/**
 * Calculate GRR
 */
export function calculateGRR(input) {
    const endingMRR = input.startingMRR - input.contraction - input.churn;
    const rate = input.startingMRR > 0 ? Math.min((endingMRR / input.startingMRR) * 100, 100) : 0;
    return {
        rate,
        startingMRR: input.startingMRR,
        endingMRR,
        contraction: input.contraction,
        churn: input.churn,
        period: input.period,
    };
}
/**
 * Calculate CAC
 */
export function calculateCACMetric(input) {
    const value = input.newCustomers > 0 ? input.salesMarketingSpend / input.newCustomers : 0;
    let byChannel;
    if (input.byChannel) {
        byChannel = {};
        for (const [channel, data] of Object.entries(input.byChannel)) {
            byChannel[channel] = data.customers > 0 ? data.spend / data.customers : 0;
        }
    }
    return {
        value,
        totalSalesMarketingSpend: input.salesMarketingSpend,
        newCustomersAcquired: input.newCustomers,
        currency: input.currency || 'USD',
        period: input.period,
        byChannel,
    };
}
/**
 * Calculate LTV
 */
export function calculateLTVMetric(input) {
    // LTV = (ARPU * Gross Margin) / Churn Rate
    const averageLifetimeMonths = input.churnRate > 0 ? 1 / input.churnRate : 0;
    const value = input.churnRate > 0 ? (input.arpu * input.grossMargin / 100) / input.churnRate : 0;
    return {
        value,
        arpu: input.arpu,
        grossMargin: input.grossMargin,
        churnRate: input.churnRate,
        averageLifetimeMonths,
        currency: input.currency || 'USD',
    };
}
/**
 * Calculate LTV:CAC ratio
 */
export function calculateLTVtoCACRatio(ltv, cac) {
    const ratio = cac.value > 0 ? ltv.value / cac.value : 0;
    const paybackMonths = ltv.arpu > 0 && ltv.grossMargin > 0
        ? cac.value / (ltv.arpu * ltv.grossMargin / 100)
        : 0;
    return {
        ratio,
        ltv: ltv.value,
        cac: cac.value,
        paybackMonths,
        healthy: ratio >= 3,
    };
}
/**
 * Calculate Quick Ratio
 */
export function calculateQuickRatioMetric(mrr) {
    const growth = mrr.newMRR + mrr.expansionMRR;
    const loss = mrr.churnedMRR + mrr.contractionMRR;
    const ratio = loss > 0 ? growth / loss : growth > 0 ? Infinity : 0;
    return {
        ratio,
        newMRR: mrr.newMRR,
        expansionMRR: mrr.expansionMRR,
        churnedMRR: mrr.churnedMRR,
        contractionMRR: mrr.contractionMRR,
        healthy: ratio >= 4,
        period: mrr.period,
    };
}
/**
 * Calculate Magic Number
 */
export function calculateMagicNumberMetric(input) {
    const value = input.salesMarketingSpend > 0 ? input.netNewARR / input.salesMarketingSpend : 0;
    return {
        value,
        netNewARR: input.netNewARR,
        salesMarketingSpend: input.salesMarketingSpend,
        efficient: value >= 0.75,
        period: input.period,
    };
}
/**
 * Calculate Burn Multiple
 */
export function calculateBurnMultipleMetric(input) {
    const value = input.netNewARR > 0 ? input.netBurn / input.netNewARR : Infinity;
    return {
        value,
        netBurn: input.netBurn,
        netNewARR: input.netNewARR,
        efficient: value <= 1.5,
        period: input.period,
    };
}
/**
 * Calculate Rule of 40
 */
export function calculateRuleOf40Metric(input) {
    const score = input.revenueGrowthRate + input.profitMargin;
    return {
        score,
        revenueGrowthRate: input.revenueGrowthRate,
        profitMargin: input.profitMargin,
        passing: score >= 40,
        period: input.period,
    };
}
/**
 * Calculate growth rates
 */
export function calculateGrowthRates(input) {
    const mom = input.previousMonth && input.previousMonth > 0
        ? ((input.current - input.previousMonth) / input.previousMonth) * 100
        : 0;
    const qoq = input.previousQuarter && input.previousQuarter > 0
        ? ((input.current - input.previousQuarter) / input.previousQuarter) * 100
        : 0;
    const yoy = input.previousYear && input.previousYear > 0
        ? ((input.current - input.previousYear) / input.previousYear) * 100
        : 0;
    return {
        mom,
        qoq,
        yoy,
        metric: input.metric,
        period: input.period,
    };
}
/**
 * Calculate churn metrics
 */
export function calculateChurnMetrics(input) {
    const customerChurnRate = input.customersStart > 0
        ? (input.customersLost / input.customersStart) * 100
        : 0;
    const revenueChurnRate = input.mrrStart > 0
        ? (input.mrrChurned / input.mrrStart) * 100
        : 0;
    const netRevenueChurnRate = input.mrrStart > 0
        ? ((input.mrrChurned - input.expansionMRR) / input.mrrStart) * 100
        : 0;
    return {
        customerChurnRate,
        customersLost: input.customersLost,
        customersStart: input.customersStart,
        revenueChurnRate,
        mrrChurned: input.mrrChurned,
        netRevenueChurnRate,
        period: input.period,
    };
}
// =============================================================================
// Aggregation Functions
// =============================================================================
/**
 * Aggregate time series data by period
 */
export function aggregateTimeSeries(series, targetPeriod) {
    const buckets = new Map();
    for (const point of series.dataPoints) {
        const key = getBucketKey(point.timestamp, targetPeriod);
        const existing = buckets.get(key) || [];
        buckets.set(key, [...existing, point]);
    }
    const aggregatedPoints = [];
    const aggregation = series.aggregation || 'sum';
    for (const [key, points] of buckets) {
        const values = points.map(p => p.value);
        let aggregatedValue;
        switch (aggregation) {
            case 'sum':
                aggregatedValue = values.reduce((a, b) => a + b, 0);
                break;
            case 'avg':
                aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
                break;
            case 'min':
                aggregatedValue = Math.min(...values);
                break;
            case 'max':
                aggregatedValue = Math.max(...values);
                break;
            case 'last':
                aggregatedValue = values[values.length - 1] ?? 0;
                break;
            case 'first':
                aggregatedValue = values[0] ?? 0;
                break;
            default:
                aggregatedValue = values.reduce((a, b) => a + b, 0);
        }
        aggregatedPoints.push({
            timestamp: new Date(key),
            value: aggregatedValue,
        });
    }
    return {
        ...series,
        dataPoints: aggregatedPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    };
}
/**
 * Get bucket key for time aggregation
 */
function getBucketKey(date, period) {
    switch (period) {
        case 'daily':
            return date.toISOString().split('T')[0] || date.toISOString();
        case 'weekly':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            return weekStart.toISOString().split('T')[0] || weekStart.toISOString();
        case 'monthly':
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        case 'quarterly':
            const quarter = Math.floor(date.getMonth() / 3);
            return `${date.getFullYear()}-Q${quarter + 1}`;
        case 'yearly':
            return `${date.getFullYear()}-01-01`;
        default:
            return date.toISOString();
    }
}
/**
 * Create metric period from dates
 */
export function createMetricPeriod(period, start, end, label) {
    return {
        period,
        range: { start, end },
        label: label || formatPeriodLabel(period, start, end),
    };
}
/**
 * Format period label
 */
function formatPeriodLabel(period, start, end) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    switch (period) {
        case 'monthly':
            return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
        case 'quarterly':
            const quarter = Math.floor(start.getMonth() / 3) + 1;
            return `Q${quarter} ${start.getFullYear()}`;
        case 'yearly':
            return `${start.getFullYear()}`;
        default:
            return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
}
