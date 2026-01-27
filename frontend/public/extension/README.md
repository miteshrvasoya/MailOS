# MailOS Chrome Extension

## Installation

### From the Chrome Web Store (Coming Soon)
Visit the [Chrome Web Store](https://chrome.google.com/webstore) and search for "MailOS" to install the official extension.

### Manual Installation (Developer Mode)

1. Download or clone the MailOS repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right corner
4. Click "Load unpacked"
5. Select the `public/extension` folder from the MailOS repository
6. The MailOS extension will now appear in your Chrome extensions

## Features

- **Quick Dashboard Access**: Open your MailOS dashboard with one click
- **Email Groups**: View and manage your email groups
- **Insights**: Check email statistics and AI-generated insights
- **Rules Management**: Create and manage email rules
- **Direct Links**: Quick access to website and support

## Configuration

Before using the extension, update the `BASE_URL` in `popup.js`:

```javascript
const BASE_URL = 'http://localhost:3000'; // Change to your deployed URL
```

## How to Use

1. Click the MailOS extension icon in your Chrome toolbar
2. Choose from the available options:
   - **Open Dashboard**: Access your full MailOS dashboard
   - **View Email Groups**: See your automatically organized email groups
   - **View Insights**: Check your email analytics and insights
   - **Manage Rules**: Create and edit email handling rules
   - **Visit Website**: Go to MailOS website
   - **Help & Support**: Access support documentation

## Files

- `manifest.json` - Extension configuration and permissions
- `popup.html` - Extension popup UI
- `popup.js` - Popup functionality and event handlers
- `background.js` - Background service worker for extension tasks

## Permissions

The extension requires the following permissions:

- `storage` - To store user preferences and session data
- `tabs` - To open links in new tabs
- `host_permissions: https://mail.google.com/*` - To detect Gmail tabs

## Support

For issues or feature requests, visit our [support page](http://localhost:3000/security) or email support@mailos.app

## Version

Current Version: 1.0.0
