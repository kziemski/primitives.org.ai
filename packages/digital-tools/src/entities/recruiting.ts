/**
 * Recruiting Entity Types (Nouns)
 *
 * Recruitment and hiring entities for job postings, candidates,
 * applications, interviews, and offers.
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// Job
// =============================================================================

/**
 * Job entity
 *
 * Represents a job posting or requisition.
 */
export const Job: Noun = {
  singular: 'job',
  plural: 'jobs',
  description: 'A job posting or requisition',

  properties: {
    // Identity
    title: {
      type: 'string',
      description: 'Job title',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    requisitionId: {
      type: 'string',
      optional: true,
      description: 'Internal requisition ID',
    },

    // Description
    description: {
      type: 'string',
      description: 'Job description',
    },
    responsibilities: {
      type: 'string',
      optional: true,
      description: 'Key responsibilities',
    },
    requirements: {
      type: 'string',
      optional: true,
      description: 'Required qualifications',
    },
    niceToHave: {
      type: 'string',
      optional: true,
      description: 'Preferred qualifications',
    },
    benefits: {
      type: 'string',
      optional: true,
      description: 'Benefits offered',
    },

    // Details
    department: {
      type: 'string',
      optional: true,
      description: 'Department',
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
    employmentType: {
      type: 'string',
      optional: true,
      description: 'Employment type',
      examples: ['full-time', 'part-time', 'contract', 'internship'],
    },
    experienceLevel: {
      type: 'string',
      optional: true,
      description: 'Experience level',
      examples: ['entry', 'mid', 'senior', 'lead', 'executive'],
    },

    // Compensation
    salaryMin: {
      type: 'number',
      optional: true,
      description: 'Minimum salary',
    },
    salaryMax: {
      type: 'number',
      optional: true,
      description: 'Maximum salary',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Salary currency',
    },
    equity: {
      type: 'string',
      optional: true,
      description: 'Equity compensation',
    },

    // Status
    status: {
      type: 'string',
      description: 'Job status',
      examples: ['draft', 'open', 'paused', 'closed', 'filled', 'cancelled'],
    },
    visibility: {
      type: 'string',
      optional: true,
      description: 'Visibility',
      examples: ['public', 'internal', 'confidential'],
    },

    // Dates
    postedAt: {
      type: 'datetime',
      optional: true,
      description: 'When posted',
    },
    closingDate: {
      type: 'datetime',
      optional: true,
      description: 'Application deadline',
    },

    // Counts
    openings: {
      type: 'number',
      optional: true,
      description: 'Number of openings',
    },
    applicantCount: {
      type: 'number',
      optional: true,
      description: 'Number of applicants',
    },
  },

  relationships: {
    hiringManager: {
      type: 'Employee',
      required: false,
      description: 'Hiring manager',
    },
    recruiter: {
      type: 'Employee',
      required: false,
      description: 'Assigned recruiter',
    },
    interviewers: {
      type: 'Employee[]',
      description: 'Interview team',
    },
    applications: {
      type: 'Application[]',
      description: 'Job applications',
    },
  },

  actions: [
    'create',
    'update',
    'publish',
    'pause',
    'close',
    'reopen',
    'duplicate',
  ],

  events: [
    'created',
    'updated',
    'published',
    'paused',
    'closed',
    'reopened',
    'filled',
  ],
}

// =============================================================================
// Candidate
// =============================================================================

/**
 * Candidate entity
 *
 * Represents a job candidate.
 */
export const Candidate: Noun = {
  singular: 'candidate',
  plural: 'candidates',
  description: 'A job candidate',

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
    email: {
      type: 'string',
      description: 'Email address',
    },
    phone: {
      type: 'string',
      optional: true,
      description: 'Phone number',
    },

    // Profile
    headline: {
      type: 'string',
      optional: true,
      description: 'Professional headline',
    },
    summary: {
      type: 'string',
      optional: true,
      description: 'Professional summary',
    },
    location: {
      type: 'string',
      optional: true,
      description: 'Current location',
    },
    linkedinUrl: {
      type: 'url',
      optional: true,
      description: 'LinkedIn profile URL',
    },
    portfolioUrl: {
      type: 'url',
      optional: true,
      description: 'Portfolio URL',
    },
    websiteUrl: {
      type: 'url',
      optional: true,
      description: 'Personal website URL',
    },

    // Documents
    resumeUrl: {
      type: 'url',
      optional: true,
      description: 'Resume URL',
    },
    coverLetterUrl: {
      type: 'url',
      optional: true,
      description: 'Cover letter URL',
    },

    // Experience
    currentTitle: {
      type: 'string',
      optional: true,
      description: 'Current job title',
    },
    currentCompany: {
      type: 'string',
      optional: true,
      description: 'Current employer',
    },
    yearsOfExperience: {
      type: 'number',
      optional: true,
      description: 'Years of experience',
    },
    skills: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Skills list',
    },

    // Source
    source: {
      type: 'string',
      optional: true,
      description: 'How they found us',
      examples: ['website', 'linkedin', 'referral', 'job-board', 'agency', 'event'],
    },
    referredBy: {
      type: 'string',
      optional: true,
      description: 'Referrer name or ID',
    },

    // Tags
    tags: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Tags for organization',
    },
    notes: {
      type: 'string',
      optional: true,
      description: 'Recruiter notes',
    },
  },

  relationships: {
    applications: {
      type: 'Application[]',
      description: 'Job applications',
    },
    interviews: {
      type: 'Interview[]',
      description: 'Scheduled interviews',
    },
  },

  actions: [
    'create',
    'update',
    'merge',
    'archive',
    'addTag',
    'removeTag',
  ],

  events: [
    'created',
    'updated',
    'merged',
    'archived',
    'tagAdded',
    'tagRemoved',
  ],
}

