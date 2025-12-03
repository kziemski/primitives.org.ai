/**
 * Client-side Auth Helpers
 *
 * Provides JavaScript code for:
 * - $.auth.login() - Redirect to login
 * - $.auth.logout() - Logout
 * - $.auth.user() - Get current user
 * - $.auth.session() - Get session info
 * - $.auth.isAuthenticated() - Check auth status
 * - $.auth.onAuthChange() - Listen for auth changes
 */

export interface ClientAuthConfig {
  /** Base URL for auth endpoints */
  authUrl?: string
  /** Default redirect after login */
  defaultRedirect?: string
}

/**
 * Generate the client-side auth script
 */
export function generateAuthScript(config: ClientAuthConfig = {}): string {
  const authUrl = config.authUrl ?? '/auth'
  const defaultRedirect = config.defaultRedirect ?? '/'

  return `
/* $.auth - Authentication helpers */
(function() {
  'use strict';

  var AUTH_URL = '${authUrl}';
  var DEFAULT_REDIRECT = '${defaultRedirect}';

  // Cache for user data
  var cachedUser = null;
  var cachedSession = null;
  var authListeners = [];

  // Helper to make API calls
  function fetchJSON(url, options) {
    return fetch(url, Object.assign({
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    }, options)).then(function(r) { return r.json(); });
  }

  // Notify auth change listeners
  function notifyAuthChange(user) {
    authListeners.forEach(function(fn) {
      try { fn(user); } catch(e) { console.error('Auth listener error:', e); }
    });
  }

  // Auth namespace
  var auth = {
    /**
     * Redirect to login
     * @param {Object} options - Login options
     * @param {string} options.returnTo - URL to redirect after login
     * @param {string} options.provider - SSO provider (e.g., 'GoogleOAuth')
     * @param {string} options.email - Pre-fill email
     * @param {string} options.screen - 'sign-in' or 'sign-up'
     */
    login: function(options) {
      options = options || {};
      var params = new URLSearchParams();

      if (options.returnTo) params.set('return_to', options.returnTo);
      else params.set('return_to', window.location.href);

      if (options.provider) params.set('provider', options.provider);
      if (options.email) params.set('login_hint', options.email);
      if (options.screen) params.set('screen_hint', options.screen);
      if (options.organizationId) params.set('organization_id', options.organizationId);

      window.location.href = AUTH_URL + '/login?' + params.toString();
    },

    /**
     * Redirect to signup
     * @param {Object} options - Signup options
     */
    signup: function(options) {
      options = options || {};
      options.screen = 'sign-up';
      auth.login(options);
    },

    /**
     * Logout
     * @param {Object} options - Logout options
     * @param {string} options.returnTo - URL to redirect after logout
     * @param {boolean} options.api - Use API logout (no redirect)
     */
    logout: function(options) {
      options = options || {};

      if (options.api) {
        return fetchJSON(AUTH_URL + '/logout', { method: 'POST' })
          .then(function() {
            cachedUser = null;
            notifyAuthChange(null);
            return { success: true };
          });
      }

      var params = new URLSearchParams();
      if (options.returnTo) params.set('return_to', options.returnTo);
      else params.set('return_to', DEFAULT_REDIRECT);

      window.location.href = AUTH_URL + '/logout?' + params.toString();
    },

    /**
     * Get current user
     * @param {Object} options - Options
     * @param {boolean} options.fresh - Skip cache
     * @returns {Promise<Object|null>} User object or null
     */
    user: function(options) {
      options = options || {};

      if (cachedUser && !options.fresh) {
        return Promise.resolve(cachedUser);
      }

      return fetchJSON(AUTH_URL + '/user')
        .then(function(data) {
          cachedUser = data.user;
          return data.user;
        });
    },

    /**
     * Get session info
     * @param {Object} options - Options
     * @param {boolean} options.fresh - Skip cache
     * @returns {Promise<Object>} Session object
     */
    session: function(options) {
      options = options || {};

      if (cachedSession && !options.fresh) {
        return Promise.resolve(cachedSession);
      }

      return fetchJSON(AUTH_URL + '/session')
        .then(function(data) {
          cachedSession = data;
          return data;
        });
    },

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>}
     */
    isAuthenticated: function() {
      return auth.session().then(function(s) {
        return s.isAuthenticated;
      });
    },

    /**
     * Get CSRF token
     * @returns {Promise<string>}
     */
    csrfToken: function() {
      return auth.session().then(function(s) {
        return s.csrfToken;
      });
    },

    /**
     * Get anonymous ID
     * @returns {Promise<string>}
     */
    anonymousId: function() {
      return auth.session().then(function(s) {
        return s.anonymousId;
      });
    },

    /**
     * Listen for auth changes
     * @param {Function} callback - Called with user object (or null)
     * @returns {Function} Unsubscribe function
     */
    onAuthChange: function(callback) {
      authListeners.push(callback);

      // Immediately call with current state
      auth.user().then(callback);

      return function() {
        var idx = authListeners.indexOf(callback);
        if (idx !== -1) authListeners.splice(idx, 1);
      };
    },

    /**
     * Get/set user settings
     * @param {Object} settings - Settings to update (optional)
     * @returns {Promise<Object>} Current settings
     */
    settings: function(settings) {
      if (settings) {
        return fetchJSON(AUTH_URL + '/settings', {
          method: 'POST',
          body: JSON.stringify(settings)
        }).then(function(data) {
          return data.settings;
        });
      }

      return fetchJSON(AUTH_URL + '/settings');
    },

    /**
     * Set theme preference
     * @param {'light'|'dark'|'system'} theme
     */
    setTheme: function(theme) {
      return auth.settings({ theme: theme });
    },

    /**
     * Update consent preferences
     * @param {Object} consent - Consent flags
     */
    setConsent: function(consent) {
      return auth.settings({ consent: consent });
    },

    /**
     * Make authenticated API request
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     */
    fetch: function(url, options) {
      options = options || {};
      options.credentials = 'same-origin';

      // Add CSRF token for non-GET requests
      var method = (options.method || 'GET').toUpperCase();
      if (method !== 'GET' && method !== 'HEAD') {
        return auth.csrfToken().then(function(token) {
          options.headers = options.headers || {};
          options.headers['X-CSRF-Token'] = token;
          return fetch(url, options);
        });
      }

      return fetch(url, options);
    }
  };

  // Expose on window.$
  window.$ = window.$ || {};
  window.$.auth = auth;

  // Also expose as standalone for convenience
  window.auth = auth;

  // Initialize - preload session
  auth.session();
})();
`.trim()
}

/**
 * Generate a minimal auth script (smaller footprint)
 */
export function generateMinimalAuthScript(config: ClientAuthConfig = {}): string {
  const authUrl = config.authUrl ?? '/auth'

  return `
/* $.auth minimal */
(function(){
  var A='${authUrl}';
  function f(u,o){return fetch(u,Object.assign({credentials:'same-origin',headers:{'Content-Type':'application/json'}},o)).then(function(r){return r.json()})}
  var a={
    login:function(o){o=o||{};var p=new URLSearchParams;p.set('return_to',o.returnTo||location.href);if(o.provider)p.set('provider',o.provider);location.href=A+'/login?'+p},
    logout:function(o){o=o||{};if(o.api)return f(A+'/logout',{method:'POST'});location.href=A+'/logout?return_to='+(o.returnTo||'/')},
    user:function(){return f(A+'/user').then(function(d){return d.user})},
    session:function(){return f(A+'/session')},
    isAuthenticated:function(){return a.session().then(function(s){return s.isAuthenticated})}
  };
  (window.$=window.$||{}).auth=a;
})();
`.trim()
}
