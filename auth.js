// Alternative OAuth implementation using Google's OAuth 2.0 directly
// This allows users to authenticate without a hardcoded Client ID

class GoogleCalendarAuth {
  constructor() {
    this.clientId = null;
    this.redirectUri = chrome.identity.getRedirectURL();
    this.scope = 'https://www.googleapis.com/auth/calendar.events';
  }

  // Let user provide their own Client ID
  async setClientId(clientId) {
    this.clientId = clientId;
    await chrome.storage.local.set({ googleClientId: clientId });
  }

  // Get stored Client ID
  async getClientId() {
    if (this.clientId) return this.clientId;
    
    const result = await chrome.storage.local.get(['googleClientId']);
    this.clientId = result.googleClientId;
    return this.clientId;
  }

  // Alternative: Use web-based OAuth flow (no Client ID needed in manifest)
  async authenticateWithWebFlow(clientId) {
    const authUrl = this.buildAuthUrl(clientId);
    
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true
        },
        (redirectUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          try {
            const token = this.extractTokenFromUrl(redirectUrl);
            resolve(token);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  buildAuthUrl(clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: 'token',
      scope: this.scope,
      prompt: 'consent' // Always ask for permission
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  extractTokenFromUrl(url) {
    const urlParams = new URLSearchParams(new URL(url).hash.slice(1));
    const token = urlParams.get('access_token');
    
    if (!token) {
      throw new Error('No access token found in response');
    }
    
    return token;
  }

  // Create calendar event using token
  async createEvent(token, eventData) {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create event');
    }

    return await response.json();
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleCalendarAuth;
}
