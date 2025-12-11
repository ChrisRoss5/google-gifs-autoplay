"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
chrome.runtime.onInstalled.addListener(() => __awaiter(void 0, void 0, void 0, function* () {
    let { enabled, rulesetEnabled, columnCount } = yield chrome.storage.sync.get([
        "enabled",
        "rulesetEnabled",
        "columnCount",
    ]);
    enabled = enabled === undefined ? true : enabled;
    rulesetEnabled = rulesetEnabled === undefined ? false : rulesetEnabled;
    columnCount = columnCount === undefined ? 8 : columnCount;
    if (enabled && rulesetEnabled)
        applyRules();
    else
        removeRules();
    chrome.storage.sync.set({ enabled, rulesetEnabled, columnCount });
}));
chrome.storage.onChanged.addListener((changes, area) => __awaiter(void 0, void 0, void 0, function* () {
    if (changes.enabled || changes.rulesetEnabled) {
        let { enabled, rulesetEnabled } = yield chrome.storage.sync.get([
            "enabled",
            "rulesetEnabled",
        ]);
        if (enabled && rulesetEnabled)
            applyRules();
        else
            removeRules();
    }
}));
const rules = {
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
                        value: "Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
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
    }
    catch (e) {
        console.warn("failed to apply rules", e);
    }
}
function removeRules() {
    try {
        return chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: (rules.addRules || []).map((r) => r.id),
        });
    }
    catch (e) {
        console.warn("failed to remove rules", e);
    }
}
