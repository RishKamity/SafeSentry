import { pipeline } from './libs/transformers.min.js';

let lastTypedText = "";
let nerPipeline = null;

// Initialize the NER pipeline
async function initializePipeline() {
  if (!nerPipeline) {
    nerPipeline = await pipeline("ner", "Xenova/bert-base-NER");
  }
  return nerPipeline;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "textUpdate") {
    lastTypedText = message.text;
  }

  if (message.type === "getText") {
    sendResponse({ text: lastTypedText });
  }
  
  if (message.type === "checkPII") {
    // Run PII detection
    (async function() {
      try {
        const ner = await initializePipeline();
        const entities = await ner(message.text);
        
        const piiGroups = ["PER", "ORG", "LOC"];
        const foundEntities = entities.filter(e => piiGroups.includes(e.entity_group));
        
        const patterns = [
          { name: "Email", re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/ },
          { name: "Phone", re: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
          { name: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/ },
          { name: "Credit Card", re: /\b(?:\d[ -]*?){13,16}\b/ }
        ];
        const foundPatterns = patterns.filter(p => p.re.test(message.text));
        
        sendResponse({
          hasPII: foundEntities.length > 0 || foundPatterns.length > 0,
          entities: foundEntities,
          patterns: foundPatterns.map(p => p.name)
        });
      } catch (err) {
        console.error("PII detection error:", err);
        sendResponse({ error: err.message });
      }
    })();
    
    return true; // Indicates asynchronous response
  }
});
