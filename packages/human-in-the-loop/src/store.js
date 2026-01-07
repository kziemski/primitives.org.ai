/**
 * In-memory store implementation for human requests
 */
/**
 * Simple in-memory implementation of HumanStore
 *
 * For production use, implement a persistent store using:
 * - Database (PostgreSQL, MongoDB, etc.)
 * - Key-value store (Redis)
 * - Message queue (RabbitMQ, AWS SQS)
 */
export class InMemoryHumanStore {
    requests = new Map();
    requestIdCounter = 0;
    /**
     * Generate a unique request ID
     */
    generateId() {
        return `req_${Date.now()}_${++this.requestIdCounter}`;
    }
    /**
     * Create a new request
     */
    async create(request) {
        const now = new Date();
        const fullRequest = {
            ...request,
            id: this.generateId(),
            createdAt: now,
            updatedAt: now,
        };
        this.requests.set(fullRequest.id, fullRequest);
        return fullRequest;
    }
    /**
     * Get a request by ID
     */
    async get(id) {
        const request = this.requests.get(id);
        return request ? request : null;
    }
    /**
     * Update a request
     */
    async update(id, updates) {
        const request = this.requests.get(id);
        if (!request) {
            throw new Error(`Request not found: ${id}`);
        }
        const updated = {
            ...request,
            ...updates,
            updatedAt: new Date(),
        };
        this.requests.set(id, updated);
        return updated;
    }
    /**
     * List requests with filters
     */
    async list(filters, limit) {
        let requests = Array.from(this.requests.values());
        // Apply filters
        if (filters) {
            if (filters.status) {
                requests = requests.filter((r) => filters.status.includes(r.status));
            }
            if (filters.priority) {
                requests = requests.filter((r) => filters.priority.includes(r.priority));
            }
            if (filters.assignee) {
                requests = requests.filter((r) => {
                    if (!r.assignee)
                        return false;
                    const assignees = Array.isArray(r.assignee) ? r.assignee : [r.assignee];
                    return assignees.some((a) => filters.assignee.includes(a));
                });
            }
            if (filters.role) {
                requests = requests.filter((r) => r.role && filters.role.includes(r.role));
            }
            if (filters.team) {
                requests = requests.filter((r) => r.team && filters.team.includes(r.team));
            }
        }
        // Sort by creation date (newest first)
        requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        // Apply limit
        if (limit && limit > 0) {
            requests = requests.slice(0, limit);
        }
        return requests;
    }
    /**
     * Complete a request
     */
    async complete(id, response) {
        const request = await this.get(id);
        if (!request) {
            throw new Error(`Request not found: ${id}`);
        }
        return this.update(id, {
            status: 'completed',
            response,
            completedAt: new Date(),
        });
    }
    /**
     * Reject a request
     */
    async reject(id, reason) {
        const request = await this.get(id);
        if (!request) {
            throw new Error(`Request not found: ${id}`);
        }
        return this.update(id, {
            status: 'rejected',
            rejectionReason: reason,
            completedAt: new Date(),
        });
    }
    /**
     * Escalate a request
     */
    async escalate(id, to) {
        const request = await this.get(id);
        if (!request) {
            throw new Error(`Request not found: ${id}`);
        }
        return this.update(id, {
            status: 'escalated',
            assignee: to,
        });
    }
    /**
     * Cancel a request
     */
    async cancel(id) {
        const request = await this.get(id);
        if (!request) {
            throw new Error(`Request not found: ${id}`);
        }
        return this.update(id, {
            status: 'cancelled',
            completedAt: new Date(),
        });
    }
    /**
     * Clear all requests (for testing)
     */
    clear() {
        this.requests.clear();
        this.requestIdCounter = 0;
    }
    /**
     * Get total count of requests
     */
    count() {
        return this.requests.size;
    }
}
