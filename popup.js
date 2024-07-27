document.addEventListener("DOMContentLoaded", function () {
  const newTopicInput = document.getElementById("newTopic");
  const addTopicButton = document.getElementById("addTopic");
  const topicsList = document.getElementById("topicsList");
  const toggleFilterButton = document.getElementById("toggleFilter");

  function renderTopics(topics) {
    topicsList.innerHTML = "";
    topics.forEach((topic, index) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.textContent = topic;

      // Edit button
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
            });
          });
        }
      };

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.textContent = "Delete";
      deleteButton.onclick = () => {
        chrome.storage.sync.get("topics", function (result) {
          const updatedTopics = result.topics.filter((_, i) => i !== index);
          chrome.storage.sync.set({ topics: updatedTopics }, () => {
            renderTopics(updatedTopics);
          });
        });
      };

      li.appendChild(editButton);
      li.appendChild(deleteButton);
      topicsList.appendChild(li);
    });
  }

  // Add a new topic
  addTopicButton.addEventListener("click", function () {
    const newTopic = newTopicInput.value.trim();
    if (newTopic) {
      chrome.storage.sync.get("topics", function (result) {
        const updatedTopics = [...(result.topics || []), newTopic];
        chrome.storage.sync.set({ topics: updatedTopics }, () => {
          newTopicInput.value = "";
          renderTopics(updatedTopics);
        });
      });
    }
  });

  // Toggle the filter
  toggleFilterButton.addEventListener("click", function () {
    chrome.storage.sync.get("filterEnabled", function (result) {
      const newStatus = !result.filterEnabled;
      chrome.storage.sync.set({ filterEnabled: newStatus }, () => {
        toggleFilterButton.textContent = newStatus
          ? "Disable Filter"
          : "Enable Filter";
      });
    });
  });

  // Initialize the UI
  chrome.storage.sync.get(["topics", "filterEnabled"], function (result) {
    renderTopics(result.topics || []);
    toggleFilterButton.textContent = result.filterEnabled
      ? "Disable Filter"
      : "Enable Filter";
  });
});
