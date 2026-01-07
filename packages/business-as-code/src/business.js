/**
 * Business entity definition
 */
/**
 * Define a business entity with organizational structure, mission, and values
 *
 * @example
 * ```ts
 * const acme = Business({
 *   name: 'Acme Corp',
 *   description: 'Building the future of widgets',
 *   industry: 'Technology',
 *   mission: 'To make widgets accessible to everyone',
 *   values: ['Innovation', 'Customer Focus', 'Integrity'],
 *   targetMarket: 'SMB and Enterprise',
 *   foundedAt: new Date('2020-01-01'),
 *   teamSize: 50,
 *   structure: {
 *     departments: [
 *       {
 *         name: 'Engineering',
 *         head: 'Jane Smith',
 *         members: ['Alice', 'Bob', 'Charlie'],
 *         budget: 2000000,
 *       },
 *       {
 *         name: 'Sales',
 *         head: 'John Doe',
 *         members: ['David', 'Eve'],
 *         budget: 1000000,
 *       },
 *     ],
 *   },
 * })
 * ```
 */
export function Business(definition) {
    // Validate required fields
    if (!definition.name) {
        throw new Error('Business name is required');
    }
    // Return validated business definition
    return {
        ...definition,
        foundedAt: definition.foundedAt || new Date(),
        teamSize: definition.teamSize || 0,
        values: definition.values || [],
        metadata: definition.metadata || {},
    };
}
/**
 * Get total budget across all departments
 */
export function getTotalBudget(business) {
    if (!business.structure?.departments)
        return 0;
    return business.structure.departments.reduce((total, dept) => {
        return total + (dept.budget || 0);
    }, 0);
}
/**
 * Get total team size across all departments
 */
export function getTotalTeamSize(business) {
    if (!business.structure?.departments)
        return business.teamSize || 0;
    return business.structure.departments.reduce((total, dept) => {
        return total + (dept.members?.length || 0);
    }, 0);
}
/**
 * Get department by name
 */
export function getDepartment(business, name) {
    return business.structure?.departments?.find(d => d.name === name);
}
/**
 * Get team by name
 */
export function getTeam(business, name) {
    return business.structure?.teams?.find(t => t.name === name);
}
/**
 * Validate business definition
 */
export function validateBusiness(business) {
    const errors = [];
    if (!business.name) {
        errors.push('Business name is required');
    }
    if (business.teamSize && business.teamSize < 0) {
        errors.push('Team size cannot be negative');
    }
    if (business.structure?.departments) {
        for (const dept of business.structure.departments) {
            if (!dept.name) {
                errors.push('Department name is required');
            }
            if (dept.budget && dept.budget < 0) {
                errors.push(`Department ${dept.name} budget cannot be negative`);
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
