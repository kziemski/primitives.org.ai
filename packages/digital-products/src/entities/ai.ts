/**
 * AI Entity Types (Nouns)
 *
 * AI-native products: AIProduct, Model, Agent, Prompt, Tool
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// AIProduct
// =============================================================================

/**
 * AIProduct entity
 *
 * AI-powered digital product.
 */
export const AIProduct: Noun = {
  singular: 'ai-product',
  plural: 'ai-products',
  description: 'An AI-powered digital product',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Product name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Product description',
    },

    // Classification
    type: {
      type: 'string',
      description: 'AI product type',
      examples: ['chatbot', 'copilot', 'assistant', 'generator', 'analyzer', 'classifier', 'recommender', 'autonomous'],
    },
    domain: {
      type: 'string',
      optional: true,
      description: 'Application domain',
    },

    // AI Configuration
    primaryModel: {
      type: 'string',
      optional: true,
      description: 'Primary AI model',
      examples: ['gpt-4', 'claude-3', 'gemini', 'llama', 'mistral', 'custom'],
    },
    modelProvider: {
      type: 'string',
      optional: true,
      description: 'Model provider',
      examples: ['openai', 'anthropic', 'google', 'meta', 'custom'],
    },

    // Capabilities
    capabilities: {
      type: 'string',
      array: true,
      optional: true,
      description: 'AI capabilities',
      examples: ['text-generation', 'code-generation', 'image-generation', 'speech', 'vision', 'reasoning'],
    },
    modalities: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Supported modalities',
      examples: ['text', 'image', 'audio', 'video', 'code'],
    },

    // Integration
    hasTools: {
      type: 'boolean',
      optional: true,
      description: 'Has tool/function calling',
    },
    hasRAG: {
      type: 'boolean',
      optional: true,
      description: 'Has retrieval augmented generation',
    },
    hasMemory: {
      type: 'boolean',
      optional: true,
      description: 'Has conversation memory',
    },
    hasAgents: {
      type: 'boolean',
      optional: true,
      description: 'Has autonomous agents',
    },

    // Autonomy
    autonomyLevel: {
      type: 'string',
      optional: true,
      description: 'Level of autonomous operation',
      examples: ['manual', 'assisted', 'supervised', 'autonomous'],
    },

    // Safety
    contentFiltering: {
      type: 'boolean',
      optional: true,
      description: 'Content filtering enabled',
    },
    moderationEnabled: {
      type: 'boolean',
      optional: true,
      description: 'Moderation enabled',
    },

    // Metrics
    requestsPerDay: {
      type: 'number',
      optional: true,
      description: 'Average daily requests',
    },
    averageLatencyMs: {
      type: 'number',
      optional: true,
      description: 'Average latency in ms',
    },

    // Status
    status: {
      type: 'string',
      description: 'Product status',
      examples: ['draft', 'alpha', 'beta', 'production', 'deprecated'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      description: 'Parent product',
    },
    models: {
      type: 'Model[]',
      description: 'AI models used',
    },
    agents: {
      type: 'Agent[]',
      description: 'AI agents',
    },
    prompts: {
      type: 'Prompt[]',
      description: 'Prompt templates',
    },
    tools: {
      type: 'Tool[]',
      description: 'Available tools',
    },
  },

  actions: [
    'create',
    'update',
    'deploy',
    'addModel',
    'removeModel',
    'addAgent',
    'removeAgent',
    'evaluate',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'deployed',
    'modelAdded',
    'modelRemoved',
    'agentAdded',
    'agentRemoved',
    'evaluated',
    'deprecated',
  ],
}

// =============================================================================
// Model
// =============================================================================

/**
 * Model entity
 *
 * ML/AI model definition.
 */
