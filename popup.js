document.addEventListener("DOMContentLoaded", function () {
  const newTopicInput = document.getElementById("newTopic");
  const addTopicButton = document.getElementById("addTopic");
  const topicsList = document.getElementById("topicsList");
  const newHiddenTopicInput = document.getElementById("newHiddenTopic");
  const addHiddenTopicButton = document.getElementById("addHiddenTopic");
  const hiddenTopicsList = document.getElementById("hiddenTopicsList");
  const toggleFilterButton = document.getElementById("toggleFilter");
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

  addTopicButton.addEventListener("click", function () {
    const newTopic = newTopicInput.value.trim();
    if (newTopic) {
      chrome.storage.sync.get("topics", function (result) {
        const updatedTopics = [...(result.topics || []), newTopic];
        chrome.storage.sync.set({ topics: updatedTopics }, () => {
          newTopicInput.value = "";
          renderTopics(updatedTopics);
          notifyContentScript();
        });
      });
    }
  });

  addHiddenTopicButton.addEventListener("click", function () {
    const newHiddenTopic = newHiddenTopicInput.value.trim();
    if (newHiddenTopic) {
      chrome.storage.sync.get("hiddenTopics", function (result) {
        const updatedHiddenTopics = [
          ...(result.hiddenTopics || []),
          newHiddenTopic,
        ];
        chrome.storage.sync.set({ hiddenTopics: updatedHiddenTopics }, () => {
          newHiddenTopicInput.value = "";
          renderHiddenTopics(updatedHiddenTopics);
          notifyContentScript();
        });
      });
    }
  });

  toggleFilterButton.addEventListener("click", function () {
    chrome.storage.sync.get("filterEnabled", function (result) {
      const newStatus = !result.filterEnabled;
      chrome.storage.sync.set({ filterEnabled: newStatus }, () => {
        updateToggleButton(newStatus);
        toggleContentVisibility(newStatus);
        notifyContentScript();
      });
    });
  });

  chrome.storage.sync.get(
    ["topics", "hiddenTopics", "filterEnabled"],
    function (result) {
      renderTopics(result.topics || []);
      renderHiddenTopics(result.hiddenTopics || []);
      updateToggleButton(result.filterEnabled);
      toggleContentVisibility(result.filterEnabled);
    }
  );

  function toggleContentVisibility(isEnabled) {
    const displayStyle = isEnabled ? "block" : "none";
    content.style.display = displayStyle;
  }

  function updateToggleButton(isEnabled) {
    toggleFilterButton.textContent = isEnabled
      ? "Disable Filter"
      : "Enable Filter";
    toggleFilterButton.classList.toggle("bg-danger", isEnabled);
    toggleFilterButton.classList.toggle("bg-primary", !isEnabled);
    if (!isEnabled) {
      toggleFilterButton.classList.add("toggle-button-circle");
    } else {
      toggleFilterButton.classList.remove("toggle-button-circle");
    }
  }

  function notifyContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "updateFilter" });
    });
  }
});
