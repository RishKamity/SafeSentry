const typedTextDiv = document.getElementById("typedText");
const warningDiv = document.getElementById("warning");

chrome.runtime.sendMessage({ type: "getText" }, (response) => {
  const text = response.text || "(nothing yet)";
  typedTextDiv.textContent = text;

  if (!text || text === "(nothing yet)") return;

  warningDiv.textContent = "Checking for PII...";

  // Ask the background script to check for PII
  chrome.runtime.sendMessage({ type: "checkPII", text: text }, (result) => {
    if (result.error) {
      warningDiv.textContent = "❌ Error: " + result.error;
      return;
    }

    if (result.hasPII) {
      let details = [];
      if (result.entities && result.entities.length > 0) {
        details.push("Entities: " + result.entities.map(e => e.entity_group).join(", "));
      }
      if (result.patterns && result.patterns.length > 0) {
        details.push("Patterns: " + result.patterns.join(", "));
      }
      warningDiv.textContent = `⚠️ Possible PII detected!\n${details.join(" | ")}`;
    } else {
      warningDiv.textContent = "✅ No PII detected.";
    }
  });
});