export const Model: Noun = {
  singular: 'model',
  plural: 'models',
  description: 'An ML/AI model',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Model name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Model description',
    },

    // Type
    type: {
      type: 'string',
      description: 'Model type',
      examples: ['llm', 'embedding', 'classification', 'regression', 'generation', 'vision', 'speech', 'multimodal'],
    },
    architecture: {
      type: 'string',
      optional: true,
      description: 'Model architecture',
      examples: ['transformer', 'diffusion', 'cnn', 'rnn', 'custom'],
    },

    // Provider
    provider: {
      type: 'string',
      optional: true,
      description: 'Model provider',
      examples: ['openai', 'anthropic', 'google', 'meta', 'mistral', 'huggingface', 'custom'],
    },
    modelId: {
      type: 'string',
      optional: true,
      description: 'Provider model ID',
    },

    // Capabilities
    contextWindow: {
      type: 'number',
      optional: true,
      description: 'Context window size (tokens)',
    },
    maxOutputTokens: {
      type: 'number',
      optional: true,
      description: 'Max output tokens',
    },
    supportsFunctions: {
      type: 'boolean',
      optional: true,
      description: 'Supports function calling',
    },
    supportsVision: {
      type: 'boolean',
      optional: true,
      description: 'Supports image input',
    },
    supportsStreaming: {
      type: 'boolean',
      optional: true,
      description: 'Supports streaming output',
    },

    // Fine-tuning
    fineTuned: {
      type: 'boolean',
      optional: true,
      description: 'Is fine-tuned',
    },
    baseModel: {
      type: 'string',
      optional: true,
      description: 'Base model for fine-tuning',
    },
    trainingDataset: {
      type: 'string',
      optional: true,
      description: 'Training dataset',
    },

    // Hosting
    hostingType: {
      type: 'string',
      optional: true,
      description: 'Hosting type',
      examples: ['api', 'self-hosted', 'edge', 'serverless'],
    },
    endpoint: {
      type: 'string',
      optional: true,
      description: 'API endpoint',
    },

    // Performance
    latencyP50: {
      type: 'number',
      optional: true,
      description: 'P50 latency (ms)',
    },
    latencyP99: {
      type: 'number',
      optional: true,
      description: 'P99 latency (ms)',
    },
    tokensPerSecond: {
      type: 'number',
      optional: true,
      description: 'Tokens per second',
    },

    // Pricing
    inputPricePerMillion: {
      type: 'number',
      optional: true,
      description: 'Price per million input tokens',
    },
    outputPricePerMillion: {
      type: 'number',
      optional: true,
      description: 'Price per million output tokens',
    },

    // Status
    status: {
      type: 'string',
      description: 'Model status',
      examples: ['training', 'evaluating', 'active', 'deprecated'],
    },
    version: {
      type: 'string',
      optional: true,
      description: 'Model version',
    },
  },

  relationships: {
    aiProduct: {
      type: 'AIProduct',
      required: false,
      description: 'Parent AI product',
    },
    evaluations: {
      type: 'ModelEvaluation[]',
      description: 'Model evaluations',
    },
  },

  actions: [
    'create',
    'update',
    'train',
    'evaluate',
    'deploy',
    'undeploy',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'trained',
    'evaluated',
    'deployed',
    'undeployed',
    'deprecated',
  ],
}

// =============================================================================
// Agent
// =============================================================================

/**
 * Agent entity
 *
 * Autonomous AI agent product.
 */
