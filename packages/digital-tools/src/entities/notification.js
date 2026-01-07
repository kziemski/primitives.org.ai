/**
 * Notification Entity Types (Nouns)
 *
 * Notification and messaging primitives for push, SMS, email, and in-app notifications.
 *
 * @packageDocumentation
 */
// =============================================================================
// Notification
// =============================================================================
/**
 * Notification entity
 *
 * A notification message sent to users through various channels.
 */
export const Notification = {
    singular: 'notification',
    plural: 'notifications',
    description: 'A notification message sent to users through various channels',
    properties: {
        id: {
            type: 'string',
            description: 'Unique notification identifier',
        },
        title: {
            type: 'string',
            description: 'Notification title',
        },
        body: {
            type: 'string',
            description: 'Notification body content',
        },
        channel: {
            type: 'string',
            description: 'Delivery channel: email, sms, push, in-app, webhook',
            examples: ['email', 'sms', 'push', 'in-app', 'webhook'],
        },
        status: {
            type: 'string',
            description: 'Delivery status',
            examples: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
        },
        priority: {
            type: 'string',
            optional: true,
            description: 'Notification priority',
            examples: ['low', 'normal', 'high', 'urgent'],
        },
        category: {
            type: 'string',
            optional: true,
            description: 'Notification category for grouping',
        },
        recipientId: {
            type: 'string',
            description: 'Recipient user ID',
        },
        recipientEmail: {
            type: 'string',
            optional: true,
            description: 'Recipient email address',
        },
        recipientPhone: {
            type: 'string',
            optional: true,
            description: 'Recipient phone number',
        },
        recipientDeviceToken: {
            type: 'string',
            optional: true,
            description: 'Recipient device token for push',
        },
        senderId: {
            type: 'string',
            optional: true,
            description: 'Sender user or system ID',
        },
        templateId: {
            type: 'string',
            optional: true,
            description: 'Template used for this notification',
        },
        data: {
            type: 'json',
            optional: true,
            description: 'Template variables and custom data',
        },
        scheduledAt: {
            type: 'datetime',
            optional: true,
            description: 'Scheduled send time',
        },
        sentAt: {
            type: 'datetime',
            optional: true,
            description: 'Actual send time',
        },
        deliveredAt: {
            type: 'datetime',
            optional: true,
            description: 'Delivery confirmation time',
        },
        readAt: {
            type: 'datetime',
            optional: true,
            description: 'Time when notification was read',
        },
        clickedAt: {
            type: 'datetime',
            optional: true,
            description: 'Time when notification was clicked',
        },
        expiresAt: {
            type: 'datetime',
            optional: true,
            description: 'Notification expiration time',
        },
        actionUrl: {
            type: 'url',
            optional: true,
            description: 'URL to open when clicked',
        },
        imageUrl: {
            type: 'url',
            optional: true,
            description: 'Image URL for rich notifications',
        },
        icon: {
            type: 'string',
            optional: true,
            description: 'Icon identifier or URL',
        },
        badge: {
            type: 'number',
            optional: true,
            description: 'Badge count for app icon',
        },
        sound: {
            type: 'string',
            optional: true,
            description: 'Sound to play on delivery',
        },
        tags: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Tags for filtering and analytics',
        },
        metadata: {
            type: 'json',
            optional: true,
            description: 'Additional metadata',
        },
        errorMessage: {
            type: 'string',
            optional: true,
            description: 'Error message if delivery failed',
        },
        retryCount: {
            type: 'number',
            optional: true,
            description: 'Number of delivery retry attempts',
        },
    },
    relationships: {
        recipient: {
            type: 'User',
            description: 'User receiving the notification',
        },
        template: {
            type: 'NotificationTemplate',
            required: false,
            description: 'Template used',
        },
        campaign: {
            type: 'NotificationCampaign',
            required: false,
            description: 'Campaign this notification belongs to',
        },
    },
    actions: [
        'send',
        'schedule',
        'cancel',
        'retry',
        'read',
        'click',
    ],
    events: [
        'sent',
        'delivered',
        'failed',
        'bounced',
        'read',
        'clicked',
    ],
};
// =============================================================================
// NotificationTemplate
// =============================================================================
/**
 * NotificationTemplate entity
 *
 * A reusable template for notifications.
 */
