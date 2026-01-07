/**
 * Streaming & Video Platform Entity Types (Nouns)
 *
 * Entities for video platforms like YouTube, Twitch, etc.
 * Includes videos, channels, playlists, live streams, and comments.
 *
 * @packageDocumentation
 */
// =============================================================================
// Video Channel
// =============================================================================
/**
 * Video channel entity
 *
 * Represents a video channel/creator account
 */
export const VideoChannel = {
    singular: 'video channel',
    plural: 'video channels',
    description: 'A video channel or creator account',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Channel name',
        },
        handle: {
            type: 'string',
            optional: true,
            description: 'Channel handle/username',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Channel description',
        },
        // Branding
        thumbnailUrl: {
            type: 'url',
            optional: true,
            description: 'Channel thumbnail/avatar',
        },
        bannerUrl: {
            type: 'url',
            optional: true,
            description: 'Channel banner image',
        },
        customUrl: {
            type: 'string',
            optional: true,
            description: 'Custom channel URL',
        },
        // Status
        status: {
            type: 'string',
            description: 'Channel status: active, suspended, terminated',
            examples: ['active', 'suspended', 'terminated'],
        },
        verified: {
            type: 'boolean',
            optional: true,
            description: 'Whether channel is verified',
        },
        // Statistics
        subscriberCount: {
            type: 'number',
            optional: true,
            description: 'Number of subscribers',
        },
        videoCount: {
            type: 'number',
            optional: true,
            description: 'Number of videos',
        },
        viewCount: {
            type: 'number',
            optional: true,
            description: 'Total view count',
        },
        // Settings
        country: {
            type: 'string',
            optional: true,
            description: 'Channel country',
        },
        defaultLanguage: {
            type: 'string',
            optional: true,
            description: 'Default language',
        },
        madeForKids: {
            type: 'boolean',
            optional: true,
            description: 'Whether channel is made for kids',
        },
        // Monetization
        monetizationEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether monetization is enabled',
        },
        partnerProgram: {
            type: 'string',
            optional: true,
            description: 'Partner program status',
        },
    },
    relationships: {
        owner: {
            type: 'Contact',
            description: 'Channel owner',
        },
        videos: {
            type: 'StreamingVideo[]',
            backref: 'channel',
            description: 'Videos on this channel',
        },
        playlists: {
            type: 'Playlist[]',
            backref: 'channel',
            description: 'Channel playlists',
        },
        liveStreams: {
            type: 'LiveStream[]',
            backref: 'channel',
            description: 'Live streams',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'verify',
        'suspend',
        'unsuspend',
        'enableMonetization',
        'disableMonetization',
        'subscribe',
        'unsubscribe',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'verified',
        'suspended',
        'unsuspended',
        'monetizationEnabled',
        'monetizationDisabled',
        'subscribed',
        'unsubscribed',
    ],
};
// =============================================================================
// Streaming Video
// =============================================================================
/**
 * Streaming video entity
 *
 * Represents a video on a streaming platform
 */
