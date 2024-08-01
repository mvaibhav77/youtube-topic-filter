document.addEventListener("DOMContentLoaded", function () {
  const newTopicInput = document.getElementById("newTopic");
  const addTopicButton = document.getElementById("addTopic");
  const topicsList = document.getElementById("topicsList");
  const newHiddenTopicInput = document.getElementById("newHiddenTopic");
  const addHiddenTopicButton = document.getElementById("addHiddenTopic");
  const hiddenTopicsList = document.getElementById("hiddenTopicsList");
  const toggleFilterButton = document.getElementById("toggleFilter");
  const detoxifyFeedButton = document.getElementById("detoxifyFeed");
  const loadingOverlay = document.getElementById("loading");
  const filterTabs = document.getElementById("filterTabs");
  const filterTabsContent = document.getElementById("filterTabsContent");
  const toggleRow = document.querySelector(".toggle-row");
  const content = document.querySelector(".content");

  function renderTopics(topics) {
    topicsList.innerHTML = "";
    topics.forEach((topic, index) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.textContent = topic;

      const editButton = document.createElement("button");
      editButton.className = "btn btn-warning btn-sm";
      editButton.textContent = "Edit";
      editButton.onclick = () => {
        const newTopic = prompt("Edit topic:", topic);
        if (newTopic) {
          chrome.storage.sync.get("topics", function (result) {
            const updatedTopics = result.topics;
            updatedTopics[index] = newTopic;
            chrome.storage.sync.set({ topics: updatedTopics }, () => {
              renderTopics(updatedTopics);
              notifyContentScript();
            });
          });
        }
      };

      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.textContent = "Delete";
      deleteButton.onclick = () => {
        chrome.storage.sync.get("topics", function (result) {
          const updatedTopics = result.topics.filter((_, i) => i !== index);
          chrome.storage.sync.set({ topics: updatedTopics }, () => {
            renderTopics(updatedTopics);
            notifyContentScript();
          });
        });
      };

      li.appendChild(editButton);
      li.appendChild(deleteButton);
      topicsList.appendChild(li);
    });
  }

  function renderHiddenTopics(hiddenTopics) {
    hiddenTopicsList.innerHTML = "";
    hiddenTopics.forEach((topic, index) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.textContent = topic;

      const editButton = document.createElement("button");
      editButton.className = "btn btn-warning btn-sm";
      editButton.textContent = "Edit";
      editButton.onclick = () => {
        const newTopic = prompt("Edit topic:", topic);
        if (newTopic) {
          chrome.storage.sync.get("hiddenTopics", function (result) {
            const updatedHiddenTopics = result.hiddenTopics;
            updatedHiddenTopics[index] = newTopic;
            chrome.storage.sync.set(
              { hiddenTopics: updatedHiddenTopics },
              () => {
                renderHiddenTopics(updatedHiddenTopics);
                notifyContentScript();
              }
            );
          });
        }
      };

      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.textContent = "Delete";
      deleteButton.onclick = () => {
        chrome.storage.sync.get("hiddenTopics", function (result) {
          const updatedHiddenTopics = result.hiddenTopics.filter(
            (_, i) => i !== index
          );
          chrome.storage.sync.set({ hiddenTopics: updatedHiddenTopics }, () => {
            renderHiddenTopics(updatedHiddenTopics);
            notifyContentScript();
          });
        });
      };

      li.appendChild(editButton);
      li.appendChild(deleteButton);
      hiddenTopicsList.appendChild(li);
    });
  }

  function notifyContentScript() {
    chrome.runtime.sendMessage({ type: "updateFilter" });
  }

  function showLoading() {
    loadingOverlay.style.display = "flex";
  }

  function hideLoading() {
    loadingOverlay.style.display = "none";
  }

  addTopicButton.addEventListener("click", () => {
    const newTopic = newTopicInput.value.trim();
    if (newTopic) {
      chrome.storage.sync.get("topics", function (result) {
        const updatedTopics = result.topics || [];
        updatedTopics.push(newTopic);
        chrome.storage.sync.set({ topics: updatedTopics }, () => {
          renderTopics(updatedTopics);
          newTopicInput.value = "";
          notifyContentScript();
        });
      });
    }
  });

  addHiddenTopicButton.addEventListener("click", () => {
    const newHiddenTopic = newHiddenTopicInput.value.trim();
    if (newHiddenTopic) {
      chrome.storage.sync.get("hiddenTopics", function (result) {
        const updatedHiddenTopics = result.hiddenTopics || [];
        updatedHiddenTopics.push(newHiddenTopic);
        chrome.storage.sync.set({ hiddenTopics: updatedHiddenTopics }, () => {
          renderHiddenTopics(updatedHiddenTopics);
          newHiddenTopicInput.value = "";
          notifyContentScript();
        });
      });
    }
  });

  toggleFilterButton.addEventListener("click", () => {
    chrome.storage.sync.get("filterEnabled", function (result) {
      const isEnabled = result.filterEnabled !== false;
      chrome.storage.sync.set({ filterEnabled: !isEnabled }, () => {
        toggleFilterButton.textContent = isEnabled
          ? "Enable Filter"
          : "Disable Filter";
        notifyContentScript();
      });
    });
  });

  detoxifyFeedButton.addEventListener("click", () => {
    showLoading();
    chrome.runtime.sendMessage({ action: "detoxifyFeed" }, (response) => {
      hideLoading();
      if (response && response.success) {
        alert("Feed detoxified successfully.");
      } else {
        alert("Error detoxifying feed.");
      }
    });
  });

  chrome.storage.sync.get("topics", function (result) {
    renderTopics(result.topics || []);
  });

  chrome.storage.sync.get("hiddenTopics", function (result) {
    renderHiddenTopics(result.hiddenTopics || []);
  });

  chrome.storage.sync.get("filterEnabled", function (result) {
    toggleFilterButton.textContent = result.filterEnabled
      ? "Disable Filter"
      : "Enable Filter";
  });
});
