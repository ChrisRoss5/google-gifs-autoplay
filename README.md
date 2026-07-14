# Gifs autoplay for Google™

Browser extension that autoplays gifs on Google Images — no more hovering or clicking through to see them move.

**Install:**
[Chrome Web Store](https://chrome.google.com/webstore/detail/mfaepkdaodjclepbclabjbigjeohfdje) ·
[Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/gifs-autoplay-for-google)

## How it works

Google Images serves static thumbnails on desktop. The extension offers two strategies, switchable in the popup:

### New solution (default off — "Use new solution")

A `declarativeNetRequest` dynamic rule rewrites the `User-Agent` header to mobile Chrome on Google image-search requests (`tbm=isch` / `udm=2`). Google then serves its mobile page, where gifs animate natively. Injected CSS ([`dist/inject/main.css`](dist/inject/main.css)) re-lays the mobile results out into a masonry-style column layout with a configurable column count (1–20).

### Old solution (default)

Keeps the desktop page and overlays real gifs on top of the static thumbnails:

1. [`inject/xhr.js`](src/inject/xhr.ts) runs in the page's MAIN world at `document_start` and patches `XMLHttpRequest.prototype.open`, relaying GET response bodies to the content script via `postMessage`.
2. [`inject/main.js`](src/inject/main.ts) (isolated world) scans the initial page source and every intercepted XHR response for image metadata: it locates each result's `data-docid` and extracts the original gif URL that follows it.
3. For each match, an absolutely-positioned `<img>` with the real gif source is placed over the thumbnail.

May not resolve every image due to how Google chunks its search data — that's what the new solution is for.

## Popup settings

- **Extension enabled** — master toggle.
- **Use new solution** — switches between the strategies above (page reloads on change).
- **Column count** — layout density for the new solution.

Settings are stored in `storage.sync` and roam with your browser profile.

## Permissions

- `storage` — persist the settings above.
- `declarativeNetRequestWithHostAccess` — the User-Agent rule; only affects Google image-search requests on the listed Google domains.
- Host permissions for `www.google.*` — run the content scripts on all Google country TLDs.

No data is collected, stored remotely, or sent anywhere.

## Development

```
npm install
npx tsc          # compiles src/*.ts → dist/
```

`dist/` is the complete, loadable extension (`manifest.json` lives there directly and is edited by hand).

- **Chrome**: `chrome://extensions` → Developer mode → Load unpacked → select `dist/`.
- **Firefox**: `about:debugging` → This Firefox → Load Temporary Add-on → select `dist/manifest.json`.

One codebase serves both browsers: the manifest declares `background.service_worker` (Chrome) alongside `background.scripts` (Firefox event page), plus `browser_specific_settings.gecko` for AMO. Minimum versions: Chrome 121, Firefox 140 (142 on Android).

## Publishing

Zip the **contents** of `dist/` (manifest at the zip root) and upload the same archive to both stores. Expect one AMO linter warning about `background.service_worker` being ignored on Firefox — that's the dual-browser manifest working as intended.
