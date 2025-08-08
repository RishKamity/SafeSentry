import { pipeline } from './libs/transformers.min.js';

const typedTextDiv = document.getElementById("typedText");
const warningDiv = document.getElementById("warning");

chrome.runtime.sendMessage({ type: "getText" }, async (response) => {
  const text = response.text || "(nothing yet)";
  typedTextDiv.textContent = text;

  if (!text || text === "(nothing yet)") return;

  warningDiv.textContent = "Checking for PII...";

  try {
    const ner = await pipeline("ner", "Xenova/bert-base-NER");
    const entities = await ner(text);

    const piiGroups = ["PER", "ORG", "LOC"];
    const foundEntities = entities.filter(e => piiGroups.includes(e.entity_group));

    const patterns = [
      { name: "Email", re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/ },
      { name: "Phone", re: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
      { name: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/ },
      { name: "Credit Card", re: /\b(?:\d[ -]*?){13,16}\b/ }
    ];
    const foundPatterns = patterns.filter(p => p.re.test(text));

    if (foundEntities.length > 0 || foundPatterns.length > 0) {
      let details = [];
      if (foundEntities.length > 0) {
        details.push("Entities: " + foundEntities.map(e => e.entity_group).join(", "));
      }
      if (foundPatterns.length > 0) {
        details.push("Patterns: " + foundPatterns.map(p => p.name).join(", "));
      }
      warningDiv.textContent = `⚠️ Possible PII detected!\n${details.join(" | ")}`;
    } else {
      warningDiv.textContent = "✅ No PII detected.";
    }
  } catch (err) {
    warningDiv.textContent = "❌ Error: " + err.message;
    console.error(err);
  }
});