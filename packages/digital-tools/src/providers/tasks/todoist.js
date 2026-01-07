/**
 * Todoist Task Provider
 *
 * Concrete implementation of TaskProvider using Todoist REST API v2.
 *
 * @packageDocumentation
 */
import { defineProvider } from '../registry.js';
const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';
/**
 * Todoist provider info
 */
export const todoistInfo = {
    id: 'tasks.todoist',
    name: 'Todoist',
    description: 'Todoist task management service',
    category: 'tasks',
    website: 'https://todoist.com',
    docsUrl: 'https://developer.todoist.com/rest/v2',
    requiredConfig: ['apiKey'],
    optionalConfig: [],
};
/**
 * Create Todoist task provider
 */
export function createTodoistProvider(config) {
    let apiKey;
    /**
     * Make authenticated request to Todoist API
     */
    async function todoistRequest(endpoint, options = {}) {
        const response = await fetch(`${TODOIST_API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                ...options.headers,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Todoist API error (${response.status}): ${errorText}`);
        }
        // Handle 204 No Content responses
        if (response.status === 204) {
            return undefined;
        }
        return response.json();
    }
    /**
     * Convert Todoist project to ProjectData
     */
    function toProjectData(project) {
        return {
            id: project.id,
            name: project.name,
            color: project.color,
            parentId: project.parent_id,
        };
    }
    /**
     * Convert Todoist task to TaskData
     */
    function toTaskData(task) {
        let dueDate;
        if (task.due?.datetime) {
            dueDate = new Date(task.due.datetime);
        }
        else if (task.due?.date) {
            dueDate = new Date(task.due.date);
        }
        return {
            id: task.id,
            content: task.content,
            description: task.description,
            projectId: task.project_id,
            parentId: task.parent_id,
            priority: task.priority,
            dueDate,
            completed: task.is_completed,
            labels: task.labels,
            createdAt: new Date(task.created_at),
        };
    }
    /**
     * Convert Todoist comment to CommentData
     */
    function toCommentData(comment) {
        return {
            id: comment.id,
            taskId: comment.task_id || '',
            content: comment.content,
            authorId: '', // Todoist doesn't provide author_id in v2 API
            createdAt: new Date(comment.posted_at),
        };
    }
    return {
        info: todoistInfo,
        async initialize(cfg) {
            apiKey = cfg.apiKey;
            if (!apiKey) {
                throw new Error('Todoist API key is required');
            }
        },
        async healthCheck() {
            const start = Date.now();
            try {
                // Try to fetch projects to verify connectivity
                await todoistRequest('/projects');
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
            // No cleanup needed
        },
        async listProjects() {
            const projects = await todoistRequest('/projects');
            return projects.map(toProjectData);
        },
        async createTask(task) {
            const body = {
                content: task.content,
            };
            if (task.description) {
                body.description = task.description;
            }
            if (task.projectId) {
                body.project_id = task.projectId;
            }
            if (task.parentId) {
                body.parent_id = task.parentId;
            }
            if (task.priority) {
                body.priority = task.priority;
            }
            if (task.dueDate) {
                body.due_date = task.dueDate.toISOString().split('T')[0];
            }
            else if (task.dueString) {
                body.due_string = task.dueString;
            }
            if (task.labels && task.labels.length > 0) {
                body.labels = task.labels;
            }
            if (task.assigneeId) {
                body.assignee_id = task.assigneeId;
            }
            const created = await todoistRequest('/tasks', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            return toTaskData(created);
        },
        async getTask(taskId) {
            try {
                const task = await todoistRequest(`/tasks/${taskId}`);
                return toTaskData(task);
            }
            catch (error) {
                // Return null if task not found
                if (error instanceof Error && error.message.includes('404')) {
                    return null;
                }
                throw error;
            }
        },
        async updateTask(taskId, updates) {
            const body = {};
            if (updates.content !== undefined) {
                body.content = updates.content;
            }
            if (updates.description !== undefined) {
                body.description = updates.description;
            }
            if (updates.priority !== undefined) {
                body.priority = updates.priority;
            }
            if (updates.dueDate) {
                body.due_date = updates.dueDate.toISOString().split('T')[0];
            }
            else if (updates.dueString) {
                body.due_string = updates.dueString;
            }
            if (updates.labels !== undefined) {
                body.labels = updates.labels;
            }
            if (updates.assigneeId !== undefined) {
                body.assignee_id = updates.assigneeId;
            }
            await todoistRequest(`/tasks/${taskId}`, {
                method: 'POST',
                body: JSON.stringify(body),
            });
            // Fetch and return the updated task
            const updated = await todoistRequest(`/tasks/${taskId}`);
            return toTaskData(updated);
        },
        async deleteTask(taskId) {
            try {
                await todoistRequest(`/tasks/${taskId}`, {
                    method: 'DELETE',
                });
                return true;
            }
            catch (error) {
                return false;
            }
        },
        async completeTask(taskId) {
            try {
                await todoistRequest(`/tasks/${taskId}/close`, {
                    method: 'POST',
                });
                return true;
            }
            catch (error) {
                return false;
            }
        },
        async reopenTask(taskId) {
            try {
                await todoistRequest(`/tasks/${taskId}/reopen`, {
                    method: 'POST',
                });
                return true;
            }
            catch (error) {
                return false;
            }
        },
        async listTasks(options) {
            const params = new URLSearchParams();
            if (options?.projectId) {
                params.append('project_id', options.projectId);
            }
            if (options?.filter) {
                params.append('filter', options.filter);
            }
            const queryString = params.toString();
            const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
            const tasks = await todoistRequest(endpoint);
            // Filter by completed status if specified
            let filteredTasks = tasks;
            if (options?.completed !== undefined) {
                filteredTasks = tasks.filter((t) => t.is_completed === options.completed);
            }
            // Apply pagination
            const limit = options?.limit || 50;
            const offset = options?.offset || 0;
            const paginatedTasks = filteredTasks.slice(offset, offset + limit);
            return {
                items: paginatedTasks.map(toTaskData),
                total: filteredTasks.length,
                hasMore: offset + limit < filteredTasks.length,
            };
        },
        async addComment(taskId, content) {
            const body = {
                task_id: taskId,
                content,
            };
            const comment = await todoistRequest('/comments', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            return toCommentData(comment);
        },
    };
}
/**
 * Todoist provider definition
 */
export const todoistProvider = defineProvider(todoistInfo, async (config) => createTodoistProvider(config));
