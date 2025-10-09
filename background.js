// Background service worker for OAuth 2.0 and API calls

console.log('Background script loaded');

// Store the Client ID and access token
let clientId = null;
let cachedAccessToken = null;
let tokenExpiryTime = null;

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
    createCalendarEvent(request.eventData, request.clientId, request.forceAuth)
      .then(result => {
        console.log('Event created successfully:', result);
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.error('Error creating event:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'clearToken') {
    console.log('Clearing cached token');
    cachedAccessToken = null;
    tokenExpiryTime = null;
    sendResponse({ success: true });
    return true;
  }
});

// Check if cached token is still valid
function isTokenValid() {
  if (!cachedAccessToken) {
    return false;
  }
  
  if (!tokenExpiryTime) {
    return false;
  }
  
  // Check if token has expired (with 5 minute buffer)
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  
  if (now >= (tokenExpiryTime - bufferTime)) {
    console.log('Token expired or about to expire');
    return false;
  }
  
  console.log('Using cached token');
  return true;
}

// Get access token (from cache or by authenticating)
async function getAccessToken(clientId, forceAuth = false) {
  // If forcing authentication, clear cache
  if (forceAuth) {
    console.log('Forcing new authentication');
    cachedAccessToken = null;
    tokenExpiryTime = null;
  }
  
  // Check if we have a valid cached token
  if (isTokenValid()) {
    console.log('Using cached access token');
    return cachedAccessToken;
  }
  
  // Need to authenticate
  console.log('Authenticating with OAuth 2.0...');
  const tokenData = await authenticateWithOAuth2(clientId);
  
  // Cache the token
  cachedAccessToken = tokenData.accessToken;
  tokenExpiryTime = Date.now() + (tokenData.expiresIn * 1000);
  
  console.log('Token cached, expires in', tokenData.expiresIn, 'seconds');
  return cachedAccessToken;
}

// OAuth 2.0 authentication using web flow
async function authenticateWithOAuth2(clientId) {
  const redirectUri = chrome.identity.getRedirectURL();
  console.log('Redirect URI:', redirectUri);
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events');
  // Remove 'prompt=consent' to allow token reuse
  
  console.log('Auth URL:', authUrl.toString());
  
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true
      },
      (redirectUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Auth error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (!redirectUrl) {
          reject(new Error('No redirect URL received'));
          return;
        }
        
        console.log('Redirect URL:', redirectUrl);
        
        // Extract access token and expiry from URL fragment
        try {
          const url = new URL(redirectUrl);
          const fragment = url.hash.substring(1); // Remove #
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
          
          if (!accessToken) {
            reject(new Error('No access token in response'));
            return;
          }
          
          console.log('Access token received, expires in', expiresIn, 'seconds');
          resolve({ accessToken, expiresIn });
        } catch (error) {
          console.error('Error parsing redirect URL:', error);
          reject(error);
        }
      }
    );
  });
}

// Create calendar event
async function createCalendarEvent(eventData, clientId, forceAuth = false) {
  try {
    if (!clientId) {
      throw new Error('No Client ID provided. Please set up your OAuth credentials.');
    }
    
    // Get access token (cached or new)
    const accessToken = await getAccessToken(clientId, forceAuth);
    
    console.log('Making API request to Google Calendar...');
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      }
    );
    
    if (!response.ok) {
      console.error('API request failed with status:', response.status, response.statusText);
      
      // Check if it's an auth error (401 or 403)
      if (response.status === 401 || response.status === 403) {
        console.log('Auth error detected, checking if we need to re-authenticate...');
        
        try {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          
          // Check if it's a permission/auth issue
          const errorMessage = errorData.error?.message || '';
          if (errorMessage.includes('Invalid Credentials') || 
              errorMessage.includes('unauthorized') ||
              errorMessage.includes('insufficient') ||
              response.status === 401) {
            
            // If we weren't forcing auth, try once more with fresh token
            if (!forceAuth) {
              console.log('Token might be invalid, retrying with fresh authentication...');
              return await createCalendarEvent(eventData, clientId, true);
            }
          }
          
          throw new Error(errorMessage || `API request failed: ${response.status}`);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
      }
      
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
        const errorText = await response.text();
        console.error('Error response text:', errorText);
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('API success response:', result);
    return result;
    
  } catch (error) {
    console.error('Exception in createCalendarEvent:', error);
    throw error;
  }
}
