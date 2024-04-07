// ExecutionWorld: "ISOLATED"
// Run at: "document_start"

/* XHR LISTENER INJECTION AND BATCH DATA STRING SEARCHING

// This way we can listen for messages from the page's XHR requests.
// For future implementation on mobile devices...
let gifsBatchData = "";

(function injectXhr() {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("inject/xhr.js");
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
})();

window.addEventListener("message", (event) => {
  if (event.data.type != "GIFS_AUTOPLAY") return;
  gifsBatchData += event.data.text;
  updateSearchResults();
});

*/

chrome.storage.sync.get("enabled", ({ enabled }: { enabled?: boolean }) => {
  /* Old regex: /client=img|tbm=isch|VisualFrontendUi|imgres/;
  New Example:
  https://www.google.com/search?q=gifs&sca_esv=84c550665db3d809&sca_upv=1&udm=2&biw=1078&bih=983&sxsrf=ACQVn09pOPXM0BOqaZWt9DTChQcyahfKSA%3A1712237442629&ei=gqsOZtHKJdmXxc8P4u2k8Ak&ved=0ahUKEwjRk6fE1aiFAxXZS_EDHeI2CZ4Q4dUDCBA&uact=5&oq=gifs&gs_lp=Egxnd3Mtd2l6LXNlcnAiBGdpZnNIAFAAWABwAHgAkAEAmAEAoAEAqgEAuAEDyAEAmAIAoAIAmAMAkgcAoAcA&sclient=gws-wiz-serp
  */
  const regexFilter = /\/search/;
  const isImageSearch = regexFilter.test(location.href);
  if (!isImageSearch) return;
  if (enabled === undefined) {
    enabled = true;
    chrome.storage.sync.set({ enabled });
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

const mouseEvents = ["mouseover", "mousedown"].map(
  (type) => new MouseEvent(type, { bubbles: true })
);

let searchResultsContainer: HTMLDivElement;
let sideResultsContainer: HTMLDivElement;

function main() {
  searchResultsContainer = document.querySelector("[jscontroller='XW992c']")!;
  sideResultsContainer = document.querySelector("#TWfxFb")!;
  if (searchResultsContainer) addGifsButton();
  else intervalSolution(3000);
  // loadGifsBatchData();
  observerSolution();
  updateSearchResults();
}

/* function loadGifsBatchData() {
  document.querySelectorAll("script").forEach((script) => {
    gifsBatchData += script.textContent || "";
  });
} */

function observerSolution() {
  const searchResultsObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations)
      for (const container of mutation.addedNodes)
        if (container instanceof HTMLElement) updateSearchResults(container);
  });
  const sideResultsObserver = new MutationObserver(() => {
    updateSearchResults(sideResultsContainer);
  });
  if (searchResultsContainer)
    searchResultsObserver.observe(searchResultsContainer, {
      childList: true,
    });
  if (sideResultsContainer)
    sideResultsObserver.observe(sideResultsContainer, {
      childList: true,
      subtree: true,
    });
}

function intervalSolution(interval: number) {
  setInterval(updateSearchResults, interval);
}

function updateSearchResults(container: Document | Element | null = document) {
  // const tmp = container == document ? "document" : "container";
  // customLog(`Executing updateSearchResults() on ${tmp}`);
  container
    ?.querySelectorAll<HTMLImageElement>("a img[jsname='Q4LuWd'], a img.YQ4gaf")
    .forEach(updateSearchResult);
}

const visitedImages = new Set<HTMLImageElement>();

function updateSearchResult(image: HTMLImageElement) {
  if (visitedImages.has(image)) return;
  visitedImages.add(image);
  const a = image.closest("a")!;

  const insertGif = (gifSrc: string) => {
    image.insertAdjacentElement("afterend", createGif(gifSrc));
    image.loading = "lazy";
    image.parentElement?.style.setProperty("position", "relative", "important");
  };

  /* const container = image.closest("[jscontroller='qKrDxc']");
  const id = container?.getAttribute("jsdata")?.split(";").pop();
  const gifSrc = id ? findGifFromBatch(id) : undefined;
  if (gifSrc) return insertGif(gifSrc); */

  const hrefObserver = new MutationObserver(() => {
    const gifSrc = findGifFromHref(a.href);
    if (!gifSrc) return;
    hrefObserver.disconnect();
    if (a.querySelector(".gifs-autoplay-gif")) return;
    insertGif(gifSrc);
  });

  hrefObserver.observe(a, { attributeFilter: ["href"] });
  mouseEvents.forEach((mouseEvent) => image.dispatchEvent(mouseEvent));
}

/* function findGifFromBatch(gifId: string) {
  const idx = gifsBatchData.indexOf(gifId);
  const endIdx = gifsBatchData.indexOf(".gif", idx);
  const startIdx = gifsBatchData.lastIndexOf("http", endIdx);
  if (idx == -1 || endIdx == -1 || startIdx == -1) return;
  const url = gifsBatchData.slice(startIdx, endIdx + 4);
  return String.raw`${url}`.replace(/\\\\u003d/g, "=").replace(/\\u003d/g, "=");
} */

function findGifFromHref(href: string) {
  const url = new URL(href);
  /* if (!url.searchParams.has("imgurl"))
    console.log("No imgurl param found. + " + href); */
  return url.searchParams.get("imgurl");
}

function createGif(src: string) {
  const gif = document.createElement("img");
  gif.className = "gifs-autoplay-gif";
  gif.style.setProperty("position", "absolute", "important");
  gif.style.setProperty("top", "0", "important");
  gif.style.setProperty("left", "0", "important");
  gif.style.setProperty("width", "100%", "important");
  gif.style.setProperty("height", "100%", "important");
  // gif.style.setProperty("object-fit", "contain", "important");
  gif.loading = "lazy";
  gif.src = src;
  gif.onerror = () => {
    gif.remove();
    // customLog("Gif error:" + src, true);
  };
  return gif;
}

async function addGifsButton() {
  const gifsSearchParam = "&tbs=itp:animated";
  const itemsContainer = document.querySelector(".crJ18e")!;
  const activeItem = itemsContainer.querySelector(
    ":scope > div:has([selected])"
  )!;
  const inactiveItem = itemsContainer.querySelector(
    ":scope > div:not(:has([selected]))"
  )!;
  const activeItemText = activeItem.querySelector(".YmvwI")!.textContent;
  const clone = inactiveItem?.cloneNode(true) as HTMLDivElement;
  const cloneTextHolder = clone?.querySelector(".YmvwI") as HTMLDivElement;

  if (location.href.includes(gifsSearchParam)) {
    activeItem.querySelector(".YmvwI")!.textContent = "GIFs";
    cloneTextHolder.textContent = activeItemText;
    const newLocation = location.href.replace(gifsSearchParam, "");
    cloneTextHolder.closest("a")!.href = newLocation;
    activeItem.insertAdjacentElement("beforebegin", clone);
  } else {
    cloneTextHolder.textContent = "GIFs";
    cloneTextHolder.closest("a")!.href = location.href + gifsSearchParam;
    activeItem.insertAdjacentElement("afterend", clone);
  }
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
