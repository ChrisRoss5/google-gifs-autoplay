declare const chrome: any;

const regexFilter = /client=img|tbm=isch|VisualFrontendUi/;
const isImageSearch = regexFilter.test(location.href);
const mouseEvent = new MouseEvent("mousedown", {
  bubbles: true,
});

if (isImageSearch) {
  log("Image search detected.");
  chrome.storage.sync.get("enabled", ({ enabled }: { enabled?: boolean }) => {
    if (enabled === undefined) {
      chrome.storage.sync.set({ enabled: true });
      enabled = true;
    }
    log("Extension " + (enabled ? "enabled." : "disabled."));
    if (enabled) main();
  });

  chrome.runtime.onMessage.addListener(({ enabled }: { enabled: boolean }) => {
    if (enabled) main();
    else location.reload();
  });
}

function main() {
  const searchResultsContainer = document.querySelector(".islrc");
  if (!searchResultsContainer)
    return log("Search results container not found!", true);
  const sideResultsContainer = document.querySelector("#islsp");

  addGifsButton();
  updateSearchResults(searchResultsContainer);

  const resultsObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations)
      for (const child of mutation.addedNodes)
        if (child instanceof HTMLElement && child.classList.contains("isnpr"))
          updateSearchResults(child);
  });

  const sideResultsObserver = new MutationObserver(() => {
    const lists = sideResultsContainer!.querySelectorAll("[role=list]");
    lists.forEach(updateSearchResults);
  });

  resultsObserver.observe(searchResultsContainer, { childList: true });
  if (sideResultsContainer)
    sideResultsObserver.observe(sideResultsContainer, { childList: true, subtree: true });
  else log("Side results container not found!", true);
}

function updateSearchResults(searchResultsContainer: Element) {
  for (const item of searchResultsContainer.children) {
    if (item.classList.contains("isnpr")) {
      updateSearchResults(item);
      continue;
    }
    const a = item.querySelector("a");
    const img = a?.querySelector("img");
    if (!a || !img) continue;

    let originalSrc: string;
    let gifSrc: string;

    const initSrcObserver = () =>
      srcObserver.observe(img, {
        attributeFilter: ["src"],
        attributeOldValue: true,
      });

    const hrefObserver = new MutationObserver(() => {
      const decodedUrl = decodeURIComponent(a.href);
      const startIdx = decodedUrl.indexOf("=http");
      let endIdx = decodedUrl.indexOf(".gif&");
      if (endIdx == -1) endIdx = decodedUrl.lastIndexOf(".gif");
      gifSrc = decodedUrl.slice(startIdx + 1, endIdx + 4);
      if (!gifSrc) return;
      hrefObserver.disconnect();
      originalSrc = img.src;
      if (originalSrc) setGif();
      initSrcObserver();
    });

    // Keeping the src attribute immutable if a gif has been set.
    // Similar to Object.freeze() but for HTML elements.
    const srcObserver = new MutationObserver((mutations) => {
      const target = mutations[0].target as HTMLImageElement;
      srcObserver.disconnect();
      if (!originalSrc) {
        originalSrc = target.src;
        setGif();
      } else {
        target.src = img.dataset.src = mutations[0].oldValue!;
      }
      initSrcObserver();
    });

    const setGif = () => {
      img.loading = "lazy";
      img.src = img.dataset.src = gifSrc;
      img.onerror = () => {
        srcObserver.disconnect();
        img.onerror = null;
        img.src = img.dataset.src = originalSrc;
      };
    };

    hrefObserver.observe(a, { attributeFilter: ["href"] });

    a.dispatchEvent(mouseEvent);
  }
}

async function addGifsButton() {
  const gifsParam = "&tbs=itp:animated";
  if (location.href.includes(gifsParam)) return;

  const activeItem = document.querySelector("[aria-current=page]");
  const nextItem = activeItem?.nextElementSibling;
  if (!nextItem) return log("Next item not found!", true);

  const clone = nextItem.cloneNode(true) as HTMLAnchorElement;
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("images/original.png");
  img.style.height = "1rem";
  clone.textContent = "";
  clone.appendChild(img);
  clone.href = location.href + gifsParam;
  activeItem.insertAdjacentElement("afterend", clone);
}

function log(message: string, isError = false) {
  message = "%c[Gifs autoplay for Google™]%c " + message;
  if (isError) message += " Please report this issue.";
  console.log(message, "color: #C55A11", "color: initial");
}
