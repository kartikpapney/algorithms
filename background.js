// Minimal background service worker
console.log('LeetCode Capturer background loaded');

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ extensionEnabled: true });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  sendResponse({ success: true });
});