export const NotificationTemplate = {
    singular: 'notification-template',
    plural: 'notification-templates',
    description: 'A reusable template for notifications',
    properties: {
        id: {
            type: 'string',
            description: 'Unique template identifier',
        },
        name: {
            type: 'string',
            description: 'Template name',
        },
        slug: {
            type: 'string',
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Template description',
        },
        channel: {
            type: 'string',
            description: 'Target channel: email, sms, push, in-app',
            examples: ['email', 'sms', 'push', 'in-app'],
        },
        subject: {
            type: 'string',
            optional: true,
            description: 'Subject line for email notifications',
        },
        title: {
            type: 'string',
            optional: true,
            description: 'Title template with variables',
        },
        body: {
            type: 'string',
            description: 'Body template with variables',
        },
        htmlBody: {
            type: 'string',
            optional: true,
            description: 'HTML body for email notifications',
        },
        variables: {
            type: 'string',
            array: true,
            optional: true,
            description: 'List of template variables',
        },
        defaultData: {
            type: 'json',
            optional: true,
            description: 'Default values for variables',
        },
        category: {
            type: 'string',
            optional: true,
            description: 'Template category',
        },
        locale: {
            type: 'string',
            optional: true,
            description: 'Template locale/language',
        },
        version: {
            type: 'number',
            optional: true,
            description: 'Template version number',
        },
        isActive: {
            type: 'boolean',
            optional: true,
            description: 'Whether template is active',
        },
    },
    relationships: {
        notifications: {
            type: 'Notification[]',
            backref: 'template',
            description: 'Notifications using this template',
        },
        translations: {
            type: 'NotificationTemplate[]',
            required: false,
            description: 'Translated versions',
        },
    },
    actions: [
        'create',
        'update',
        'preview',
        'duplicate',
        'activate',
        'deactivate',
    ],
    events: [
        'created',
        'updated',
        'activated',
        'deactivated',
    ],
};
// =============================================================================
// NotificationCampaign
// =============================================================================
/**
 * NotificationCampaign entity
 *
 * A campaign for sending bulk notifications.
 */
export const NotificationCampaign = {
    singular: 'notification-campaign',
    plural: 'notification-campaigns',
    description: 'A campaign for sending bulk notifications',
    properties: {
        id: {
            type: 'string',
            description: 'Unique campaign identifier',
        },
        name: {
            type: 'string',
            description: 'Campaign name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Campaign description',
        },
        status: {
            type: 'string',
            description: 'Campaign status',
            examples: ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'],
        },
        channel: {
            type: 'string',
            description: 'Notification channel',
        },
        templateId: {
            type: 'string',
            optional: true,
            description: 'Template ID to use',
        },
        segmentId: {
            type: 'string',
            optional: true,
            description: 'Target audience segment',
        },
        audienceFilter: {
            type: 'json',
            optional: true,
            description: 'Custom audience filter criteria',
        },
        scheduledAt: {
            type: 'datetime',
            optional: true,
            description: 'Scheduled start time',
        },
        startedAt: {
            type: 'datetime',
            optional: true,
            description: 'Actual start time',
        },
        completedAt: {
            type: 'datetime',
            optional: true,
            description: 'Completion time',
        },
        totalRecipients: {
            type: 'number',
            optional: true,
            description: 'Total number of recipients',
        },
        sentCount: {
            type: 'number',
            optional: true,
            description: 'Number of notifications sent',
        },
        deliveredCount: {
            type: 'number',
            optional: true,
            description: 'Number delivered',
        },
        failedCount: {
            type: 'number',
            optional: true,
            description: 'Number failed',
        },
        openRate: {
            type: 'number',
            optional: true,
            description: 'Open rate percentage',
        },
        clickRate: {
            type: 'number',
            optional: true,
            description: 'Click rate percentage',
        },
        throttleRate: {
            type: 'number',
            optional: true,
            description: 'Messages per second limit',
        },
    },
    relationships: {
        notifications: {
            type: 'Notification[]',
            backref: 'campaign',
            description: 'Notifications in this campaign',
        },
        template: {
            type: 'NotificationTemplate',
            required: false,
            description: 'Template used',
        },
        segment: {
            type: 'Segment',
            required: false,
            description: 'Target segment',
        },
    },
    actions: [
        'create',
        'schedule',
        'start',
        'pause',
        'resume',
        'cancel',
    ],
    events: [
        'created',
        'scheduled',
        'started',
        'paused',
        'resumed',
        'completed',
        'cancelled',
    ],
};
// =============================================================================
// SMS
// =============================================================================
/**
 * SMS entity
 *
 * An SMS text message.
 */