export const Agent: Noun = {
  singular: 'agent',
  plural: 'agents',
  description: 'An autonomous AI agent',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Agent name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Agent description',
    },

    // Purpose
    role: {
      type: 'string',
      optional: true,
      description: 'Agent role',
    },
    goal: {
      type: 'string',
      optional: true,
      description: 'Agent goal',
    },
    backstory: {
      type: 'string',
      optional: true,
      description: 'Agent backstory/context',
    },

    // Configuration
    systemPrompt: {
      type: 'string',
      optional: true,
      description: 'System prompt',
    },
    model: {
      type: 'string',
      optional: true,
      description: 'AI model used',
    },
    temperature: {
      type: 'number',
      optional: true,
      description: 'Model temperature',
    },

    // Capabilities
    tools: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Available tools',
    },
    allowedActions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Allowed actions',
    },

    // Autonomy
    autonomyLevel: {
      type: 'string',
      description: 'Autonomy level',
      examples: ['advisory', 'assisted', 'supervised', 'autonomous'],
    },
    maxIterations: {
      type: 'number',
      optional: true,
      description: 'Max iterations per task',
    },
    requiresApproval: {
      type: 'boolean',
      optional: true,
      description: 'Requires human approval',
    },
    approvalThreshold: {
      type: 'number',
      optional: true,
      description: 'Confidence threshold for auto-approval',
    },

    // Memory
    memoryEnabled: {
      type: 'boolean',
      optional: true,
      description: 'Memory enabled',
    },
    memoryType: {
      type: 'string',
      optional: true,
      description: 'Memory type',
      examples: ['short-term', 'long-term', 'episodic', 'semantic'],
    },

    // Collaboration
    canDelegate: {
      type: 'boolean',
      optional: true,
      description: 'Can delegate to other agents',
    },
    canCollaborate: {
      type: 'boolean',
      optional: true,
      description: 'Can collaborate with other agents',
    },

    // Safety
    guardrails: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Safety guardrails',
    },
    escalationRules: {
      type: 'json',
      optional: true,
      description: 'Escalation rules',
    },

    // Status
    status: {
      type: 'string',
      description: 'Agent status',
      examples: ['draft', 'testing', 'active', 'paused', 'deprecated'],
    },
  },

  relationships: {
    aiProduct: {
      type: 'AIProduct',
      required: false,
      description: 'Parent AI product',
    },
    modelRef: {
      type: 'Model',
      required: false,
      description: 'AI model',
    },
    toolRefs: {
      type: 'Tool[]',
      description: 'Available tools',
    },
    crew: {
      type: 'Agent[]',
      description: 'Collaborating agents',
    },
    tasks: {
      type: 'AgentTask[]',
      description: 'Assigned tasks',
    },
  },

  actions: [
    'create',
    'update',
    'activate',
    'pause',
    'assignTask',
    'execute',
    'escalate',
    'evaluate',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'activated',
    'paused',
    'taskAssigned',
    'executed',
    'escalated',
    'evaluated',
    'deprecated',
  ],
}

// =============================================================================
// Prompt
// =============================================================================

/**
 * Prompt entity
 *
 * Prompt template or library.
 */
export const Prompt: Noun = {
  singular: 'prompt',
  plural: 'prompts',
  description: 'A prompt template for AI interactions',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Prompt name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Prompt description',
    },

    // Content
    template: {
      type: 'string',
      description: 'Prompt template',
    },
    systemPrompt: {
      type: 'string',
      optional: true,
      description: 'System prompt portion',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Prompt type',
      examples: ['system', 'user', 'assistant', 'few-shot', 'chain-of-thought', 'function'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Prompt category',
    },

    // Variables
    variables: {
      type: 'json',
      optional: true,
      description: 'Template variables schema',
    },
    defaultValues: {
      type: 'json',
      optional: true,
      description: 'Default variable values',
    },

    // Examples
    exampleInput: {
      type: 'string',
      optional: true,
      description: 'Example input',
    },
    exampleOutput: {
      type: 'string',
      optional: true,
      description: 'Expected output',
    },

    // Target
    targetModel: {
      type: 'string',
      optional: true,
      description: 'Target model',
    },
    targetModels: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Compatible models',
    },

    // Output
    outputFormat: {
      type: 'string',
      optional: true,
      description: 'Expected output format',
      examples: ['text', 'json', 'markdown', 'code', 'structured'],
    },
    outputSchema: {
      type: 'json',
      optional: true,
      description: 'Output schema for structured output',
    },

    // Metrics
    averageTokens: {
      type: 'number',
      optional: true,
      description: 'Average token usage',
    },
    useCount: {
      type: 'number',
      optional: true,
      description: 'Number of uses',
    },
    successRate: {
      type: 'number',
      optional: true,
      description: 'Success rate (0-1)',
    },

    // Status
    status: {
      type: 'string',
      description: 'Prompt status',
      examples: ['draft', 'testing', 'active', 'deprecated'],
    },
    version: {
      type: 'string',
      optional: true,
      description: 'Prompt version',
    },
  },

  relationships: {
    aiProduct: {
      type: 'AIProduct',
      required: false,
      description: 'Parent AI product',
    },
    mcp: {
      type: 'MCP',
      required: false,
      description: 'MCP server',
    },
    versions: {
      type: 'PromptVersion[]',
      description: 'Prompt versions',
    },
  },

  actions: [
    'create',
    'update',
    'test',
    'publish',
    'version',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'tested',
    'published',
    'versioned',
    'deprecated',
  ],
}

