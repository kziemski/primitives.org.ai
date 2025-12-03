/**
 * E2E Test Server
 *
 * A Hono server that serves HTML pages with client-side auth
 * for Playwright testing.
 */

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { authMiddleware, getAuth, getCookieManager } from '../src/middleware.js'
import { createAuthRoutes } from '../src/routes.js'
import { generateAuthScript } from '../src/client.js'
import { seal } from '../src/cookies.js'
import type { AuthConfig, TokenData, WorkOSUser } from '../src/types.js'

// =============================================================================
// Configuration
// =============================================================================

const PORT = 3847
const SECRET = 'e2e-test-secret-key-that-is-at-least-32-characters-long'

const config: AuthConfig = {
  workos: {
    apiKey: 'test_api_key',
    clientId: 'test_client_id',
    callbackUrl: `http://localhost:${PORT}/auth/callback`,
  },
  cookies: {
    secret: SECRET,
    secure: false, // HTTP for testing
    sameSite: 'lax',
  },
}

// =============================================================================
// Mock User Data
// =============================================================================

const mockUser: WorkOSUser = {
  id: 'user_e2e_123',
  email: 'e2e@example.com',
  emailVerified: true,
  firstName: 'E2E',
  lastName: 'Test',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockTokenData: TokenData = {
  accessToken: 'e2e_access_token',
  refreshToken: 'e2e_refresh_token',
  expiresAt: Date.now() + 3600000,
  user: mockUser,
}

// =============================================================================
// HTML Templates
// =============================================================================

function htmlPage(title: string, body: string, script = '') {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; }
    button { padding: 8px 16px; margin: 4px; cursor: pointer; }
    .result { margin-top: 20px; }
    #output { white-space: pre-wrap; }
  </style>
</head>
<body>
  ${body}
  <script>
${generateAuthScript({ authUrl: '/auth' })}
  </script>
  <script>
${script}
  </script>
</body>
</html>`
}

// =============================================================================
// App
// =============================================================================

const app = new Hono()

// Auth middleware
app.use('*', authMiddleware({ config, excludePaths: ['/health', '/favicon.ico'] }))

// Mock login - MUST be before mounting auth routes so it takes precedence
app.get('/auth/login', (c) => {
  // Redirect to mock login for e2e tests (intercepts real WorkOS redirect)
  return c.redirect('/mock/login')
})

// Mount auth routes
const authRoutes = createAuthRoutes({ config })
app.route('/auth', authRoutes)

// =============================================================================
// Test Pages
// =============================================================================

// Home page - displays auth state
app.get('/', (c) => {
  const auth = getAuth(c)
  return c.html(htmlPage('Auth E2E Test', `
    <h1>Auth E2E Test</h1>
    <div id="server-state">
      <h2>Server State</h2>
      <pre>isAuthenticated: ${auth.isAuthenticated}
user: ${auth.token?.user ? JSON.stringify(auth.token.user, null, 2) : 'null'}
sessionId: ${auth.session.sessionId}
anonymousId: ${auth.settings.anonymousId}</pre>
    </div>
    <div class="result">
      <h2>Client State</h2>
      <pre id="output">Loading...</pre>
    </div>
    <div>
      <button id="btn-user">$.user()</button>
      <button id="btn-session">$.session()</button>
      <button id="btn-settings">$.settings()</button>
      <button id="btn-authenticated">isAuthenticated()</button>
      <button id="btn-login">Login</button>
      <button id="btn-logout">Logout (API)</button>
    </div>
  `, `
    const output = document.getElementById('output');

    async function showResult(label, promise) {
      try {
        const result = await promise;
        output.textContent = label + ':\\n' + JSON.stringify(result, null, 2);
      } catch (e) {
        output.textContent = label + ' ERROR:\\n' + e.message;
      }
    }

    document.getElementById('btn-user').onclick = () => showResult('$.user()', $.auth.user());
    document.getElementById('btn-session').onclick = () => showResult('$.session()', $.auth.session());
    document.getElementById('btn-settings').onclick = () => showResult('$.settings()', $.auth.settings());
    document.getElementById('btn-authenticated').onclick = () => showResult('isAuthenticated', $.auth.isAuthenticated());
    document.getElementById('btn-login').onclick = () => $.auth.login();
    document.getElementById('btn-logout').onclick = () => showResult('logout', $.auth.logout({ api: true }));

    // Initial load
    showResult('$.user()', $.auth.user());
  `))
})

// Test page for settings updates
app.get('/settings-test', (c) => {
  return c.html(htmlPage('Settings Test', `
    <h1>Settings Test</h1>
    <div>
      <button id="btn-get">Get Settings</button>
      <button id="btn-dark">Set Dark Theme</button>
      <button id="btn-light">Set Light Theme</button>
      <button id="btn-system">Set System Theme</button>
    </div>
    <div class="result">
      <pre id="output">Loading...</pre>
    </div>
  `, `
    const output = document.getElementById('output');

    async function showResult(label, promise) {
      try {
        const result = await promise;
        output.textContent = label + ':\\n' + JSON.stringify(result, null, 2);
      } catch (e) {
        output.textContent = label + ' ERROR:\\n' + e.message;
      }
    }

    document.getElementById('btn-get').onclick = () => showResult('$.settings()', $.auth.settings());
    document.getElementById('btn-dark').onclick = () => showResult('setTheme(dark)', $.auth.settings({ theme: 'dark' }));
    document.getElementById('btn-light').onclick = () => showResult('setTheme(light)', $.auth.settings({ theme: 'light' }));
    document.getElementById('btn-system').onclick = () => showResult('setTheme(system)', $.auth.settings({ theme: 'system' }));

    showResult('$.settings()', $.auth.settings());
  `))
})

// Test page for CSRF
app.get('/csrf-test', (c) => {
  const auth = getAuth(c)
  return c.html(htmlPage('CSRF Test', `
    <h1>CSRF Test</h1>
    <p>CSRF Token (server): <code id="csrf-server">${auth.session.csrfToken}</code></p>
    <p>CSRF Token (client): <code id="csrf-client">Loading...</code></p>
    <div>
      <button id="btn-post-without">POST without CSRF</button>
      <button id="btn-post-with">POST with CSRF</button>
    </div>
    <div class="result">
      <pre id="output"></pre>
    </div>
  `, `
    const output = document.getElementById('output');

    $.auth.session().then(s => {
      document.getElementById('csrf-client').textContent = s.csrfToken;
    });

    async function testPost(withCsrf) {
      const headers = { 'Content-Type': 'application/json' };
      if (withCsrf) {
        const session = await $.auth.session();
        headers['X-CSRF-Token'] = session.csrfToken;
      }

      try {
        const res = await fetch('/api/protected', {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ test: true })
        });
        const data = await res.json();
        output.textContent = 'Status: ' + res.status + '\\n' + JSON.stringify(data, null, 2);
      } catch (e) {
        output.textContent = 'ERROR: ' + e.message;
      }
    }

    document.getElementById('btn-post-without').onclick = () => testPost(false);
    document.getElementById('btn-post-with').onclick = () => testPost(true);
  `))
})

// Protected API endpoint for CSRF testing
import { csrfProtection } from '../src/middleware.js'

app.post('/api/protected', csrfProtection(), (c) => {
  return c.json({ success: true, message: 'CSRF validation passed!' })
})

// =============================================================================
// Mock Auth Endpoints (for E2E testing without real WorkOS)
// =============================================================================

// Mock login - simulates successful auth by setting token cookie
app.get('/mock/login', async (c) => {
  const cookieManager = getCookieManager(c)
  await cookieManager.setToken(mockTokenData)
  const cookies = await cookieManager.commit()

  for (const cookie of cookies) {
    c.header('Set-Cookie', cookie, { append: true })
  }

  return c.redirect('/')
})

// =============================================================================
// Health Check
// =============================================================================

app.get('/health', (c) => c.json({ status: 'ok' }))

// =============================================================================
// Start Server
// =============================================================================

console.log(`E2E Test server running on http://localhost:${PORT}`)

serve({
  fetch: app.fetch,
  port: PORT,
})
