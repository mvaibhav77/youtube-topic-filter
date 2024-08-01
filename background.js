chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    topics: [],
    hiddenTopics: [],
    filterEnabled: true,
  });

  // Set up an initial schedule
  scheduleDetoxifyFeed();
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
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "detoxifyFeed") {
    detoxifyFeed()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error(error);
        sendResponse({ success: false });
      });
    return true; // Keeps the message channel open for asynchronous response
  }
});


async function detoxifyFeed() {
  const result = await new Promise((resolve) => {
    chrome.storage.sync.get(["topics"], resolve);
  });

  const recommendedTopics = result.topics || [];
  if (recommendedTopics.length === 0) return;

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

  const tabIds = [];
  for (const url of searchUrls) {
    const tab = await new Promise((resolve) => {
      chrome.tabs.create({ url, active: false }, resolve);
    });
    tabIds.push(tab.id);
  }

  // Ensure search results are processed
  await new Promise((resolve) => setTimeout(resolve, 40000));

  // Close tabs
  for (const tabId of tabIds) {
    await new Promise((resolve) => {
      chrome.tabs.remove(tabId, resolve);
    });
  }

  // Additional filtering can be done here if needed
}

// Schedule the detoxifyFeed function
function scheduleDetoxifyFeed() {
  const INTERVAL = 100000; // 100 sec in milliseconds
  chrome.alarms.create("detoxifyFeedAlarm", {
    periodInMinutes: INTERVAL / 60000,
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "detoxifyFeedAlarm") {
      detoxifyFeed();
    }
  });
}
