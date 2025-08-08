document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const element = event.target;

    if (
      element.tagName === "INPUT" ||
      element.tagName === "TEXTAREA" ||
      element.isContentEditable
    ) {
      const typedText = element.value || element.innerText;

      try {
        chrome.runtime.sendMessage({
          type: "textUpdate",
          text: typedText
        });
      } catch (err) {
        console.warn("Could not send message:", err);
      }
    }
  }
}, true);
