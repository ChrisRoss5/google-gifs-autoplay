const regexFilter = /client=img|tbm=isch|VisualFrontendUi/;
const isImageSearch = regexFilter.test(location.href);

declare const chrome: any;

if (isImageSearch) {
  console.log("[Gifs autoplay for Google™] Image search detected!");
  chrome.storage.sync.get("enabled", ({ enabled }: { enabled?: boolean }) => {
    if (enabled === undefined) {
      chrome.storage.sync.set({ enabled: true });
      enabled = true;
    }
    if (enabled) {
      console.log("[Gifs autoplay for Google™] Enabled!");
      main();
    }
  });
}

chrome.runtime.onMessage.addListener(({ enabled }: { enabled: boolean }) => {
  if (enabled) main();
  else location.reload();
});

function main() {
  const mouseEvent = new MouseEvent("mousedown", {
    bubbles: true,
  });

  const searchResultsContainer = document.querySelector(".islrc");
  if (!searchResultsContainer) {
    console.error(
      "[Gifs autoplay for Google™] Search results container not found!"
    );
    return;
  }

  updateSearchResults(searchResultsContainer);

  const resultsObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const child of mutation.addedNodes) {
        if (child instanceof HTMLElement && child.classList.contains("isnpr")) {
          updateSearchResults(child);
        }
      }
    }
  });

  resultsObserver.observe(searchResultsContainer, { childList: true });

  function updateSearchResults(searchResultsContainer: Element) {
    for (const item of searchResultsContainer.children) {
      if (item.classList.contains("isnpr")) {
        updateSearchResults(item);
        continue;
      }
      const a = item.querySelector("a");
      const img = a?.querySelector("img");
      if (!a || !img) continue;

      const hrefObserver = new MutationObserver(() => {
        const decodedUrl = decodeURIComponent(a.href);
        const startIdx = decodedUrl.indexOf("=http");
        let endIdx = decodedUrl.indexOf(".gif&");
        if (endIdx == -1) endIdx = decodedUrl.lastIndexOf(".gif");
        const url = decodedUrl.slice(startIdx + 1, endIdx + 4);
        if (url) {
          img.src = url;
          hrefObserver.disconnect();
          srcObserver.observe(img, {
            attributeFilter: ["src"],
            attributeOldValue: true,
          });
        }
      });

      // Keeping the src attribute immutable if a gif has been set.
      // Similar to Object.freeze() but for HTML elements.
      const srcObserver = new MutationObserver((mutations) => {
        srcObserver.disconnect();
        const target = mutations[0].target as HTMLImageElement;
        target.src = mutations[0].oldValue!;
        srcObserver.observe(target, {
          attributeFilter: ["src"],
          attributeOldValue: true,
        });
      });

      hrefObserver.observe(a, { attributeFilter: ["href"] });

      a.dispatchEvent(mouseEvent);
    }
  }
}
