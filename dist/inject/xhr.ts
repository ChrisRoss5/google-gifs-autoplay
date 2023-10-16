// ExecutionWorld: "MAIN"
// Run at: "document_start"

const oldXHROpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function (method, url) {
  this.addEventListener("load", function () {
    if (url instanceof URL) url = url.href;
    if (!url.includes("batch")) return;
    const type = "GIFS_AUTOPLAY";
    const text = this.responseText;
    window.postMessage({ type, text }, "*");
  });
  return oldXHROpen.apply(this, arguments as any);
};
