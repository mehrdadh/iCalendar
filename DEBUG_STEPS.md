# How to Fix "Could not establish connection" Error

This error means the background service worker isn't running. Follow these steps to fix it:

## Step 1: Check Extension Status

1. Open Chrome and go to `chrome://extensions/`
2. Find "ICS File Reader" extension
3. Look for any error messages in red

## Step 2: Check Service Worker Status

On the extensions page, look under your extension for:
- **"service worker"** link (should be visible)
- **"Errors"** button (if present, click it to see errors)

### If you see "service worker (inactive)":
- This is normal - it activates when needed
- Click the "service worker" link to activate it

### If you DON'T see "service worker" link at all:
- The background script failed to load
- Check Step 3 below

## Step 3: Reload the Extension

1. On `chrome://extensions/`, find your extension
2. Click the **circular reload icon** (🔄)
3. Watch for any error messages
4. After reload, you should see "service worker" appear

## Step 4: Check Service Worker Console

1. Click the **"service worker"** link under your extension
2. A DevTools window opens showing the background script console
3. You should see: `Background script loaded`
4. If you see errors, read them carefully

### Common errors in service worker console:

**"Uncaught SyntaxError"**
- There's a syntax error in background.js
- Check the line number mentioned
- Make sure all files are saved properly

**"chrome.identity is not defined"**
- OAuth2 configuration issue in manifest.json
- Make sure you have the "identity" permission

## Step 5: Check Manifest.json

Open `manifest.json` and verify:

```json
{
  "background": {
    "service_worker": "background.js"
  },
  "permissions": [
    "identity"
  ]
}
```

Make sure:
- ✅ File name is exactly "background.js" (case-sensitive)
- ✅ The file exists in the same directory as manifest.json
- ✅ No syntax errors in the JSON (no trailing commas, proper quotes)

## Step 6: Test the Connection

1. Click the extension icon to open the popup
2. Right-click the popup and select **"Inspect"**
3. In the Console tab, you should see:
   - `Popup loaded, checking background script connection...`
   - `Background script is connected`

If you see an error instead, the background script isn't responding.

## Step 7: Complete Reload

If nothing works, do a complete reload:

1. Go to `chrome://extensions/`
2. Click **"Remove"** on your extension
3. Close Chrome completely
4. Reopen Chrome
5. Go back to `chrome://extensions/`
6. Click **"Load unpacked"**
7. Select your extension folder again

## Step 8: Check File Permissions

Make sure all files are readable:

```bash
cd /Users/mhessar/work/chrome_extension
ls -la
```

All files should have read permissions (r-- in the permissions column).

## Step 9: Verify All Files Exist

Required files:
- ✅ manifest.json
- ✅ background.js
- ✅ popup.html
- ✅ popup.js
- ✅ styles.css

Run this command to check:
```bash
cd /Users/mhessar/work/chrome_extension
ls -1 *.js *.json *.html *.css
```

## Step 10: Check for Hidden Characters

Sometimes copying code can introduce hidden characters:

1. Open `background.js` in a text editor
2. Check the first line - it should be exactly:
   ```javascript
   // Background service worker for handling OAuth and API calls
   ```
3. No weird symbols or characters before the `//`

## What the Error Means

**"Could not establish connection. Receiving end does not exist"**

This means:
- The popup (sender) is trying to send a message
- The background script (receiver) isn't listening
- Usually because the background script failed to load or crashed

## Quick Fix Checklist

Try these in order:

1. ☐ Reload extension on chrome://extensions/
2. ☐ Click "service worker" link to check console
3. ☐ Look for "Background script loaded" message
4. ☐ Check for any red error messages
5. ☐ Verify manifest.json has correct background configuration
6. ☐ Verify background.js file exists and is readable
7. ☐ Remove and re-add the extension
8. ☐ Restart Chrome

## Still Not Working?

If you've tried everything:

1. **Check the service worker console** (most important!)
   - Go to chrome://extensions/
   - Click "service worker" under your extension
   - Copy any error messages you see

2. **Check the popup console**
   - Right-click extension icon → Inspect
   - Look at the Console tab
   - Copy any error messages

3. **Verify your manifest.json** has no syntax errors
   - Use a JSON validator: https://jsonlint.com/
   - Paste your manifest.json content
   - Fix any errors it finds

The error message in the console will tell you exactly what's wrong!
