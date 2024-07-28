// Function to hide videos based on topics
function hideNonMatchingVideos(recommendedTopics, hiddenTopics) {
  const videoElements = document.querySelectorAll(
    "ytd-rich-item-renderer, ytd-video-renderer"
  );

  videoElements.forEach((video) => {
    const title = video.querySelector("#video-title")?.textContent || "";
    const description =
      video.querySelector("#description-text")?.textContent || "";

    // Check if video matches any recommended topic
    const matchesRecommended =
      recommendedTopics.length !== 0
        ? recommendedTopics.some(
            (topic) =>
              title.toLowerCase().includes(topic.toLowerCase()) ||
              description.toLowerCase().includes(topic.toLowerCase())
          )
        : true;

    // Check if video matches any hidden topic
    const matchesHidden = hiddenTopics.some(
      (topic) =>
        title.toLowerCase().includes(topic.toLowerCase()) ||
        description.toLowerCase().includes(topic.toLowerCase())
    );

    // Determine if video should be shown
    const shouldShow = matchesRecommended && !matchesHidden;

    video.style.display = shouldShow ? "block" : "none";
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
