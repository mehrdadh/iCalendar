# Screenshot Helper

Interactive screenshot tool for capturing high-quality screenshots of the iCalendar extension popup.

## Running the Server

You need to run a local web server because the tool uses `fetch()` to load files.

### Option 1: Python (Recommended)

From the project root directory:

```bash
cd /Users/mhessar/work/chrome_extension
python3 -m http.server 8000
```

Then open: <http://localhost:8000/scripts/screenshot/screenshot-helper.html>

### Option 2: Node.js

```bash
npx serve
```

Then navigate to the screenshot helper in your browser.

### Option 3: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click `screenshot-helper.html`
3. Select "Open with Live Server"

## Features

- **Interactive Demo**: Loads the actual popup with mock "John Smith" Google account
- **Full Functionality**: Drag & drop files, select calendars, create events
- **High Quality**: Screenshots saved at 2560×1600 pixels (4x scale)
- **Current View Capture**: Captures exactly what you see in the frame

## Usage

1. Start the web server (see above)
2. Open the screenshot helper in your browser
3. Use demo buttons to set up different states:
   - **📅 Load Sample Event** - Loads a test event
   - **✅ Show Success Message** - Simulates event creation
   - **🔄 Reset Demo** - Reloads to initial state
   - **📋 Open Calendar Dropdown** - Shows calendar options
   - **📸 Save Screenshot (PNG)** - Captures current view as high-quality PNG
4. Scroll within the frame to position content
5. Click "Save Screenshot" to download

## Screenshots for Chrome Web Store

Recommended screenshots to capture:

1. Initial state with drop zone
2. Calendar dropdown open
3. Event details displayed
4. Success message after creating event

All screenshots are automatically saved as PNG files with timestamps.
