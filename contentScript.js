// Function to hide videos based on topics
function hideNonMatchingVideos(topics) {
  const videoElements = document.querySelectorAll(
    "ytd-rich-item-renderer, ytd-video-renderer"
  );

  videoElements.forEach((video) => {
    const title = video.querySelector("#video-title")?.textContent || "";
    const description =
      video.querySelector("#description-text")?.textContent || "";

    const shouldHide = !topics.some(
      (topic) =>
        title.toLowerCase().includes(topic.toLowerCase()) ||
        description.toLowerCase().includes(topic.toLowerCase())
    );

    video.style.display = shouldHide ? "none" : "block";
  });
}

// Function to show all videos
function showAllVideos() {
  const videoElements = document.querySelectorAll(
    "ytd-rich-item-renderer, ytd-video-renderer"
  );

  videoElements.forEach((video) => {
    video.style.display = "block";
  });
}

// Apply filter based on storage settings
function applyFilter() {
  chrome.storage.sync.get(["topics", "filterEnabled"], function (result) {
    if (result.filterEnabled && result.topics && result.topics.length > 0) {
      hideNonMatchingVideos(result.topics);
    } else {
      showAllVideos();
    }
  });
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
