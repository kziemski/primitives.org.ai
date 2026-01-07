/**
 * Services-as-Software Entity Types (Nouns)
 *
 * Comprehensive entity definitions for AI-delivered productized services.
 * Each entity follows the Noun pattern with Properties, Actions, and Events.
 *
 * Categories:
 * - services: Core service entities (ProductizedService, ServiceOffering, ServicePlan, ServiceInstance, ServiceExecution)
 * - delivery: AI delivery mechanics (AgentDelivery, AutonomyLevel, EscalationRule, ConfidenceThreshold, HumanHandoff, QualityGate)
 * - billing: Billing & commerce (ServiceQuote, ServiceOrder, ServiceSubscription, Usage, Invoice, Payment)
 * - operations: Service operations (SLA, SLO, ServiceIncident, SupportTicket, ServiceFeedback, ServiceMetric)
 * - customers: Customer entities (ServiceCustomer, ServiceEntitlement, CustomerUsage, CustomerSegment)
 * - orchestration: Service orchestration (ServiceWorkflow, WorkflowStep, ServiceTask, ServiceQueue, ServiceWorker)
 *
 * @packageDocumentation
 */
// =============================================================================
// Services (Core service entities)
// =============================================================================
export { ProductizedService, ServiceOffering, ServicePlan, ServiceInstance, ServiceExecution, ServiceEntities, ServiceCategories, } from './services.js';
// =============================================================================
// Delivery (AI delivery mechanics)
// =============================================================================
export { AgentDelivery, AutonomyLevel, EscalationRule, ConfidenceThreshold, HumanHandoff, QualityGate, DeliveryEntities, DeliveryCategories, } from './delivery.js';
// =============================================================================
// Billing (Billing & commerce)
// =============================================================================
export { ServiceQuote, ServiceOrder, ServiceSubscription, Usage, Invoice, Payment, BillingEntities, BillingCategories, } from './billing.js';
// =============================================================================
// Operations (Service operations)
// =============================================================================
export { SLA, SLO, ServiceIncident, SupportTicket, ServiceFeedback, ServiceMetric, OperationsEntities, OperationsCategories, } from './operations.js';
// =============================================================================
// Customers (Customer entities)
// =============================================================================
export { ServiceCustomer, ServiceEntitlement, CustomerUsage, CustomerSegment, CustomerEntities, CustomerCategories, } from './customers.js';
// =============================================================================
// Orchestration (Service orchestration)
// =============================================================================
export { ServiceWorkflow, WorkflowStep, ServiceTask, ServiceQueue, ServiceWorker, OrchestrationEntities, OrchestrationCategories, } from './orchestration.js';
// =============================================================================
// All Entities Collection
// =============================================================================
import { ServiceEntities } from './services.js';
import { DeliveryEntities } from './delivery.js';
import { BillingEntities } from './billing.js';
import { OperationsEntities } from './operations.js';
import { CustomerEntities } from './customers.js';
import { OrchestrationEntities } from './orchestration.js';
/**
 * All services-as-software entities organized by category
 */
export const AllServiceEntities = {
    services: ServiceEntities,
    delivery: DeliveryEntities,
    billing: BillingEntities,
    operations: OperationsEntities,
    customers: CustomerEntities,
    orchestration: OrchestrationEntities,
};
/**
 * All entity category names
 */
export const ServiceEntityCategories = [
    'services',
    'delivery',
    'billing',
    'operations',
    'customers',
    'orchestration',
];
/**
 * Flat list of all entities for quick access
 */
export const Entities = {
    // Services
    ...ServiceEntities,
    // Delivery
    ...DeliveryEntities,
    // Billing
    ...BillingEntities,
    // Operations
    ...OperationsEntities,
    // Customers
    ...CustomerEntities,
    // Orchestration
    ...OrchestrationEntities,
};
