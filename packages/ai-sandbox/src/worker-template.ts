/**
 * Worker template for sandbox execution
 *
 * This code is stringified and sent to the worker loader.
 * It provides a vitest-compatible test runner and script execution.
 */

export function generateWorkerCode(options: {
  module?: string
  tests?: string
  script?: string
}): string {
  const { module = '', tests = '', script = '' } = options

  return `
// Sandbox Worker Entry Point
const logs = [];
const testResults = { total: 0, passed: 0, failed: 0, skipped: 0, tests: [], duration: 0 };

// Capture console output
const originalConsole = { ...console };
const captureConsole = (level) => (...args) => {
  logs.push({
    level,
    message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
    timestamp: Date.now()
  });
  originalConsole[level](...args);
};
console.log = captureConsole('log');
console.warn = captureConsole('warn');
console.error = captureConsole('error');
console.info = captureConsole('info');
console.debug = captureConsole('debug');

// Simple test framework (vitest-compatible API)
let currentDescribe = '';
const describe = (name, fn) => {
  const prev = currentDescribe;
  currentDescribe = currentDescribe ? currentDescribe + ' > ' + name : name;
  try { fn(); } finally { currentDescribe = prev; }
};

const it = (name, fn) => {
  const fullName = currentDescribe ? currentDescribe + ' > ' + name : name;
  const start = Date.now();
  testResults.total++;
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      throw new Error('Async tests not supported in sync mode');
    }
    testResults.passed++;
    testResults.tests.push({ name: fullName, passed: true, duration: Date.now() - start });
  } catch (e) {
    testResults.failed++;
    testResults.tests.push({
      name: fullName,
      passed: false,
      error: e.message || String(e),
      duration: Date.now() - start
    });
  }
};
const test = it;

// Skip helper
it.skip = (name, fn) => {
  const fullName = currentDescribe ? currentDescribe + ' > ' + name : name;
  testResults.total++;
  testResults.skipped++;
  testResults.tests.push({ name: fullName, passed: true, skipped: true, duration: 0 });
};
test.skip = it.skip;

// Expect implementation
const expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
    }
  },
  toEqual: (expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
    }
  },
  toBeTruthy: () => {
    if (!actual) throw new Error(\`Expected truthy but got \${JSON.stringify(actual)}\`);
  },
  toBeFalsy: () => {
    if (actual) throw new Error(\`Expected falsy but got \${JSON.stringify(actual)}\`);
  },
  toBeNull: () => {
    if (actual !== null) throw new Error(\`Expected null but got \${JSON.stringify(actual)}\`);
  },
  toBeUndefined: () => {
    if (actual !== undefined) throw new Error(\`Expected undefined but got \${JSON.stringify(actual)}\`);
  },
  toBeDefined: () => {
    if (actual === undefined) throw new Error('Expected defined but got undefined');
  },
  toContain: (item) => {
    if (Array.isArray(actual)) {
      if (!actual.includes(item)) throw new Error(\`Expected array to contain \${JSON.stringify(item)}\`);
    } else if (typeof actual === 'string') {
      if (!actual.includes(item)) throw new Error(\`Expected string to contain "\${item}"\`);
    } else {
      throw new Error('toContain only works on arrays and strings');
    }
  },
  toHaveLength: (length) => {
    if (actual?.length !== length) {
      throw new Error(\`Expected length \${length} but got \${actual?.length}\`);
    }
  },
  toThrow: (message) => {
    if (typeof actual !== 'function') throw new Error('toThrow expects a function');
    try {
      actual();
      throw new Error('Expected function to throw');
    } catch (e) {
      if (message && !e.message.includes(message)) {
        throw new Error(\`Expected error message to contain "\${message}" but got "\${e.message}"\`);
      }
    }
  },
  toBeGreaterThan: (n) => {
    if (!(actual > n)) throw new Error(\`Expected \${actual} to be greater than \${n}\`);
  },
  toBeLessThan: (n) => {
    if (!(actual < n)) throw new Error(\`Expected \${actual} to be less than \${n}\`);
  },
  toBeGreaterThanOrEqual: (n) => {
    if (!(actual >= n)) throw new Error(\`Expected \${actual} to be >= \${n}\`);
  },
  toBeLessThanOrEqual: (n) => {
    if (!(actual <= n)) throw new Error(\`Expected \${actual} to be <= \${n}\`);
  },
  toMatch: (pattern) => {
    if (typeof actual !== 'string') throw new Error('toMatch expects a string');
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    if (!regex.test(actual)) {
      throw new Error(\`Expected "\${actual}" to match \${pattern}\`);
    }
  },
  toBeInstanceOf: (cls) => {
    if (!(actual instanceof cls)) {
      throw new Error(\`Expected instance of \${cls.name}\`);
    }
  },
  not: {
    toBe: (expected) => {
      if (actual === expected) throw new Error(\`Expected not \${JSON.stringify(expected)}\`);
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) === JSON.stringify(expected)) {
        throw new Error(\`Expected not equal to \${JSON.stringify(expected)}\`);
      }
    },
    toBeTruthy: () => {
      if (actual) throw new Error(\`Expected not truthy\`);
    },
    toBeFalsy: () => {
      if (!actual) throw new Error(\`Expected not falsy\`);
    },
    toContain: (item) => {
      if (Array.isArray(actual) && actual.includes(item)) {
        throw new Error(\`Expected array not to contain \${JSON.stringify(item)}\`);
      }
      if (typeof actual === 'string' && actual.includes(item)) {
        throw new Error(\`Expected string not to contain "\${item}"\`);
      }
    },
    toThrow: () => {
      if (typeof actual !== 'function') throw new Error('toThrow expects a function');
      try {
        actual();
      } catch (e) {
        throw new Error('Expected function not to throw');
      }
    },
  },
});

// Module exports container
let moduleExports = {};

// Execute module code
${module ? `
try {
  const moduleCode = ${JSON.stringify(module)};
  const moduleFunc = new Function('exports', moduleCode + '; return exports;');
  moduleExports = moduleFunc({});
} catch (e) {
  console.error('Module error:', e.message);
}
` : ''}

// Execute script with module exports in scope
let scriptResult = undefined;
${script ? `
try {
  const scriptCode = ${JSON.stringify(script)};
  const exportNames = Object.keys(moduleExports);
  const exportValues = Object.values(moduleExports);
  const scriptFunc = new Function(...exportNames, scriptCode);
  scriptResult = scriptFunc(...exportValues);
} catch (e) {
  console.error('Script error:', e.message);
  throw e;
}
` : ''}

// Execute tests with module exports in scope
${tests ? `
try {
  const testCode = ${JSON.stringify(tests)};
  const exportNames = Object.keys(moduleExports);
  const exportValues = Object.values(moduleExports);
  const testFunc = new Function('describe', 'it', 'test', 'expect', ...exportNames, testCode);
  const testStart = Date.now();
  testFunc(describe, it, test, expect, ...exportValues);
  testResults.duration = Date.now() - testStart;
} catch (e) {
  console.error('Test error:', e.message);
}
` : ''}

export default {
  async fetch(request) {
    return Response.json({
      success: testResults.failed === 0,
      value: scriptResult,
      logs,
      testResults: ${tests ? 'testResults' : 'undefined'},
      duration: 0
    });
  }
};
`
}
