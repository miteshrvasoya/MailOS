// MailOS Chrome Extension Background Script
// This handles extension initialization and background tasks

// Declare the chrome variable
const chrome = window.chrome;

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Open welcome page on first install
        chrome.tabs.create({
            url: 'http://localhost:3000' // Change to your deployed URL
        });

        // Initialize storage
        chrome.storage.local.set({
            userLoggedIn: false,
            extensionVersion: '1.0.0',
            installDate: new Date().toISOString()
        });

        console.log('[MailOS] Extension installed');
    } else if (details.reason === 'update') {
        console.log('[MailOS] Extension updated');
    }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_AUTH') {
        chrome.storage.local.get(['userLoggedIn'], (result) => {
            sendResponse({ isLoggedIn: result.userLoggedIn });
        });
        return true;
    }

    if (request.type === 'SET_AUTH') {
        chrome.storage.local.set({ userLoggedIn: request.value });
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'GET_USER_DATA') {
        chrome.storage.local.get(['userData'], (result) => {
            sendResponse({ userData: result.userData });
        });
        return true;
    }
});

// Check for Gmail tab periodically
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes('mail.google.com')) {
        console.log('[MailOS] Gmail tab detected');
        // You can add custom behavior for Gmail tabs here
    }
});

// Set badge if there are unread important emails (example)
function updateBadge() {
    chrome.storage.local.get(['unreadImportant'], (result) => {
        if (result.unreadImportant && result.unreadImportant > 0) {
            chrome.action.setBadgeText({ text: result.unreadImportant.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#ffffff' });
        }
    });
}

// Update badge every 5 minutes
setInterval(updateBadge, 5 * 60 * 1000);
