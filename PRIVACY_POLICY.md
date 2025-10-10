# Privacy Policy for iCalendar Chrome Extension

**Last Updated:** October 10, 2025

## Introduction

This Privacy Policy describes how the iCalendar Chrome Extension ("the Extension", "we", "our") collects, uses, and protects information when you use our Chrome extension.

## Information We Collect

### OAuth Access Tokens
- **What:** Temporary authentication tokens provided by Google OAuth 2.0
- **Why:** To authenticate API requests to Google Calendar on your behalf
- **Duration:** Automatically expires after 1 hour
- **Storage:** Encrypted in Chrome's local storage (`chrome.storage.local`)

### Calendar List
- **What:** Names and IDs of your Google Calendars
- **Why:** To display calendar options when adding events
- **Duration:** Cached until extension is uninstalled or manually cleared
- **Storage:** Encrypted in Chrome's local storage

### Authorization Status
- **What:** Boolean flag indicating whether you've authorized the extension
- **Why:** To provide a smooth user experience
- **Storage:** Chrome's local storage

## Information We Do NOT Collect

We do **NOT** collect, store, or transmit:
- ❌ Your calendar event contents (except temporarily in memory during event creation)
- ❌ Your email address or personal information
- ❌ Your browsing history or website data
- ❌ Any personally identifiable information beyond OAuth tokens
- ❌ Usage analytics or tracking data
- ❌ Cookies or tracking mechanisms

## How We Use Information

### OAuth Access Tokens
Used exclusively to:
- Create calendar events in your Google Calendar
- Fetch your calendar list for display in the extension
- Authenticate with Google Calendar API

### Calendar List
Used to:
- Display calendar options in the extension dropdown
- Allow you to select which calendar to add events to

## Data Storage and Security

### Local Storage
- All data is stored locally in `chrome.storage.local`
- Storage is encrypted and sandboxed by Chrome browser
- Data is isolated from websites and other extensions
- Data is automatically cleared when extension is uninstalled

### No External Servers
- We do NOT operate any external servers
- We do NOT transmit data to third-party services
- Communication only occurs with official Google APIs:
  - `accounts.google.com` (authentication)
  - `www.googleapis.com` (Calendar API)

### Token Expiration
- OAuth tokens automatically expire after 1 hour
- Expired tokens are not used and are replaced with new ones
- Token validation occurs before each API request

## Data Sharing

We do **NOT** share your data with:
- Third-party services
- Advertisers
- Analytics companies
- Any external parties

The only data transmission occurs directly between:
- Your browser and Google's official authentication servers
- Your browser and Google's official Calendar API

## Permissions Explained

### Identity Permission
Required for OAuth 2.0 authentication with your Google Account to access Google Calendar.

### Storage Permission
Required to cache OAuth tokens and calendar list to prevent repeated authentication prompts.

### Host Permissions
- `accounts.google.com`: OAuth 2.0 authentication flow
- `www.googleapis.com`: Google Calendar API requests

## Your Rights and Control

### View Stored Data
You can view what's stored by:
1. Opening Chrome DevTools (F12)
2. Go to Application → Storage → Local Storage
3. Look for `chrome-extension://[extension-id]`

### Clear Stored Data
You can clear all stored data by:
1. Uninstalling the extension
2. Using Chrome's "Clear browsing data" feature
3. Clearing site data for the extension

### Revoke Access
You can revoke the extension's access to Google Calendar by:
1. Visit [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find "iCalendar Chrome Extension"
3. Click "Remove Access"

## Children's Privacy

This extension is not directed to children under 13 years of age. We do not knowingly collect information from children.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be reflected by the "Last Updated" date at the top of this policy.

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- Google API Services User Data Policy
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

## Open Source

This extension is open source. You can review the source code to verify our privacy practices at:
[Your GitHub Repository URL]

## Data Retention

- **OAuth Tokens:** Retained for 1 hour (until expiration), then automatically cleared
- **Calendar List:** Retained until extension is uninstalled or manually cleared
- **Authorization Status:** Retained until extension is uninstalled

## Third-Party Services

This extension only communicates with:
- **Google OAuth 2.0** (`accounts.google.com`) - For authentication
- **Google Calendar API** (`www.googleapis.com`) - For creating events and fetching calendar list

We do not use:
- Analytics services (e.g., Google Analytics)
- Crash reporting services
- Advertising networks
- Any other third-party services

## Contact Information

If you have questions about this Privacy Policy or our data practices, please contact us:

- **GitHub Issues:** [Your GitHub Repository URL]/issues
- **Email:** [Your contact email]
- **Website:** [Your website if available]

## Consent

By using the iCalendar Chrome Extension, you consent to this Privacy Policy and our handling of information as described.

---

## Summary (TL;DR)

✅ We only collect OAuth tokens (expires in 1 hour) and your calendar list  
✅ Data is stored locally in encrypted Chrome storage  
✅ We do NOT share data with anyone  
✅ We do NOT track or collect personal information  
✅ We only communicate with official Google APIs  
✅ You can revoke access anytime through Google Account settings  
✅ All code is open source and auditable  

---

**Your privacy is important to us. This extension is designed to be as privacy-friendly as possible while providing useful functionality.**

