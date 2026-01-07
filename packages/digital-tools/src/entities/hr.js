/**
 * HR Entity Types (Nouns)
 *
 * Human Resources entities for employee management, teams, time off,
 * performance reviews, and organizational structure.
 *
 * @packageDocumentation
 */
// =============================================================================
// Employee
// =============================================================================
/**
 * Employee entity
 *
 * Represents an employee in the organization.
 */
export const Employee = {
    singular: 'employee',
    plural: 'employees',
    description: 'An employee in the organization',
    properties: {
        // Identity
        firstName: {
            type: 'string',
            description: 'First name',
        },
        lastName: {
            type: 'string',
            description: 'Last name',
        },
        displayName: {
            type: 'string',
            optional: true,
            description: 'Preferred display name',
        },
        email: {
            type: 'string',
            description: 'Work email address',
        },
        personalEmail: {
            type: 'string',
            optional: true,
            description: 'Personal email address',
        },
        phone: {
            type: 'string',
            optional: true,
            description: 'Work phone number',
        },
        employeeId: {
            type: 'string',
            optional: true,
            description: 'Internal employee ID',
        },
        // Employment
        status: {
            type: 'string',
            description: 'Employment status',
            examples: ['active', 'onboarding', 'on-leave', 'offboarding', 'terminated'],
        },
        type: {
            type: 'string',
            description: 'Employment type',
            examples: ['full-time', 'part-time', 'contractor', 'intern', 'temporary'],
        },
        title: {
            type: 'string',
            description: 'Job title',
        },
        department: {
            type: 'string',
            optional: true,
            description: 'Department name',
        },
        location: {
            type: 'string',
            optional: true,
            description: 'Work location',
        },
        workType: {
            type: 'string',
            optional: true,
            description: 'Work arrangement',
            examples: ['remote', 'hybrid', 'onsite'],
        },
        // Dates
        startDate: {
            type: 'datetime',
            description: 'Start date',
        },
        endDate: {
            type: 'datetime',
            optional: true,
            description: 'End date (if terminated)',
        },
        // Compensation
        salary: {
            type: 'number',
            optional: true,
            description: 'Annual salary',
        },
        currency: {
            type: 'string',
            optional: true,
            description: 'Currency for salary',
        },
        payFrequency: {
            type: 'string',
            optional: true,
            description: 'Pay frequency',
            examples: ['weekly', 'biweekly', 'semimonthly', 'monthly'],
        },
        // Profile
        avatarUrl: {
            type: 'url',
            optional: true,
            description: 'Profile photo URL',
        },
        bio: {
            type: 'string',
            optional: true,
            description: 'Short bio',
        },
        timezone: {
            type: 'string',
            optional: true,
            description: 'Preferred timezone',
        },
    },
    relationships: {
        manager: {
            type: 'Employee',
            required: false,
            description: 'Direct manager',
        },
        directReports: {
            type: 'Employee[]',
            description: 'Direct reports',
        },
        team: {
            type: 'Team',
            required: false,
            description: 'Primary team',
        },
        teams: {
            type: 'Team[]',
            description: 'All teams',
        },
    },
    actions: [
        'create',
        'update',
        'onboard',
        'offboard',
        'terminate',
        'promote',
        'transfer',
        'updateCompensation',
    ],
    events: [
        'created',
        'updated',
        'onboarded',
        'offboarded',
        'terminated',
        'promoted',
        'transferred',
        'compensationUpdated',
    ],
};
// =============================================================================
// Team
// =============================================================================
/**
 * Team entity
 *
 * Represents a team or group within the organization.
 */
export const Team = {
    singular: 'team',
    plural: 'teams',
    description: 'A team or group within the organization',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Team name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Team description',
        },
        type: {
            type: 'string',
            optional: true,
            description: 'Team type',
            examples: ['department', 'project', 'squad', 'working-group', 'committee'],
        },
        // Status
        status: {
            type: 'string',
            description: 'Team status',
            examples: ['active', 'inactive', 'archived'],
        },
        // Settings
        isPrivate: {
            type: 'boolean',
            optional: true,
            description: 'Whether team is private',
        },
        iconUrl: {
            type: 'url',
            optional: true,
            description: 'Team icon URL',
        },
    },
    relationships: {
        lead: {
            type: 'Employee',
            required: false,
            description: 'Team lead',
        },
        members: {
            type: 'Employee[]',
            description: 'Team members',
        },
        parentTeam: {
            type: 'Team',
            required: false,
            description: 'Parent team (for hierarchy)',
        },
        subteams: {
            type: 'Team[]',
            description: 'Sub-teams',
        },
    },
    actions: [
        'create',
        'update',
        'archive',
        'addMember',
        'removeMember',
        'setLead',
    ],
    events: [
        'created',
        'updated',
        'archived',
        'memberAdded',
        'memberRemoved',
        'leadChanged',
    ],
};
// =============================================================================
// TimeOff
// =============================================================================
/**
 * TimeOff entity
 *
 * Represents a time off request or record.
 */
