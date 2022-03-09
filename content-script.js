new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList)
    for (const node of mutation.addedNodes)
      if (node.textContent.startsWith("AF_initDataCallback")) readScript(node);
  updateImages();
}).observe(document.documentElement, { childList: true, subtree: true });

const URLs = [];

function readScript(node) {
  const script = node.textContent;
  const strings = script.match(/(["'])(?:(?=(\\?))\2.)*?\1/g);
  if (!strings) return;
  URLs.push(...strings.filter((i) => /(\.gif(\?.*)?")$/.test(i)));
}

function updateImages() {
  document.querySelectorAll("a img[jsname]").forEach((img, i) => {
    if (URLs[i]) img.src = URLs[i].slice(1, -1);
  });
}
