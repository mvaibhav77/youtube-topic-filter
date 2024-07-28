chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ topics: [], hiddenTopics: [], filterEnabled: true });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTopics") {
    chrome.storage.sync.set({ topics: request.topics }, function () {
      sendResponse({ status: "Topics updated" });
    });
    return true;
  }

  if (request.action === "updateHiddenTopics") {
    chrome.storage.sync.set({ hiddenTopics: request.hiddenTopics }, function () {
      sendResponse({ status: "Hidden topics updated" });
    });
    return true;
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
    return true;
  }
});
