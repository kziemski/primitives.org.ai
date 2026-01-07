/**
 * AI Entity Types (Nouns)
 *
 * AI and machine learning entities for models, prompts,
 * completions, agents, and embeddings.
 *
 * @packageDocumentation
 */
// =============================================================================
// Model
// =============================================================================
/**
 * Model entity
 *
 * Represents an AI/ML model.
 */
export const Model = {
    singular: 'model',
    plural: 'models',
    description: 'An AI/ML model',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Model name',
        },
        provider: {
            type: 'string',
            description: 'Model provider',
            examples: ['openai', 'anthropic', 'google', 'meta', 'mistral', 'cohere', 'custom'],
        },
        modelId: {
            type: 'string',
            description: 'Provider model ID',
        },
        // Type
        type: {
            type: 'string',
            description: 'Model type',
            examples: ['chat', 'completion', 'embedding', 'image', 'audio', 'video', 'multimodal'],
        },
        // Capabilities
        contextWindow: {
            type: 'number',
            optional: true,
            description: 'Context window size in tokens',
        },
        maxOutputTokens: {
            type: 'number',
            optional: true,
            description: 'Max output tokens',
        },
        supportsStreaming: {
            type: 'boolean',
            optional: true,
            description: 'Supports streaming',
        },
        supportsTools: {
            type: 'boolean',
            optional: true,
            description: 'Supports tool/function calling',
        },
        supportsVision: {
            type: 'boolean',
            optional: true,
            description: 'Supports image input',
        },
        // Pricing
        inputCostPer1k: {
            type: 'number',
            optional: true,
            description: 'Cost per 1k input tokens',
        },
        outputCostPer1k: {
            type: 'number',
            optional: true,
            description: 'Cost per 1k output tokens',
        },
        currency: {
            type: 'string',
            optional: true,
            description: 'Currency',
        },
        // Status
        status: {
            type: 'string',
            optional: true,
            description: 'Model status',
            examples: ['available', 'deprecated', 'beta', 'preview'],
        },
        isActive: {
            type: 'boolean',
            description: 'Whether model is active',
        },
    },
    relationships: {
        completions: {
            type: 'Completion[]',
            description: 'Completions using this model',
        },
    },
    actions: [
        'create',
        'update',
        'activate',
        'deactivate',
        'test',
    ],
    events: [
        'created',
        'updated',
        'activated',
        'deactivated',
        'deprecated',
    ],
};
// =============================================================================
// Prompt
// =============================================================================
/**
 * Prompt entity
 *
 * Represents a reusable prompt template.
 */
export const Prompt = {
    singular: 'prompt',
    plural: 'prompts',
    description: 'A reusable prompt template',
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
            description: 'Prompt template with variables',
        },
        systemPrompt: {
            type: 'string',
            optional: true,
            description: 'System prompt',
        },
        variables: {
            type: 'json',
            optional: true,
            description: 'Template variables definition',
        },
        // Configuration
        defaultModel: {
            type: 'string',
            optional: true,
            description: 'Default model to use',
        },
        temperature: {
            type: 'number',
            optional: true,
            description: 'Temperature setting',
        },
        maxTokens: {
            type: 'number',
            optional: true,
            description: 'Max output tokens',
        },
        topP: {
            type: 'number',
            optional: true,
            description: 'Top-p sampling',
        },
        stopSequences: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Stop sequences',
        },
        // Organization
        category: {
            type: 'string',
            optional: true,
            description: 'Prompt category',
        },
        tags: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Tags',
        },
        // Versioning
        version: {
            type: 'string',
            optional: true,
            description: 'Version',
        },
        isPublished: {
            type: 'boolean',
            optional: true,
            description: 'Whether published',
        },
    },
    relationships: {
        owner: {
            type: 'User',
            description: 'Prompt owner',
        },
        completions: {
            type: 'Completion[]',
            description: 'Completions using this prompt',
        },
    },
    actions: [
        'create',
        'update',
        'publish',
        'unpublish',
        'duplicate',
        'version',
        'test',
    ],
    events: [
        'created',
        'updated',
        'published',
        'unpublished',
        'versioned',
    ],
};
// =============================================================================
// Completion
// =============================================================================
/**
 * Completion entity
 *
 * Represents an AI completion/response.
 */
