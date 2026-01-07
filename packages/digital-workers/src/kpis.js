/**
 * KPI and OKR tracking functionality for digital workers
 */
export function kpis(definition) {
    return definition;
}
/**
 * Update a KPI's current value
 *
 * @param kpi - The KPI to update
 * @param current - New current value
 * @returns Updated KPI
 *
 * @example
 * ```ts
 * const updated = kpis.update(deploymentFrequency, 8)
 * console.log(updated.current) // 8
 * console.log(updated.trend) // 'up' (automatically determined)
 * ```
 */
kpis.update = (kpi, current) => {
    // Determine trend
    let trend = 'stable';
    if (current > kpi.current) {
        trend = 'up';
    }
    else if (current < kpi.current) {
        trend = 'down';
    }
    return {
        ...kpi,
        current,
        trend,
    };
};
/**
 * Calculate progress towards target (0-1)
 *
 * @param kpi - The KPI
 * @returns Progress as a decimal (0-1)
 *
 * @example
 * ```ts
 * const kpi = { current: 75, target: 100 }
 * const progress = kpis.progress(kpi) // 0.75
 * ```
 */
kpis.progress = (kpi) => {
    if (kpi.target === 0)
        return 0;
    return Math.min(1, Math.max(0, kpi.current / kpi.target));
};
/**
 * Check if a KPI is on track
 *
 * @param kpi - The KPI
 * @param threshold - Minimum progress to be "on track" (default: 0.8)
 * @returns Whether the KPI is on track
 *
 * @example
 * ```ts
 * const kpi = { current: 85, target: 100 }
 * const onTrack = kpis.onTrack(kpi) // true (85% >= 80%)
 * ```
 */
kpis.onTrack = (kpi, threshold = 0.8) => {
    return kpis.progress(kpi) >= threshold;
};
/**
 * Get the gap to target
 *
 * @param kpi - The KPI
 * @returns Difference between target and current
 *
 * @example
 * ```ts
 * const kpi = { current: 75, target: 100 }
 * const gap = kpis.gap(kpi) // 25
 * ```
 */
kpis.gap = (kpi) => {
    return kpi.target - kpi.current;
};
/**
 * Format a KPI for display
 *
 * @param kpi - The KPI
 * @returns Formatted string
 *
 * @example
 * ```ts
 * const kpi = {
 *   name: 'Deployment Frequency',
 *   current: 5,
 *   target: 10,
 *   unit: 'deploys/week',
 *   trend: 'up',
 * }
 * const formatted = kpis.format(kpi)
 * // "Deployment Frequency: 5/10 deploys/week (50%, trending up)"
 * ```
 */
kpis.format = (kpi) => {
    const progress = kpis.progress(kpi);
    const progressPercent = Math.round(progress * 100);
    const trendEmoji = kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→';
    return `${kpi.name}: ${kpi.current}/${kpi.target} ${kpi.unit} (${progressPercent}%, trending ${kpi.trend} ${trendEmoji})`;
};
/**
 * Compare two KPI snapshots to see change over time
 *
 * @param previous - Previous KPI state
 * @param current - Current KPI state
 * @returns Change analysis
 *
 * @example
 * ```ts
 * const change = kpis.compare(previousKPI, currentKPI)
 * console.log(change.delta) // 5
 * console.log(change.percentChange) // 10
 * console.log(change.improved) // true
 * ```
 */
kpis.compare = (previous, current) => {
    const delta = current.current - previous.current;
    const percentChange = previous.current !== 0
        ? (delta / previous.current) * 100
        : 0;
    // Improved if we got closer to the target
    const previousGap = Math.abs(previous.target - previous.current);
    const currentGap = Math.abs(current.target - current.current);
    const improved = currentGap < previousGap;
    return {
        delta,
        percentChange,
        improved,
    };
};
/**
 * Define OKRs (Objectives and Key Results)
 *
 * @param definition - OKR definition
 * @returns The defined OKR
 *
 * @example
 * ```ts
 * const engineeringOKR = okrs({
 *   objective: 'Improve development velocity',
 *   keyResults: [
 *     {
 *       name: 'Deployment Frequency',
 *       current: 5,
 *       target: 10,
 *       unit: 'deploys/week',
 *     },
 *     {
 *       name: 'Lead Time',
 *       current: 48,
 *       target: 24,
 *       unit: 'hours',
 *     },
 *     {
 *       name: 'Change Failure Rate',
 *       current: 15,
 *       target: 5,
 *       unit: '%',
 *     },
 *   ],
 *   owner: 'engineering-team',
 *   dueDate: new Date('2024-03-31'),
 * })
 * ```
 */
export function okrs(definition) {
    return definition;
}
/**
 * Calculate overall OKR progress
 *
 * @param okr - The OKR
 * @returns Average progress across all key results (0-1)
 *
 * @example
 * ```ts
 * const progress = okrs.progress(engineeringOKR)
 * console.log(progress) // 0.67 (67% complete)
 * ```
 */
okrs.progress = (okr) => {
    if (okr.keyResults.length === 0)
        return 0;
    const totalProgress = okr.keyResults.reduce((sum, kr) => {
        return sum + kpis.progress(kr);
    }, 0);
    return totalProgress / okr.keyResults.length;
};
/**
 * Update a key result in an OKR
 *
 * @param okr - The OKR
 * @param keyResultName - Name of key result to update
 * @param current - New current value
 * @returns Updated OKR
 *
 * @example
 * ```ts
 * const updated = okrs.updateKeyResult(
 *   engineeringOKR,
 *   'Deployment Frequency',
 *   8
 * )
 * ```
 */
okrs.updateKeyResult = (okr, keyResultName, current) => {
    return {
        ...okr,
        keyResults: okr.keyResults.map((kr) => kr.name === keyResultName ? { ...kr, current } : kr),
        progress: undefined, // Will be recalculated
    };
};
/**
 * Check if OKR is on track
 *
 * @param okr - The OKR
 * @param threshold - Minimum progress to be "on track" (default: 0.7)
 * @returns Whether the OKR is on track
 *
 * @example
 * ```ts
 * const onTrack = okrs.onTrack(engineeringOKR)
 * ```
 */
okrs.onTrack = (okr, threshold = 0.7) => {
    return okrs.progress(okr) >= threshold;
};
/**
 * Format OKR for display
 *
 * @param okr - The OKR
 * @returns Formatted string
 *
 * @example
 * ```ts
 * const formatted = okrs.format(engineeringOKR)
 * console.log(formatted)
 * // Improve development velocity (67% complete)
 * // • Deployment Frequency: 5/10 deploys/week (50%)
 * // • Lead Time: 48/24 hours (200%)
 * // • Change Failure Rate: 15/5 % (300%)
 * ```
 */
okrs.format = (okr) => {
    const progress = okrs.progress(okr);
    const progressPercent = Math.round(progress * 100);
    const lines = [
        `${okr.objective} (${progressPercent}% complete)`,
        ...okr.keyResults.map((kr) => {
            const krProgress = kpis.progress(kr);
            const krPercent = Math.round(krProgress * 100);
            return `  • ${kr.name}: ${kr.current}/${kr.target} ${kr.unit} (${krPercent}%)`;
        }),
    ];
    if (okr.owner) {
        lines.push(`  Owner: ${okr.owner}`);
    }
    if (okr.dueDate) {
        lines.push(`  Due: ${okr.dueDate.toLocaleDateString()}`);
    }
    return lines.join('\n');
};