export const StreamingVideo = {
    singular: 'streaming video',
    plural: 'streaming videos',
    description: 'A video on a streaming platform',
    properties: {
        // Identity
        title: {
            type: 'string',
            description: 'Video title',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Video description',
        },
        tags: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Video tags',
        },
        category: {
            type: 'string',
            optional: true,
            description: 'Video category',
        },
        // Media
        thumbnailUrl: {
            type: 'url',
            optional: true,
            description: 'Video thumbnail',
        },
        duration: {
            type: 'number',
            optional: true,
            description: 'Video duration in seconds',
        },
        resolution: {
            type: 'string',
            optional: true,
            description: 'Video resolution: 720p, 1080p, 4k',
            examples: ['480p', '720p', '1080p', '1440p', '4k'],
        },
        // Status
        status: {
            type: 'string',
            description: 'Video status: processing, public, private, unlisted, deleted',
            examples: ['processing', 'public', 'private', 'unlisted', 'deleted'],
        },
        publishedAt: {
            type: 'datetime',
            optional: true,
            description: 'Publication date',
        },
        scheduledPublishAt: {
            type: 'datetime',
            optional: true,
            description: 'Scheduled publication date',
        },
        // Settings
        madeForKids: {
            type: 'boolean',
            optional: true,
            description: 'Whether video is made for kids',
        },
        ageRestricted: {
            type: 'boolean',
            optional: true,
            description: 'Whether video is age-restricted',
        },
        embeddable: {
            type: 'boolean',
            optional: true,
            description: 'Whether video can be embedded',
        },
        license: {
            type: 'string',
            optional: true,
            description: 'Video license',
        },
        // Statistics
        viewCount: {
            type: 'number',
            optional: true,
            description: 'View count',
        },
        likeCount: {
            type: 'number',
            optional: true,
            description: 'Like count',
        },
        dislikeCount: {
            type: 'number',
            optional: true,
            description: 'Dislike count',
        },
        commentCount: {
            type: 'number',
            optional: true,
            description: 'Comment count',
        },
        shareCount: {
            type: 'number',
            optional: true,
            description: 'Share count',
        },
        // Engagement
        averageViewDuration: {
            type: 'number',
            optional: true,
            description: 'Average view duration in seconds',
        },
        averageViewPercentage: {
            type: 'number',
            optional: true,
            description: 'Average percentage watched',
        },
        // Monetization
        monetized: {
            type: 'boolean',
            optional: true,
            description: 'Whether video is monetized',
        },
        adSuitability: {
            type: 'string',
            optional: true,
            description: 'Ad suitability status',
        },
        estimatedRevenue: {
            type: 'number',
            optional: true,
            description: 'Estimated revenue',
        },
        // Captions
        captionsAvailable: {
            type: 'boolean',
            optional: true,
            description: 'Whether captions are available',
        },
        captionLanguages: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Available caption languages',
        },
    },
    relationships: {
        channel: {
            type: 'VideoChannel',
            backref: 'videos',
            description: 'Channel that owns this video',
        },
        comments: {
            type: 'VideoComment[]',
            backref: 'video',
            description: 'Video comments',
        },
        playlists: {
            type: 'Playlist[]',
            description: 'Playlists containing this video',
        },
        captions: {
            type: 'Caption[]',
            description: 'Video captions',
        },
    },
    actions: [
        'upload',
        'update',
        'delete',
        'publish',
        'unpublish',
        'setPrivacy',
        'like',
        'dislike',
        'share',
        'comment',
        'addToPlaylist',
        'removeFromPlaylist',
        'monetize',
        'demonetize',
        'addCaption',
        'removeCaption',
    ],
    events: [
        'uploaded',
        'updated',
        'deleted',
        'published',
        'unpublished',
        'privacyChanged',
        'liked',
        'disliked',
        'shared',
        'commented',
        'addedToPlaylist',
        'removedFromPlaylist',
        'monetized',
        'demonetized',
        'viewed',
    ],
};
// =============================================================================
// Playlist
// =============================================================================
/**
 * Playlist entity
 *
 * Represents a video playlist
 */
export const Playlist = {
    singular: 'playlist',
    plural: 'playlists',
    description: 'A video playlist',
    properties: {
        // Identity
        title: {
            type: 'string',
            description: 'Playlist title',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Playlist description',
        },
        // Branding
        thumbnailUrl: {
            type: 'url',
            optional: true,
            description: 'Playlist thumbnail',
        },
        // Status
        visibility: {
            type: 'string',
            description: 'Playlist visibility: public, private, unlisted',
            examples: ['public', 'private', 'unlisted'],
        },
        // Content
        itemCount: {
            type: 'number',
            optional: true,
            description: 'Number of items in playlist',
        },
        // Settings
        defaultLanguage: {
            type: 'string',
            optional: true,
            description: 'Default language',
        },
        embedEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether embedding is enabled',
        },
    },
    relationships: {
        channel: {
            type: 'VideoChannel',
            backref: 'playlists',
            description: 'Channel that owns this playlist',
        },
        items: {
            type: 'PlaylistItem[]',
            backref: 'playlist',
            description: 'Items in this playlist',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'addItem',
        'removeItem',
        'reorderItems',
        'setVisibility',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'itemAdded',
        'itemRemoved',
        'itemsReordered',
        'visibilityChanged',
    ],
};
/**
 * Playlist item entity
 */
export const PlaylistItem = {
    singular: 'playlist item',
    plural: 'playlist items',
    description: 'An item in a playlist',
    properties: {
        position: {
            type: 'number',
            description: 'Position in playlist (0-indexed)',
        },
        addedAt: {
            type: 'datetime',
            optional: true,
            description: 'When item was added',
        },
        note: {
            type: 'string',
            optional: true,
            description: 'Note about this item',
        },
    },
    relationships: {
        playlist: {
            type: 'Playlist',
            backref: 'items',
            description: 'Parent playlist',
        },
        video: {
            type: 'StreamingVideo',
            description: 'The video',
        },
    },
    actions: ['add', 'remove', 'move', 'setNote'],
    events: ['added', 'removed', 'moved', 'noteSet'],
};
// =============================================================================
// Live Stream
// =============================================================================
/**
 * Live stream entity
 *
 * Represents a live streaming broadcast
 */
