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

    if (shouldHide) {
      video.style.display = "none";
    } else {
      video.style.display = "block"; // Ensure videos that match are visible
    }
  });
}

// Fetch topics from storage and apply filtering
chrome.storage.sync.get(["topics", "filterEnabled"], function (result) {
  if (result.filterEnabled) {
    hideNonMatchingVideos(result.topics);
  }
});

// Observe changes in the DOM to continuously filter new content
const observer = new MutationObserver(() => {
  chrome.storage.sync.get(["topics", "filterEnabled"], function (result) {
    if (result.filterEnabled) {
      hideNonMatchingVideos(result.topics);
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
