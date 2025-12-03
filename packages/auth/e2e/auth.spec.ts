/**
 * E2E Auth Tests
 *
 * Tests client-side auth interactivity with Playwright
 */

import { test, expect, Page } from '@playwright/test'

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Wait for output element to contain expected text (not "Loading...")
 */
async function waitForOutput(page: Page, expectedContent: string, timeout = 10000) {
  await page.waitForFunction(
    (expected: string) => {
      const el = document.getElementById('output')
      if (!el) return false
      const text = el.textContent || ''
      return text !== 'Loading...' && text.includes(expected)
    },
    expectedContent,
    { timeout }
  )
  return page.locator('#output').textContent()
}

/**
 * Click a button and wait for output to update
 */
async function clickAndWait(page: Page, buttonId: string, expectedContent: string) {
  await page.click(buttonId)
  return waitForOutput(page, expectedContent)
}

// =============================================================================
// User API Tests
// =============================================================================

test.describe('$.user()', () => {
  test('should return null when not authenticated', async ({ page }) => {
    await page.goto('/')

    // Wait for initial auto-load of $.user()
    const output = await waitForOutput(page, '$.user()')

    expect(output).toContain('$.user()')
    expect(output).toContain('null')
  })

  test('should return user after login', async ({ page }) => {
    // Login via mock endpoint
    await page.goto('/mock/login')
    await expect(page).toHaveURL('/')

    // Wait for user data to load
    const output = await waitForOutput(page, 'e2e@example.com')

    expect(output).toContain('e2e@example.com')
    expect(output).toContain('E2E')
  })

  test('isAuthenticated returns false when not logged in', async ({ page }) => {
    await page.goto('/')
    await waitForOutput(page, '$.user()') // Wait for initial load

    const output = await clickAndWait(page, '#btn-authenticated', 'isAuthenticated')

    expect(output).toContain('false')
  })

  test('isAuthenticated returns true when logged in', async ({ page }) => {
    await page.goto('/mock/login')
    await expect(page).toHaveURL('/')
    await waitForOutput(page, 'e2e@example.com') // Wait for initial load

    const output = await clickAndWait(page, '#btn-authenticated', 'isAuthenticated')

    expect(output).toContain('true')
  })
})

// =============================================================================
// Session API Tests
// =============================================================================

test.describe('$.session()', () => {
  test('should return session data with sessionId', async ({ page }) => {
    await page.goto('/')
    await waitForOutput(page, '$.user()') // Wait for initial load

    const output = await clickAndWait(page, '#btn-session', 'sessionId')

    expect(output).toContain('$.session()')
    expect(output).toContain('sess_')
  })

  test('should include CSRF token', async ({ page }) => {
    await page.goto('/')
    await waitForOutput(page, '$.user()')

    const output = await clickAndWait(page, '#btn-session', 'csrfToken')

    expect(output).toContain('csrfToken')
  })

  test('session persists across page navigations', async ({ page }) => {
    await page.goto('/')
    await waitForOutput(page, '$.user()')

    // Get session ID
    await page.click('#btn-session')
    const output1 = await waitForOutput(page, 'sessionId')
    const sessionIdMatch = output1?.match(/sess_[a-f0-9]+/)
    expect(sessionIdMatch).toBeTruthy()
    const sessionId = sessionIdMatch![0]

    // Navigate away and back
    await page.goto('/settings-test')
    await page.goto('/')
    await waitForOutput(page, '$.user()')

    // Session ID should be the same
    const output2 = await clickAndWait(page, '#btn-session', 'sessionId')
    expect(output2).toContain(sessionId)
  })
})

// =============================================================================
// Settings API Tests
// =============================================================================

test.describe('$.settings()', () => {
  test('should return settings with anonymousId', async ({ page }) => {
    await page.goto('/settings-test')

    const output = await waitForOutput(page, 'anonymousId')

    expect(output).toContain('$.settings()')
    expect(output).toContain('anonymousId')
  })

  test('should update theme to dark', async ({ page }) => {
    await page.goto('/settings-test')
    await waitForOutput(page, 'anonymousId')

    const output = await clickAndWait(page, '#btn-dark', 'setTheme')

    expect(output).toContain('"theme"')
    expect(output).toContain('"dark"')
  })

  test('should update theme to light', async ({ page }) => {
    await page.goto('/settings-test')
    await waitForOutput(page, 'anonymousId')

    const output = await clickAndWait(page, '#btn-light', 'setTheme')

    expect(output).toContain('"theme"')
    expect(output).toContain('"light"')
  })

  test('theme persists across navigations', async ({ page }) => {
    await page.goto('/settings-test')
    await waitForOutput(page, 'anonymousId')

    // Set theme to dark
    await clickAndWait(page, '#btn-dark', 'setTheme')

    // Navigate away and back
    await page.goto('/')
    await page.goto('/settings-test')

    // Theme should still be dark
    const output = await waitForOutput(page, 'anonymousId')
    expect(output).toContain('"theme"')
    expect(output).toContain('"dark"')
  })

  test('anonymousId persists across navigations', async ({ page }) => {
    await page.goto('/settings-test')
    const output1 = await waitForOutput(page, 'anonymousId')

    // Extract anonymousId
    const anonIdMatch = output1?.match(/"anonymousId":\s*"([^"]+)"/)
    expect(anonIdMatch).toBeTruthy()
    const anonymousId = anonIdMatch![1]

    // Navigate away and back
    await page.goto('/')
    await page.goto('/settings-test')

    // Should have same anonymousId
    const output2 = await waitForOutput(page, 'anonymousId')
    expect(output2).toContain(anonymousId)
  })
})

