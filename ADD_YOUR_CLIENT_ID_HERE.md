# 📍 Where to Add Your Client ID

## Step 1: Open manifest.json

The file is located at: `/Users/mhessar/work/chrome_extension/manifest.json`

## Step 2: Find Line 17

Look for this section:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/calendar.events"
  ]
},
```

## Step 3: Replace YOUR_CLIENT_ID_HERE

**BEFORE:**
```json
"client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
```

**AFTER** (with your actual Client ID):
```json
"client_id": "123456789-abc123def456xyz.apps.googleusercontent.com",
```

## Example

If your Client ID from Google Cloud is:
```
987654321-xyz789abc456def.apps.googleusercontent.com
```

Then line 17 should be:
```json
"client_id": "987654321-xyz789abc456def.apps.googleusercontent.com",
```

## Step 4: Save the File

Make sure to **SAVE** the manifest.json file after making the change!

## Step 5: Reload the Extension

1. Go to `chrome://extensions/`
2. Find "ICS File Reader"
3. Click the 🔄 **Reload** button

## Step 6: Test It!

1. Click the extension icon
2. Drag an .ics file
3. Click "Create Google Calendar Event"
4. **Google sign-in popup should appear!**
5. Sign in and grant permissions
6. Event created! ✅

---

## ⚠️ Important Notes

- Replace the **ENTIRE** string `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com`
- Keep the quotes: `"client_id": "..."`
- Keep the comma at the end: `...",`
- Your Client ID should end with `.apps.googleusercontent.com`
- Make sure to **save the file** before reloading

## ✅ How to Verify It's Correct

After editing, your `oauth2` section should look like:

```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_NUMBER_HERE.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/calendar.events"
  ]
},
```

Where `YOUR_ACTUAL_NUMBER_HERE` is replaced with your actual Client ID numbers/letters.

NO MORE "bad client id" errors! 🎉

