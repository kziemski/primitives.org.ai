/**
 * Digital Tool Entity Types (Nouns)
 *
 * Comprehensive entity definitions for all digital tools that can be used
 * by both remote human workers AND AI agents.
 *
 * Categories use single-word identifiers for use as JS/TS var/component/function names.
 *
 * @packageDocumentation
 */

// =============================================================================
// Site (Deployed web presence with type enumeration)
// =============================================================================

export { Site, SiteEntities, SiteTypes, type SiteType } from './site.js'

// =============================================================================
// Message (unified: email, text, chat, direct, voicemail)
// =============================================================================

export {
  // Core entities (single-word nouns)
  Message,
  Thread,
  Call,
  Channel,
  Workspace,
  Member,
  Contact,
  Attachment,
  Reaction,

  // Collections
  CommunicationEntities as MessageEntities,
  CommunicationCategories as MessageCategories,
} from './communication.js'

// =============================================================================
// Productivity (Calendar, Tasks, Notes)
// =============================================================================

export {
  Calendar,
  Event,
  Availability,
  Task,
  Checklist,
  Note,
  Notebook,
  Reminder,
  Bookmark,
  ProductivityEntities,
  ProductivityCategories,
} from './productivity.js'

// =============================================================================
// Project (Projects, Issues, Sprints, Repositories)
// =============================================================================

export {
  Project,
  Issue,
  Sprint,
  Milestone,
  Board,
  Column,
  Label,
  Epic,
  ProjectManagementEntities as ProjectEntities,
  ProjectManagementCategories as ProjectCategories,
} from './project-management.js'

// =============================================================================
// Code (Repositories, PRs, Commits)
// =============================================================================

export {
  Repository,
  Branch,
  Commit,
  PullRequest,
  CodeReview,
  CodeIssue,
  Release,
  Workflow,
  WorkflowRun,
  DevelopmentEntities as CodeEntities,
  DevelopmentCategories as CodeCategories,
} from './development.js'

// =============================================================================
// Sales (Leads, Deals, Accounts)
// =============================================================================

export {
  Lead,
  Deal,
  Account,
  Pipeline,
  Stage,
  Activity,
  Quote,
  QuoteLineItem,
  Product as CRMProduct,
  CRMEntities as SalesEntities,
  CRMCategories as SalesCategories,
} from './crm.js'

// =============================================================================
// Finance (Stripe-based: Payments, Billing, Connect, Treasury, Issuing)
// =============================================================================

export {
  // Core
  Customer as FinanceCustomer,
  Product as FinanceProduct,
  Price,

  // Payments
  PaymentMethod,
  PaymentIntent,
  Charge,
  Refund,

  // Billing
  Invoice,
  InvoiceLineItem,
  Subscription,
  SubscriptionItem,
  Quote as FinanceQuote,

  // Balance
  Balance,
  BalanceTransaction,

  // Connect
  Account as ConnectAccount,
  AccountLink,
  Transfer,
  Payout,
  ApplicationFee,

  // Treasury
  FinancialAccount,
  TreasuryTransaction,
  InboundTransfer,
  OutboundTransfer,
  OutboundPayment,
  ReceivedCredit,
  ReceivedDebit,

  // Issuing
  IssuingCard,
  IssuingCardholder,
  IssuingAuthorization,
  IssuingTransaction,
  IssuingDispute,

  // Bank
  BankAccount,

  // Webhooks
  WebhookEndpoint,
  Event as FinanceEvent,

  // Collections
  FinanceEntities,
  FinanceCategories,
} from './finance.js'

// =============================================================================
// Support (Tickets, Conversations, Help)
// =============================================================================

export {
  SupportTicket,
  TicketComment,
  Conversation,
  ConversationMessage,
  HelpArticle,
  HelpCategory,
  FAQ,
  SatisfactionRating,
  SupportEntities,
  SupportCategories,
} from './support.js'

// =============================================================================
// Media (Images, Videos, Audio)
// =============================================================================

