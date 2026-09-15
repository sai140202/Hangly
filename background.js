// Injects content.js into the active tab when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  const url = tab.url || "";
  const blocked = /^(chrome|edge|about|chrome-extension|devtools):/i.test(url)
    || url.startsWith("https://chrome.google.com/webstore")
    || url.startsWith("https://chromewebstore.google.com");
  if (blocked) {
    chrome.action.setBadgeText({ text: "!", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#c33", tabId: tab.id });
    chrome.action.setTitle({
      title: "Hangly can't run on this page. Open a normal website first.",
      tabId: tab.id
    });
    return;
  }
  try {
    chrome.action.setBadgeText({ text: "", tabId: tab.id });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (e) {
    console.warn("Hangly inject skipped:", e.message);
  }
});
