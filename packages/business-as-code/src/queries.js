/**
 * Live Queries & Views
 *
 * Query definitions for real-time analytics against ai-database (ClickHouse-backed).
 * These are NOT batch reports - they're live, composable queries that execute
 * in real-time against a performant OLAP database.
 *
 * @packageDocumentation
 */
// =============================================================================
// Metric Definitions (Standard SaaS Metrics as Queries)
// =============================================================================
/**
 * Standard SaaS metric dimensions
 */
export const StandardDimensions = {
    // Time
    date: { name: 'date', field: 'date', type: 'date', description: 'Event date' },
    month: { name: 'month', field: 'date', type: 'date', granularity: 'month', description: 'Month' },
    quarter: { name: 'quarter', field: 'date', type: 'date', granularity: 'quarter', description: 'Quarter' },
    year: { name: 'year', field: 'date', type: 'date', granularity: 'year', description: 'Year' },
    // Customer
    customerId: { name: 'customerId', field: 'customer_id', type: 'string', description: 'Customer ID' },
    customerSegment: { name: 'customerSegment', field: 'customer_segment', type: 'string', description: 'Customer segment' },
    plan: { name: 'plan', field: 'plan', type: 'string', description: 'Subscription plan' },
    cohort: { name: 'cohort', field: 'cohort', type: 'string', description: 'Customer cohort' },
    // Product
    productId: { name: 'productId', field: 'product_id', type: 'string', description: 'Product ID' },
    productName: { name: 'productName', field: 'product_name', type: 'string', description: 'Product name' },
    feature: { name: 'feature', field: 'feature', type: 'string', description: 'Feature name' },
    // Geography
    country: { name: 'country', field: 'country', type: 'string', description: 'Country' },
    region: { name: 'region', field: 'region', type: 'string', description: 'Region' },
    // Channel
    channel: { name: 'channel', field: 'channel', type: 'string', description: 'Acquisition channel' },
    source: { name: 'source', field: 'source', type: 'string', description: 'Traffic source' },
    campaign: { name: 'campaign', field: 'campaign', type: 'string', description: 'Marketing campaign' },
};
/**
 * Standard SaaS metric measures
 */
export const StandardMeasures = {
    // Revenue
    revenue: { name: 'revenue', field: 'revenue', aggregate: 'sum', type: 'currency', description: 'Total revenue' },
    mrr: { name: 'mrr', field: 'mrr', aggregate: 'sum', type: 'currency', description: 'Monthly recurring revenue' },
    newMrr: { name: 'newMrr', field: 'new_mrr', aggregate: 'sum', type: 'currency', description: 'New MRR' },
    expansionMrr: { name: 'expansionMrr', field: 'expansion_mrr', aggregate: 'sum', type: 'currency', description: 'Expansion MRR' },
    contractionMrr: { name: 'contractionMrr', field: 'contraction_mrr', aggregate: 'sum', type: 'currency', description: 'Contraction MRR' },
    churnedMrr: { name: 'churnedMrr', field: 'churned_mrr', aggregate: 'sum', type: 'currency', description: 'Churned MRR' },
    // Customers
    customers: { name: 'customers', field: 'customer_id', aggregate: 'countDistinct', type: 'number', description: 'Unique customers' },
    newCustomers: { name: 'newCustomers', field: 'new_customer_id', aggregate: 'countDistinct', type: 'number', description: 'New customers' },
    churnedCustomers: { name: 'churnedCustomers', field: 'churned_customer_id', aggregate: 'countDistinct', type: 'number', description: 'Churned customers' },
    // Usage
    events: { name: 'events', field: 'event_id', aggregate: 'count', type: 'number', description: 'Event count' },
    sessions: { name: 'sessions', field: 'session_id', aggregate: 'countDistinct', type: 'number', description: 'Unique sessions' },
    activeUsers: { name: 'activeUsers', field: 'user_id', aggregate: 'countDistinct', type: 'number', description: 'Active users' },
    // Costs
    cogs: { name: 'cogs', field: 'cogs', aggregate: 'sum', type: 'currency', description: 'Cost of goods sold' },
    salesSpend: { name: 'salesSpend', field: 'sales_spend', aggregate: 'sum', type: 'currency', description: 'Sales spend' },
    marketingSpend: { name: 'marketingSpend', field: 'marketing_spend', aggregate: 'sum', type: 'currency', description: 'Marketing spend' },
};
/**
 * Calculated SaaS metrics
 */
