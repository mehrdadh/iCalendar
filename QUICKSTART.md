# Quick Start Guide - Fix "bad client id" Error

You're seeing this error because the OAuth Client ID hasn't been set up yet. Here's how to fix it:

## The Problem

Your `manifest.json` currently has:
```json
"client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com"
```

This is a placeholder. Chrome can't authenticate with Google using this fake ID.

## The Solution (5 minutes)

### Option 1: Complete Setup (Recommended)

Follow the full setup in **[SETUP.md](SETUP.md)** to:
1. Create a Google Cloud Project (2 min)
2. Enable Google Calendar API (30 sec)
3. Configure OAuth consent screen (1 min)
4. Create OAuth Client ID (1 min)
5. Update manifest.json with your real Client ID (30 sec)

### Option 2: Quick Visual Guide

#### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

#### Step 2: Create Project
1. Click "Select a project" at the top
2. Click "NEW PROJECT"
3. Name it: "ICS File Reader"
4. Click "CREATE"

#### Step 3: Enable Calendar API
1. In the left sidebar, go to: **APIs & Services > Library**
2. Search for: "Google Calendar API"
3. Click on it
4. Click "ENABLE"

#### Step 4: Configure OAuth Consent Screen
1. Go to: **APIs & Services > OAuth consent screen**
2. Choose "External"
3. Click "CREATE"
4. Fill in:
   - App name: `ICS File Reader`
   - User support email: Your email
   - Developer email: Your email
5. Click "SAVE AND CONTINUE"
6. Click "ADD OR REMOVE SCOPES"
7. Find and add: `https://www.googleapis.com/auth/calendar.events`
8. Click "UPDATE"
9. Click "SAVE AND CONTINUE"
10. Add yourself as a test user (your email)
11. Click "SAVE AND CONTINUE"

#### Step 5: Create OAuth Client ID
1. Go to: **APIs & Services > Credentials**
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. Application type: **Chrome Extension**
4. Name: `ICS File Reader Extension`
5. Application ID: 
   - Go to `chrome://extensions/`
   - Find your extension
   - Copy the ID (looks like: `abcdefghijklmnopqrstuvwxyz123456`)
   - Paste it here
6. Click "CREATE"
7. **COPY THE CLIENT ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)

#### Step 6: Update manifest.json
1. Open your extension's `manifest.json`
2. Find this line:
   ```json
   "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
   ```
3. Replace with your actual Client ID:
   ```json
   "client_id": "123456789-abc123.apps.googleusercontent.com",
   ```
   (Use the one you copied in Step 5)
4. **SAVE the file**

#### Step 7: Reload Extension
1. Go to `chrome://extensions/`
2. Find "ICS File Reader"
3. Click the 🔄 **Reload** button

#### Step 8: Test It!
1. Click the extension icon
2. Drag an .ics file
3. Click "Create Google Calendar Event"
4. **A Google sign-in popup should appear!**
5. Sign in and grant permissions
6. Event created! ✅

## What Each Part Does

- **Google Cloud Project**: Container for your API setup
- **Calendar API**: Enables access to Google Calendar
- **OAuth Consent Screen**: What users see when granting permission
- **OAuth Client ID**: Unique identifier for your extension
- **manifest.json update**: Tells Chrome which Client ID to use

## Verification Checklist

Before testing, verify:

✅ Google Calendar API is enabled in your project  
✅ OAuth consent screen is configured  
✅ You're added as a test user  
✅ OAuth Client ID is created  
✅ Extension ID in Google Cloud matches your actual extension ID  
✅ Client ID in manifest.json is updated (no "YOUR_CLIENT_ID")  
✅ manifest.json file is saved  
✅ Extension is reloaded in Chrome  

## Common Mistakes

❌ **Forgetting to reload the extension** after updating manifest.json  
❌ **Using the wrong Extension ID** in Google Cloud  
❌ **Not adding yourself as a test user**  
❌ **Copying Client Secret instead of Client ID**  
❌ **Not saving manifest.json after editing**  

## Need Help?

If you're stuck:
1. Check the detailed guide: [SETUP.md](SETUP.md)
2. Check troubleshooting: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Verify your manifest.json has no syntax errors
4. Make sure you completed ALL steps (especially adding yourself as test user)

## What You Should See

**Before setup:**
```
Error: OAuth2 request failed: Service responded with error: 'bad client id: {0}'
```

**After setup:**
- Google sign-in popup appears
- You grant permissions
- Event is created successfully
- Success message appears in green

## Test Without Creating Real Events

If you want to test the OAuth flow without creating calendar events:
1. Complete the setup above
2. Click the extension icon
3. Load an .ics file
4. Click "Create Google Calendar Event"
5. The sign-in popup proves OAuth is working
6. You can close it or grant permission to test fully

Good luck! The setup takes about 5 minutes total. 🚀
