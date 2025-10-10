# ICS File Importer Chrome Extension

A Chrome extension that reads .ics calendar files and creates Google Calendar events from them with a beautiful, modern interface.

## Features

- 📁 **Drag and drop** .ics files onto the extension popup
- 📝 **Smart parsing** - Displays key event details (title, time, location)
- 📅 **Multi-calendar support** - Choose which Google Calendar to add events to
- 🎨 **Modern, gradient UI** - Purple gradient theme with clean design
- 🖱️ **Click to browse** - Alternative file selection method
- ✅ **Instant feedback** - Success/error messages with smooth animations
- 🔄 **Auto-clear** - Event data clears after successful creation
- 🔐 **Secure OAuth** - First-time authentication, then cached tokens
- 📏 **Compact design** - Optimized spacing and font sizes
- 🎯 **ICS standard compliant** - Proper handling of escape sequences and line folding

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

1. Open `popup.js` in your code editor
2. Find line ~16: `const GOOGLE_CLIENT_ID = '...'`
3. Replace with your Client ID
4. Save the file
5. Reload the extension in Chrome

### Step 5: Use the Extension

1. Click the extension icon - **You'll be prompted to authorize on first use**
2. Sign in with Google and grant calendar permissions
3. Your calendars will load automatically
4. Drag and drop an `.ics` file (or click to browse)
5. Review the event details (title, time, location)
6. Select which calendar to add the event to
7. Click **"Add to Calendar"**
8. Event created! ✓ (Display auto-clears after 2.5 seconds)

## Files Structure

```
chrome_extension/
├── manifest.json          # Extension configuration with OAuth2 scopes
├── popup.html             # Extension popup UI
├── popup.js               # ICS parsing, UI logic, and event creation
├── background.js          # OAuth authentication and Google Calendar API calls
├── styles.css             # Modern purple gradient theme styling
├── README.md              # This file
├── USER_SETUP_GUIDE.md    # Step-by-step OAuth setup guide
└── TOKEN_CACHING_INFO.md  # Token caching behavior documentation
```

## How It Works

1. **First-Time Setup**: On first use, you'll be prompted to authorize with Google Calendar
2. **Calendar Loading**: Your Google Calendars load automatically and are cached for quick access
3. **File Validation**: Drag and drop validates `.ics` file extension
4. **ICS Parsing**: 
   - Handles line folding per RFC 5545
   - Decodes escape sequences (`\n` → newlines, etc.)
   - Extracts key event data
5. **Smart Display**: Shows only essential info (event title as heading, start/end times, location)
6. **Calendar Selection**: Choose which Google Calendar to add the event to
7. **Token Caching**: OAuth tokens are cached with 5-minute expiry buffer for smooth UX
8. **Event Creation**: Converts ICS data to Google Calendar API format and creates the event
9. **Auto-Clear**: Success message shows for 2 seconds, then fades out with event data cleared

### Feature Flags

Event caching can be toggled in `popup.js`:
```javascript
const ENABLE_EVENT_CACHING = false; // Set to true to persist events across sessions
```

All file processing happens locally in your browser. The extension only communicates with Google Calendar API when loading calendars or creating events.

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
- Verify your Client ID is correct in `popup.js` (line ~16)
- Make sure you're added as a test user in Google Cloud Console
- Ensure Calendar API is enabled in your Google Cloud project
- Try reloading the extension

**No calendars showing**
- Check browser console for errors (Right-click popup → Inspect → Console)
- Verify you granted calendar.readonly permission
- Reload the extension and reauthorize

**OAuth/Authentication errors**
- See [USER_SETUP_GUIDE.md](./scripts/USER_SETUP_GUIDE.md) for setup instructions
- See [TOKEN_CACHING_INFO.md](./scripts/TOKEN_CACHING_INFO.md) for token behavior

**Event not persisting after closing popup**
- This is expected behavior with `ENABLE_EVENT_CACHING = false`
- Set flag to `true` in `popup.js` to enable persistence

## Privacy & Security

- Files are processed locally in your browser
- No data is sent to any server except Google Calendar API
- OAuth tokens are cached locally with expiry management
- The extension requests two permissions:
  - `calendar.events` - Create calendar events
  - `calendar.readonly` - Read your calendar list
- You can revoke access anytime in your [Google Account settings](https://myaccount.google.com/permissions)
- Event caching is disabled by default (no data persists after popup closes)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

See the [LICENSE](LICENSE) file for details.