export const SMS = {
    singular: 'sms',
    plural: 'sms-messages',
    description: 'An SMS text message',
    properties: {
        id: {
            type: 'string',
            description: 'Unique SMS identifier',
        },
        from: {
            type: 'string',
            description: 'Sender phone number',
        },
        to: {
            type: 'string',
            description: 'Recipient phone number',
        },
        body: {
            type: 'string',
            description: 'Message body (max 1600 chars)',
        },
        status: {
            type: 'string',
            description: 'Message status',
            examples: ['queued', 'sending', 'sent', 'delivered', 'failed', 'undelivered'],
        },
        direction: {
            type: 'string',
            description: 'Message direction',
            examples: ['inbound', 'outbound'],
        },
        segments: {
            type: 'number',
            optional: true,
            description: 'Number of message segments',
        },
        encoding: {
            type: 'string',
            optional: true,
            description: 'Message encoding: GSM-7, UCS-2',
        },
        price: {
            type: 'number',
            optional: true,
            description: 'Message cost',
        },
        currency: {
            type: 'string',
            optional: true,
            description: 'Currency for price',
        },
        carrier: {
            type: 'string',
            optional: true,
            description: 'Recipient carrier name',
        },
        countryCode: {
            type: 'string',
            optional: true,
            description: 'Recipient country code',
        },
        errorCode: {
            type: 'string',
            optional: true,
            description: 'Error code if failed',
        },
        errorMessage: {
            type: 'string',
            optional: true,
            description: 'Error message if failed',
        },
        mediaUrls: {
            type: 'url',
            array: true,
            optional: true,
            description: 'Media URLs for MMS',
        },
        messagingServiceId: {
            type: 'string',
            optional: true,
            description: 'Messaging service ID',
        },
        conversationId: {
            type: 'string',
            optional: true,
            description: 'Conversation thread ID',
        },
        queuedAt: {
            type: 'datetime',
            optional: true,
            description: 'Time queued for sending',
        },
        sentAt: {
            type: 'datetime',
            optional: true,
            description: 'Time sent to carrier',
        },
        deliveredAt: {
            type: 'datetime',
            optional: true,
            description: 'Time delivered to recipient',
        },
    },
    relationships: {
        conversation: {
            type: 'SMSConversation',
            required: false,
            description: 'Parent conversation thread',
        },
        notification: {
            type: 'Notification',
            required: false,
            description: 'Parent notification if triggered by one',
        },
    },
    actions: [
        'send',
        'schedule',
        'cancel',
        'redact',
    ],
    events: [
        'queued',
        'sent',
        'delivered',
        'failed',
        'received',
    ],
};
// =============================================================================
// SMSConversation
// =============================================================================
/**
 * SMSConversation entity
 *
 * A conversation thread of SMS messages.
 */
