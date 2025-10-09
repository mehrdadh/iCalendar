# ICS File Reader Chrome Extension

A Chrome extension that reads .ics calendar files and creates Google Calendar events from them.

## Features

- 📁 Drag and drop .ics files onto the extension popup
- 📝 Displays all ICS file attributes (summary, dates, location, description, etc.)
- 📅 Create Google Calendar events directly from ICS files
- 🎨 Modern, gradient UI design
- 🖱️ Click to browse files as an alternative to drag and drop
- ✅ Success/error messages for user feedback
- 🧹 Clear button to reset the display

## Installation

### Step 1: Install the Extension

No hard-coded credentials required! Each user brings their own OAuth credentials.

### Step 2: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the extension directory
5. Copy the **Extension ID** (you'll need it for OAuth setup)

### Step 3: Set Up Your Google OAuth (5 minutes)

See [USER_SETUP_GUIDE.md](USER_SETUP_GUIDE.md) for detailed instructions.

**Quick steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable Calendar API
3. Set up OAuth consent screen
4. Create OAuth Client ID (type: Web application)
5. Copy your Client ID

### Step 4: Configure the Extension

1. Click the extension icon
2. Click **"⚙️ Google OAuth Setup"** section
3. Paste your Client ID
4. Click **"Save"**
5. Done! ✓

### Step 5: Use the Extension

1. Drag and drop an `.ics` file
2. Review the file attributes
3. Click **"Create Google Calendar Event"**
4. **Google sign-in popup appears** - Sign in and grant permission
5. Event created! ✓

## Files Structure

```
chrome_extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup UI with settings
├── popup.js               # ICS parsing and event creation
├── auth.js                # OAuth authentication handler
├── background.js          # Background service worker
├── styles.css             # Styling
├── README.md              # This file
├── USER_SETUP_GUIDE.md    # Step-by-step setup guide for users
└── SETUP.md               # Detailed OAuth configuration guide
```

## How It Works

1. **File Validation**: The extension checks if the uploaded file has a `.ics` extension
2. **ICS Parsing**: Reads and parses the ICS file to extract calendar event attributes
3. **Display**: Shows all attributes in a clean, organized format
4. **User Authentication**: When you click "Create Google Calendar Event", a Google sign-in popup appears asking for permission
5. **OAuth Flow**: The extension requests fresh authentication each time (no cached tokens)
6. **Event Creation**: Converts ICS data to Google Calendar API format and creates the event
7. **Feedback**: Displays success or error messages to the user

All file processing happens locally in your browser. The extension only communicates with Google Calendar API when you click "Create Google Calendar Event", and **always prompts you for permission** each time.

## What Gets Created in Google Calendar

The extension extracts and creates events with the following information from your ICS file:

- **Event Title** (SUMMARY)
- **Start Date/Time** (DTSTART)
- **End Date/Time** (DTEND)
- **Location** (LOCATION)
- **Description** (DESCRIPTION)
- **Attendees** (ATTENDEE) - if present
- **Recurrence Rules** (RRULE) - if present

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Troubleshooting

**"Unsupported file type" error**
- Make sure your file has the `.ics` extension
- Verify the file is a valid ICS calendar file

**"Failed to create event" error**
- Check that you've completed the Google Calendar API setup
- Verify your Client ID is correct in `manifest.json`
- Make sure you're added as a test user in Google Cloud Console
- Try signing out and signing in again

**OAuth/Authentication errors**
- See the detailed troubleshooting section in [SETUP.md](SETUP.md)

## Privacy & Security

- Files are processed locally in your browser
- No data is sent to any server except Google Calendar API
- The extension only requests permission to create calendar events
- You can revoke access anytime in your Google Account settings

## License

Free to use and modify.