export {
  Image,
  Video,
  Audio,
  Screenshot,
  Album,
  MediaLibrary,
  Transcript,
  Caption,
  MediaEntities,
  MediaCategories,
} from './media.js'

// =============================================================================
// Marketing (Campaigns, Audiences, Templates)
// =============================================================================

export {
  Campaign,
  Audience,
  EmailTemplate,
  LandingPage,
  FormSubmission,
  SocialPost,
  AdCreative,
  UTMLink,
  MarketingEntities,
  MarketingCategories,
} from './marketing.js'

// =============================================================================
// Knowledge (Wiki, Articles, Glossary)
// =============================================================================

export {
  WikiPage,
  WikiSpace,
  WikiRevision,
  Article,
  KnowledgeBase,
  Glossary,
  GlossaryTerm,
  SearchIndex,
  Tag,
  Category,
  KnowledgeEntities,
  KnowledgeCategories,
} from './knowledge.js'

// =============================================================================
// Commerce (Products, Orders, Carts)
// =============================================================================

export {
  Product,
  ProductVariant,
  Order,
  OrderItem,
  Cart,
  Customer,
  Inventory,
  Discount,
  Review,
  EcommerceEntities as CommerceEntities,
  EcommerceCategories as CommerceCategories,
} from './ecommerce.js'

// =============================================================================
// Analytics (Reports, Dashboards, Metrics)
// =============================================================================

export {
  Report,
  Dashboard,
  Widget,
  Metric,
  Goal,
  DataSource,
  Query,
  Alert,
  AnalyticsEntities,
  AnalyticsCategories,
} from './analytics.js'

// =============================================================================
// Storage (Files, Folders, Drives)
// =============================================================================

export {
  File,
  Folder,
  Drive,
  SharedLink,
  FileVersion,
  StorageQuota,
  Backup,
  StorageEntities,
  StorageCategories,
} from './storage.js'

// =============================================================================
// Meeting (Video Conferencing, Webinars)
// =============================================================================

export {
  Meeting,
  MeetingParticipant,
  MeetingRecording,
  Webinar,
  WebinarRegistrant,
  MeetingRoom,
  BreakoutRoom,
  MeetingPoll,
  MeetingChat,
  MeetingType,
  Resource,
  Reservation,
  Waitlist,
  VideoConferencingEntities as MeetingEntities,
  VideoConferencingCategories as MeetingCategories,
} from './video-conferencing.js'

// =============================================================================
// Form (Forms, Surveys, Quizzes)
// =============================================================================

export {
  Form,
  FormField,
  FormResponse,
  Survey,
  SurveyQuestion,
  SurveyResponse,
  Quiz,
  QuizQuestion,
  QuizResult,
  FormsEntities as FormEntities,
  FormsCategories as FormCategories,
} from './forms.js'

// =============================================================================
// Signature (E-signatures, DocuSign, DocuSeal)
// =============================================================================

export {
  SignatureDocument,
  SignatureRequest,
  Signer,
  SignatureField,
  Signature,
  SignatureTemplate,
  AuditTrail,
  SignatureEntities,
  SignatureCategories,
} from './signature.js'

// =============================================================================
// Document (Word Processing: Google Docs, Word, Markdown)
// =============================================================================

export {
  Document,
  DocumentVersion,
  DocumentComment,
  DocumentCollaborator,
  DocumentEntities,
  DocumentCategories,
} from './document.js'

// =============================================================================
// Spreadsheet (Google Sheets, Excel, CSV)
// =============================================================================

export {
  Spreadsheet,
  Sheet,
  Cell,
  Range,
  Chart,
  PivotTable,
  SpreadsheetEntities,
  SpreadsheetCategories,
} from './spreadsheet.js'

// =============================================================================
// Presentation (Google Slides, PowerPoint, Reveal.js)
// =============================================================================

export {
  Presentation,
  Slide,
  SlideElement,
  SpeakerNotes,
  Animation,
  PresentationEntities,
  PresentationCategories,
} from './presentation.js'

// =============================================================================
// Infrastructure (Firebase, GCP, AWS - Config, Database, Hosting, Functions)
// =============================================================================

