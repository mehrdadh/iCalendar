# User Setup Guide - No Hardcoded Credentials

## ✨ What's New

This extension now allows **YOU** to use your own Google OAuth credentials instead of requiring hardcoded
credentials in the code!

## 🎯 How It Works

1. **You create** your own Google Cloud OAuth credentials (free, 5 minutes)
2. **You enter** your Client ID in the extension settings
3. **You authenticate** with Google when creating events
4. **No hardcoded credentials** - you have full control!

## 📋 Setup Steps

### Step 1: Create Google OAuth Credentials (One Time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google Calendar API":

   - Go to "APIs & Services" > "Library"
   - Search "Google Calendar API"
   - Click "Enable"

4. Set up OAuth consent screen:

   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External"
   - Fill in app name: "My ICS Reader"
   - Add your email
   - Add scope: `https://www.googleapis.com/auth/calendar.events`
   - Add yourself as test user

5. Create OAuth Client ID:

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **"Web application"** (important!)
   - Name: "ICS Reader"
   - Authorized redirect URIs: Add this URL:

     ```text
     https://<YOUR_EXTENSION_ID>.chromiumapp.org/
     ```

     (Get your extension ID from chrome://extensions/)

   - Click "Create"
   - **COPY THE CLIENT ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

### Step 2: Enter Client ID in Extension

1. Click the extension icon
2. You'll see **"⚙️ Google OAuth Setup"** section at the top
3. If not expanded, click it to expand
4. Paste your Client ID in the input field
5. Click **"Save"**
6. Done! The Client ID is now saved locally in your browser

### Step 3: Use the Extension

1. Drag and drop an `.ics` file
2. Review the file attributes
3. Click **"Create Google Calendar Event"**
4. **Google sign-in popup will appear** - this is where you grant permission!
5. Sign in with your Google account
6. Grant calendar access
7. Event is created! ✓

## 🔒 Privacy & Security

- **Your Client ID** is stored only in your browser (chrome.storage.local)
- **No credentials** are sent to anyone except Google
- **Authentication happens directly** between you and Google
- **You can revoke access** anytime from your Google Account settings
- **Each time you create an event**, you'll be asked to authenticate (no cached tokens)

## 🎨 Benefits

✅ **No hardcoded credentials** - you control everything  
✅ **Your own Google project** - you own the OAuth app  
✅ **Transparent authentication** - you see every permission request  
✅ **Works with any Google account** - personal or workspace  
✅ **Free to use** - Google Cloud OAuth is free for personal use

## ❓ FAQ

**Q: Do I need to pay for Google Cloud?**  
A: No! OAuth and Calendar API are free for normal usage.

**Q: Why do I need to create my own Client ID?**  
A: This way, YOU control the OAuth application. No hardcoded credentials in the code means better security and privacy.

**Q: Can I share this with others?**  
A: Yes! Each user creates their own Client ID and uses their own Google account.

**Q: Will I be asked to authenticate every time?**  
A: Yes, for maximum security. This ensures you always explicitly grant permission.

**Q: What if I want to change my Client ID?**  
A: Just open settings, enter a new Client ID, and click Save.

**Q: Where is my Client ID stored?**  
A: In your browser's local storage (chrome.storage.local). It never leaves your machine except when authenticating with Google.

## 🆚 Comparison with Traditional Extensions

| Feature           | This Extension          | Traditional Extension    |
| ----------------- | ----------------------- | ------------------------ |
| OAuth Credentials | User provides their own | Hardcoded by developer   |
| Privacy           | You control everything  | Developer controls       |
| Setup             | 5 min one-time setup    | Usually pre-configured   |
| Flexibility       | Use any Google account  | Limited to app's account |
| Security          | Maximum transparency    | Trust the developer      |

## 🐛 Troubleshooting

### "Please set up your Google OAuth Client ID"

- You haven't entered a Client ID yet
- Click the settings section and add your Client ID

### "Invalid Client ID format"

- Make sure you copied the entire Client ID
- It should end with `.apps.googleusercontent.com`

### "Authentication cancelled or failed"

- You closed the Google sign-in popup
- Try again and complete the sign-in process

### "redirect_uri_mismatch" error

- The redirect URI in Google Cloud doesn't match your extension ID
- Go to Google Cloud Console and update the redirect URI to:
  `https://<YOUR_EXTENSION_ID>.chromiumapp.org/`

## 🎓 Learn More

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)

## 💡 Tips

- **Keep your Client ID safe** - while not as sensitive as a secret, treat it with care
- **Test with a personal Google account first** before using with work accounts
- **Check Google Cloud Console** periodically to see API usage (it's free!)
- **You can create multiple Client IDs** for different purposes

---

**You're now in full control of your calendar integration!** 🎉