export const TimeOff = {
    singular: 'time-off',
    plural: 'time-off-requests',
    description: 'A time off request or record',
    properties: {
        // Type
        type: {
            type: 'string',
            description: 'Time off type',
            examples: ['vacation', 'sick', 'personal', 'bereavement', 'parental', 'jury-duty', 'unpaid'],
        },
        // Status
        status: {
            type: 'string',
            description: 'Request status',
            examples: ['pending', 'approved', 'denied', 'cancelled', 'taken'],
        },
        // Dates
        startDate: {
            type: 'datetime',
            description: 'Start date',
        },
        endDate: {
            type: 'datetime',
            description: 'End date',
        },
        hours: {
            type: 'number',
            optional: true,
            description: 'Total hours requested',
        },
        // Details
        reason: {
            type: 'string',
            optional: true,
            description: 'Reason for time off',
        },
        notes: {
            type: 'string',
            optional: true,
            description: 'Additional notes',
        },
        denialReason: {
            type: 'string',
            optional: true,
            description: 'Reason for denial',
        },
        // Dates
        requestedAt: {
            type: 'datetime',
            description: 'When request was submitted',
        },
        respondedAt: {
            type: 'datetime',
            optional: true,
            description: 'When request was responded to',
        },
    },
    relationships: {
        employee: {
            type: 'Employee',
            description: 'Employee requesting time off',
        },
        approver: {
            type: 'Employee',
            required: false,
            description: 'Manager who approved/denied',
        },
    },
    actions: [
        'request',
        'approve',
        'deny',
        'cancel',
        'modify',
    ],
    events: [
        'requested',
        'approved',
        'denied',
        'cancelled',
        'modified',
    ],
};
// =============================================================================
// PerformanceReview
// =============================================================================
/**
 * PerformanceReview entity
 *
 * Represents a performance review or evaluation.
 */
export const PerformanceReview = {
    singular: 'performance-review',
    plural: 'performance-reviews',
    description: 'A performance review or evaluation',
    properties: {
        // Type
        type: {
            type: 'string',
            description: 'Review type',
            examples: ['annual', 'semi-annual', 'quarterly', 'probation', '360', 'self'],
        },
        // Period
        periodStart: {
            type: 'datetime',
            description: 'Review period start',
        },
        periodEnd: {
            type: 'datetime',
            description: 'Review period end',
        },
        // Status
        status: {
            type: 'string',
            description: 'Review status',
            examples: ['draft', 'pending-self', 'pending-manager', 'completed', 'acknowledged'],
        },
        // Ratings
        overallRating: {
            type: 'number',
            optional: true,
            description: 'Overall rating (1-5 scale)',
        },
        ratings: {
            type: 'json',
            optional: true,
            description: 'Detailed ratings by category',
        },
        // Content
        accomplishments: {
            type: 'string',
            optional: true,
            description: 'Key accomplishments',
        },
        areasForImprovement: {
            type: 'string',
            optional: true,
            description: 'Areas for improvement',
        },
        goals: {
            type: 'json',
            optional: true,
            description: 'Goals for next period',
        },
        managerFeedback: {
            type: 'string',
            optional: true,
            description: 'Manager feedback',
        },
        selfAssessment: {
            type: 'string',
            optional: true,
            description: 'Self assessment',
        },
        // Dates
        dueDate: {
            type: 'datetime',
            optional: true,
            description: 'Due date',
        },
        completedAt: {
            type: 'datetime',
            optional: true,
            description: 'Completion date',
        },
        acknowledgedAt: {
            type: 'datetime',
            optional: true,
            description: 'When employee acknowledged',
        },
    },
    relationships: {
        employee: {
            type: 'Employee',
            description: 'Employee being reviewed',
        },
        reviewer: {
            type: 'Employee',
            description: 'Manager conducting review',
        },
        peerReviewers: {
            type: 'Employee[]',
            description: 'Peer reviewers (for 360)',
        },
    },
    actions: [
        'create',
        'submitSelfAssessment',
        'submitManagerReview',
        'complete',
        'acknowledge',
        'reopen',
    ],
    events: [
        'created',
        'selfAssessmentSubmitted',
        'managerReviewSubmitted',
        'completed',
        'acknowledged',
        'reopened',
    ],
};
// =============================================================================
// Benefit
// =============================================================================
/**
 * Benefit entity
 *
 * Represents an employee benefit enrollment.
 */
