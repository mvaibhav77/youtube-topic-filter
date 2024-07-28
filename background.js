const CLIENT_ID =
  "354648778471-0g4ve725ki9gddm20ancqtq0kjj1gn1d.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://hjbcngofgafombbdfmfgjopkialmncen.chromiumapp.org";
let accessToken = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ topics: [], filterEnabled: true });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTopics") {
    chrome.storage.sync.set({ topics: request.topics }, function () {
      sendResponse({ status: "Topics updated" });
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

  if (request.action === "authenticate") {
    authenticateUser()
      .then((token) => {
        accessToken = token;
        sendResponse({ status: "Authenticated" });
      })
      .catch((err) => {
        sendResponse({ status: "Authentication failed", error: err });
      });
    return true;
  }

  if (request.action === "performSearch") {
    performSearch(request.topics)
      .then((response) => {
        sendResponse({ status: "Search performed", response });
      })
      .catch((err) => {
        sendResponse({ status: "Search failed", error: err });
      });
    return true;
  }
});

async function authenticateUser() {
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=https://www.googleapis.com/auth/youtube.readonly`;
  const authWindow = window.open(authUrl, "_blank", "width=500,height=600");
  return new Promise((resolve, reject) => {
    window.addEventListener("message", function (event) {
      if (event.origin === new URL(REDIRECT_URI).origin) {
        const hash = new URLSearchParams(event.data);
        if (hash.has("access_token")) {
          resolve(hash.get("access_token"));
        } else {
          reject("Authentication failed");
        }
        authWindow.close();
      }
    });
  });
}

async function performSearch(topics) {
  if (!accessToken) {
    throw new Error("User is not authenticated");
  }

  const query = topics.join(" ");
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}