export {
  Config,
  ConfigVersion,
  Database,
  Collection,
  Index,
  Hosting,
  Deployment,
  Function,
  FunctionLog,
  Identity,
  Bucket,
  StorageObject,
  InfrastructureEntities,
  InfrastructureCategories,
} from './infrastructure.js'

// =============================================================================
// Experiment (Analytics, A/B Testing, Feature Flags)
// =============================================================================

export {
  Session,
  AnalyticsEvent,
  Pageview,
  Segment,
  FeatureFlag,
  Experiment,
  ExperimentResult,
  Funnel,
  FunnelStep,
  Cohort,
  ExperimentEntities,
  ExperimentCategories,
} from './experiment.js'

// =============================================================================
// Advertising (Google Ads, Meta Ads, LinkedIn Ads)
// =============================================================================

export {
  Ad,
  AdGroup,
  AdCampaign,
  Keyword,
  NegativeKeyword,
  Conversion,
  Budget,
  AdAudience,
  AdvertisingEntities,
  AdvertisingCategories,
} from './advertising.js'

// =============================================================================
// Video (YouTube, Twitch, Video Platforms)
// =============================================================================

export {
  VideoChannel,
  StreamingVideo,
  Playlist,
  PlaylistItem,
  LiveStream,
  ChatMessage,
  VideoComment,
  ChannelSubscription,
  VideoEntities,
  VideoCategories,
} from './video.js'

// =============================================================================
// Identity (WorkOS, Auth0, SSO, Directory)
// =============================================================================

export {
  Vault,
  VaultSecret,
  SecretVersion,
  VaultPolicy,
  SSOConnection,
  Directory,
  DirectoryUser,
  DirectoryGroup,
  AuditLog,
  Organization,
  OrganizationMember,
  IdentityEntities,
  IdentityCategories,
} from './identity.js'

// =============================================================================
// Notification (Push, SMS, Email, In-App)
// =============================================================================

export {
  Notification,
  NotificationTemplate,
  NotificationCampaign,
  SMS,
  SMSConversation,
  PushNotification,
  Device,
  NotificationPreference,
  InAppNotification,
  NotificationEntities,
  NotificationCategories,
} from './notification.js'

// =============================================================================
// HR (Employees, Teams, Time Off)
// =============================================================================

export {
  Employee,
  Team,
  TimeOff,
  PerformanceReview,
  Benefit,
  Payroll,
  HREntities,
  HRCategories,
} from './hr.js'

// =============================================================================
// Recruiting (Jobs, Candidates, Interviews)
// =============================================================================

export {
  Job,
  Candidate,
  Application,
  Interview,
  Offer,
  RecruitingEntities,
  RecruitingCategories,
} from './recruiting.js'

// =============================================================================
// Design (Figma, Sketch, Design Systems)
// =============================================================================

export {
  DesignFile,
  Component,
  DesignSystem,
  Style,
  Prototype,
  DesignComment,
  DesignEntities,
  DesignCategories,
} from './design.js'

// =============================================================================
// Shipping (Shipments, Packages, Carriers)
// =============================================================================

export {
  Shipment,
  Package,
  TrackingEvent,
  Carrier,
  Rate,
  ShippingEntities,
  ShippingCategories,
} from './shipping.js'

// =============================================================================
// Automation (Workflows, Triggers, Actions)
// =============================================================================

export {
  AutomationWorkflow,
  Trigger,
  Action,
  AutomationRun,
  StepResult,
  Integration,
  AutomationEntities,
  AutomationCategories,
} from './automation.js'

// =============================================================================
// AI (Models, Prompts, Completions, Agents)
// =============================================================================

export {
  Model,
  Prompt,
  Completion,
  AIConversation,
  Agent,
  Embedding,
  FineTune,
  AIEntities,
  AICategories,
} from './ai.js'

// =============================================================================
// All Entities Collection
// =============================================================================

// Site
import { SiteEntities } from './site.js'

