/**
 * Metrics - KPIs and OKRs for autonomous agents
 *
 * Track key performance indicators and objectives/key results to measure
 * agent and team performance.
 *
 * @packageDocumentation
 */
/**
 * Create a KPI (Key Performance Indicator)
 *
 * @example
 * ```ts
 * import { kpi } from 'autonomous-agents'
 *
 * const revenueKPI = kpi({
 *   name: 'Monthly Recurring Revenue',
 *   description: 'Total MRR from subscriptions',
 *   value: 125000,
 *   target: 150000,
 *   unit: 'USD',
 *   frequency: 'monthly',
 *   trend: 'up',
 * })
 *
 * // Update the value
 * revenueKPI.update(130000)
 *
 * // Add historical data
 * revenueKPI.addHistory(125000)
 *
 * // Get progress
 * const progress = revenueKPI.getProgress() // 86.67%
 * ```
 */
export function kpi(config) {
    const state = {
        id: generateKPIId(config.name),
        name: config.name,
        description: config.description,
        value: config.value,
        target: config.target,
        unit: config.unit,
        frequency: config.frequency,
        history: [],
    };
    return {
        ...state,
        update,
        addHistory,
        getProgress,
        getTrend,
        getHistory,
        toJSON,
    };
    /**
     * Update the current value
     */
    function update(newValue) {
        // Store old value in history
        if (state.value !== undefined) {
            addHistory(state.value);
        }
        state.value = newValue;
        state.trend = calculateTrend();
    }
    /**
     * Add a historical data point
     */
    function addHistory(value, timestamp) {
        if (!state.history) {
            state.history = [];
        }
        state.history.push({
            timestamp: timestamp || new Date(),
            value,
        });
    }
    /**
     * Get progress towards target
     */
    function getProgress() {
        if (!state.target)
            return null;
        if (typeof state.value === 'number' && typeof state.target === 'number') {
            return Math.min(100, (state.value / state.target) * 100);
        }
        return null;
    }
    /**
     * Get trend direction
     */
    function getTrend() {
        return state.trend || calculateTrend();
    }
    /**
     * Calculate trend from history
     */
    function calculateTrend() {
        if (!state.history || state.history.length < 2)
            return 'stable';
        const recent = state.history.slice(-2);
        const prev = recent[0].value;
        const curr = recent[1].value;
        if (typeof prev === 'number' && typeof curr === 'number') {
            if (curr > prev)
                return 'up';
            if (curr < prev)
                return 'down';
        }
        return 'stable';
    }
    /**
     * Get historical data
     */
    function getHistory() {
        return state.history || [];
    }
    /**
     * Convert to plain JSON
     */
    function toJSON() {
        return { ...state };
    }
}
/**
 * Create multiple KPIs
 *
 * @example
 * ```ts
 * import { kpis } from 'autonomous-agents'
 *
 * const metrics = kpis([
 *   { name: 'Revenue', value: 100000, target: 150000, unit: 'USD' },
 *   { name: 'Active Users', value: 5000, target: 10000, unit: 'users' },
 *   { name: 'NPS Score', value: 72, target: 80, unit: 'points' },
 * ])
 *
 * // Access individual KPIs
 * metrics.revenue.update(110000)
 *
 * // Get all KPIs
 * const all = metrics.getAll()
 *
 * // Get progress summary
 * const summary = metrics.getSummary()
 * ```
 */
export function kpis(configs) {
    const kpiMap = new Map();
    // Create KPI instances
    configs.forEach(config => {
        const instance = kpi(config);
        const key = config.name.toLowerCase().replace(/\s+/g, '');
        kpiMap.set(key, instance);
    });
    // Create proxy for direct access
    const proxy = new Proxy({}, {
        get(_target, prop) {
            if (prop === 'getAll')
                return getAll;
            if (prop === 'get')
                return get;
            if (prop === 'getSummary')
                return getSummary;
            if (prop === 'toJSON')
                return toJSON;
            return kpiMap.get(prop);
        },
    });
    function getAll() {
        return Array.from(kpiMap.values());
    }
    function get(name) {
        return kpiMap.get(name.toLowerCase().replace(/\s+/g, ''));
    }
    function getSummary() {
        const all = getAll();
        const withTargets = all.filter(k => k.target !== undefined);
        const onTrack = withTargets.filter(k => {
            const progress = k.getProgress();
            return progress !== null && progress >= 70;
        });
        const atRisk = withTargets.filter(k => {
            const progress = k.getProgress();
            return progress !== null && progress < 70;
        });
        const totalProgress = withTargets.reduce((sum, k) => {
            const progress = k.getProgress();
            return sum + (progress || 0);
        }, 0);
        return {
            total: all.length,
            onTrack: onTrack.length,
            atRisk: atRisk.length,
            averageProgress: withTargets.length > 0 ? totalProgress / withTargets.length : 0,
        };
    }
    function toJSON() {
        return getAll().map(k => k.toJSON());
    }
    return proxy;
}
/**
 * Create an OKR (Objectives and Key Results)
 *
 * @example
 * ```ts
 * import { okr } from 'autonomous-agents'
 *
 * const growthOKR = okr({
 *   objective: 'Accelerate revenue growth',
 *   description: 'Drive sustainable revenue growth through product expansion and market penetration',
 *   keyResults: [
 *     {
 *       id: 'kr1',
 *       description: 'Increase MRR from $100k to $150k',
 *       current: 100000,
 *       target: 150000,
 *       unit: 'USD',
 *     },
 *     {
 *       id: 'kr2',
 *       description: 'Launch in 3 new markets',
 *       current: 0,
 *       target: 3,
 *       unit: 'markets',
 *     },
 *   ],
 *   period: 'Q1 2024',
 *   owner: 'CEO',
 * })
 *
 * // Update a key result
 * growthOKR.updateKeyResult('kr1', { current: 125000 })
 *
 * // Get overall progress
 * const progress = growthOKR.getProgress() // 58.33%
 * ```
 */
