/**
 * Task Providers
 *
 * @packageDocumentation
 */
export { todoistInfo, todoistProvider, createTodoistProvider } from './todoist.js';
import { todoistProvider } from './todoist.js';
/**
 * Register all task providers
 */
export function registerTaskProviders() {
    todoistProvider.register();
}
/**
 * All task providers
 */
export const taskProviders = [todoistProvider];
