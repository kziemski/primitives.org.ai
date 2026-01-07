/**
 * Forms Providers
 *
 * @packageDocumentation
 */
export { typeformInfo, typeformProvider, createTypeformProvider } from './typeform.js';
import { typeformProvider } from './typeform.js';
/**
 * Register all forms providers
 */
export function registerFormsProviders() {
    typeformProvider.register();
}
/**
 * All forms providers
 */
export const formsProviders = [typeformProvider];
