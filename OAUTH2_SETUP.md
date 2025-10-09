# OAuth 2.0 Setup for Your Extension

## ✅ Good News!

You can now use your existing Client ID with OAuth 2.0! No need to create a Chrome Extension specific client.

## 🔧 One More Step Needed

You need to add your extension's redirect URI to your Google Cloud OAuth client.

### Step 1: Get Your Extension's Redirect URI

1. Go to `chrome://extensions/`
2. Find "ICS File Reader"
3. Copy the **Extension ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)
4. Your redirect URI is: `https://<YOUR_EXTENSION_ID>.chromiumapp.org/`

**Example:** If your Extension ID is `abc123xyz456`, then your redirect URI is:
```
https://abc123xyz456.chromiumapp.org/
```

### Step 2: Add Redirect URI to Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **v2ray-377703**
3. Go to **"APIs & Services"** → **"Credentials"**
4. Find your OAuth 2.0 Client ID (the one ending in `erstd2j`)
5. Click on it to edit
6. Under **"Authorized redirect URIs"**, click **"+ ADD URI"**
7. Paste: `https://<YOUR_EXTENSION_ID>.chromiumapp.org/`
8. Click **"SAVE"**

### Step 3: Make Sure Calendar API is Enabled

1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Calendar API"**
3. Make sure it says **"MANAGE"** (if it says "ENABLE", click it)

### Step 4: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Make sure you have:
   - Added your email as a **test user**
   - Added the scope: `https://www.googleapis.com/auth/calendar.events`

### Step 5: Reload Extension

1. Go to `chrome://extensions/`
2. Click the 🔄 **Reload** button on "ICS File Reader"
3. Test it!

## 🎉 How It Works Now

1. Click "Create Google Calendar Event"
2. **Google OAuth 2.0 popup appears** (standard Google login)
3. You sign in with your Gmail
4. You grant calendar permission
5. Event is created!

## 🔍 What Changed

- ✅ **No more** Chrome-specific Client ID needed
- ✅ Uses **standard OAuth 2.0** web flow
- ✅ Works with **any OAuth client type** (Desktop, Web, etc.)
- ✅ Your Client ID is **hardcoded in popup.js** (line 15)
- ✅ **Always prompts** for authentication (no cached tokens)

## 📝 To Change Client ID Later

Edit `/Users/mhessar/work/chrome_extension/popup.js` line 15:

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
```

## 🐛 Troubleshooting

**"redirect_uri_mismatch" error:**
- You forgot to add the redirect URI in Google Cloud Console
- Make sure the Extension ID matches exactly

**"invalid_client" error:**
- Client ID is wrong
- Check line 15 in popup.js

**"Access blocked" error:**
- Add yourself as a test user in OAuth consent screen
- Make sure Calendar API is enabled

**Still seeing "bad client id":**
- You need to add the redirect URI (Step 2 above)

---

**After adding the redirect URI, it should work!** 🚀