// Tool Entities
import { CommunicationEntities as MessageEntities } from './communication.js'
import { ProductivityEntities } from './productivity.js'
import { ProjectManagementEntities as ProjectEntities } from './project-management.js'
import { DevelopmentEntities as CodeEntities } from './development.js'
import { CRMEntities as SalesEntities } from './crm.js'
import { FinanceEntities } from './finance.js'
import { SupportEntities } from './support.js'
import { MediaEntities } from './media.js'
import { MarketingEntities } from './marketing.js'
import { KnowledgeEntities } from './knowledge.js'
import { EcommerceEntities as CommerceEntities } from './ecommerce.js'
import { AnalyticsEntities } from './analytics.js'
import { StorageEntities } from './storage.js'
import { VideoConferencingEntities as MeetingEntities } from './video-conferencing.js'
import { FormsEntities as FormEntities } from './forms.js'
import { SignatureEntities } from './signature.js'
import { DocumentEntities } from './document.js'
import { SpreadsheetEntities } from './spreadsheet.js'
import { PresentationEntities } from './presentation.js'
import { InfrastructureEntities } from './infrastructure.js'
import { ExperimentEntities } from './experiment.js'
import { AdvertisingEntities } from './advertising.js'
import { VideoEntities } from './video.js'
import { IdentityEntities } from './identity.js'
import { NotificationEntities } from './notification.js'
import { HREntities } from './hr.js'
import { RecruitingEntities } from './recruiting.js'
import { DesignEntities } from './design.js'
import { ShippingEntities } from './shipping.js'
import { AutomationEntities } from './automation.js'
import { AIEntities } from './ai.js'

/**
 * All digital tool entities organized by category (single-word keys)
 */
export const AllEntities = {
  // Site
  site: SiteEntities,

  // Tool Entities
  message: MessageEntities,
  productivity: ProductivityEntities,
  project: ProjectEntities,
  code: CodeEntities,
  sales: SalesEntities,
  finance: FinanceEntities,
  support: SupportEntities,
  media: MediaEntities,
  marketing: MarketingEntities,
  knowledge: KnowledgeEntities,
  commerce: CommerceEntities,
  analytics: AnalyticsEntities,
  storage: StorageEntities,
  meeting: MeetingEntities,
  form: FormEntities,
  signature: SignatureEntities,
  document: DocumentEntities,
  spreadsheet: SpreadsheetEntities,
  presentation: PresentationEntities,
  infrastructure: InfrastructureEntities,
  experiment: ExperimentEntities,
  advertising: AdvertisingEntities,
  video: VideoEntities,
  identity: IdentityEntities,
  notification: NotificationEntities,
  hr: HREntities,
  recruiting: RecruitingEntities,
  design: DesignEntities,
  shipping: ShippingEntities,
  automation: AutomationEntities,
  ai: AIEntities,
} as const

/**
 * All entity category names (single-word identifiers)
 */
export const EntityCategories = [
  // Site
  'site',
  // Tool Entities
  'message',
  'productivity',
  'project',
  'code',
  'sales',
  'finance',
  'support',
  'media',
  'marketing',
  'knowledge',
  'commerce',
  'analytics',
  'storage',
  'meeting',
  'form',
  'signature',
  'document',
  'spreadsheet',
  'presentation',
  'infrastructure',
  'experiment',
  'advertising',
  'video',
  'identity',
  'notification',
  'hr',
  'recruiting',
  'design',
  'shipping',
  'automation',
  'ai',
] as const

export type EntityCategory = (typeof EntityCategories)[number]

// =============================================================================
// Legacy aliases for backwards compatibility
// =============================================================================

// Re-export legacy names as aliases
export {
  MessageEntities as CommunicationEntities,
  ProjectEntities as ProjectManagementEntities,
  CodeEntities as DevelopmentEntities,
  SalesEntities as CRMEntities,
  CommerceEntities as EcommerceEntities,
  MeetingEntities as VideoConferencingEntities,
  FormEntities as FormsEntities,
  InfrastructureEntities as CloudEntities,
  ExperimentEntities as ExperimentationEntities,
  VideoEntities as StreamingEntities,
}