export const CalculatedMetrics = {
    // Revenue metrics
    arr: {
        name: 'arr',
        expression: 'mrr * 12',
        measures: ['mrr'],
        type: 'currency',
        description: 'Annual recurring revenue',
    },
    netNewMrr: {
        name: 'netNewMrr',
        expression: 'newMrr + expansionMrr - contractionMrr - churnedMrr',
        measures: ['newMrr', 'expansionMrr', 'contractionMrr', 'churnedMrr'],
        type: 'currency',
        description: 'Net new MRR',
    },
    arpu: {
        name: 'arpu',
        expression: 'mrr / customers',
        measures: ['mrr', 'customers'],
        type: 'currency',
        description: 'Average revenue per user',
    },
    // Margin metrics
    grossProfit: {
        name: 'grossProfit',
        expression: 'revenue - cogs',
        measures: ['revenue', 'cogs'],
        type: 'currency',
        description: 'Gross profit',
    },
    grossMargin: {
        name: 'grossMargin',
        expression: '(revenue - cogs) / revenue * 100',
        measures: ['revenue', 'cogs'],
        type: 'percent',
        description: 'Gross margin percentage',
    },
    // Efficiency metrics
    cac: {
        name: 'cac',
        expression: '(salesSpend + marketingSpend) / newCustomers',
        measures: ['salesSpend', 'marketingSpend', 'newCustomers'],
        type: 'currency',
        description: 'Customer acquisition cost',
    },
    ltv: {
        name: 'ltv',
        expression: 'arpu * grossMargin / 100 / churnRate',
        measures: ['arpu', 'grossMargin'],
        type: 'currency',
        description: 'Customer lifetime value',
    },
    ltvCacRatio: {
        name: 'ltvCacRatio',
        expression: 'ltv / cac',
        measures: ['ltv', 'cac'],
        type: 'number',
        description: 'LTV:CAC ratio',
    },
    // Churn metrics
    customerChurnRate: {
        name: 'customerChurnRate',
        expression: 'churnedCustomers / customers * 100',
        measures: ['churnedCustomers', 'customers'],
        type: 'percent',
        description: 'Customer churn rate',
    },
    revenueChurnRate: {
        name: 'revenueChurnRate',
        expression: 'churnedMrr / mrr * 100',
        measures: ['churnedMrr', 'mrr'],
        type: 'percent',
        description: 'Revenue churn rate',
    },
    nrr: {
        name: 'nrr',
        expression: '(mrr + expansionMrr - contractionMrr - churnedMrr) / mrr * 100',
        measures: ['mrr', 'expansionMrr', 'contractionMrr', 'churnedMrr'],
        type: 'percent',
        description: 'Net revenue retention',
    },
    // Growth metrics
    quickRatio: {
        name: 'quickRatio',
        expression: '(newMrr + expansionMrr) / (contractionMrr + churnedMrr)',
        measures: ['newMrr', 'expansionMrr', 'contractionMrr', 'churnedMrr'],
        type: 'number',
        description: 'SaaS Quick Ratio',
    },
    magicNumber: {
        name: 'magicNumber',
        expression: 'netNewMrr * 12 / (salesSpend + marketingSpend)',
        measures: ['netNewMrr', 'salesSpend', 'marketingSpend'],
        type: 'number',
        description: 'Magic Number',
    },
};
// =============================================================================
// Query Builder Functions
// =============================================================================
/**
 * Create a query
 */
export function query(name, source) {
    return new QueryBuilder(name, source);
}
/**
 * Fluent query builder
 */
export class QueryBuilder {
    _query;
    constructor(name, source) {
        this._query = { name, source };
    }
    describe(description) {
        this._query.description = description;
        return this;
    }
    dimensions(...dims) {
        this._query.dimensions = dims;
        return this;
    }
    measures(...measures) {
        this._query.measures = measures;
        return this;
    }
    filter(field, operator, value) {
        if (!this._query.filters)
            this._query.filters = [];
        this._query.filters.push({ field, operator, value });
        return this;
    }
    where(filters) {
        this._query.filters = filters;
        return this;
    }
    timeRange(field, start, end, granularity) {
        this._query.timeRange = { field, start, end, granularity };
        return this;
    }
    last(duration, field = 'date') {
        this._query.timeRange = { field, start: `-${duration}` };
        return this;
    }
    sort(field, direction = 'desc') {
        if (!this._query.sort)
            this._query.sort = [];
        this._query.sort.push({ field, direction });
        return this;
    }
    limit(n) {
        this._query.limit = n;
        return this;
    }
    offset(n) {
        this._query.offset = n;
        return this;
    }
    tags(...tags) {
        this._query.tags = tags;
        return this;
    }
    owner(owner) {
        this._query.owner = owner;
        return this;
    }
    build() {
        return { ...this._query };
    }
}
// =============================================================================
// Pre-built SaaS Metric Queries
// =============================================================================
/**
 * MRR Overview query
 */
export const MrrOverview = query('mrr_overview', 'revenue_events')
    .describe('Monthly recurring revenue breakdown')
    .dimensions('month')
    .measures('mrr', 'newMrr', 'expansionMrr', 'contractionMrr', 'churnedMrr', 'netNewMrr')
    .last('12m')
    .sort('month', 'asc')
    .build();
