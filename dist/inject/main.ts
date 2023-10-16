// ExecutionWorld: "ISOLATED"
// Run at: "document_start"

let missingContainers = false;
let gifsBatchData = "";

const mouseEvent = new MouseEvent("mousedown", {
  bubbles: true,
});

/* -------------------------------------- */

(function injectXhr() {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("inject/xhr.js");
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
})();

window.addEventListener("message", (event) => {
  if (event.data.type != "GIFS_AUTOPLAY") return;
  gifsBatchData += event.data.text;
  if (missingContainers) updateSearchResults();
});

/* -------------------------------------- */

chrome.storage.sync.get("enabled", ({ enabled }: { enabled?: boolean }) => {
  const regexFilter = /client=img|tbm=isch|VisualFrontendUi|imgres/;
  const isImageSearch = regexFilter.test(location.href);
  if (!isImageSearch) return;
  customLog("Image search detected.");
  if (enabled === undefined) {
    chrome.storage.sync.set({ enabled: true });
    enabled = true;
  }
  customLog("Extension " + (enabled ? "enabled." : "disabled."));
  if (!enabled) return;
  if (document.readyState != "loading") main();
  else document.addEventListener("DOMContentLoaded", main);
});

chrome.runtime.onMessage.addListener(({ enabled }: { enabled: boolean }) => {
  if (enabled) main();
  else location.reload();
});

/* -------------------------------------- */

function main() {
  addGifsButton();
  loadGifsBatchData();
  observerSolution();
  updateSearchResults();
}

function loadGifsBatchData() {
  document.querySelectorAll("script").forEach((script) => {
    gifsBatchData += script.textContent || "";
  });
}

function observerSolution() {
  const searchResultsContainer = document.querySelector(".islrc");
  const sideResultsContainer = document.querySelector("#islsp");
  const searchResultsObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations)
      for (const container of mutation.addedNodes)
        if (container instanceof HTMLElement) updateSearchResults(container);
  });
  const sideResultsObserver = new MutationObserver(() => {
    updateSearchResults(sideResultsContainer);
  });

  if (searchResultsContainer) {
    searchResultsObserver.observe(searchResultsContainer, {
      childList: true,
    });
    updateSearchResults(searchResultsContainer);
  } else customLog("Search results container not found!");

  if (sideResultsContainer) {
    sideResultsObserver.observe(sideResultsContainer, {
      childList: true,
      subtree: true,
    });
    updateSearchResults(sideResultsContainer);
  } else customLog("Side results container not found!");

  if (!searchResultsContainer || !sideResultsContainer) {
    missingContainers = true;
    intervalSolution();
  }
}

function intervalSolution() {
  setInterval(updateSearchResults, 3000);
}

function updateSearchResults(container: Document | Element | null = document) {
  //const tmp = container == document ? "document" : "container";
  //customLog(`Executing updateSearchResults() on ${tmp}`);
  container
    ?.querySelectorAll<HTMLAnchorElement>("a.islib")
    .forEach(updateSearchResult);
}

function updateSearchResult(searchResult: HTMLAnchorElement) {
  const isUpdated = () => !!searchResult.querySelector(".gifs-autoplay-gif");
  if (isUpdated()) return;

  const img = searchResult.querySelector("img");
  if (!img) return;
  const container = searchResult.closest("[data-id]");
  const id = container?.getAttribute("data-id");
  const gifSrc = id ? findGifFromBatch(id) : undefined;

  const insertGif = (gifSrc: string) => {
    img.insertAdjacentElement("afterend", createGif(gifSrc));
    img.loading = "lazy";
  };

  if (gifSrc) return insertGif(gifSrc);

  const hrefObserver = new MutationObserver(() => {
    const gifSrc = findGifFromHref(searchResult.href);
    if (!gifSrc) return;
    hrefObserver.disconnect();
    insertGif(gifSrc);
  });

  hrefObserver.observe(searchResult, { attributeFilter: ["href"] });
  searchResult.dispatchEvent(mouseEvent);
}

function findGifFromBatch(gifId: string) {
  const idx = gifsBatchData.indexOf(gifId);
  if (idx == -1) return;
  const idx2 = gifsBatchData.indexOf('"http', idx);
  if (idx2 == -1) return;
  const idx3 = gifsBatchData.indexOf('"http', idx2 + 5);
  if (idx3 == -1) return;
  let idx4 = gifsBatchData.indexOf('"', idx3 + 5);
  if (gifsBatchData[idx4 - 1] == "\\") idx4--;
  const url = gifsBatchData.slice(idx3 + 1, idx4);
  return String.raw`${url}`.replace(/\\\\u003d/g, "=").replace(/\\u003d/g, "=");
}

function findGifFromHref(href: string) {
  const decodedUrl = decodeURIComponent(href);
  const startIdx = decodedUrl.indexOf("=http");
  let endIdx = decodedUrl.indexOf(".gif&");
  if (endIdx == -1) endIdx = decodedUrl.lastIndexOf(".gif");
  return decodedUrl.slice(startIdx + 1, endIdx + 4);
}

function createGif(src: string) {
  const gif = document.createElement("img");
  gif.className = "gifs-autoplay-gif";
  gif.style.setProperty("position", "absolute", "important");
  gif.style.setProperty("top", "0", "important");
  gif.style.setProperty("left", "0", "important");
  gif.style.setProperty("width", "100%", "important");
  gif.style.setProperty("height", "100%", "important");
  gif.loading = "lazy";
  gif.src = src;
  gif.onerror = () => {
    gif.remove();
    //customLog("Gif error:" + src, true);
  };
  return gif;
}

async function addGifsButton() {
  const gifsSearchParam = "&tbs=itp:animated";
  if (location.href.includes(gifsSearchParam)) return;

  const activeItem = document.querySelector("[aria-current=page]");
  const nextItem = activeItem?.nextElementSibling;
  if (!nextItem) return customLog("Next item not found!", true);

  const clone = nextItem.cloneNode(true) as HTMLAnchorElement;
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("images/original.png");
  img.style.height = "1rem";
  img.style.verticalAlign = "middle";
  clone.textContent = "";
  clone.appendChild(img);
  clone.href = location.href + gifsSearchParam;
  activeItem.insertAdjacentElement("afterend", clone);
}

function customLog(message: string, isWarning = false) {
  message = "%c[Gifs autoplay for Google™]%c " + message;
  if (isWarning)
    message += " Please report this issue to:\n" + "kristijan.ros@gmail.com";
  console[isWarning ? "warn" : "log"](
    message,
    "color: #C55A11",
    "color: initial"
  );
}
