const cbx = document.querySelector("input");
chrome.storage.sync.get("enabled", ({ enabled }) => {
  if (enabled === undefined) {
    chrome.storage.sync.set({ enabled: true });
    enabled = true;
  }
  cbx.checked = enabled;
});
cbx.addEventListener("change", async () => {
  chrome.storage.sync.set({ enabled: cbx.checked });
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { enabled: cbx.checked });
    }
  });
});