/**
 * ARR by segment query
 */
export const ArrBySegment = query('arr_by_segment', 'revenue_events')
    .describe('Annual recurring revenue by customer segment')
    .dimensions('customerSegment')
    .measures('arr', 'customers', 'arpu')
    .last('1m')
    .sort('arr', 'desc')
    .build();
/**
 * Customer cohort retention query
 */
export const CohortRetention = query('cohort_retention', 'customer_events')
    .describe('Customer retention by signup cohort')
    .dimensions('cohort', 'month')
    .measures('customers', 'mrr')
    .last('12m')
    .sort('cohort', 'asc')
    .build();
/**
 * Unit economics query
 */
export const UnitEconomics = query('unit_economics', 'financial_events')
    .describe('Key unit economics metrics')
    .dimensions('month')
    .measures('cac', 'ltv', 'ltvCacRatio', 'arpu', 'customerChurnRate')
    .last('12m')
    .sort('month', 'asc')
    .build();
/**
 * Revenue by channel query
 */
export const RevenueByChannel = query('revenue_by_channel', 'revenue_events')
    .describe('Revenue breakdown by acquisition channel')
    .dimensions('channel')
    .measures('mrr', 'newCustomers', 'cac')
    .last('3m')
    .sort('mrr', 'desc')
    .build();
/**
 * Growth metrics query
 */
export const GrowthMetrics = query('growth_metrics', 'financial_events')
    .describe('Key growth and efficiency metrics')
    .dimensions('month')
    .measures('mrr', 'netNewMrr', 'quickRatio', 'nrr', 'magicNumber')
    .last('12m')
    .sort('month', 'asc')
    .build();
// =============================================================================
// View Builder
// =============================================================================
/**
 * Create a view from a query
 */
export function view(name, queryDef) {
    return new ViewBuilder(name, queryDef);
}
/**
 * Fluent view builder
 */
export class ViewBuilder {
    _view;
    constructor(name, queryDef) {
        this._view = { name, query: queryDef };
    }
    describe(description) {
        this._view.description = description;
        return this;
    }
    materialize(refreshInterval, retention) {
        this._view.materialized = true;
        this._view.refreshInterval = refreshInterval;
        this._view.retention = retention;
        return this;
    }
    public() {
        this._view.public = true;
        return this;
    }
    owner(owner) {
        this._view.owner = owner;
        return this;
    }
    tags(...tags) {
        this._view.tags = tags;
        return this;
    }
    build() {
        return { ...this._view };
    }
}
// =============================================================================
// Dashboard Builder
// =============================================================================
/**
 * Create a dashboard
 */
export function dashboard(name) {
    return new DashboardBuilder(name);
}
/**
 * Fluent dashboard builder
 */
export class DashboardBuilder {
    _dashboard;
    constructor(name) {
        this._dashboard = { name, views: [] };
    }
    describe(description) {
        this._dashboard.description = description;
        return this;
    }
    add(viewDef, options) {
        this._dashboard.views.push(viewDef);
        if (options && this._dashboard.layout) {
            this._dashboard.layout.items.push({
                viewName: viewDef.name,
                x: options.x || 0,
                y: options.y || 0,
                width: options.width || 1,
                height: options.height || 1,
                visualization: options.visualization,
            });
        }
        return this;
    }
    layout(columns, rows) {
        this._dashboard.layout = { columns, rows, items: [] };
        return this;
    }
    refresh(interval) {
        this._dashboard.refreshInterval = interval;
        return this;
    }
    owner(owner) {
        this._dashboard.owner = owner;
        return this;
    }
    tags(...tags) {
        this._dashboard.tags = tags;
        return this;
    }
    build() {
        return { ...this._dashboard };
    }
}
// =============================================================================
// Pre-built Dashboards
// =============================================================================
/**
 * Executive SaaS Dashboard
 */
export const ExecutiveDashboard = dashboard('executive')
    .describe('Executive overview of key SaaS metrics')
    .layout(4, 3)
    .add(view('mrr', MrrOverview).build(), { x: 0, y: 0, width: 2, height: 1, visualization: 'trend' })
    .add(view('arr_segments', ArrBySegment).build(), { x: 2, y: 0, width: 2, height: 1, visualization: 'bar' })
    .add(view('unit_econ', UnitEconomics).build(), { x: 0, y: 1, width: 2, height: 1, visualization: 'table' })
    .add(view('growth', GrowthMetrics).build(), { x: 2, y: 1, width: 2, height: 1, visualization: 'line' })
    .add(view('cohorts', CohortRetention).build(), { x: 0, y: 2, width: 4, height: 1, visualization: 'cohort' })
    .refresh('5m')
    .tags('executive', 'saas', 'metrics')
    .build();
