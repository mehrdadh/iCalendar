# Google Calendar API Setup Guide

To use the Google Calendar integration feature, you need to set up OAuth credentials. Follow these steps:

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top, then "New Project"
3. Enter a project name (e.g., "ICS File Reader")
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required fields:
   - App name: "ICS File Reader"
   - User support email: Your email
   - Developer contact: Your email
5. Click "Save and Continue"
6. On the Scopes page, click "Add or Remove Scopes"
7. Add the scope: `https://www.googleapis.com/auth/calendar.events`
8. Click "Update" then "Save and Continue"
9. Add your email as a test user (for testing phase)
10. Click "Save and Continue"

## Step 4: Create OAuth Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Chrome Extension" as the application type
4. Enter a name (e.g., "ICS File Reader Extension")
5. For the "Application ID", you'll need your Chrome Extension ID:
   - Load your unpacked extension in Chrome (load the `src/` directory)
   - Go to `chrome://extensions/`
   - Find your extension and copy the ID (it looks like: `abcdefghijklmnopqrstuvwxyz123456`)
6. Paste the Extension ID in the "Application ID" field
7. Click "Create"
8. Copy the **Client ID** that appears (it will look like: `123456789-abc123.apps.googleusercontent.com`)

## Step 5: Update manifest.json

1. Open `src/manifest.json` in your extension folder
2. Find the line with `"client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com"`
3. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID from Step 4
4. Save the file

## Step 6: Reload the Extension

1. Go to `chrome://extensions/`
2. Click the reload icon on your extension
3. The extension is now ready to use!

## Testing

1. Click the extension icon
2. Drag and drop an .ics file
3. Click "Create Google Calendar Event"
4. You'll be prompted to sign in with Google (first time only)
5. Grant the necessary permissions
6. The event will be created in your default Google Calendar

## Important Notes

- The extension will request permission to access your Google Calendar
- Only you can use the extension during the testing phase (unless you publish it)
- To add more test users, go back to the OAuth consent screen and add their emails
- The extension only creates events; it doesn't delete or modify existing events

## Troubleshooting

### Error: "Invalid client_id"

- Make sure you copied the correct Client ID from Google Cloud Console
- Ensure the Extension ID in Google Cloud matches your actual extension ID

### Error: "Access blocked: Authorization Error"

- Make sure you've added yourself as a test user in the OAuth consent screen
- Check that the Google Calendar API is enabled

### Error: "Failed to get auth token"

- Try removing and re-adding the extension
- Clear your browser cache and try again

## Security Note

Keep your Client ID secure. While it's not as sensitive as a Client Secret, it's still part of your OAuth configuration.
