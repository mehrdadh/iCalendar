# Troubleshooting Guide

## How Authentication Works

The authentication flow in this extension works as follows:

1. **User clicks "Create Google Calendar Event"** button
2. **popup.js** sends a message to **background.js** via `chrome.runtime.sendMessage()` with `forceNewAuth: true`
3. **background.js** removes any cached authentication tokens
4. **background.js** calls `chrome.identity.getAuthToken({ interactive: true })`
5. **Chrome opens a popup window** asking you to:
   - Choose your Google account
   - Review and grant permissions to access Google Calendar
6. **User grants permission** in the popup
7. **Chrome returns a fresh token** to the extension
8. **background.js** uses the token to call Google Calendar API
9. **Success/error message** is sent back to popup.js and displayed

**Important**: This extension **always requests fresh authentication** each time you create an event. It does not
use cached tokens, ensuring you always explicitly grant permission.

## Common Issues and Solutions

### Issue 1: Button doesn't do anything when clicked

**Possible causes:**

1. Background script not loaded
2. OAuth Client ID not configured
3. Extension not properly reloaded after changes

**How to check:**

1. Open Chrome DevTools Console (F12) on the extension popup
2. Click the button and look for console messages
3. Check for errors in red

**Solution:**

- Go to `chrome://extensions/`
- Find your extension
- Click the "Reload" button
- Try again and check console for errors

### Issue 2: "OAuth2 client ID is invalid" or similar error

**Cause:** The Client ID in `manifest.json` hasn't been updated

**Solution:**

1. Follow the complete setup in [SETUP.md](SETUP.md)
2. Get your Client ID from Google Cloud Console
3. Open `src/manifest.json`
4. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID
5. Save and reload the extension

### Issue 3: "Could not establish connection" error

**Cause:** Background script failed to load

**How to check:**

1. Go to `chrome://extensions/`
2. Find your extension
3. Click "service worker" link (under "Inspect views")
4. Check the console for errors

**Solution:**

- Make sure `src/background.js` exists in your extension folder
- Check that `src/manifest.json` has the correct reference to it
- Reload the extension

### Issue 4: Authentication popup doesn't appear

**Possible causes:**

1. Popup blockers
2. Invalid OAuth configuration
3. Extension ID mismatch

**How to check:**

1. Look at the background service worker console (see Issue 3)
2. Check for authentication-related errors

**Solution:**

1. Verify your OAuth setup in Google Cloud Console
2. Make sure the Extension ID in Google Cloud matches your actual extension ID
3. Try removing and re-adding the extension

### Issue 5: "Access blocked" or "This app isn't verified"

**Cause:** OAuth consent screen not properly configured or you're not added as a test user

**Solution:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "OAuth consent screen"
3. Scroll down to "Test users"
4. Click "Add Users"
5. Add your Google email address
6. Save and try again

## Debugging Steps

### Step 1: Check if background script is running

1. Go to `chrome://extensions/`
2. Find "ICS File Reader"
3. Look for "service worker" under "Inspect views"
4. Click it to open the background script console
5. You should see: `Background script loaded`

### Step 2: Check popup console

1. Right-click the extension icon
2. Select "Inspect popup"
3. Click the "Create Google Calendar Event" button
4. Watch the console for messages

**Expected console output:**

```javascript
Event data to send: {summary: "...", start: {...}, end: {...}}
Response from background: {success: true, result: {...}}
```

**If you see errors:**

- Copy the error message
- Check the solutions above

### Step 3: Verify manifest.json configuration

Open `src/manifest.json` and verify:

```json
{
  "permissions": ["identity"],
  "host_permissions": ["https://www.googleapis.com/*"],
  "oauth2": {
    "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/calendar.events"]
  },
  "background": {
    "service_worker": "background.js"
  }
}
```

Make sure:

- ✅ `client_id` is NOT "YOUR_CLIENT_ID" (must be your actual ID)
- ✅ All files exist in your `src/` folder
- ✅ No syntax errors in the JSON

### Step 4: Test with a simple ICS file

Create a test file called `test.ics`:

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:test123@example.com
DTSTAMP:20231015T120000Z
DTSTART:20231020T140000Z
DTEND:20231020T150000Z
SUMMARY:Test Event
DESCRIPTION:This is a test event
LOCATION:Test Location
END:VEVENT
END:VCALENDAR
```

Load this file and try creating the event.

## Still Not Working?

If you've tried all the above and it still doesn't work:

1. **Check the console logs** in both popup and background script
2. **Copy any error messages** you see
3. **Verify your Google Cloud setup** matches SETUP.md exactly
4. **Make sure Google Calendar API is enabled** in your Google Cloud project
5. **Try with a fresh Google Cloud project** if all else fails

## Manual Testing of OAuth

To test if OAuth is working at all, you can temporarily add this to popup.js:

```javascript
// Add this temporarily for testing
document.addEventListener('DOMContentLoaded', () => {
  const testBtn = document.createElement('button');
  testBtn.textContent = 'Test OAuth';
  testBtn.onclick = () => {
    chrome.runtime.sendMessage({ action: 'getAuthToken' }, response => {
      console.log('OAuth test result:', response);
      alert(response.success ? 'OAuth works!' : 'OAuth failed: ' + response.error);
    });
  };
  document.body.appendChild(testBtn);
});
```

If this test button works, the issue is with the event creation logic, not OAuth.