export const SMSConversation = {
    singular: 'sms-conversation',
    plural: 'sms-conversations',
    description: 'A conversation thread of SMS messages',
    properties: {
        id: {
            type: 'string',
            description: 'Unique conversation identifier',
        },
        participants: {
            type: 'string',
            array: true,
            description: 'Phone numbers in the conversation',
        },
        status: {
            type: 'string',
            description: 'Conversation status',
            examples: ['active', 'closed', 'archived'],
        },
        lastMessageAt: {
            type: 'datetime',
            optional: true,
            description: 'Timestamp of last message',
        },
        lastMessagePreview: {
            type: 'string',
            optional: true,
            description: 'Preview of last message',
        },
        messageCount: {
            type: 'number',
            optional: true,
            description: 'Total message count',
        },
        unreadCount: {
            type: 'number',
            optional: true,
            description: 'Unread message count',
        },
        assignedTo: {
            type: 'string',
            optional: true,
            description: 'Assigned agent ID',
        },
        tags: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Conversation tags',
        },
        metadata: {
            type: 'json',
            optional: true,
            description: 'Custom metadata',
        },
    },
    relationships: {
        messages: {
            type: 'SMS[]',
            backref: 'conversation',
            description: 'Messages in this conversation',
        },
        contact: {
            type: 'Contact',
            required: false,
            description: 'Associated contact',
        },
    },
    actions: [
        'send',
        'close',
        'archive',
        'assign',
        'read',
    ],
    events: [
        'messageReceived',
        'messageSent',
        'closed',
        'assigned',
    ],
};
// =============================================================================
// PushNotification
// =============================================================================
/**
 * PushNotification entity
 *
 * A mobile push notification.
 */
export const PushNotification = {
    singular: 'push-notification',
    plural: 'push-notifications',
    description: 'A mobile push notification',
    properties: {
        id: {
            type: 'string',
            description: 'Unique push notification identifier',
        },
        title: {
            type: 'string',
            description: 'Notification title',
        },
        body: {
            type: 'string',
            description: 'Notification body',
        },
        subtitle: {
            type: 'string',
            optional: true,
            description: 'Notification subtitle (iOS)',
        },
        status: {
            type: 'string',
            description: 'Delivery status',
            examples: ['pending', 'sent', 'delivered', 'failed'],
        },
        platform: {
            type: 'string',
            description: 'Target platform',
            examples: ['ios', 'android', 'web'],
        },
        deviceToken: {
            type: 'string',
            description: 'Device push token',
        },
        userId: {
            type: 'string',
            optional: true,
            description: 'Target user ID',
        },
        topic: {
            type: 'string',
            optional: true,
            description: 'Push topic for topic-based delivery',
        },
        collapseKey: {
            type: 'string',
            optional: true,
            description: 'Collapse key for grouping',
        },
        priority: {
            type: 'string',
            optional: true,
            description: 'Delivery priority',
            examples: ['normal', 'high'],
        },
        ttl: {
            type: 'number',
            optional: true,
            description: 'Time to live in seconds',
        },
        badge: {
            type: 'number',
            optional: true,
            description: 'Badge count to display',
        },
        sound: {
            type: 'string',
            optional: true,
            description: 'Sound to play',
        },
        icon: {
            type: 'string',
            optional: true,
            description: 'Notification icon (Android)',
        },
        image: {
            type: 'url',
            optional: true,
            description: 'Image URL for rich notification',
        },
        clickAction: {
            type: 'string',
            optional: true,
            description: 'Action to perform on click',
        },
        data: {
            type: 'json',
            optional: true,
            description: 'Custom data payload',
        },
        category: {
            type: 'string',
            optional: true,
            description: 'Notification category for actions',
        },
        threadId: {
            type: 'string',
            optional: true,
            description: 'Thread ID for grouping (iOS)',
        },
        channelId: {
            type: 'string',
            optional: true,
            description: 'Notification channel ID (Android)',
        },
        contentAvailable: {
            type: 'boolean',
            optional: true,
            description: 'Enable background processing',
        },
        mutableContent: {
            type: 'boolean',
            optional: true,
            description: 'Allow notification modification (iOS)',
        },
        sentAt: {
            type: 'datetime',
            optional: true,
            description: 'Time sent to push service',
        },
        deliveredAt: {
            type: 'datetime',
            optional: true,
            description: 'Time delivered to device',
        },
        openedAt: {
            type: 'datetime',
            optional: true,
            description: 'Time notification was opened',
        },
        errorCode: {
            type: 'string',
            optional: true,
            description: 'Error code if failed',
        },
        errorMessage: {
            type: 'string',
            optional: true,
            description: 'Error message if failed',
        },
    },
    relationships: {
        device: {
            type: 'Device',
            description: 'Target device',
        },
        user: {
            type: 'User',
            required: false,
            description: 'Target user',
        },
        notification: {
            type: 'Notification',
            required: false,
            description: 'Parent notification',
        },
    },
    actions: [
        'send',
        'schedule',
        'cancel',
    ],
    events: [
        'sent',
        'delivered',
        'failed',
        'opened',
        'dismissed',
    ],
};
// =============================================================================
// Device
// =============================================================================
/**
 * Device entity
 *
 * A user device registered for push notifications.
 */