export const LiveStream = {
    singular: 'live stream',
    plural: 'live streams',
    description: 'A live streaming broadcast',
    properties: {
        // Identity
        title: {
            type: 'string',
            description: 'Stream title',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Stream description',
        },
        category: {
            type: 'string',
            optional: true,
            description: 'Stream category',
        },
        tags: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Stream tags',
        },
        // Branding
        thumbnailUrl: {
            type: 'url',
            optional: true,
            description: 'Stream thumbnail',
        },
        // Status
        status: {
            type: 'string',
            description: 'Stream status: scheduled, live, ended, cancelled',
            examples: ['scheduled', 'live', 'ended', 'cancelled'],
        },
        visibility: {
            type: 'string',
            description: 'Stream visibility: public, private, unlisted',
            examples: ['public', 'private', 'unlisted'],
        },
        // Timing
        scheduledStartTime: {
            type: 'datetime',
            optional: true,
            description: 'Scheduled start time',
        },
        actualStartTime: {
            type: 'datetime',
            optional: true,
            description: 'Actual start time',
        },
        actualEndTime: {
            type: 'datetime',
            optional: true,
            description: 'Actual end time',
        },
        duration: {
            type: 'number',
            optional: true,
            description: 'Stream duration in seconds',
        },
        // Configuration
        streamKey: {
            type: 'string',
            optional: true,
            description: 'Stream key',
        },
        rtmpUrl: {
            type: 'url',
            optional: true,
            description: 'RTMP ingest URL',
        },
        latencyPreference: {
            type: 'string',
            optional: true,
            description: 'Latency preference: normal, low, ultra_low',
            examples: ['normal', 'low', 'ultra_low'],
        },
        dvr: {
            type: 'boolean',
            optional: true,
            description: 'Whether DVR is enabled',
        },
        // Chat
        chatEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether chat is enabled',
        },
        chatMode: {
            type: 'string',
            optional: true,
            description: 'Chat mode: open, subscribers, slow, members',
            examples: ['open', 'subscribers', 'slow', 'members'],
        },
        // Statistics
        concurrentViewers: {
            type: 'number',
            optional: true,
            description: 'Current concurrent viewers',
        },
        peakViewers: {
            type: 'number',
            optional: true,
            description: 'Peak concurrent viewers',
        },
        totalViews: {
            type: 'number',
            optional: true,
            description: 'Total unique views',
        },
        chatMessages: {
            type: 'number',
            optional: true,
            description: 'Total chat messages',
        },
        // Recording
        recordingEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether recording is enabled',
        },
        recordingUrl: {
            type: 'url',
            optional: true,
            description: 'Recording URL (after stream ends)',
        },
    },
    relationships: {
        channel: {
            type: 'VideoChannel',
            backref: 'liveStreams',
            description: 'Channel broadcasting the stream',
        },
        recording: {
            type: 'StreamingVideo',
            required: false,
            description: 'Recording of the stream',
        },
        chatMessages: {
            type: 'ChatMessage[]',
            description: 'Chat messages during stream',
        },
    },
    actions: [
        'schedule',
        'start',
        'end',
        'cancel',
        'update',
        'delete',
        'enableChat',
        'disableChat',
        'setChatMode',
        'enableDvr',
        'disableDvr',
        'generateStreamKey',
        'revokeStreamKey',
    ],
    events: [
        'scheduled',
        'started',
        'ended',
        'cancelled',
        'updated',
        'deleted',
        'chatEnabled',
        'chatDisabled',
        'chatModeChanged',
        'viewerJoined',
        'viewerLeft',
    ],
};
/**
 * Chat message entity
 */
export const ChatMessage = {
    singular: 'chat message',
    plural: 'chat messages',
    description: 'A chat message in a live stream',
    properties: {
        content: {
            type: 'string',
            description: 'Message content',
        },
        authorName: {
            type: 'string',
            description: 'Author display name',
        },
        authorAvatar: {
            type: 'url',
            optional: true,
            description: 'Author avatar URL',
        },
        isModerator: {
            type: 'boolean',
            optional: true,
            description: 'Whether author is a moderator',
        },
        isSubscriber: {
            type: 'boolean',
            optional: true,
            description: 'Whether author is a subscriber',
        },
        isMember: {
            type: 'boolean',
            optional: true,
            description: 'Whether author is a member',
        },
        isOwner: {
            type: 'boolean',
            optional: true,
            description: 'Whether author is the channel owner',
        },
        timestamp: {
            type: 'datetime',
            description: 'Message timestamp',
        },
        superchat: {
            type: 'boolean',
            optional: true,
            description: 'Whether this is a paid message',
        },
        superchatAmount: {
            type: 'number',
            optional: true,
            description: 'Super chat amount',
        },
        deleted: {
            type: 'boolean',
            optional: true,
            description: 'Whether message was deleted',
        },
    },
    relationships: {
        liveStream: {
            type: 'LiveStream',
            backref: 'chatMessages',
            description: 'Parent live stream',
        },
        author: {
            type: 'Contact',
            description: 'Message author',
        },
    },
    actions: ['send', 'delete', 'pin', 'unpin', 'timeout', 'ban'],
    events: ['sent', 'deleted', 'pinned', 'unpinned'],
};
// =============================================================================
// Video Comment
// =============================================================================
/**
 * Video comment entity
 *
 * Represents a comment on a video
 */