// =============================================================================
// CSRF Protection Tests
// =============================================================================

test.describe('CSRF Protection', () => {
  test('server and client CSRF tokens match', async ({ page }) => {
    await page.goto('/csrf-test')

    // Wait for client to load CSRF token
    await page.waitForFunction(() => {
      const el = document.getElementById('csrf-client')
      return el && el.textContent !== 'Loading...'
    }, { timeout: 10000 })

    const serverToken = await page.locator('#csrf-server').textContent()
    const clientToken = await page.locator('#csrf-client').textContent()

    expect(serverToken).toBeTruthy()
    expect(serverToken!.length).toBeGreaterThan(10)
    expect(clientToken).toBe(serverToken)
  })

  test('POST without CSRF token is rejected', async ({ page }) => {
    await page.goto('/csrf-test')

    // Wait for CSRF token to load
    await page.waitForFunction(() => {
      const el = document.getElementById('csrf-client')
      return el && el.textContent !== 'Loading...'
    }, { timeout: 10000 })

    await page.click('#btn-post-without')

    // Wait for response
    const output = await waitForOutput(page, 'Status:')

    expect(output).toContain('Status: 403')
    expect(output).toContain('CSRF validation failed')
  })

  test('POST with valid CSRF token succeeds', async ({ page }) => {
    await page.goto('/csrf-test')

    // Wait for CSRF token to load
    await page.waitForFunction(() => {
      const el = document.getElementById('csrf-client')
      return el && el.textContent !== 'Loading...'
    }, { timeout: 10000 })

    await page.click('#btn-post-with')

    // Wait for response
    const output = await waitForOutput(page, 'Status:')

    expect(output).toContain('Status: 200')
    expect(output).toContain('CSRF validation passed')
  })
})

// =============================================================================
// Login/Logout Flow Tests
// =============================================================================

test.describe('Login/Logout Flow', () => {
  test('full login flow', async ({ page }) => {
    // Start unauthenticated
    await page.goto('/')
    await waitForOutput(page, 'null')

    // Click login (redirects to mock login)
    await page.click('#btn-login')

    // Should redirect through mock login back to home
    await expect(page).toHaveURL('/')

    // Now should be authenticated
    const output = await waitForOutput(page, 'e2e@example.com')
    expect(output).toContain('e2e@example.com')
  })

  test('logout via API clears user', async ({ page }) => {
    // First login
    await page.goto('/mock/login')
    await expect(page).toHaveURL('/')
    await waitForOutput(page, 'e2e@example.com')

    // Verify authenticated
    let output = await clickAndWait(page, '#btn-authenticated', 'isAuthenticated')
    expect(output).toContain('true')

    // Logout via API
    output = await clickAndWait(page, '#btn-logout', 'logout')
    expect(output).toContain('success')
  })
})

// =============================================================================
// Cookie Persistence Tests
// =============================================================================

test.describe('Cookie Persistence', () => {
  test('auth state persists across page reloads', async ({ page }) => {
    // Login
    await page.goto('/mock/login')
    await expect(page).toHaveURL('/')
    await waitForOutput(page, 'e2e@example.com')

    // Reload page
    await page.reload()

    // Should still be authenticated
    const output = await waitForOutput(page, 'e2e@example.com')
    expect(output).toContain('e2e@example.com')
  })

  test('session persists across different pages', async ({ page }) => {
    await page.goto('/')
    await waitForOutput(page, '$.user()')

    // Get session
    await page.click('#btn-session')
    const output1 = await waitForOutput(page, 'sessionId')
    const sessionIdMatch = output1?.match(/sess_[a-f0-9]+/)
    const sessionId = sessionIdMatch![0]

    // Go to different pages
    await page.goto('/settings-test')
    await page.goto('/csrf-test')
    await page.goto('/')
    await waitForOutput(page, '$.user()')

    // Session should be same
    const output2 = await clickAndWait(page, '#btn-session', 'sessionId')
    expect(output2).toContain(sessionId)
  })
})

// =============================================================================
// Server-Client Consistency Tests
// =============================================================================

test.describe('Server-Client Consistency', () => {
  test('server and client session IDs match', async ({ page }) => {
    await page.goto('/')

    // Extract server session ID from rendered HTML
    const serverState = await page.locator('#server-state pre').textContent()
    const serverSessionMatch = serverState?.match(/sessionId: (sess_[a-f0-9]+)/)
    expect(serverSessionMatch).toBeTruthy()
    const serverSessionId = serverSessionMatch![1]

    // Get client session ID
    await waitForOutput(page, '$.user()')
    const output = await clickAndWait(page, '#btn-session', 'sessionId')
    expect(output).toContain(serverSessionId)
  })

  test('server and client anonymousId match', async ({ page }) => {
    await page.goto('/')

    // Extract server anonymousId
    const serverState = await page.locator('#server-state pre').textContent()
    const serverAnonMatch = serverState?.match(/anonymousId: ([a-f0-9-]+)/)
    expect(serverAnonMatch).toBeTruthy()
    const serverAnonId = serverAnonMatch![1]

    // Get client settings
    await waitForOutput(page, '$.user()')
    const output = await clickAndWait(page, '#btn-settings', 'anonymousId')
    expect(output).toContain(serverAnonId)
  })
})
