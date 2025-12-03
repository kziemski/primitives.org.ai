/**
 * Types for ai-sandbox
 */

/**
 * Options for evaluate()
 */
export interface EvaluateOptions {
  /** Module code with exports */
  module?: string
  /** Test code using vitest (describe, expect, it in global scope) */
  tests?: string
  /** Script code to run immediately (module exports in scope) */
  script?: string
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number
  /** Environment variables to pass to the sandbox */
  env?: Record<string, string>
}

/**
 * Result from evaluate()
 */
export interface EvaluateResult {
  /** Whether execution succeeded */
  success: boolean
  /** Return value from script (if any) */
  value?: unknown
  /** Console output */
  logs: LogEntry[]
  /** Test results (if tests were provided) */
  testResults?: TestResults
  /** Error message if execution failed */
  error?: string
  /** Execution time in milliseconds */
  duration: number
}

/**
 * A log entry from console.log/warn/error
 */
export interface LogEntry {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug'
  message: string
  timestamp: number
}

/**
 * Test results from vitest-style tests
 */
export interface TestResults {
  /** Total number of tests */
  total: number
  /** Number of passed tests */
  passed: number
  /** Number of failed tests */
  failed: number
  /** Number of skipped tests */
  skipped: number
  /** Individual test results */
  tests: TestResult[]
  /** Total duration in milliseconds */
  duration: number
}

/**
 * Individual test result
 */
export interface TestResult {
  /** Test name (describe > it) */
  name: string
  /** Whether the test passed */
  passed: boolean
  /** Error message if failed */
  error?: string
  /** Test duration in milliseconds */
  duration: number
}

/**
 * Worker loader binding type (Cloudflare)
 */
export interface WorkerLoader {
  get(
    id: string,
    loader: () => Promise<WorkerCode>
  ): WorkerStub
}

/**
 * Worker code configuration
 */
export interface WorkerCode {
  mainModule: string
  modules: Record<string, string | { js?: string; cjs?: string; text?: string; json?: unknown }>
  compatibilityDate?: string
  env?: Record<string, unknown>
  globalOutbound?: null | unknown
}

/**
 * Worker stub returned by loader
 */
export interface WorkerStub {
  fetch(request: Request): Promise<Response>
}

/**
 * Environment with worker loader binding
 */
export interface SandboxEnv {
  LOADER?: WorkerLoader
}