export const VideoComment = {
    singular: 'video comment',
    plural: 'video comments',
    description: 'A comment on a video',
    properties: {
        // Content
        text: {
            type: 'string',
            description: 'Comment text',
        },
        textOriginal: {
            type: 'string',
            optional: true,
            description: 'Original text before any edits',
        },
        // Author
        authorName: {
            type: 'string',
            description: 'Author display name',
        },
        authorAvatar: {
            type: 'url',
            optional: true,
            description: 'Author avatar URL',
        },
        authorChannelUrl: {
            type: 'url',
            optional: true,
            description: 'Author channel URL',
        },
        // Status
        published: {
            type: 'boolean',
            optional: true,
            description: 'Whether comment is published',
        },
        heldForReview: {
            type: 'boolean',
            optional: true,
            description: 'Whether comment is held for review',
        },
        // Engagement
        likeCount: {
            type: 'number',
            optional: true,
            description: 'Number of likes',
        },
        replyCount: {
            type: 'number',
            optional: true,
            description: 'Number of replies',
        },
        // Metadata
        isReply: {
            type: 'boolean',
            optional: true,
            description: 'Whether this is a reply to another comment',
        },
        timestamp: {
            type: 'datetime',
            description: 'Comment timestamp',
        },
        editedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last edit timestamp',
        },
        // Pinned
        pinned: {
            type: 'boolean',
            optional: true,
            description: 'Whether comment is pinned',
        },
        heartedByCreator: {
            type: 'boolean',
            optional: true,
            description: 'Whether creator hearted this comment',
        },
    },
    relationships: {
        video: {
            type: 'StreamingVideo',
            backref: 'comments',
            description: 'Video this comment is on',
        },
        author: {
            type: 'Contact',
            description: 'Comment author',
        },
        parentComment: {
            type: 'VideoComment',
            required: false,
            description: 'Parent comment if this is a reply',
        },
        replies: {
            type: 'VideoComment[]',
            description: 'Replies to this comment',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'like',
        'unlike',
        'reply',
        'pin',
        'unpin',
        'heart',
        'unheart',
        'approve',
        'reject',
        'report',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'liked',
        'unliked',
        'replied',
        'pinned',
        'unpinned',
        'hearted',
        'unhearted',
        'approved',
        'rejected',
        'reported',
    ],
};
// =============================================================================
// Subscription
// =============================================================================
/**
 * Channel subscription entity
 *
 * Represents a subscription to a video channel
 */
export const ChannelSubscription = {
    singular: 'channel subscription',
    plural: 'channel subscriptions',
    description: 'A subscription to a video channel',
    properties: {
        // Notification settings
        notificationPreference: {
            type: 'string',
            description: 'Notification preference: all, personalized, none',
            examples: ['all', 'personalized', 'none'],
        },
        // Timestamps
        subscribedAt: {
            type: 'datetime',
            description: 'When subscription was created',
        },
    },
    relationships: {
        subscriber: {
            type: 'Contact',
            description: 'The subscriber',
        },
        channel: {
            type: 'VideoChannel',
            description: 'The subscribed channel',
        },
    },
    actions: ['subscribe', 'unsubscribe', 'setNotifications'],
    events: ['subscribed', 'unsubscribed', 'notificationsChanged'],
};
// =============================================================================
// Export all entities as a schema
// =============================================================================
/**
 * All video entity types
 */
export const VideoEntities = {
    // Channels
    VideoChannel,
    // Videos
    StreamingVideo,
    // Playlists
    Playlist,
    PlaylistItem,
    // Live Streaming
    LiveStream,
    ChatMessage,
    // Comments
    VideoComment,
    // Subscriptions
    ChannelSubscription,
};
/**
 * Entity categories for organization
 */
export const VideoCategories = {
    channels: ['VideoChannel'],
    videos: ['StreamingVideo', 'Playlist', 'PlaylistItem'],
    liveStreaming: ['LiveStream', 'ChatMessage'],
    engagement: ['VideoComment', 'ChannelSubscription'],
};