// =============================================================================
// Application
// =============================================================================

/**
 * Application entity
 *
 * Represents a job application from a candidate.
 */
export const Application: Noun = {
  singular: 'application',
  plural: 'applications',
  description: 'A job application from a candidate',

  properties: {
    // Status
    status: {
      type: 'string',
      description: 'Application status',
      examples: ['new', 'screening', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn'],
    },
    stage: {
      type: 'string',
      optional: true,
      description: 'Current pipeline stage',
    },

    // Responses
    answers: {
      type: 'json',
      optional: true,
      description: 'Application question answers',
    },
    coverLetter: {
      type: 'string',
      optional: true,
      description: 'Cover letter text',
    },

    // Evaluation
    rating: {
      type: 'number',
      optional: true,
      description: 'Overall rating (1-5)',
    },
    scores: {
      type: 'json',
      optional: true,
      description: 'Detailed scores by criteria',
    },

    // Rejection
    rejectionReason: {
      type: 'string',
      optional: true,
      description: 'Reason for rejection',
      examples: ['underqualified', 'overqualified', 'culture-fit', 'compensation', 'position-filled', 'no-response'],
    },
    rejectionNotes: {
      type: 'string',
      optional: true,
      description: 'Rejection notes',
    },

    // Dates
    appliedAt: {
      type: 'datetime',
      description: 'Application date',
    },
    reviewedAt: {
      type: 'datetime',
      optional: true,
      description: 'When first reviewed',
    },
    decidedAt: {
      type: 'datetime',
      optional: true,
      description: 'When final decision made',
    },
  },

  relationships: {
    job: {
      type: 'Job',
      description: 'Job applied for',
    },
    candidate: {
      type: 'Candidate',
      description: 'Applicant',
    },
    interviews: {
      type: 'Interview[]',
      description: 'Scheduled interviews',
    },
    offer: {
      type: 'Offer',
      required: false,
      description: 'Job offer (if extended)',
    },
  },

  actions: [
    'submit',
    'review',
    'advance',
    'reject',
    'withdraw',
    'restore',
  ],

  events: [
    'submitted',
    'reviewed',
    'advanced',
    'rejected',
    'withdrawn',
    'restored',
    'hired',
  ],
}

// =============================================================================
// Interview
// =============================================================================

/**
 * Interview entity
 *
 * Represents a scheduled interview.
 */
export const Interview: Noun = {
  singular: 'interview',
  plural: 'interviews',
  description: 'A scheduled interview',

  properties: {
    // Type
    type: {
      type: 'string',
      description: 'Interview type',
      examples: ['phone-screen', 'video', 'onsite', 'technical', 'behavioral', 'panel', 'final'],
    },
    round: {
      type: 'number',
      optional: true,
      description: 'Interview round number',
    },

    // Status
    status: {
      type: 'string',
      description: 'Interview status',
      examples: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    },

    // Scheduling
    scheduledAt: {
      type: 'datetime',
      description: 'Scheduled start time',
    },
    duration: {
      type: 'number',
      description: 'Duration in minutes',
    },
    timezone: {
      type: 'string',
      optional: true,
      description: 'Timezone',
    },

    // Location
    location: {
      type: 'string',
      optional: true,
      description: 'Location or meeting link',
    },
    meetingUrl: {
      type: 'url',
      optional: true,
      description: 'Video meeting URL',
    },

    // Content
    agenda: {
      type: 'string',
      optional: true,
      description: 'Interview agenda',
    },
    questions: {
      type: 'json',
      optional: true,
      description: 'Interview questions',
    },

    // Feedback
    feedback: {
      type: 'string',
      optional: true,
      description: 'Interviewer feedback',
    },
    rating: {
      type: 'number',
      optional: true,
      description: 'Overall rating (1-5)',
    },
    scores: {
      type: 'json',
      optional: true,
      description: 'Scores by criteria',
    },
    recommendation: {
      type: 'string',
      optional: true,
      description: 'Hiring recommendation',
      examples: ['strong-hire', 'hire', 'no-hire', 'strong-no-hire', 'undecided'],
    },

    // Notes
    notes: {
      type: 'string',
      optional: true,
      description: 'Interview notes',
    },
  },

  relationships: {
    application: {
      type: 'Application',
      description: 'Related application',
    },
    candidate: {
      type: 'Candidate',
      description: 'Candidate being interviewed',
    },
    interviewer: {
      type: 'Employee',
      description: 'Primary interviewer',
    },
    panelists: {
      type: 'Employee[]',
      description: 'Interview panel',
    },
    meeting: {
      type: 'Meeting',
      required: false,
      description: 'Associated meeting',
    },
  },

  actions: [
    'schedule',
    'confirm',
    'reschedule',
    'cancel',
    'complete',
    'submitFeedback',
  ],

  events: [
    'scheduled',
    'confirmed',
    'rescheduled',
    'cancelled',
    'started',
    'completed',
    'feedbackSubmitted',
  ],
}

// =============================================================================
// Offer
// =============================================================================

/**
 * Offer entity
 *
 * Represents a job offer.
 */
export const Offer: Noun = {
  singular: 'offer',
  plural: 'offers',
  description: 'A job offer',

  properties: {
    // Status
    status: {
      type: 'string',
      description: 'Offer status',
      examples: ['draft', 'pending-approval', 'approved', 'sent', 'accepted', 'declined', 'expired', 'rescinded'],
    },

    // Position
    title: {
      type: 'string',
      description: 'Job title',
    },
    department: {
      type: 'string',
      optional: true,
      description: 'Department',
    },
    location: {
      type: 'string',
      optional: true,
      description: 'Work location',
    },
    startDate: {
      type: 'datetime',
      optional: true,
      description: 'Proposed start date',
    },

    // Compensation
    salary: {
      type: 'number',
      description: 'Base salary',
    },
    currency: {
      type: 'string',
      description: 'Currency',
    },
    bonus: {
      type: 'number',
      optional: true,
      description: 'Signing bonus',
    },
    equity: {
      type: 'string',
      optional: true,
      description: 'Equity package',
    },
    benefits: {
      type: 'string',
      optional: true,
      description: 'Benefits summary',
    },

    // Terms
    employmentType: {
      type: 'string',
      optional: true,
      description: 'Employment type',
    },
    offerLetterUrl: {
      type: 'url',
      optional: true,
      description: 'Offer letter document URL',
    },

    // Dates
    expiresAt: {
      type: 'datetime',
      optional: true,
      description: 'Offer expiration date',
    },
    sentAt: {
      type: 'datetime',
      optional: true,
      description: 'When sent to candidate',
    },
    respondedAt: {
      type: 'datetime',
      optional: true,
      description: 'When candidate responded',
    },

    // Decline
    declineReason: {
      type: 'string',
      optional: true,
      description: 'Reason for decline',
    },
  },

  relationships: {
    application: {
      type: 'Application',
      description: 'Related application',
    },
    candidate: {
      type: 'Candidate',
      description: 'Candidate receiving offer',
    },
    job: {
      type: 'Job',
      description: 'Job position',
    },
    approver: {
      type: 'Employee',
      required: false,
      description: 'Person who approved offer',
    },
  },

  actions: [
    'create',
    'update',
    'submitForApproval',
    'approve',
    'send',
    'accept',
    'decline',
    'rescind',
    'negotiate',
  ],

  events: [
    'created',
    'updated',
    'submittedForApproval',
    'approved',
    'sent',
    'accepted',
    'declined',
    'rescinded',
    'negotiated',
    'expired',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const RecruitingEntities = {
  Job,
  Candidate,
  Application,
  Interview,
  Offer,
}

export const RecruitingCategories = {
  jobs: ['Job'],
  candidates: ['Candidate'],
  applications: ['Application'],
  interviews: ['Interview'],
  offers: ['Offer'],
} as const
