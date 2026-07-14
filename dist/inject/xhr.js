"use strict";
// ExecutionWorld: "MAIN" (declared as a content script in manifest.json)
// Run at: "document_start"
// Runs unconditionally on matched pages, even when the extension is toggled off —
// it only posts messages that inject/main.js ignores in that case.
const oldXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
    if (method.toUpperCase() === "GET") {
        this.addEventListener("load", function () {
            if (url instanceof URL)
                url = url.href;
            const type = "GIFS_AUTOPLAY";
            const text = this.responseText;
            postMessage({ type, text }, "*");
        });
    }
    return oldXHROpen.apply(this, arguments);
};