export const Device = {
    singular: 'device',
    plural: 'devices',
    description: 'A user device registered for push notifications',
    properties: {
        id: {
            type: 'string',
            description: 'Unique device identifier',
        },
        userId: {
            type: 'string',
            description: 'Owner user ID',
        },
        platform: {
            type: 'string',
            description: 'Device platform',
            examples: ['ios', 'android', 'web'],
        },
        pushToken: {
            type: 'string',
            optional: true,
            description: 'Push notification token',
        },
        tokenUpdatedAt: {
            type: 'datetime',
            optional: true,
            description: 'When token was last updated',
        },
        deviceModel: {
            type: 'string',
            optional: true,
            description: 'Device model name',
        },
        deviceName: {
            type: 'string',
            optional: true,
            description: 'User-defined device name',
        },
        osVersion: {
            type: 'string',
            optional: true,
            description: 'Operating system version',
        },
        appVersion: {
            type: 'string',
            optional: true,
            description: 'App version installed',
        },
        appBuild: {
            type: 'string',
            optional: true,
            description: 'App build number',
        },
        locale: {
            type: 'string',
            optional: true,
            description: 'Device locale',
        },
        timezone: {
            type: 'string',
            optional: true,
            description: 'Device timezone',
        },
        isActive: {
            type: 'boolean',
            optional: true,
            description: 'Whether device is active',
        },
        lastActiveAt: {
            type: 'datetime',
            optional: true,
            description: 'Last activity timestamp',
        },
        notificationsEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether notifications are enabled',
        },
        metadata: {
            type: 'json',
            optional: true,
            description: 'Additional device metadata',
        },
    },
    relationships: {
        user: {
            type: 'User',
            description: 'Device owner',
        },
        notifications: {
            type: 'PushNotification[]',
            backref: 'device',
            description: 'Notifications sent to this device',
        },
    },
    actions: [
        'register',
        'updateToken',
        'deactivate',
        'delete',
    ],
    events: [
        'registered',
        'tokenUpdated',
        'deactivated',
        'deleted',
    ],
};
// =============================================================================
// NotificationPreference
// =============================================================================
/**
 * NotificationPreference entity
 *
 * User preferences for notifications.
 */
