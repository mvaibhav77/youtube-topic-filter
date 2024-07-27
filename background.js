// const API_KEY = "AIzaSyDOyTJQ89J_9vskZuleu02rI8VBtCZy-mA"; // Replace with your YouTube Data API key
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ topics: [], filterEnabled: true });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTopics") {
    chrome.storage.sync.set({ topics: request.topics }, function () {
      sendResponse({ status: "Topics updated" });
    });
    return true; // Will respond asynchronously
  }

  if (request.action === "toggleFilter") {
    chrome.storage.sync.get("filterEnabled", function (result) {
      const newStatus = !result.filterEnabled;
      chrome.storage.sync.set({ filterEnabled: newStatus }, function () {
        sendResponse({
          status: newStatus ? "Filter enabled" : "Filter disabled",
        });
      });
    });
    return true; // Will respond asynchronously
  }
});
