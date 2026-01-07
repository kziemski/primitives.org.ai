/**
 * Organization Structure - Flows to FGA/RBAC
 *
 * Defines the complete organizational hierarchy:
 *
 * Organization
 *   └── Department
 *       └── Team
 *           └── Position (Role + Worker)
 *               └── Permissions (FGA/RBAC)
 *
 * This structure enables:
 * - Hierarchical permission inheritance
 * - Role-based task assignment
 * - Approval chains based on org structure
 * - Resource access control based on department/team
 *
 * @packageDocumentation
 */
/**
 * Resolve permissions for a position in the org hierarchy
 */
export function resolvePermissions(org, positionId) {
    // Find the position
    let position;
    let team;
    let department;
    // Search through hierarchy
    for (const dept of org.departments || []) {
        for (const t of dept.teams || []) {
            const pos = t.positions?.find(p => p.id === positionId);
            if (pos) {
                position = pos;
                team = t;
                department = dept;
                break;
            }
        }
        if (position)
            break;
    }
    // Also check standalone teams
    if (!position) {
        for (const t of org.teams || []) {
            const pos = t.positions?.find(p => p.id === positionId);
            if (pos) {
                position = pos;
                team = t;
                break;
            }
        }
    }
    if (!position)
        return null;
    // Find the role
    const role = org.roles?.find(r => r.id === position.roleId);
    // Build inheritance chain
    const inheritanceChain = [];
    const permissions = {};
    const resourcePermissions = {};
    const canApprove = [];
    const canHandle = [];
    // 1. Department defaults
    if (department?.defaultPermissions) {
        inheritanceChain.push(`department:${department.id}`);
        mergePermissions(permissions, department.defaultPermissions);
    }
    // 2. Team defaults
    if (team?.defaultPermissions) {
        inheritanceChain.push(`team:${team.id}`);
        mergePermissions(permissions, team.defaultPermissions);
    }
    // 3. Team resources (scoped permissions)
    if (team?.resources) {
        for (const [resourceType, resourceIds] of Object.entries(team.resources)) {
            if (resourceIds) {
                for (const resourceId of resourceIds) {
                    const key = `${resourceType}:${resourceId}`;
                    resourcePermissions[key] = resourcePermissions[key] || {};
                    mergePermissions(resourcePermissions[key], team.defaultPermissions || {});
                }
            }
        }
    }
    // 4. Role permissions
    if (role?.permissions) {
        inheritanceChain.push(`role:${role.id}`);
        mergePermissions(permissions, role.permissions);
    }
    // 5. Role capabilities
    if (role?.canApprove) {
        canApprove.push(...role.canApprove);
    }
    if (role?.canHandle) {
        canHandle.push(...role.canHandle);
    }
    // 6. Position-specific permissions
    if (position.additionalPermissions) {
        inheritanceChain.push(`position:${position.id}`);
        mergePermissions(permissions, position.additionalPermissions);
        // Handle resource-specific permissions
        for (const [key, perms] of Object.entries(position.additionalPermissions)) {
            if (key.includes(':')) {
                resourcePermissions[key] = resourcePermissions[key] || {};
                resourcePermissions[key] = { ...resourcePermissions[key], _direct: perms };
            }
        }
    }
    return {
        workerId: position.workerId || '',
        positionId: position.id,
        permissions,
        resourcePermissions,
        canApprove: [...new Set(canApprove)],
        canHandle: [...new Set(canHandle)],
        inheritanceChain,
    };
}
/**
 * Merge permissions into target
 */
function mergePermissions(target, source) {
    for (const [key, perms] of Object.entries(source)) {
        if (!target[key]) {
            target[key] = [];
        }
        for (const perm of perms) {
            if (!target[key].includes(perm)) {
                target[key].push(perm);
            }
        }
    }
}
/**
 * Get approval chain for a request
 */
export function getApprovalChainForRequest(org, requestType, amount) {
    const chain = org.approvalChains?.find(c => c.type === requestType && c.active !== false);
    if (!chain)
        return [];
    // Find the appropriate level based on amount
    const levels = [...chain.levels].sort((a, b) => (a.threshold || 0) - (b.threshold || 0));
    for (const level of levels.reverse()) {
        if (amount === undefined || (level.threshold && amount <= level.threshold)) {
            return level.approvers;
        }
    }
    // Return highest level if amount exceeds all thresholds
    return levels[levels.length - 1]?.approvers || [];
}
/**
 * Find manager for a position (follows reportsTo chain)
 */
export function findManager(org, positionId) {
    // Find the position
    for (const dept of org.departments || []) {
        for (const team of dept.teams || []) {
            const position = team.positions?.find(p => p.id === positionId);
            if (position?.reportsTo) {
                // Find the manager position
                for (const d of org.departments || []) {
                    for (const t of d.teams || []) {
                        const manager = t.positions?.find(p => p.id === position.reportsTo);
                        if (manager)
                            return manager;
                    }
                }
            }
        }
    }
    return null;
}
