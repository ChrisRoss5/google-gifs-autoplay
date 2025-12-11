// ExecutionWorld: "ISOLATED"
// Run at: "document_start"

// The same regex is explained in declarativeNetRequest rules (background/service-worker.ts)
const regex =
  /^https?:\/\/[^/]*google\.[^/]*\/(search|async\/(callback|imgv)).*[?&](tbm=isch|udm=2)/;

/* STORAGE ------------------------------------------------------------------------------- */

type FullStorage = {
  enabled: boolean;
  rulesetEnabled: boolean;
  columnCount: number;
};

(() => {
  if (!regex.test(location.href)) return;

  chrome.storage.sync.get(
    ["enabled", "rulesetEnabled", "columnCount"],
    ({ enabled, rulesetEnabled, columnCount }: FullStorage) => {
      customLog("Extension " + (enabled ? "enabled." : "disabled."));

      if (!enabled) return;

      customLog(
        "Custom user agent " + (rulesetEnabled ? "enabled." : "disabled.")
      );

      if (rulesetEnabled) solutionA(columnCount);
      else solutionB();
    }
  );

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled || changes.rulesetEnabled)
      return setTimeout(() => location.reload(), 500);

    if (changes.columnCount) solutionA(Number(changes.columnCount.newValue));
  });
})();

/* SOLUTIONS ------------------------------------------------------------------------------- */

function solutionA(columnCount: number) {
  document.documentElement.setAttribute("gifs-autoplay-css-ready", "true");
  document.documentElement.style.setProperty(
    "--gifs-autoplay-column-count",
    `${columnCount}`
  );
}

function solutionB() {
  const resolvedImageEls = new Set<HTMLImageElement>();
  let imageEls: NodeListOf<HTMLImageElement>;
  // let unparsedSearchSource = "";

  injectXhrInterceptor();
  listenForMessagesFromInterceptor();

  if (DOMContentLoaded) init();
  else addEventListener("DOMContentLoaded", init);

  function init() {
    updateImages(getParsedSearchSource(), true);
  }

  function injectXhrInterceptor() {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("inject/xhr.js");
    s.onload = () => s.remove();
    document.documentElement.appendChild(s);
  }

  function listenForMessagesFromInterceptor() {
    addEventListener("message", (event) => {
      if (event.data.type !== "GIFS_AUTOPLAY") return;
      // unparsedSearchSource += event.data.text;
      setTimeout(() => updateImages(event.data.text, false), 200);
      setTimeout(() => updateImages(event.data.text, false), 2000); // in case of mega slow CPU
    });
  }

  function getParsedSearchSource() {
    let searchSource = "";
    const scriptEls = document.querySelectorAll("script");
    scriptEls.forEach((script) => (searchSource += script.textContent));
    return searchSource;
  }

  function updateImages(searchSource: string, isSourceParsed = true) {
    let searchIndex = 0;

    imageEls = document.querySelectorAll("img");
    imageEls.forEach((imageEl) => {
      if (resolvedImageEls.has(imageEl)) return;

      const containerEl = imageEl.closest("[data-docid]") as HTMLElement | null;
      if (!containerEl) return;
      const id = containerEl?.dataset.docid;
      if (!id) return;
      const result = findGifSrc(id, searchSource, searchIndex, isSourceParsed);
      if (!result) return;

      searchIndex = result.index;
      updateImage(imageEl, result.gifSrc);

      resolvedImageEls.add(imageEl);
    });
  }

  function updateImage(imageEl: HTMLImageElement, gifSrc: string) {
    imageEl.loading = "lazy";
    imageEl.parentElement?.style.setProperty(
      "position",
      "relative",
      "important"
    );
    imageEl.insertAdjacentElement("afterend", createGif(gifSrc));
  }

  function findGifSrc(
    id: string,
    searchSource: string,
    searchIndex = 0,
    isSourceParsed = true
  ) {
    const target = isSourceParsed ? `"${id}",` : `"${id}\\",`;

    searchIndex = searchSource.indexOf(target, searchIndex);

    if (searchIndex === -1) return;

    for (let i = 0; i < 2; i++) {
      const startQuoteIndex = searchSource.indexOf('"http', searchIndex);
      if (startQuoteIndex === -1) return;

      const urlStartIndex = startQuoteIndex + 1;
      const urlEndIndex = searchSource.indexOf(
        isSourceParsed ? '"' : '\\"',
        urlStartIndex
      );
      if (urlEndIndex === -1) return;

      let rawUrl = searchSource.slice(urlStartIndex, urlEndIndex);
      try {
        rawUrl = JSON.parse(`"${rawUrl}"`);
      } catch (e) {
        return;
      }

      if (rawUrl.includes("gstatic.") && !rawUrl.endsWith(".gif")) {
        searchIndex = urlEndIndex;
        continue;
      }

      return { gifSrc: rawUrl, index: searchIndex };
    }
  }

  function createGif(src: string) {
    const gif = document.createElement("img");
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
}

/* UTILS ------------------------------------------------------------------------------- */

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

// NOT using readyState because we want to catch the moment when DOMContentLoaded has fired,
// meaning that the deferred and module scripts have executed!
// https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState
let DOMContentLoaded = false;
addEventListener("DOMContentLoaded", () => (DOMContentLoaded = true));