export function okr(config) {
    const state = {
        id: generateOKRId(config.objective),
        objective: config.objective,
        description: config.description,
        keyResults: config.keyResults,
        period: config.period,
        owner: config.owner,
        status: 'active',
    };
    return {
        ...state,
        updateKeyResult,
        getProgress,
        getKeyResult,
        getKeyResults,
        getStatus,
        toJSON,
    };
    /**
     * Update a key result
     */
    function updateKeyResult(keyResultId, updates) {
        const kr = state.keyResults.find(k => k.id === keyResultId);
        if (!kr) {
            throw new Error(`Key result with id ${keyResultId} not found`);
        }
        Object.assign(kr, updates);
        // Recalculate progress
        kr.progress = calculateKeyResultProgress(kr);
        state.progress = calculateOKRProgress();
    }
    /**
     * Get overall OKR progress
     */
    function getProgress() {
        if (state.progress !== undefined)
            return state.progress;
        return calculateOKRProgress();
    }
    /**
     * Calculate OKR progress from key results
     */
    function calculateOKRProgress() {
        if (state.keyResults.length === 0)
            return 0;
        const totalProgress = state.keyResults.reduce((sum, kr) => {
            return sum + (kr.progress || calculateKeyResultProgress(kr));
        }, 0);
        return totalProgress / state.keyResults.length;
    }
    /**
     * Get a specific key result
     */
    function getKeyResult(keyResultId) {
        return state.keyResults.find(k => k.id === keyResultId);
    }
    /**
     * Get all key results
     */
    function getKeyResults() {
        return [...state.keyResults];
    }
    /**
     * Get OKR status
     */
    function getStatus() {
        if (state.status)
            return state.status;
        const progress = getProgress();
        if (progress >= 100)
            return 'completed';
        if (progress < 50)
            return 'at-risk';
        return 'active';
    }
    /**
     * Convert to plain JSON
     */
    function toJSON() {
        return { ...state };
    }
}
/**
 * Create multiple OKRs
 *
 * @example
 * ```ts
 * import { okrs } from 'autonomous-agents'
 *
 * const objectives = okrs([
 *   {
 *     objective: 'Accelerate revenue growth',
 *     keyResults: [
 *       { id: 'kr1', description: 'Increase MRR to $150k', current: 100000, target: 150000 },
 *     ],
 *   },
 *   {
 *     objective: 'Improve product quality',
 *     keyResults: [
 *       { id: 'kr2', description: 'Reduce bug count to 10', current: 25, target: 10 },
 *     ],
 *   },
 * ])
 *
 * const all = objectives.getAll()
 * const summary = objectives.getSummary()
 * ```
 */
export function okrs(configs) {
    const okrList = configs.map(config => okr(config));
    return {
        getAll() {
            return okrList;
        },
        get(id) {
            return okrList.find(o => o.id === id);
        },
        getByOwner(owner) {
            return okrList.filter(o => o.owner === owner);
        },
        getSummary() {
            const totalProgress = okrList.reduce((sum, o) => sum + o.getProgress(), 0);
            return {
                total: okrList.length,
                onTrack: okrList.filter(o => o.getProgress() >= 70).length,
                atRisk: okrList.filter(o => o.getProgress() < 50).length,
                completed: okrList.filter(o => o.status === 'completed').length,
                averageProgress: okrList.length > 0 ? totalProgress / okrList.length : 0,
            };
        },
        toJSON() {
            return okrList.map(o => o.toJSON());
        },
    };
}
/**
 * Generate a KPI ID from name
 */
function generateKPIId(name) {
    return `kpi-${name.toLowerCase().replace(/\s+/g, '-')}`;
}
/**
 * Generate an OKR ID from objective
 */
function generateOKRId(objective) {
    return `okr-${objective.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`;
}
/**
 * Calculate progress for a key result
 */
function calculateKeyResultProgress(kr) {
    if (typeof kr.current === 'number' && typeof kr.target === 'number') {
        return Math.min(100, (kr.current / kr.target) * 100);
    }
    return 0;
}
/**
 * Update key result status based on progress
 */
export function updateKeyResultStatus(kr) {
    const progress = kr.progress || calculateKeyResultProgress(kr);
    if (progress >= 100) {
        kr.status = 'completed';
    }
    else if (progress >= 70) {
        kr.status = 'on-track';
    }
    else if (progress >= 30) {
        kr.status = 'at-risk';
    }
    else {
        kr.status = 'off-track';
    }
}
/**
 * Create a key result
 */
export function createKeyResult(config) {
    const kr = {
        id: config.id,
        description: config.description,
        current: config.current,
        target: config.target,
        unit: config.unit,
        progress: calculateKeyResultProgress({
            id: config.id,
            description: config.description,
            current: config.current,
            target: config.target,
        }),
    };
    updateKeyResultStatus(kr);
    return kr;
}
