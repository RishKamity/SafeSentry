let lastTypedText = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "textUpdate") {
    lastTypedText = message.text;
  }

  if (message.type === "getText") {
    sendResponse({ text: lastTypedText });
  }
});
