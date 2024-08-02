chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    topics: [],
    hiddenTopics: [],
    filterEnabled: true,
    isLoading: false,
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTopics") {
    chrome.storage.sync.set({ topics: request.topics }, function () {
      sendResponse({ status: "Topics updated" });
    });
    return true;
  }

  if (request.action === "updateHiddenTopics") {
    chrome.storage.sync.set(
      { hiddenTopics: request.hiddenTopics },
      function () {
        sendResponse({ status: "Hidden topics updated" });
      }
    );
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

  if (request.action === "detoxifyFeed") {
    detoxifyFeed()
      .then(() => {
        sendResponse({ success: true });
        chrome.storage.sync.set({ isLoading: false });
        notifyPopupAndContent();
      })
      .catch((error) => {
        console.error(error);
        sendResponse({ success: false });
        chrome.storage.sync.set({ isLoading: false });
        notifyPopupAndContent();
      });
    chrome.storage.sync.set({ isLoading: true });
    return true; // Will respond asynchronously.
  }
});

async function detoxifyFeed() {
  await new Promise((resolve) => {
    chrome.storage.sync.set({ isLoading: true }, resolve);
  });

  const result = await new Promise((resolve) => {
    chrome.storage.sync.get(["topics"], resolve);
  });

  const recommendedTopics = result.topics || [];
  if (recommendedTopics.length === 0) {
    await new Promise((resolve) => {
      chrome.storage.sync.set({ isLoading: false }, resolve);
    });
    return;
  }

  const searchQueries = recommendedTopics.flatMap((topic) => [
    `intitle:${topic}`,
    `#${topic}`,
    topic,
  ]);

  const searchUrls = searchQueries.map(
    (query) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        query
      )}`
  );

  const window = await new Promise((resolve) => {
    chrome.windows.create({ url: "about:blank", state: "minimized" }, resolve);
  });

  const tabIds = [];
  for (const url of searchUrls) {
    const tab = await new Promise((resolve) => {
      chrome.tabs.create({ windowId: window.id, url, active: false }, resolve);
    });
    tabIds.push(tab.id);
  }

  await new Promise((resolve) => setTimeout(resolve, 40000));

  for (const tabId of tabIds) {
    await new Promise((resolve) => {
      chrome.tabs.remove(tabId, resolve);
    });
  }

  await new Promise((resolve) => {
    chrome.windows.remove(window.id, resolve);
  });

  await new Promise((resolve) => {
    chrome.storage.sync.set({ isLoading: false }, resolve);
  });

  chrome.tabs.query({ url: "*://www.youtube.com/*" }, function (tabs) {
    tabs.forEach((tab) => {
      chrome.tabs.reload(tab.id);
    });
  });

  setTimeout(() => {
    console.log("Detoxify feed completed.");
    resolve();
  }, 5000);
}

function notifyPopupAndContent() {
  chrome.runtime.sendMessage({
    action: "updateLoadingState",
    isLoading: false,
  });
  chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: "refreshContent" });
    });
  });
}

chrome.alarms.create("detoxifyFeed", { periodInMinutes: 6 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "detoxifyFeed") {
    detoxifyFeed().catch(console.error);
  }
});
