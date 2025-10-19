// Background service worker for OAuth 2.0 and API calls

console.log('Background script loaded');

// Store the Client ID (in memory only)
let clientId = null;

// Token cache will be stored in chrome.storage.local for persistence across service worker restarts
// This ensures the user doesn't have to re-authenticate every time the service worker is terminated

// Handle extension installation
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    console.log('Extension installed - user will be prompted for authorization on first use');
    // Set initial authorization state
    chrome.storage.local.set({
      isFirstInstall: true,
      isAuthorized: false,
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.action);

  if (request.action === 'ping') {
    console.log('Ping received');
    sendResponse({ success: true, message: 'pong' });
    return true;
  }

  if (request.action === 'setClientId') {
    clientId = request.clientId;
    console.log('Client ID stored');
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'createCalendarEvent') {
    console.log('Creating calendar event');

    // Send status updates to popup
    const sendStatus = status => {
      chrome.runtime.sendMessage({ action: 'statusUpdate', status: status });
    };

    createCalendarEvent(
      request.eventData,
      request.clientId,
      request.calendarId || 'primary',
      request.forceAuth,
      sendStatus
    )
      .then(result => {
        console.log('Event created successfully:', result);
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.log('Error creating event:', error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'clearToken') {
    console.log('Clearing cached token');
    chrome.storage.local.remove(['cachedAccessToken', 'tokenExpiryTime'], () => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'requestAuthorization') {
    console.log('Requesting authorization');

    // Request authorization (interactive)
    getAccessToken(request.clientId, true)
      .then(token => {
        console.log('Authorization successful');
        sendResponse({ success: true, token: token });
      })
      .catch(error => {
        console.log('Authorization not completed:', error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'getCalendars') {
    console.log('Getting user calendars');

    getCalendarList(request.clientId)
      .then(calendars => {
        console.log('Calendars retrieved:', calendars);
        sendResponse({ success: true, calendars: calendars });
      })
      .catch(error => {
        console.log('Could not get calendars:', error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

// Check if cached token is still valid (reads from storage)
async function isTokenValid() {
  const stored = await chrome.storage.local.get(['cachedAccessToken', 'tokenExpiryTime']);

  if (!stored.cachedAccessToken) {
    return false;
  }

  if (!stored.tokenExpiryTime) {
    return false;
  }

  // Check if token has expired (with 5 minute buffer)
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  if (now >= stored.tokenExpiryTime - bufferTime) {
    console.log('Token expired or about to expire');
    return false;
  }

  console.log('Using cached token');
  return true;
}

// Get user's email from Google (for login_hint)
async function getUserEmail(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.log('Failed to get user info:', response.status);
      return null;
    }

    const data = await response.json();
    return data.email || null;
  } catch (error) {
    console.log('Could not fetch user email (optional):', error.message);
    return null;
  }
}

// Get access token (from cache or by authenticating)
async function getAccessToken(clientId, forceAuth = false, sendStatus = null) {
  // If forcing authentication, clear cache
  if (forceAuth) {
    console.log('Forcing new authentication');
    await chrome.storage.local.remove(['cachedAccessToken', 'tokenExpiryTime']);
  }

  // Check if we have a valid cached token
  if (await isTokenValid()) {
    console.log('Using cached access token');
    const stored = await chrome.storage.local.get(['cachedAccessToken']);
    return stored.cachedAccessToken;
  }

  // Need to authenticate
  // First try silent authentication (non-interactive) if not forcing
  if (!forceAuth) {
    console.log('Attempting silent authentication...');
    try {
      const tokenData = await authenticateWithOAuth2(clientId, false); // false = non-interactive

      // Cache the token in storage (persists across service worker restarts)
      const expiryTime = Date.now() + tokenData.expiresIn * 1000;
      await chrome.storage.local.set({
        cachedAccessToken: tokenData.accessToken,
        tokenExpiryTime: expiryTime,
      });

      console.log('✓ Silent authentication successful, token cached');
      return tokenData.accessToken;
    } catch (error) {
      // Silent auth failed - this is expected when user needs to interact
      console.log(
        'Silent authentication not available (expected), falling back to interactive auth'
      );
      // Fall through to interactive authentication below
    }
  }

  // Silent auth failed or forceAuth was requested - use interactive authentication
  console.log('Authenticating with OAuth 2.0 (interactive)...');
  if (sendStatus) sendStatus('Authenticating...');

  const tokenData = await authenticateWithOAuth2(clientId, true); // true = interactive

  // Cache the token in storage (persists across service worker restarts)
  const expiryTime = Date.now() + tokenData.expiresIn * 1000;
  await chrome.storage.local.set({
    cachedAccessToken: tokenData.accessToken,
    tokenExpiryTime: expiryTime,
  });

  console.log('Token cached to storage, expires in', tokenData.expiresIn, 'seconds');

  // Try to get and store user email for future login_hint (helps avoid account selection)
  try {
    const userEmail = await getUserEmail(tokenData.accessToken);
    if (userEmail) {
      await chrome.storage.local.set({ userEmail: userEmail });
      console.log('Stored user email for login_hint:', userEmail);
    }
  } catch (error) {
    console.log('Could not fetch user email (optional, non-critical):', error.message);
  }

  return tokenData.accessToken;
}

// OAuth 2.0 authentication using web flow
// interactive: true = show UI, false = silent (prompt=none)
async function authenticateWithOAuth2(clientId, interactive = true) {
  const redirectUri = chrome.identity.getRedirectURL();
  console.log('Redirect URI:', redirectUri);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set(
    'scope',
    'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email'
  );

  // Try to get stored user email to help with auth (reduces account selection prompts)
  const stored = await chrome.storage.local.get(['userEmail']);
  if (stored.userEmail) {
    authUrl.searchParams.set('login_hint', stored.userEmail);
    console.log('Using login_hint:', stored.userEmail);
  }

  // For non-interactive (silent) authentication, use prompt=none
  // This will silently get a new token if the user is signed in and has already granted consent
  if (!interactive) {
    authUrl.searchParams.set('prompt', 'none');
    console.log('Silent authentication mode');
  } else {
    console.log('Interactive authentication mode');
  }

  console.log('Auth URL:', authUrl.toString());

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: interactive,
      },
      redirectUrl => {
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message;
          // Both silent auth failure and user cancellation are expected user flows
          if (!interactive) {
            console.log('Silent auth unavailable:', errorMsg);
          } else {
            console.log('Authentication not completed:', errorMsg);
          }
          reject(new Error(errorMsg));
          return;
        }

        if (!redirectUrl) {
          const errorMsg = 'No redirect URL received';
          console.log(errorMsg);
          reject(new Error(errorMsg));
          return;
        }

        console.log('Redirect URL received:', redirectUrl.substring(0, 100) + '...');

        // Extract access token and expiry from URL fragment
        try {
          const url = new URL(redirectUrl);
          const fragment = url.hash.substring(1); // Remove #
          const params = new URLSearchParams(fragment);

          // Check for errors (especially important for silent auth)
          const error = params.get('error');
          if (error) {
            const errorDesc = params.get('error_description') || error;
            // Both silent auth and interactive cancellation are expected user flows
            if (!interactive) {
              console.log('Silent auth not available:', error);
            } else {
              console.log('Authentication not completed:', error, '-', errorDesc);
            }
            reject(new Error(`OAuth error: ${error} - ${errorDesc}`));
            return;
          }

          const accessToken = params.get('access_token');
          const expiresIn = parseInt(params.get('expires_in') || '3600', 10);

          if (!accessToken) {
            reject(new Error('No access token in response'));
            return;
          }

          console.log('Access token received, expires in', expiresIn, 'seconds');
          resolve({ accessToken, expiresIn });
        } catch (error) {
          console.log('Error parsing redirect URL:', error.message);
          reject(error);
        }
      }
    );
  });
}

// Get list of user's calendars
async function getCalendarList(clientId) {
  try {
    // Get access token
    const accessToken = await getAccessToken(clientId, false);

    console.log('Fetching calendar list...');

    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If auth error, try with fresh token
      if (response.status === 401 || response.status === 403) {
        console.log('Authentication issue, retrying with fresh token...');
        const newAccessToken = await getAccessToken(clientId, true);

        const retryResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!retryResponse.ok) {
          const retryError = await retryResponse.text();
          throw new Error(`Failed to get calendar list: ${retryResponse.status} - ${retryError}`);
        }

        const retryData = await retryResponse.json();
        return retryData.items || [];
      }

      const errorText = await response.text();
      throw new Error(`Failed to get calendar list: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Calendar list retrieved:', data.items?.length, 'calendars');

    return data.items || [];
  } catch (error) {
    console.log('Error getting calendar list:', error.message);
    throw error;
  }
}

// Create calendar event
async function createCalendarEvent(
  eventData,
  clientId,
  calendarId = 'primary',
  forceAuth = false,
  sendStatus = null
) {
  try {
    if (!clientId) {
      throw new Error('No Client ID provided. Please set up your OAuth credentials.');
    }

    // Get access token (cached or new)
    const accessToken = await getAccessToken(clientId, forceAuth, sendStatus);

    console.log('Making API request to Google Calendar...');
    console.log('Using calendar ID:', calendarId);
    if (sendStatus) sendStatus('Adding to Calendar...');

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      // Check if it's an auth error (401 or 403)
      if (response.status === 401 || response.status === 403) {
        console.log('Authentication issue detected, checking token validity...');

        try {
          const errorData = await response.json();

          // Check if it's a permission/auth issue
          const errorMessage = errorData.error?.message || '';
          if (
            errorMessage.includes('Invalid Credentials') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('insufficient') ||
            response.status === 401
          ) {
            // If we weren't forcing auth, try once more with fresh token
            if (!forceAuth) {
              console.log('Token might be invalid, retrying with fresh authentication...');
              return await createCalendarEvent(eventData, clientId, calendarId, true, sendStatus);
            }
          }

          throw new Error(errorMessage || `API request failed: ${response.status}`);
        } catch (parseError) {
          // Could not parse response, use default error
        }
      }

      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (parseError) {
        // Could not parse JSON, try text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage += `: ${errorText}`;
        } catch (textError) {
          // Use default error message
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('API success response:', result);
    return result;
  } catch (error) {
    console.log('Error in createCalendarEvent:', error.message);
    throw error;
  }
}