export const NotificationPreference = {
    singular: 'notification-preference',
    plural: 'notification-preferences',
    description: 'User preferences for notifications',
    properties: {
        id: {
            type: 'string',
            description: 'Unique preference identifier',
        },
        userId: {
            type: 'string',
            description: 'User ID',
        },
        category: {
            type: 'string',
            description: 'Notification category',
        },
        emailEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Receive email notifications',
        },
        smsEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Receive SMS notifications',
        },
        pushEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Receive push notifications',
        },
        inAppEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Receive in-app notifications',
        },
        frequency: {
            type: 'string',
            optional: true,
            description: 'Notification frequency',
            examples: ['instant', 'daily', 'weekly'],
        },
        quietHoursStart: {
            type: 'string',
            optional: true,
            description: 'Quiet hours start time',
        },
        quietHoursEnd: {
            type: 'string',
            optional: true,
            description: 'Quiet hours end time',
        },
        timezone: {
            type: 'string',
            optional: true,
            description: 'User timezone for scheduling',
        },
    },
    relationships: {
        user: {
            type: 'User',
            description: 'User who owns these preferences',
        },
    },
    actions: [
        'update',
        'enableAll',
        'disableAll',
        'setQuietHours',
    ],
    events: [
        'updated',
        'channelEnabled',
        'channelDisabled',
    ],
};
// =============================================================================
// InAppNotification
// =============================================================================
/**
 * InAppNotification entity
 *
 * An in-application notification displayed within the app UI.
 */
export const InAppNotification = {
    singular: 'in-app-notification',
    plural: 'in-app-notifications',
    description: 'An in-application notification displayed within the app UI',
    properties: {
        id: {
            type: 'string',
            description: 'Unique notification identifier',
        },
        userId: {
            type: 'string',
            description: 'Target user ID',
        },
        title: {
            type: 'string',
            description: 'Notification title',
        },
        body: {
            type: 'string',
            description: 'Notification body',
        },
        type: {
            type: 'string',
            description: 'Notification type',
            examples: ['info', 'success', 'warning', 'error'],
        },
        category: {
            type: 'string',
            optional: true,
            description: 'Notification category',
        },
        icon: {
            type: 'string',
            optional: true,
            description: 'Icon identifier',
        },
        imageUrl: {
            type: 'url',
            optional: true,
            description: 'Image URL',
        },
        actionUrl: {
            type: 'url',
            optional: true,
            description: 'URL to navigate on click',
        },
        actionLabel: {
            type: 'string',
            optional: true,
            description: 'Action button label',
        },
        isRead: {
            type: 'boolean',
            optional: true,
            description: 'Whether notification has been read',
        },
        isArchived: {
            type: 'boolean',
            optional: true,
            description: 'Whether notification is archived',
        },
        isPinned: {
            type: 'boolean',
            optional: true,
            description: 'Whether notification is pinned',
        },
        expiresAt: {
            type: 'datetime',
            optional: true,
            description: 'Expiration timestamp',
        },
        readAt: {
            type: 'datetime',
            optional: true,
            description: 'When notification was read',
        },
        clickedAt: {
            type: 'datetime',
            optional: true,
            description: 'When notification was clicked',
        },
        metadata: {
            type: 'json',
            optional: true,
            description: 'Custom metadata',
        },
    },
    relationships: {
        user: {
            type: 'User',
            description: 'Target user',
        },
        notification: {
            type: 'Notification',
            required: false,
            description: 'Parent notification',
        },
    },
    actions: [
        'create',
        'read',
        'unread',
        'archive',
        'pin',
        'delete',
    ],
    events: [
        'created',
        'read',
        'clicked',
        'archived',
    ],
};
// =============================================================================
// Exports
// =============================================================================
export const NotificationEntities = {
    Notification,
    NotificationTemplate,
    NotificationCampaign,
    SMS,
    SMSConversation,
    PushNotification,
    Device,
    NotificationPreference,
    InAppNotification,
};
export const NotificationCategories = [
    'notification',
    'template',
    'campaign',
    'sms',
    'push',
    'device',
    'preference',
    'in-app',
];
