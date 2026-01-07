/**
 * Zoom Video Conferencing Provider
 *
 * Concrete implementation of VideoConferencingProvider using Zoom API v2.
 *
 * @packageDocumentation
 */
import { defineProvider } from '../registry.js';
const ZOOM_API_URL = 'https://api.zoom.us/v2';
/**
 * Zoom provider info
 */
export const zoomInfo = {
    id: 'video-conferencing.zoom',
    name: 'Zoom',
    description: 'Zoom video conferencing and webinar platform',
    category: 'video-conferencing',
    website: 'https://zoom.us',
    docsUrl: 'https://developers.zoom.us/docs/api/',
    requiredConfig: ['accountId', 'clientId', 'clientSecret'],
    optionalConfig: ['accessToken'],
};
/**
 * Create Zoom video conferencing provider
 */
export function createZoomProvider(config) {
    let accountId;
    let clientId;
    let clientSecret;
    let accessToken;
    let tokenExpiresAt = 0;
    /**
     * Get OAuth access token using Server-to-Server OAuth
     */
    async function getAccessToken() {
        // Return cached token if still valid (with 5-minute buffer)
        if (accessToken && Date.now() < tokenExpiresAt - 300000) {
            return accessToken;
        }
        // Get new token
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to get access token: HTTP ${response.status}`);
        }
        const data = (await response.json());
        accessToken = data.access_token;
        tokenExpiresAt = Date.now() + data.expires_in * 1000;
        return accessToken;
    }
    /**
     * Make authenticated API request
     */
    async function apiRequest(endpoint, options = {}) {
        const token = await getAccessToken();
        const url = `${ZOOM_API_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Zoom API error: ${response.status} - ${errorData?.message || response.statusText}`);
        }
        return response.json();
    }
    /**
     * Convert Zoom meeting response to MeetingData
     */
    function convertMeeting(meeting) {
        return {
            id: meeting.id.toString(),
            topic: meeting.topic,
            startTime: meeting.start_time ? new Date(meeting.start_time) : undefined,
            duration: meeting.duration,
            timezone: meeting.timezone,
            agenda: meeting.agenda,
            joinUrl: meeting.join_url,
            hostId: meeting.host_id,
            status: meeting.status,
            password: meeting.password,
            createdAt: new Date(meeting.created_at),
        };
    }
    return {
        info: zoomInfo,
        async initialize(cfg) {
            accountId = cfg.accountId;
            clientId = cfg.clientId;
            clientSecret = cfg.clientSecret;
            accessToken = cfg.accessToken;
            if (!accountId || !clientId || !clientSecret) {
                throw new Error('Zoom requires accountId, clientId, and clientSecret');
            }
        },
        async healthCheck() {
            const start = Date.now();
            try {
                // Get current user to verify API access
                await apiRequest('/users/me');
                return {
                    healthy: true,
                    latencyMs: Date.now() - start,
                    message: 'Connected',
                    checkedAt: new Date(),
                };
            }
            catch (error) {
                return {
                    healthy: false,
                    latencyMs: Date.now() - start,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    checkedAt: new Date(),
                };
            }
        },
        async dispose() {
            // Clear cached token
            accessToken = undefined;
            tokenExpiresAt = 0;
        },
        async createMeeting(meeting) {
            const body = {
                topic: meeting.topic,
                type: meeting.startTime ? 2 : 1, // 1 = instant, 2 = scheduled
                ...(meeting.startTime && {
                    start_time: meeting.startTime.toISOString(),
                }),
                ...(meeting.duration && { duration: meeting.duration }),
                ...(meeting.timezone && { timezone: meeting.timezone }),
                ...(meeting.agenda && { agenda: meeting.agenda }),
                ...(meeting.password && { password: meeting.password }),
            };
            if (meeting.settings) {
                body.settings = {
                    ...(meeting.settings.hostVideo !== undefined && {
                        host_video: meeting.settings.hostVideo,
                    }),
                    ...(meeting.settings.participantVideo !== undefined && {
                        participant_video: meeting.settings.participantVideo,
                    }),
                    ...(meeting.settings.joinBeforeHost !== undefined && {
                        join_before_host: meeting.settings.joinBeforeHost,
                    }),
                    ...(meeting.settings.muteUponEntry !== undefined && {
                        mute_upon_entry: meeting.settings.muteUponEntry,
                    }),
                    ...(meeting.settings.waitingRoom !== undefined && {
                        waiting_room: meeting.settings.waitingRoom,
                    }),
                    ...(meeting.settings.autoRecording && {
                        auto_recording: meeting.settings.autoRecording,
                    }),
                };
            }
            const response = await apiRequest('/users/me/meetings', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            return convertMeeting(response);
        },
        async getMeeting(meetingId) {
            try {
                const response = await apiRequest(`/meetings/${meetingId}`);
                return convertMeeting(response);
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('404')) {
                    return null;
                }
                throw error;
            }
        },
        async updateMeeting(meetingId, updates) {
            const body = {};
            if (updates.topic)
                body.topic = updates.topic;
            if (updates.startTime)
                body.start_time = updates.startTime.toISOString();
            if (updates.duration !== undefined)
                body.duration = updates.duration;
            if (updates.timezone)
                body.timezone = updates.timezone;
            if (updates.agenda !== undefined)
                body.agenda = updates.agenda;
            if (updates.password !== undefined)
                body.password = updates.password;
            if (updates.settings) {
                body.settings = {
                    ...(updates.settings.hostVideo !== undefined && {
                        host_video: updates.settings.hostVideo,
                    }),
                    ...(updates.settings.participantVideo !== undefined && {
                        participant_video: updates.settings.participantVideo,
                    }),
                    ...(updates.settings.joinBeforeHost !== undefined && {
                        join_before_host: updates.settings.joinBeforeHost,
                    }),
                    ...(updates.settings.muteUponEntry !== undefined && {
                        mute_upon_entry: updates.settings.muteUponEntry,
                    }),
                    ...(updates.settings.waitingRoom !== undefined && {
                        waiting_room: updates.settings.waitingRoom,
                    }),
                    ...(updates.settings.autoRecording !== undefined && {
                        auto_recording: updates.settings.autoRecording,
                    }),
                };
            }
            await apiRequest(`/meetings/${meetingId}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            // Fetch updated meeting
            const updated = await this.getMeeting(meetingId);
            if (!updated) {
                throw new Error(`Failed to fetch updated meeting ${meetingId}`);
            }
            return updated;
        },
        async deleteMeeting(meetingId) {
            try {
                await apiRequest(`/meetings/${meetingId}`, {
                    method: 'DELETE',
                });
                return true;
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('404')) {
                    return false;
                }
                throw error;
            }
        },
        async listMeetings(options = {}) {
            const params = new URLSearchParams();
            // Map type option to Zoom API parameter
            const typeMap = {
                scheduled: 'scheduled',
                live: 'live',
                upcoming: 'upcoming',
                previous: 'previous_meetings',
            };
            if (options.type) {
                params.append('type', typeMap[options.type] || 'scheduled');
            }
            else {
                params.append('type', 'scheduled');
            }
            if (options.limit)
                params.append('page_size', options.limit.toString());
            if (options.cursor)
                params.append('next_page_token', options.cursor);
            const response = await apiRequest(`/users/me/meetings?${params.toString()}`);
            return {
                items: response.meetings.map(convertMeeting),
                total: response.total_records,
                hasMore: !!response.next_page_token,
                nextCursor: response.next_page_token,
            };
        },
        async endMeeting(meetingId) {
            try {
                await apiRequest(`/meetings/${meetingId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ action: 'end' }),
                });
                return true;
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('404')) {
                    return false;
                }
                throw error;
            }
        },
        async getParticipants(meetingId) {
            try {
                const response = await apiRequest(`/past_meetings/${meetingId}/participants`);
                return response.participants.map((p) => ({
                    id: p.id,
                    name: p.name,
                    email: p.user_email,
                    joinTime: new Date(p.join_time),
                    leaveTime: p.leave_time ? new Date(p.leave_time) : undefined,
                    duration: p.duration,
                }));
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('404')) {
                    return [];
                }
                throw error;
            }
        },
        async getRecordings(meetingId) {
            try {
                const response = await apiRequest(`/meetings/${meetingId}/recordings`);
                return response.recording_files.map((r) => ({
                    id: r.id,
                    meetingId: r.meeting_id,
                    type: r.recording_type === 'audio_only' ? 'audio' :
                        r.file_type === 'TRANSCRIPT' ? 'transcript' : 'video',
                    url: r.download_url,
                    size: r.file_size,
                    duration: undefined, // Not provided in this endpoint
                    createdAt: new Date(r.recording_start),
                }));
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('404')) {
                    return [];
                }
                throw error;
            }
        },
    };
}
/**
 * Zoom provider definition
 */
export const zoomProvider = defineProvider(zoomInfo, async (config) => createZoomProvider(config));
