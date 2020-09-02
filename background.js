chrome.webRequest.onBeforeSendHeaders.addListener(details => {
  if (!/client=img|tbm=isch/.test(details.url)) return;

  // Images bar or search icon clicked
  for (let i = 0; i < details.requestHeaders.length; i++) {
    if (details.requestHeaders[i].name != "User-Agent") continue;

    // New user agent does the magic
    details.requestHeaders[i].value = "Mozilla/5.0 \
      (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) \
      AppleWebKit/605.1.15 (KHTML, like Gecko) \
      Version/13.0.3 Mobile/15E148 Safari/604.1";

    return {requestHeaders: details.requestHeaders};
  }
}, {
  urls: ["*://www.google.com/search*"]
}, [
  "blocking", "requestHeaders"
]);