// =============================================================================
// Tool
// =============================================================================

/**
 * Tool entity
 *
 * AI tool definition for function calling.
 */
export const Tool: Noun = {
  singular: 'tool',
  plural: 'tools',
  description: 'A tool for AI function calling',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Tool name',
    },
    description: {
      type: 'string',
      description: 'Tool description for AI',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Tool type',
      examples: ['function', 'api', 'database', 'file', 'web', 'system', 'custom'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Tool category',
    },

    // Interface
    inputSchema: {
      type: 'json',
      description: 'Input parameters schema',
    },
    outputSchema: {
      type: 'json',
      optional: true,
      description: 'Output schema',
    },

    // Execution
    handler: {
      type: 'string',
      optional: true,
      description: 'Handler function/endpoint',
    },
    async: {
      type: 'boolean',
      optional: true,
      description: 'Async execution',
    },
    timeoutMs: {
      type: 'number',
      optional: true,
      description: 'Execution timeout',
    },

    // Permissions
    requiresAuth: {
      type: 'boolean',
      optional: true,
      description: 'Requires authentication',
    },
    requiredScopes: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Required permission scopes',
    },
    dangerous: {
      type: 'boolean',
      optional: true,
      description: 'Potentially dangerous operation',
    },
    requiresConfirmation: {
      type: 'boolean',
      optional: true,
      description: 'Requires user confirmation',
    },

    // Rate Limiting
    rateLimit: {
      type: 'number',
      optional: true,
      description: 'Rate limit per minute',
    },
    cooldownMs: {
      type: 'number',
      optional: true,
      description: 'Cooldown between calls',
    },

    // Metrics
    callCount: {
      type: 'number',
      optional: true,
      description: 'Total call count',
    },
    successRate: {
      type: 'number',
      optional: true,
      description: 'Success rate (0-1)',
    },
    averageLatencyMs: {
      type: 'number',
      optional: true,
      description: 'Average latency',
    },

    // Status
    status: {
      type: 'string',
      description: 'Tool status',
      examples: ['draft', 'active', 'deprecated'],
    },
  },

  relationships: {
    aiProduct: {
      type: 'AIProduct',
      required: false,
      description: 'Parent AI product',
    },
    mcp: {
      type: 'MCP',
      required: false,
      description: 'MCP server',
    },
    agent: {
      type: 'Agent',
      required: false,
      description: 'Assigned agent',
    },
  },

  actions: [
    'create',
    'update',
    'enable',
    'disable',
    'execute',
    'test',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'enabled',
    'disabled',
    'executed',
    'tested',
    'deprecated',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const AIEntities = {
  AIProduct,
  Model,
  Agent,
  Prompt,
  Tool,
}

export const AICategories = {
  products: ['AIProduct'],
  models: ['Model'],
  agents: ['Agent'],
  prompts: ['Prompt'],
  tools: ['Tool'],
} as const
