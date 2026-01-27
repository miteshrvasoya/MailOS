// Configuration
const BASE_URL = 'http://localhost:3000'; // Change to your deployed URL
const DASHBOARD_URL = `${BASE_URL}/dashboard`;
const WEBSITE_URL = `${BASE_URL}`;
const SUPPORT_URL = `${BASE_URL}/security`; // Support/Help page

// DOM Elements
const openDashboardBtn = document.getElementById('openDashboard');
const openGroupsBtn = document.getElementById('openGroups');
const openInsightsBtn = document.getElementById('openInsights');
const openRulesBtn = document.getElementById('openRules');
const openWebsiteBtn = document.getElementById('openWebsite');
const openHelpBtn = document.getElementById('openHelp');
const twitterLink = document.getElementById('twitter');
const githubLink = document.getElementById('github');
const emailLink = document.getElementById('email');

// Event Listeners
openDashboardBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openInNewTab(DASHBOARD_URL);
});

openGroupsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openInNewTab(`${DASHBOARD_URL}/groups`);
});

openInsightsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openInNewTab(`${DASHBOARD_URL}/insights`);
});

openRulesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openInNewTab(`${DASHBOARD_URL}/rules`);
});

openWebsiteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openInNewTab(WEBSITE_URL);
});

openHelpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openInNewTab(SUPPORT_URL);
});

// Social Links
twitterLink.addEventListener('click', (e) => {
    e.preventDefault();
    openInNewTab('https://twitter.com');
});

githubLink.addEventListener('click', (e) => {
    e.preventDefault();
    openInNewTab('https://github.com');
});

emailLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'mailto:support@mailos.app';
});

// Utility function to open URL in new tab
function openInNewTab(url) {
    window.open(url, '_blank');
}

// Check if user is logged in and update UI accordingly
const chrome = window.chrome; // Declare the chrome variable
chrome.storage.local.get(['userLoggedIn'], (result) => {
    if (result.userLoggedIn) {
        console.log('[MailOS] User is logged in');
    } else {
        console.log('[MailOS] User not logged in');
    }
});
