// Function to create the overlay
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "video-lock-overlay";
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.zIndex = "1000";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.cursor = "pointer";

  const lockImage = document.createElement("img");
  lockImage.src = chrome.runtime.getURL("images/lock.png");
  lockImage.style.width = "50px";
  lockImage.style.height = "50px";
  overlay.appendChild(lockImage);

  const contextMenu = document.createElement("div");
  contextMenu.className = "context-menu";
  contextMenu.style.position = "absolute";
  contextMenu.style.top = "50%";
  contextMenu.style.left = "50%";
  contextMenu.style.transform = "translate(-50%, -50%)";
  contextMenu.style.backgroundColor = "#fff";
  contextMenu.style.padding = "15px";
  contextMenu.style.borderRadius = "5px";
  contextMenu.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
  contextMenu.style.zIndex = "1001";
  contextMenu.style.display = "none";
  contextMenu.style.textAlign = "center";

  const question = document.createElement("p");
  question.textContent =
    "This video doesn't fall under your recommendations. Do you want to still unlock it?";
  question.style.marginBottom = "10px";
  question.style.fontFamily = "Roboto, Arial, sans-serif";
  question.style.fontSize = "14px";
  question.style.color = "#333";

  const yesButton = document.createElement("button");
  yesButton.textContent = "Yes";
  yesButton.style.marginRight = "10px";
  yesButton.style.padding = "5px 10px";
  yesButton.style.fontSize = "14px";
  yesButton.style.border = "none";
  yesButton.style.borderRadius = "3px";
  yesButton.style.backgroundColor = "#065fd4";
  yesButton.style.color = "#fff";
  yesButton.style.cursor = "pointer";
  yesButton.addEventListener("click", function (event) {
    event.stopPropagation();
    overlay.style.display = "none";
    contextMenu.style.display = "none";
  });

  const noButton = document.createElement("button");
  noButton.textContent = "No";
  noButton.style.padding = "5px 10px";
  noButton.style.fontSize = "14px";
  noButton.style.border = "none";
  noButton.style.borderRadius = "3px";
  noButton.style.backgroundColor = "#f1f1f1";
  noButton.style.color = "#333";
  noButton.style.cursor = "pointer";
  noButton.addEventListener("click", function (event) {
    event.stopPropagation();
    contextMenu.style.display = "none";
  });

  contextMenu.appendChild(question);
  contextMenu.appendChild(yesButton);
  contextMenu.appendChild(noButton);
  overlay.appendChild(contextMenu);

  overlay.addEventListener("click", function () {
    contextMenu.style.display = "block";
  });

  return overlay;
}

// Function to hide videos based on topics
function hideNonMatchingVideos(recommendedTopics, hiddenTopics) {
  const videoElements = document.querySelectorAll(
    "ytd-rich-item-renderer, ytd-video-renderer"
  );

  videoElements.forEach((video) => {
    const title = video.querySelector("#video-title")?.textContent || "";
    const description =
      video.querySelector("#description-text")?.textContent || "";

    const matchesRecommended =
      recommendedTopics.length !== 0
        ? recommendedTopics.some(
            (topic) =>
              title.toLowerCase().includes(topic.toLowerCase()) ||
              description.toLowerCase().includes(topic.toLowerCase())
          )
        : true;

    const matchesHidden = hiddenTopics.some(
      (topic) =>
        title.toLowerCase().includes(topic.toLowerCase()) ||
        description.toLowerCase().includes(topic.toLowerCase())
    );

    const shouldShow = matchesRecommended && !matchesHidden;

    if (shouldShow) {
      video.style.display = "block";
      const existingOverlay = video.querySelector(".video-lock-overlay");
      if (existingOverlay) existingOverlay.remove();
    } else {
      video.style.display = "block";
      let overlay = video.querySelector(".video-lock-overlay");
      if (!overlay) {
        overlay = createOverlay();
        video.style.position = "relative";
        video.appendChild(overlay);
      }
    }
  });
}

// Function to show all videos
function showAllVideos() {
  const videoElements = document.querySelectorAll(
    "ytd-rich-item-renderer, ytd-video-renderer"
  );

  videoElements.forEach((video) => {
    video.style.display = "block";
    const existingOverlay = video.querySelector(".video-lock-overlay");
    if (existingOverlay) existingOverlay.remove();
  });
}

// Apply filter based on storage settings
function applyFilter() {
  chrome.storage.sync.get(
    ["topics", "hiddenTopics", "filterEnabled"],
    function (result) {
      if (result.filterEnabled) {
        hideNonMatchingVideos(result.topics || [], result.hiddenTopics || []);
      } else {
        showAllVideos();
      }
    }
  );
}

// Initial filter application
applyFilter();

// Observe changes in the DOM to continuously filter new content
const observer = new MutationObserver(() => {
  applyFilter();
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateFilter") {
    applyFilter();
  }
});

function injectCSS() {
  const style = document.createElement("style");
  style.textContent = `
    .video-lock-overlay img {
      width: 50px;
      height: 50px;
    }

    .context-menu {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #fff;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1001;
      display: none;
      text-align: center;
      font-family: Roboto, Arial, sans-serif;
    }

    .context-menu p {
      margin-bottom: 10px;
      font-size: 14px;
      color: #333;
    }

    .context-menu button {
      margin: 5px;
      padding: 5px 10px;
      font-size: 14px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }

    .context-menu button:nth-child(2) {
      background-color: #065fd4;
      color: #fff;
    }

    .context-menu button:nth-child(3) {
      background-color: #f1f1f1;
      color: #333;
    }

    .video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;
      pointer-events: none;
    }

    .video-overlay .overlay-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .video-overlay .lock-symbol {
      font-size: 2em;
      color: white;
    }

    .video-overlay.holding {
      background: rgba(0, 0, 0, 0.9);
      pointer-events: all;
    }
  `;
  document.head.appendChild(style);
}

injectCSS();