export const Completion = {
    singular: 'completion',
    plural: 'completions',
    description: 'An AI completion or response',
    properties: {
        // Request
        input: {
            type: 'string',
            description: 'Input prompt/messages',
        },
        systemPrompt: {
            type: 'string',
            optional: true,
            description: 'System prompt used',
        },
        // Response
        output: {
            type: 'string',
            description: 'Model output',
        },
        finishReason: {
            type: 'string',
            optional: true,
            description: 'Finish reason',
            examples: ['stop', 'length', 'tool_calls', 'content_filter'],
        },
        // Usage
        inputTokens: {
            type: 'number',
            optional: true,
            description: 'Input tokens used',
        },
        outputTokens: {
            type: 'number',
            optional: true,
            description: 'Output tokens generated',
        },
        totalTokens: {
            type: 'number',
            optional: true,
            description: 'Total tokens',
        },
        // Cost
        cost: {
            type: 'number',
            optional: true,
            description: 'Cost in USD',
        },
        // Timing
        latency: {
            type: 'number',
            optional: true,
            description: 'Latency in milliseconds',
        },
        timeToFirstToken: {
            type: 'number',
            optional: true,
            description: 'Time to first token in ms',
        },
        // Configuration used
        modelId: {
            type: 'string',
            description: 'Model used',
        },
        temperature: {
            type: 'number',
            optional: true,
            description: 'Temperature used',
        },
        maxTokens: {
            type: 'number',
            optional: true,
            description: 'Max tokens setting',
        },
        // Metadata
        requestId: {
            type: 'string',
            optional: true,
            description: 'Provider request ID',
        },
        status: {
            type: 'string',
            description: 'Completion status',
            examples: ['completed', 'failed', 'cancelled'],
        },
        error: {
            type: 'string',
            optional: true,
            description: 'Error message if failed',
        },
    },
    relationships: {
        model: {
            type: 'Model',
            description: 'Model used',
        },
        prompt: {
            type: 'Prompt',
            required: false,
            description: 'Prompt template used',
        },
        conversation: {
            type: 'Conversation',
            required: false,
            description: 'Parent conversation',
        },
    },
    actions: [
        'create',
        'cancel',
        'retry',
    ],
    events: [
        'started',
        'streamed',
        'completed',
        'failed',
        'cancelled',
    ],
};
// =============================================================================
// AIConversation
// =============================================================================
/**
 * AIConversation entity
 *
 * Represents a conversation/chat session.
 */
export const AIConversation = {
    singular: 'ai-conversation',
    plural: 'ai-conversations',
    description: 'An AI conversation or chat session',
    properties: {
        // Identity
        title: {
            type: 'string',
            optional: true,
            description: 'Conversation title',
        },
        // Configuration
        systemPrompt: {
            type: 'string',
            optional: true,
            description: 'System prompt',
        },
        modelId: {
            type: 'string',
            optional: true,
            description: 'Default model',
        },
        // Stats
        messageCount: {
            type: 'number',
            optional: true,
            description: 'Number of messages',
        },
        totalTokens: {
            type: 'number',
            optional: true,
            description: 'Total tokens used',
        },
        totalCost: {
            type: 'number',
            optional: true,
            description: 'Total cost',
        },
        // Dates
        lastMessageAt: {
            type: 'datetime',
            optional: true,
            description: 'Last message time',
        },
        // Status
        status: {
            type: 'string',
            optional: true,
            description: 'Conversation status',
            examples: ['active', 'archived'],
        },
    },
    relationships: {
        user: {
            type: 'User',
            description: 'Conversation owner',
        },
        messages: {
            type: 'Completion[]',
            description: 'Conversation messages',
        },
        agent: {
            type: 'Agent',
            required: false,
            description: 'Agent if using one',
        },
    },
    actions: [
        'create',
        'update',
        'archive',
        'delete',
        'fork',
    ],
    events: [
        'created',
        'updated',
        'messageAdded',
        'archived',
        'deleted',
    ],
};
// =============================================================================
// Agent
// =============================================================================
/**
 * Agent entity
 *
 * Represents an AI agent with tools and capabilities.
 */
