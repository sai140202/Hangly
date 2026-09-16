# 🕸️ Hangly

**Hangly** is a fun, highly interactive Chrome extension that brings physically-simulated, customizable hanging charms directly into your browser! Inject a high-fidelity physics engine over any webpage and watch your charms swing, bounce, and react dynamically to gravity, momentum, and your mouse movements.

---

## 📸 Screenshots & Showcase

Explore some of Hangly's visual aesthetics, interactive thread styles, and dynamic themes in action:

| **⚡ Default Spiderman Web Design** | **🤖 Cyberpunk Neon Theme** |
| :---: | :---: |
| ![Default Spiderman Web](Readme%20images/Screenshot%202026-09-16%20143536.png) | ![Cyberpunk Neon Theme](Readme%20images/Screenshot%202026-09-16%20143645.png) |

| **🦸 Marvel Comic Blockbuster Theme** | **🌸 Custom Charms & Settings Gallery** |
| :---: | :---: |
| ![Marvel Comic Theme](Readme%20images/Screenshot%202026-09-16%20143720.png) | ![Settings Panel and Gallery](Readme%20images/Screenshot%202026-09-16%20143903.png) |

---

## ✨ Key Features

Hangly combines state-of-the-art physics simulation with lightweight and seamless UI controls:

### 1. 🪶 Physically-Simulated Hanging Physics
* **Verlet Integration**: Experience realistic cloth and rope mechanics modeled using Verlet integration for smooth velocity and positional updates.
* **Elastic Constraint Solving**: The physics engine performs 10 constraint resolution passes per frame to enforce realistic thread tension and prevent over-stretching.
* **Environmental Forces**: Built-in gravity and natural damping model the subtle friction of the air, making charms settle naturally when untouched.

### 2. 🖱️ Dynamic Interaction
* **Draggable Anchors**: Reposition the top mount point of the hanging thread anywhere on your screen. Drag the anchor and watch the rope snake and slide behind it.
* **Interactive Charms**: Grab, flick, swing, or gently guide the dangling charm. It reacts instantly with momentum and inertia when released.

### 3. 🧵 Distinct Thread Designs
Customize the look of the connection thread via the settings menu:
* **🕸️ Spiderman Web**: A classic superhero web, complete with a bright white core, soft glowing outer strands, and periodic sticky web nodes.
* **🪢 Rope**: A realistic twisted beige-golden rope featuring detailed spiraling wraps and dark defined outlines.
* **⛓️ Chain**: A heavy industrial metallic chain with alternating 3D perpendicular silver links, shiny flat plates, and realistic center openings.

### 4. 🎭 Immersive UI Themes
The entire Hangly Control Panel switches dynamically across several artistic directions:
* **🎈 Cartoon (Default)**: Bright cream and gray palette with bold borders, playful shadows, and friendly Comic Sans/Nunito typography.
* **🌸 Anime**: Soft pink-blue glassmorphism gradients, clean white outlines, and elegant typography.
* **🦸 Marvel**: Action-packed red-orange interface with heavy 3D-style offset borders, solid comic shadows, and bold Impact font headers.
* **🧛 Horror**: Crimson and dark charcoal theme with creepy dashed borders and retro monospace type.
* **🤖 Cyberpunk**: High-contrast dark cyberpunk UI with neon magenta borders, electric cyan highlights, and futuristic monospace console fonts.

### 5. 📂 Custom Charm Uploads & Local Storage
* Upload any local image file (`.png`, `.jpg`, `.jpeg`, `.gif`, etc.) directly from your computer.
* Custom charms are instantly added to your active selection gallery.
* **Offline Persistence**: Handled through the `chrome.storage.local` API—all of your uploaded images and style selections (active theme, thread, and chosen charm) are saved locally and persist across page loads and browser restarts.

### 6. 🥷 Smart Click-Through Integration
* **Seamless Browsing**: The overlay is completely invisible to pointer events by default. You can read, highlight text, scroll, and click links on any website normally.
* **Hover Detection**: The extension uses optimized mathematical hit-testing to detect when your pointer is directly over a draggable charm or anchor. It only captures pointer focus when you actively hover over these items, giving you the best of both worlds!

---

## 🚀 Installation (Developer Mode)

Since this extension is loaded locally for developer testing, follow these simple steps to install it in Google Chrome:

1. Open Google Chrome and navigate to `chrome://extensions/` in your URL bar.
2. Turn on **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `webext` folder (the folder containing `manifest.json`).
5. The Hangly icon will appear in your Chrome toolbar. Pin it by clicking the extensions puzzle piece icon (🧩) for easy access!

---

## 🎮 How to Use

1. **Toggle the Overlay**: Navigate to any webpage (except restricted Chrome settings or Web Store pages) and click the Hangly icon in your Chrome toolbar to inject your charm.
2. **Interact**:
   - Hover over the charm at the bottom of the thread and drag it to swing it around.
   - Hover over the small white anchor bead at the top of the thread to reposition where the charm hangs from.
3. **Open Settings**: Click the floating magic sparkle **✨ button** in the top-right corner of the webpage to expand the Hangly Control Panel.
   - **UI Theme**: Select your favorite interface style (Cartoon, Anime, Marvel, Horror, Cyberpunk) from the dropdown.
   - **Thread Design**: Instantly switch the thread aesthetic between Web, Rope, and Chain.
   - **Upload Custom Charm**: Click the button to choose a custom image from your device.
   - **Select Charm**: Tap any thumbnail in the visual gallery to switch the active charm on the fly.
   - **Remove**: Click the red **✕** badge on any custom charm to delete it from your local storage gallery.
   - **Stop**: Click the red **Stop** button to completely remove the Hangly overlay from the active webpage.
   - **Close**: Click the blue **Close** button to collapse the panel while keeping your hanging charms active.

---

## 🛠️ Built With

- **Manifest V3** Chrome Extension standards.
- **HTML5 Canvas & Vanilla JavaScript** (custom-built high-performance physics engine).
- **Chrome Storage API** (for seamless local persistence).
- **CSS Custom Properties** (for instant runtime theme switching).
