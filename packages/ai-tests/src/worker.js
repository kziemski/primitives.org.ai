/**
 * Test Worker - provides test utilities via RPC
 *
 * This worker can be deployed to Cloudflare Workers or run locally via Miniflare.
 * It exposes expect, should, assert, and a test runner via Workers RPC.
 *
 * Uses Cloudflare Workers RPC (WorkerEntrypoint, RpcTarget) for communication.
 */
import { WorkerEntrypoint, RpcTarget } from 'cloudflare:workers';
import { expect, should, assert } from './assertions.js';
import { createRunner } from './runner.js';
/**
 * Core test service - extends RpcTarget so it can be passed over RPC
 *
 * Contains all test functionality: assertions (expect, should, assert)
 * and test runner (describe, it, test, hooks)
 */
export class TestServiceCore extends RpcTarget {
    runner;
    constructor() {
        super();
        this.runner = createRunner();
    }
    expect(value, message) {
        return expect(value, message);
    }
    should(value) {
        return should(value);
    }
    get assert() {
        return assert;
    }
    describe(name, fn) {
        this.runner.describe(name, fn);
    }
    it(name, fn) {
        this.runner.it(name, fn);
    }
    test(name, fn) {
        this.runner.test(name, fn);
    }
    skip(name, fn) {
        this.runner.skip(name, fn);
    }
    only(name, fn) {
        this.runner.only(name, fn);
    }
    beforeEach(fn) {
        this.runner.beforeEach(fn);
    }
    afterEach(fn) {
        this.runner.afterEach(fn);
    }
    beforeAll(fn) {
        this.runner.beforeAll(fn);
    }
    afterAll(fn) {
        this.runner.afterAll(fn);
    }
    async run() {
        return this.runner.run();
    }
    reset() {
        this.runner.reset();
    }
    createRunner() {
        return createRunner();
    }
}
/**
 * Main test service exposed via RPC as WorkerEntrypoint
 *
 * Usage:
 *   const tests = await env.TEST.connect()
 *   tests.expect(1).to.equal(1)
 *   tests.describe('suite', () => { ... })
 *   const results = await tests.run()
 */
export class TestService extends WorkerEntrypoint {
    /**
     * Get a test service instance - returns an RpcTarget that can be used directly
     * This avoids boilerplate delegation and allows using `test` method name
     */
    connect() {
        return new TestServiceCore();
    }
}
// Export as default for WorkerEntrypoint pattern
export default TestService;
// Export aliases
export { TestService as TestWorker };