export const Agent = {
    singular: 'agent',
    plural: 'agents',
    description: 'An AI agent with tools and capabilities',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Agent name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Agent description',
        },
        avatarUrl: {
            type: 'url',
            optional: true,
            description: 'Agent avatar URL',
        },
        // Configuration
        systemPrompt: {
            type: 'string',
            optional: true,
            description: 'System prompt',
        },
        modelId: {
            type: 'string',
            description: 'Default model',
        },
        temperature: {
            type: 'number',
            optional: true,
            description: 'Temperature',
        },
        // Tools
        tools: {
            type: 'json',
            optional: true,
            description: 'Available tools/functions',
        },
        allowedTools: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Allowed tool names',
        },
        // Behavior
        maxIterations: {
            type: 'number',
            optional: true,
            description: 'Max tool call iterations',
        },
        returnIntermediateSteps: {
            type: 'boolean',
            optional: true,
            description: 'Return intermediate steps',
        },
        // Status
        status: {
            type: 'string',
            description: 'Agent status',
            examples: ['draft', 'active', 'paused', 'archived'],
        },
        isPublic: {
            type: 'boolean',
            optional: true,
            description: 'Whether agent is public',
        },
    },
    relationships: {
        owner: {
            type: 'User',
            description: 'Agent owner',
        },
        conversations: {
            type: 'AIConversation[]',
            description: 'Conversations with agent',
        },
    },
    actions: [
        'create',
        'update',
        'activate',
        'pause',
        'archive',
        'duplicate',
        'invoke',
    ],
    events: [
        'created',
        'updated',
        'activated',
        'paused',
        'archived',
        'invoked',
    ],
};
// =============================================================================
// Embedding
// =============================================================================
/**
 * Embedding entity
 *
 * Represents a vector embedding.
 */
export const Embedding = {
    singular: 'embedding',
    plural: 'embeddings',
    description: 'A vector embedding',
    properties: {
        // Content
        text: {
            type: 'string',
            description: 'Source text',
        },
        vector: {
            type: 'json',
            description: 'Embedding vector',
        },
        dimensions: {
            type: 'number',
            description: 'Vector dimensions',
        },
        // Source
        sourceType: {
            type: 'string',
            optional: true,
            description: 'Source type',
            examples: ['document', 'chunk', 'query', 'image'],
        },
        sourceId: {
            type: 'string',
            optional: true,
            description: 'Source document/item ID',
        },
        // Metadata
        modelId: {
            type: 'string',
            description: 'Model used',
        },
        namespace: {
            type: 'string',
            optional: true,
            description: 'Vector namespace',
        },
        metadata: {
            type: 'json',
            optional: true,
            description: 'Additional metadata',
        },
        // Tokens
        tokenCount: {
            type: 'number',
            optional: true,
            description: 'Token count',
        },
    },
    relationships: {},
    actions: [
        'create',
        'delete',
        'search',
    ],
    events: [
        'created',
        'deleted',
    ],
};
// =============================================================================
// FineTune
// =============================================================================
/**
 * FineTune entity
 *
 * Represents a fine-tuning job.
 */
export const FineTune = {
    singular: 'fine-tune',
    plural: 'fine-tunes',
    description: 'A model fine-tuning job',
    properties: {
        // Identity
        name: {
            type: 'string',
            optional: true,
            description: 'Fine-tune name',
        },
        // Base model
        baseModel: {
            type: 'string',
            description: 'Base model ID',
        },
        fineTunedModel: {
            type: 'string',
            optional: true,
            description: 'Resulting fine-tuned model ID',
        },
        // Status
        status: {
            type: 'string',
            description: 'Job status',
            examples: ['pending', 'running', 'succeeded', 'failed', 'cancelled'],
        },
        // Training
        trainingFile: {
            type: 'string',
            description: 'Training data file ID',
        },
        validationFile: {
            type: 'string',
            optional: true,
            description: 'Validation data file ID',
        },
        // Hyperparameters
        epochs: {
            type: 'number',
            optional: true,
            description: 'Training epochs',
        },
        batchSize: {
            type: 'number',
            optional: true,
            description: 'Batch size',
        },
        learningRate: {
            type: 'number',
            optional: true,
            description: 'Learning rate',
        },
        // Progress
        trainedTokens: {
            type: 'number',
            optional: true,
            description: 'Tokens trained',
        },
        // Timing
        startedAt: {
            type: 'datetime',
            optional: true,
            description: 'Start time',
        },
        completedAt: {
            type: 'datetime',
            optional: true,
            description: 'Completion time',
        },
        // Error
        error: {
            type: 'string',
            optional: true,
            description: 'Error message',
        },
    },
    relationships: {
        owner: {
            type: 'User',
            description: 'Job owner',
        },
    },
    actions: [
        'create',
        'cancel',
    ],
    events: [
        'created',
        'started',
        'progressed',
        'succeeded',
        'failed',
        'cancelled',
    ],
};
// =============================================================================
// Exports
// =============================================================================
export const AIEntities = {
    Model,
    Prompt,
    Completion,
    AIConversation,
    Agent,
    Embedding,
    FineTune,
};
export const AICategories = {
    models: ['Model', 'FineTune'],
    prompts: ['Prompt'],
    completions: ['Completion'],
    conversations: ['AIConversation'],
    agents: ['Agent'],
    embeddings: ['Embedding'],
};