export const Benefit = {
    singular: 'benefit',
    plural: 'benefits',
    description: 'An employee benefit enrollment',
    properties: {
        // Type
        type: {
            type: 'string',
            description: 'Benefit type',
            examples: ['health', 'dental', 'vision', '401k', 'hsa', 'fsa', 'life', 'disability', 'pto'],
        },
        plan: {
            type: 'string',
            optional: true,
            description: 'Specific plan name',
        },
        // Status
        status: {
            type: 'string',
            description: 'Enrollment status',
            examples: ['pending', 'active', 'cancelled', 'expired'],
        },
        // Coverage
        coverageLevel: {
            type: 'string',
            optional: true,
            description: 'Coverage level',
            examples: ['individual', 'individual-plus-spouse', 'family'],
        },
        dependents: {
            type: 'json',
            optional: true,
            description: 'Covered dependents',
        },
        // Cost
        employeeContribution: {
            type: 'number',
            optional: true,
            description: 'Employee contribution per pay period',
        },
        employerContribution: {
            type: 'number',
            optional: true,
            description: 'Employer contribution per pay period',
        },
        // Dates
        effectiveDate: {
            type: 'datetime',
            description: 'Coverage effective date',
        },
        endDate: {
            type: 'datetime',
            optional: true,
            description: 'Coverage end date',
        },
    },
    relationships: {
        employee: {
            type: 'Employee',
            description: 'Employee enrolled',
        },
    },
    actions: [
        'enroll',
        'update',
        'cancel',
        'renew',
    ],
    events: [
        'enrolled',
        'updated',
        'cancelled',
        'renewed',
        'expired',
    ],
};
// =============================================================================
// Payroll
// =============================================================================
/**
 * Payroll entity
 *
 * Represents a payroll record or pay stub.
 */
export const Payroll = {
    singular: 'payroll',
    plural: 'payrolls',
    description: 'A payroll record or pay stub',
    properties: {
        // Period
        payPeriodStart: {
            type: 'datetime',
            description: 'Pay period start',
        },
        payPeriodEnd: {
            type: 'datetime',
            description: 'Pay period end',
        },
        payDate: {
            type: 'datetime',
            description: 'Pay date',
        },
        // Status
        status: {
            type: 'string',
            description: 'Payroll status',
            examples: ['pending', 'processed', 'paid', 'cancelled'],
        },
        // Earnings
        grossPay: {
            type: 'number',
            description: 'Gross pay',
        },
        netPay: {
            type: 'number',
            description: 'Net pay',
        },
        regularHours: {
            type: 'number',
            optional: true,
            description: 'Regular hours worked',
        },
        overtimeHours: {
            type: 'number',
            optional: true,
            description: 'Overtime hours worked',
        },
        // Deductions
        deductions: {
            type: 'json',
            optional: true,
            description: 'Itemized deductions',
        },
        taxes: {
            type: 'json',
            optional: true,
            description: 'Itemized taxes',
        },
        // Currency
        currency: {
            type: 'string',
            description: 'Currency',
        },
    },
    relationships: {
        employee: {
            type: 'Employee',
            description: 'Employee paid',
        },
    },
    actions: [
        'create',
        'process',
        'approve',
        'cancel',
    ],
    events: [
        'created',
        'processed',
        'approved',
        'paid',
        'cancelled',
    ],
};
// =============================================================================
// Exports
// =============================================================================
export const HREntities = {
    Employee,
    Team,
    TimeOff,
    PerformanceReview,
    Benefit,
    Payroll,
};
export const HRCategories = {
    employees: ['Employee'],
    teams: ['Team'],
    timeOff: ['TimeOff'],
    performance: ['PerformanceReview'],
    benefits: ['Benefit'],
    payroll: ['Payroll'],
};
