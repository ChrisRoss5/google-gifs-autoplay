chrome.runtime.onInstalled.addListener(async () => {
  let { enabled, rulesetEnabled, columnCount } = await chrome.storage.sync.get([
    "enabled",
    "rulesetEnabled",
    "columnCount",
  ]);

  enabled = enabled === undefined ? true : enabled;
  rulesetEnabled = rulesetEnabled === undefined ? false : rulesetEnabled;
  columnCount = columnCount === undefined ? 8 : columnCount;

  if (enabled && rulesetEnabled) applyRules();
  else removeRules();

  chrome.storage.sync.set({ enabled, rulesetEnabled, columnCount });
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (changes.enabled || changes.rulesetEnabled) {
    let { enabled, rulesetEnabled } = await chrome.storage.sync.get([
      "enabled",
      "rulesetEnabled",
    ]);
    if (enabled && rulesetEnabled) applyRules();
    else removeRules();
  }
});

const rules: chrome.declarativeNetRequest.UpdateRuleOptions = {
  removeRuleIds: [1],
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "user-agent",
            operation: "set",
            value:
              "Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
          },
        ],
      },
      condition: {
        resourceTypes: ["main_frame", "xmlhttprequest"],
        regexFilter:
          // /async/callback is for additional image request after selecting one image
          // /async/imgv is for additional image requests, just in case the link was from desktop
          // udm=2 is newer param for image search, tbm=isch is the older one
          "^https?://[^/]*google.[^/]*/(search|async/(callback|imgv)).*[?&](tbm=isch|udm=2)",
      },
    },
  ],
};

function applyRules() {
  try {
    return chrome.declarativeNetRequest.updateDynamicRules(rules);
  } catch (e) {
    console.warn("failed to apply rules", e);
  }
}

function removeRules() {
  try {
    return chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: (rules.addRules || []).map((r) => r.id),
    });
  } catch (e) {
    console.warn("failed to remove rules", e);
  }
}
