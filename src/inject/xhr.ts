// ExecutionWorld: "MAIN"
// Run at: "document_start"

const oldXHROpen = XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.open = function (method, url) {
  if (method.toUpperCase() === "GET") {
    this.addEventListener("load", function () {
      if (url instanceof URL) url = url.href;

      const type = "GIFS_AUTOPLAY";
      const text = this.responseText;

      postMessage({ type, text }, "*");
    });
  }
  return oldXHROpen.apply(this, arguments as any);
};
