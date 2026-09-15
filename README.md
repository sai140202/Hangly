# 🕸️ Hangly

**Hangly** is a fun, interactive Chrome extension that brings physically-simulated charms directly into your browser! With a simple click, inject a physics engine over any webpage and watch your charms swing, bounce, and react to your mouse movements.

---

## ✨ Features

- **Interactive Physics**: Click and drag charms around the screen. Watch them swing naturally with gravity and tension!
- **Draggable Anchors**: Grab the pin (📍) at the top of the thread to reposition where the charm hangs from on the screen.
- **Custom Threads**: Choose your favorite aesthetic from the settings menu:
  - 🕸️ Spiderman Web
  - 🪢 Rope
  - ⛓️ Chain
- **Custom Charms**: Upload any image from your computer to use as a charm. All custom images are safely stored locally in your browser.
- **Unobtrusive**: The overlay is completely click-through, allowing you to browse the web normally while your charms hang out in the background.

---

## 🚀 Installation (Developer Mode)

Since this extension is not yet on the Chrome Web Store, you can easily install it locally:

1. Open Google Chrome and navigate to `chrome://extensions/` in your URL bar.
2. Turn on **Developer mode** using the toggle switch in the top right corner.
3. Click the **Load unpacked** button in the top left.
4. Select the `webext` folder (the folder containing the `manifest.json` file).
5. The Hangly icon will appear in your Chrome toolbar (you may need to pin it by clicking the puzzle piece icon 🧩).

---

## 🎮 How to Use

1. **Toggle the Overlay**: Navigate to any webpage (except restricted Chrome system pages like `chrome://`) and click the Hangly extension icon in your toolbar to inject the charms.
2. **Interact**: 
   - Hover over the charm and drag it around.
   - Hover over the top anchor pin (📍) to drag the starting position.
3. **Open Settings**: Click the **⚙️ Gear Icon** floating in the top right corner of the webpage to open the Hangly Menu.
   - **Thread Design**: Use the dropdown to switch between Web, Rope, and Chain.
   - **Upload Custom Image**: Click this button to upload a new charm.
   - **Select Charm**: Click any thumbnail in the gallery to instantly switch the active charm image.
   - **Remove**: Click the small red '✕' on a custom image to delete it.
   - **Stop**: Click the red "Stop" button in the header to completely remove the Hangly overlay from the page.
   - **Close**: Click the grey "Close" button to hide the settings menu and keep playing.

---

## 🛠️ Built With

- Manifest V3
- Vanilla JavaScript & HTML5 Canvas (Custom Physics Engine)
- Chrome Storage API
