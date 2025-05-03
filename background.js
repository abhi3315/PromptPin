// Optional: open a saved conversation when user clicks a notification
chrome.notifications.onClicked.addListener((url) => {
	chrome.tabs.create({ url });
});
