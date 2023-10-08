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
Object.defineProperty(exports, "__esModule", { value: true });
const regexFilter = /client=img|tbm=isch|VisualFrontendUi/;
const isImageSearch = regexFilter.test(location.href);
const mouseEvent = new MouseEvent("mousedown", {
    bubbles: true,
});
const visitedSearchResults = [];
if (isImageSearch) {
    log("Image search detected.");
    chrome.storage.sync.get("enabled", ({ enabled }) => {
        if (enabled === undefined) {
            chrome.storage.sync.set({ enabled: true });
            enabled = true;
        }
        log("Extension " + (enabled ? "enabled." : "disabled."));
        if (enabled)
            main();
    });
    chrome.runtime.onMessage.addListener(({ enabled }) => {
        if (enabled)
            main();
        else
            location.reload();
    });
}
function main() {
    addGifsButton();
    observerSolution();
}
function observerSolution() {
    const searchResultsContainer = document.querySelector(".islrc");
    const sideResultsContainer = document.querySelector("#islsp");
    const searchResultsObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations)
            for (const container of mutation.addedNodes)
                if (container instanceof HTMLElement)
                    updateSearchResults(container);
    });
    const sideResultsObserver = new MutationObserver(() => {
        updateSearchResults(sideResultsContainer);
    });
    if (searchResultsContainer)
        searchResultsObserver.observe(searchResultsContainer, { childList: true });
    else
        log("Search results container not found!", true);
    if (sideResultsContainer)
        sideResultsObserver.observe(sideResultsContainer, {
            childList: true,
            subtree: true,
        });
    else
        log("Side results container not found!", true);
    if (searchResultsContainer && sideResultsContainer)
        updateSearchResults(searchResultsContainer);
    else
        intervalSolution(); // Fallback
}
function intervalSolution() {
    setInterval(updateSearchResults, 1000);
}
function updateSearchResults(container = document) {
    container === null || container === void 0 ? void 0 : container.querySelectorAll("a.islib").forEach(updateSearchResult);
}
function updateSearchResult(searchResult) {
    if (visitedSearchResults.includes(searchResult))
        return;
    visitedSearchResults.push(searchResult);
    const img = searchResult.querySelector("img");
    if (!img)
        return;
    const hrefObserver = new MutationObserver(() => {
        const decodedUrl = decodeURIComponent(searchResult.href);
        const startIdx = decodedUrl.indexOf("=http");
        let endIdx = decodedUrl.indexOf(".gif&");
        if (endIdx == -1)
            endIdx = decodedUrl.lastIndexOf(".gif");
        const gifSrc = decodedUrl.slice(startIdx + 1, endIdx + 4);
        if (!gifSrc)
            return;
        hrefObserver.disconnect();
        img.insertAdjacentElement("afterend", createGif(gifSrc));
        img.loading = "lazy";
    });
    hrefObserver.observe(searchResult, { attributeFilter: ["href"] });
    searchResult.dispatchEvent(mouseEvent);
}
function createGif(src) {
    const gif = document.createElement("img");
    gif.style.setProperty("position", "absolute", "important");
    gif.style.setProperty("top", "0", "important");
    gif.style.setProperty("left", "0", "important");
    gif.style.setProperty("width", "100%", "important");
    gif.style.setProperty("height", "100%", "important");
    gif.style.setProperty("pointer-events", "none", "important");
    gif.loading = "lazy";
    gif.src = src;
    gif.onerror = () => gif.remove();
    return gif;
}
function addGifsButton() {
    return __awaiter(this, void 0, void 0, function* () {
        const gifsSearchParam = "&tbs=itp:animated";
        if (location.href.includes(gifsSearchParam))
            return;
        const activeItem = document.querySelector("[aria-current=page]");
        const nextItem = activeItem === null || activeItem === void 0 ? void 0 : activeItem.nextElementSibling;
        if (!nextItem)
            return log("Next item not found!", true);
        const clone = nextItem.cloneNode(true);
        const img = document.createElement("img");
        img.src = chrome.runtime.getURL("images/original.png");
        img.style.height = "1rem";
        clone.textContent = "";
        clone.appendChild(img);
        clone.href = location.href + gifsSearchParam;
        activeItem.insertAdjacentElement("afterend", clone);
    });
}
function log(message, isError = false) {
    message = "%c[Gifs autoplay for Google™]%c " + message;
    if (isError)
        message += " Please report this issue.";
    console.log(message, "color: #C55A11", "color: initial");
}
