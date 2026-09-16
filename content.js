// Hangly content-script overlay: injects a transparent, click-through-except-charm
// canvas over the current page. Clicking the extension icon toggles it.
(function () {
  const OVERLAY_ID = "__hangly_overlay__";
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.__hangly_stop && existing.__hangly_stop();
    existing.remove();
    return;
  }

  const container = document.createElement("div");
  container.id = OVERLAY_ID;
  Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "2147483647",
    pointerEvents: "none",
    background: "transparent"
  });

  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  Object.assign(canvas.style, {
    display: "block",
    width: "100vw",
    height: "100vh",
    background: "transparent",
    pointerEvents: "none"
  });
  container.appendChild(canvas);

  // Inject Theme Styles
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    #__hangly_overlay__ {
      --hg-bg: #fffaf0; --hg-text: #374151; --hg-border: 2px solid #374151; --hg-shadow: 4px 4px 0px #374151; 
      --hg-font: "Comic Sans MS", "Chalkboard SE", "Nunito", sans-serif; --hg-accent1: #e84393; 
      --hg-accent2: #fd79a8; --hg-btn-stop: #ff7675; --hg-btn-close: #74b9ff; --hg-btn-upload: #55efc4;
      --hg-radius: 14px; --hg-btn-radius: 8px; --hg-title-shadow: 1px 1px 0px #ffeaa7;
    }
    #__hangly_overlay__.theme-anime {
      --hg-bg: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%); --hg-text: #4a235a; --hg-border: 2px solid #ffffff; 
      --hg-shadow: 0 6px 20px rgba(31,38,135,0.2); --hg-font: "Nunito", "Segoe UI", sans-serif; --hg-accent1: #ffffff; 
      --hg-accent2: #fbc2eb; --hg-btn-stop: #ff9a9e; --hg-btn-close: #a1c4fd; --hg-btn-upload: #ffffff;
      --hg-radius: 20px; --hg-btn-radius: 16px; --hg-title-shadow: 0 0 6px rgba(255,255,255,0.7);
    }
    #__hangly_overlay__.theme-marvel {
      --hg-bg: #e23636; --hg-text: #ffffff; --hg-border: 3px solid #1f2937; --hg-shadow: 4px 4px 0px #f0a141; 
      --hg-font: "Impact", "Arial Black", sans-serif; --hg-accent1: #f0a141; --hg-accent2: #f0a141; 
      --hg-btn-stop: #1f2937; --hg-btn-close: #518cca; --hg-btn-upload: #f0a141;
      --hg-radius: 4px; --hg-btn-radius: 4px; --hg-title-shadow: 2px 2px 0px #1f2937;
    }
    #__hangly_overlay__.theme-horror {
      --hg-bg: #1a1a1a; --hg-text: #e53935; --hg-border: 2px dashed #9b2226; --hg-shadow: 0 0 15px rgba(229, 57, 53, 0.4); 
      --hg-font: "Courier New", monospace; --hg-accent1: #e53935; --hg-accent2: #4a0404; 
      --hg-btn-stop: #660708; --hg-btn-close: #2a2a2a; --hg-btn-upload: #9b2226;
      --hg-radius: 2px; --hg-btn-radius: 2px; --hg-title-shadow: 1px 1px 3px rgba(229, 57, 53, 0.6);
    }
    #__hangly_overlay__.theme-cyber {
      --hg-bg: rgba(18, 18, 25, 0.95); --hg-text: #00e5ff; --hg-border: 2px solid #d500f9; --hg-shadow: 0 0 12px rgba(0, 229, 255, 0.3); 
      --hg-font: "Consolas", monospace; --hg-accent1: #d500f9; --hg-accent2: #00e5ff; 
      --hg-btn-stop: #e50055; --hg-btn-close: #0044dd; --hg-btn-upload: #fcee0a;
      --hg-radius: 2px; --hg-btn-radius: 2px; --hg-title-shadow: 1px 1px 0px rgba(213, 0, 249, 0.8);
    }
  `;
  document.head.appendChild(styleEl);
  container.className = "theme-cartoon"; // default

  // Small floating control bar
  const controls = document.createElement("div");
  Object.assign(controls.style, {
    position: "fixed", top: "25px", right: "25px",
    display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px",
    fontFamily: "var(--hg-font)", fontSize: "14px", pointerEvents: "auto", zIndex: "2147483647"
  });

  const menuBtn = document.createElement("button");
  menuBtn.innerHTML = "✨";
  Object.assign(menuBtn.style, {
    padding: "8px 10px", background: "var(--hg-accent2)", color: "var(--hg-text)",
    border: "var(--hg-border)", borderRadius: "50%",
    cursor: "pointer", fontSize: "24px",
    boxShadow: "var(--hg-shadow)", fontWeight: "bold"
  });
  controls.appendChild(menuBtn);

  const menuPanel = document.createElement("div");
  Object.assign(menuPanel.style, {
    display: "none", background: "var(--hg-bg)", padding: "16px",
    borderRadius: "var(--hg-radius)", color: "var(--hg-text)", width: "240px",
    border: "var(--hg-border)", boxShadow: "var(--hg-shadow)",
    fontFamily: "var(--hg-font)"
  });

  menuPanel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <strong style="font-size:18px;margin:0;color:var(--hg-accent1);letter-spacing:1px;text-transform:uppercase;text-shadow:var(--hg-title-shadow);">🌸 Hangly</strong>
      <div style="white-space:nowrap;">
        <button id="__hg_stop" title="Remove Hangly" style="background:var(--hg-btn-stop);color:#fff;border:var(--hg-border);padding:4px 10px;border-radius:var(--hg-btn-radius);cursor:pointer;font-size:12px;margin-right:6px;display:inline-block;font-weight:bold;font-family:inherit;">Stop</button>
        <button id="__hg_close_menu" title="Close Menu" style="background:var(--hg-btn-close);color:var(--hg-text);border:var(--hg-border);padding:4px 10px;border-radius:var(--hg-btn-radius);cursor:pointer;font-size:12px;display:inline-block;font-weight:bold;font-family:inherit;">Close</button>
      </div>
    </div>
    
    <div style="font-size:13px;margin-bottom:6px;font-weight:bold;color:var(--hg-text);">🎨 UI Theme:</div>
    <select id="__hg_theme_select" style="width:100%;padding:6px;border-radius:var(--hg-btn-radius);background:var(--hg-bg);color:var(--hg-text);border:var(--hg-border);margin-bottom:14px;font-size:13px;outline:none;cursor:pointer;font-family:inherit;font-weight:bold;">
      <option value="theme-cartoon">🎈 Cartoon</option>
      <option value="theme-anime">🌸 Anime</option>
      <option value="theme-marvel">🦸 Marvel</option>
      <option value="theme-horror">🧛 Horror</option>
      <option value="theme-cyber">🤖 Cyberpunk</option>
    </select>

    <div style="font-size:13px;margin-bottom:6px;font-weight:bold;color:var(--hg-text);">🎀 Thread Design:</div>
    <select id="__hg_thread_select" style="width:100%;padding:6px;border-radius:var(--hg-btn-radius);background:var(--hg-bg);color:var(--hg-text);border:var(--hg-border);margin-bottom:14px;font-size:13px;outline:none;cursor:pointer;font-family:inherit;font-weight:bold;">
      <option value="web">🕸️ Spiderman Web</option>
      <option value="rope">🪢 Rope</option>
      <option value="chain">⛓️ Chain</option>
    </select>
    <label style="background:var(--hg-btn-upload);color:var(--hg-text);padding:8px;border-radius:var(--hg-btn-radius);cursor:pointer;display:block;text-align:center;margin-bottom:14px;font-size:14px;border:var(--hg-border);font-weight:bold;">
      🌟 Upload Custom Charm
      <input type="file" id="__hg_upload" accept="image/*" style="display:none;">
    </label>
    <div style="font-size:13px;margin-bottom:8px;font-weight:bold;color:var(--hg-text);">💖 Select Charm:</div>
    <div id="__hg_gallery" style="display:flex;gap:8px;flex-wrap:wrap;max-height:140px;overflow-y:auto;padding-bottom:6px;padding-right:4px;"></div>
  `;
  controls.appendChild(menuPanel);
  container.appendChild(controls);

  menuBtn.onclick = () => {
    menuPanel.style.display = menuPanel.style.display === "none" ? "block" : "none";
  };

  document.documentElement.appendChild(container);

  const ctx = canvas.getContext("2d", { alpha: true });
  const WINW = () => canvas.width;
  const WINH = () => canvas.height;

  function Vec2(x = 0, y = 0) { this.x = x; this.y = y; }
  Vec2.prototype.add = function (o) { return new Vec2(this.x + o.x, this.y + o.y); };
  Vec2.prototype.sub = function (o) { return new Vec2(this.x - o.x, this.y - o.y); };
  Vec2.prototype.mul = function (s) { return new Vec2(this.x * s, this.y * s); };
  const len = (v) => Math.hypot(v.x, v.y);

  function Particle(x, y) { this.pos = new Vec2(x, y); this.prev = new Vec2(x, y); this.mass = 1; this.pinned = false; }
  function Charm(x, y) { this.pos = new Vec2(x, y); this.prev = new Vec2(x, y); this.mass = 2; this.radius = 45; this.dragging = false; }

  const charmImage = new Image();
  let imageReady = false;
  charmImage.onload = () => { imageReady = true; };

  const defaultImages = [
    { id: "__default_1__", src: chrome.runtime.getURL("images/images.png") },
    { id: "__default_2__", src: chrome.runtime.getURL("images/images1.png") }
  ];

  let uploadedImages = [];
  let selectedImageId = "__default_1__";
  let selectedThread = "web";

  function updateCharmImageSrc() {
    imageReady = false;
    const def = defaultImages.find(d => d.id === selectedImageId);
    if (def) {
      charmImage.src = def.src;
    } else {
      const imgObj = uploadedImages.find(i => i.id === selectedImageId);
      charmImage.src = imgObj ? imgObj.dataUrl : defaultImages[0].src;
    }
  }

  function renderGallery() {
    const gallery = menuPanel.querySelector("#__hg_gallery");
    if (!gallery) return;
    gallery.innerHTML = "";

    const createThumb = (id, src) => {
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      const img = document.createElement("img");
      img.src = src;
      Object.assign(img.style, {
        width: "42px", height: "42px", objectFit: "cover", borderRadius: "var(--hg-btn-radius)", cursor: "pointer",
        border: id === selectedImageId ? "3px solid var(--hg-accent1)" : "var(--hg-border)",
        boxShadow: id === selectedImageId ? "2px 2px 0px var(--hg-accent1)" : "none",
        backgroundColor: "var(--hg-bg)", padding: "2px", boxSizing: "border-box"
      });
      img.onclick = () => {
        selectedImageId = id;
        if (window.chrome?.storage?.local) chrome.storage.local.set({ selectedImageId });
        updateCharmImageSrc();
        renderGallery();
      };
      wrapper.appendChild(img);

      if (!id.startsWith("__default")) {
        const delBtn = document.createElement("button");
        delBtn.innerHTML = "✕";
        Object.assign(delBtn.style, {
          position: "absolute", top: "-6px", right: "-6px", background: "var(--hg-btn-stop)", color: "#fff",
          border: "var(--hg-border)", borderRadius: "50%", width: "20px", height: "20px", fontSize: "12px",
          cursor: "pointer", padding: "0", margin: "0", display: "block",
          textAlign: "center", lineHeight: "16px", fontFamily: "inherit",
          boxShadow: "1px 1px 0px #000", fontWeight: "bold"
        });
        delBtn.onclick = (e) => {
          e.stopPropagation();
          uploadedImages = uploadedImages.filter(i => i.id !== id);
          if (selectedImageId === id) selectedImageId = "__default_1__";
          if (window.chrome?.storage?.local) chrome.storage.local.set({ uploadedImages, selectedImageId });
          updateCharmImageSrc();
          renderGallery();
        };
        wrapper.appendChild(delBtn);
      }
      gallery.appendChild(wrapper);
    };

    defaultImages.forEach(def => createThumb(def.id, def.src));
    uploadedImages.forEach(imgObj => createThumb(imgObj.id, imgObj.dataUrl));
  }

  if (window.chrome?.storage?.local) {
    chrome.storage.local.get(["uploadedImages", "selectedImageId", "selectedThread"], (res) => {
      if (res.uploadedImages) uploadedImages = res.uploadedImages;
      if (res.selectedImageId) selectedImageId = res.selectedImageId;
      if (res.selectedThread) {
        selectedThread = res.selectedThread;
        const selectEl = menuPanel.querySelector("#__hg_thread_select");
        if (selectEl) selectEl.value = selectedThread;
      }
      updateCharmImageSrc();
      renderGallery();
    });
  } else {
    updateCharmImageSrc();
    renderGallery();
  }

  const SEGMENTS = 20;
  const TOTAL_LENGTH = 220;
  const REST_LENGTH = TOTAL_LENGTH / (SEGMENTS - 1);
  const MAX_STRETCH = REST_LENGTH * 1.02;
  const DT = 1 / 240;
  const CONSTRAINT_ITERS = 10;
  const GRAVITY = new Vec2(0, 800);
  const DAMPING = 0.01;

  function System(anchorX) {
    this.anchor = new Vec2(anchorX, 60);
    this.rope = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const p = new Particle(this.anchor.x, this.anchor.y + i * REST_LENGTH);
      if (i === 0) p.pinned = true;
      this.rope.push(p);
    }
    const last = this.rope[this.rope.length - 1];
    this.charm = new Charm(last.pos.x, last.pos.y + REST_LENGTH + 20);
  }

  System.prototype.integrate = function () {
    for (let i = 0; i < this.rope.length; i++) {
      const p = this.rope[i];
      if (p.pinned) continue;
      const vel = p.pos.sub(p.prev).mul(1 - DAMPING);
      const newPos = p.pos.add(vel).add(GRAVITY.mul(DT * DT));
      p.prev = p.pos; p.pos = newPos;
    }
    const charm = this.charm;
    if (!charm.dragging) {
      const vel = charm.pos.sub(charm.prev).mul(1 - DAMPING);
      const newPos = charm.pos.add(vel).add(GRAVITY.mul(DT * DT));
      charm.prev = charm.pos; charm.pos = newPos;
    }
    for (let iter = 0; iter < CONSTRAINT_ITERS; ++iter) {
      for (let i = 0; i < this.rope.length - 1; i++) {
        const p1 = this.rope[i], p2 = this.rope[i + 1];
        const delta = p2.pos.sub(p1.pos);
        const dist = len(delta);
        if (dist === 0) continue;
        const diff = (dist - REST_LENGTH) / dist;
        const inv1 = p1.pinned ? 0 : 1 / p1.mass;
        const inv2 = p2.pinned ? 0 : 1 / p2.mass;
        const sum = inv1 + inv2;
        if (sum === 0) continue;
        const correction = delta.mul(diff / sum);
        if (!p1.pinned) p1.pos = p1.pos.add(correction.mul(inv1));
        if (!p2.pinned) p2.pos = p2.pos.sub(correction.mul(inv2));
        const newDelta = p2.pos.sub(p1.pos);
        const newDist = len(newDelta);
        if (newDist > MAX_STRETCH) {
          const fix = (newDist - MAX_STRETCH) / newDist;
          if (!p1.pinned) p1.pos = p1.pos.add(newDelta.mul(0.5 * fix));
          if (!p2.pinned) p2.pos = p2.pos.sub(newDelta.mul(0.5 * fix));
        }
      }
      const last = this.rope[this.rope.length - 1];
      const deltaC = this.charm.pos.sub(last.pos);
      const distC = len(deltaC);
      if (distC > 0) {
        const target = this.charm.radius;
        const diff = (distC - target) / distC;
        const invP = last.pinned ? 0 : 1 / last.mass;
        const invC = this.charm.mass > 0 ? 1 / this.charm.mass : 0;
        const sum = invP + invC;
        if (sum > 0) {
          const correction = deltaC.mul(diff / sum);
          if (!last.pinned) last.pos = last.pos.add(correction.mul(invP));
          if (!this.charm.dragging) this.charm.pos = this.charm.pos.sub(correction.mul(invC));
        }
      }
    }
  };

  const lerpPt = (a, b, t) => new Vec2(a.x * (1 - t) + b.x * t, a.y * (1 - t) + b.y * t);

  System.prototype.render = function (alpha, ctx) {
    // 1. Build the path for the thread
    ctx.beginPath();
    for (let i = 0; i < this.rope.length - 1; i++) {
      const a = lerpPt(this.rope[i].prev, this.rope[i].pos, alpha);
      const b = lerpPt(this.rope[i + 1].prev, this.rope[i + 1].pos, alpha);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }

    // 2. Stroke the path based on selected design
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (selectedThread === "rope") {
      // Thick dark outline
      ctx.strokeStyle = "#2d3436";
      ctx.lineWidth = 6;
      ctx.setLineDash([]);
      ctx.stroke();

      // Main rope base (golden/beige)
      ctx.strokeStyle = "#e1b12c";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Twist detail (darker orange/brown)
      ctx.strokeStyle = "#e84118";
      ctx.lineWidth = 4;
      ctx.setLineDash([3, 5]);
      ctx.stroke();

    } else if (selectedThread === "chain") {
      // Chain Period: 16px
      // 1. Base Outline
      ctx.strokeStyle = "#2d3436";
      ctx.lineWidth = 8;
      ctx.setLineDash([]);
      ctx.stroke();

      // 2. Perpendicular Links (Darker Silver)
      ctx.strokeStyle = "#636e72";
      ctx.lineWidth = 8;
      ctx.setLineDash([4, 12]);
      ctx.lineDashOffset = -12;
      ctx.stroke();

      // 3. Flat Links (Brighter Silver)
      ctx.strokeStyle = "#dfe6e9";
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 4]);
      ctx.lineDashOffset = 0;
      ctx.stroke();

      // 4. Flat Link Holes (Background/Black)
      ctx.strokeStyle = "#2d3436";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 10]);
      ctx.lineDashOffset = -3;
      ctx.stroke();

    } else { // "web"
      // Faint blue glow/outer strand
      ctx.shadowColor = "#74b9ff";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "rgba(116, 185, 255, 0.5)";
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      ctx.stroke();

      // Sharp white core
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sticky web blobs (little thick dots)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.setLineDash([2, 24]);
      ctx.stroke();
    }
    ctx.restore();

    // Draw anchor point visual cue (a small bead/pin)
    ctx.save();
    const anchorPos = lerpPt(this.rope[0].prev, this.rope[0].pos, alpha);
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#ecf0f1";
    ctx.beginPath();
    ctx.arc(anchorPos.x, anchorPos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7f8c8d";
    ctx.beginPath();
    ctx.arc(anchorPos.x, anchorPos.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw the image at the charm position, rotated to follow the rope
    const last = this.rope[this.rope.length - 1];
    const lastPos = lerpPt(last.prev, last.pos, alpha);
    const ci = lerpPt(this.charm.prev, this.charm.pos, alpha);
    const dir = new Vec2(ci.x - lastPos.x, ci.y - lastPos.y);
    const angle = Math.atan2(dir.y, dir.x) - Math.PI / 2;
    drawCharmImage(ctx, ci.x, ci.y, this.charm.radius, angle);
  };

  function drawCharmImage(ctx, x, y, r, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const targetSize = r * 2.4; // Base size for a square image
    
    if (imageReady && charmImage.width && charmImage.height) {
      const aspect = charmImage.width / charmImage.height;
      let drawW, drawH;
      
      // Scale based on the SHORTEST side to ensure the charm feels full, 
      // rather than scaling based on the longest side which makes it tiny.
      if (aspect > 1) {
        // Landscape: Make height match targetSize, let width expand
        drawH = targetSize;
        drawW = targetSize * aspect;
      } else {
        // Portrait or Square: Make width match targetSize, let height expand
        drawW = targetSize;
        drawH = targetSize / aspect;
      }
      
      ctx.drawImage(charmImage, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      // fallback while image loads
      ctx.fillStyle = "#d3202f";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const systems = [];
  let running = true;
  let lastFrame = performance.now();
  let accumulator = 0;
  const mouse = { x: 0, y: 0 };
  let activeDragging = null;

  const countEl = null;
  const updateCount = () => {};
  const addSystem = (x) => { systems.push(new System(x || 120)); updateCount(); };
  const clearSystems = () => { systems.length = 0; updateCount(); };

  controls.querySelector("#__hg_stop").onclick = () => {
    stop(); container.remove();
  };

  controls.querySelector("#__hg_close_menu").onclick = () => {
    menuPanel.style.display = "none";
  };

  const themeSelect = controls.querySelector("#__hg_theme_select");
  if (themeSelect) {
    themeSelect.onchange = (e) => {
      selectedTheme = e.target.value;
      container.className = selectedTheme;
      if (window.chrome?.storage?.local) chrome.storage.local.set({ selectedTheme });
    };
  }

  controls.querySelector("#__hg_thread_select").onchange = (e) => {
    selectedThread = e.target.value;
    if (window.chrome?.storage?.local) chrome.storage.local.set({ selectedThread });
  };

  controls.querySelector("#__hg_upload").onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const id = Date.now().toString();
        const dataUrl = ev.target.result;
        uploadedImages.push({ id, dataUrl });
        selectedImageId = id;
        if (window.chrome?.storage?.local) {
          chrome.storage.local.set({ uploadedImages, selectedImageId }, () => {
            updateCharmImageSrc();
            renderGallery();
          });
        } else {
          updateCharmImageSrc();
          renderGallery();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Hit-testing: only enable pointer events when hovering a charm or anchor
  function hitTest(x, y) {
    for (let i = systems.length - 1; i >= 0; --i) {
      const s = systems[i];
      if (len(s.charm.pos.sub(new Vec2(x, y))) <= s.charm.radius + 4) return { system: s, part: 'charm' };
      if (len(s.rope[0].pos.sub(new Vec2(x, y))) <= 15) return { system: s, part: 'anchor' };
    }
    return null;
  }

  // Use window listeners so we don't need to intercept page clicks
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (activeDragging) return;
    // toggle canvas pointer-events depending on whether we hover a draggable part
    const hit = hitTest(mouse.x, mouse.y);
    canvas.style.pointerEvents = hit ? "auto" : "none";
    if (hit) canvas.style.cursor = "grab";
    else canvas.style.cursor = "default";
  }, true);

  canvas.addEventListener("mousedown", (e) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      if (hit.part === 'charm') hit.system.charm.dragging = true;
      else if (hit.part === 'anchor') hit.system.anchorDragging = true;
      activeDragging = hit;
      canvas.style.cursor = "grabbing";
      e.preventDefault();
    }
  });
  window.addEventListener("mouseup", () => {
    if (activeDragging) {
      if (activeDragging.part === 'charm') activeDragging.system.charm.dragging = false;
      else if (activeDragging.part === 'anchor') activeDragging.system.anchorDragging = false;
      activeDragging = null;
      canvas.style.cursor = "default";
    }
    canvas.style.pointerEvents = "none";
  });

  function integrateAll() {
    for (const s of systems) {
      if (s.charm.dragging) {
        const md = new Vec2(mouse.x - (s.charm.prevDragX || mouse.x), mouse.y - (s.charm.prevDragY || mouse.y));
        s.charm.prevDragX = mouse.x; s.charm.prevDragY = mouse.y;
        s.charm.prev = s.charm.pos.sub(md);
        s.charm.pos = new Vec2(mouse.x, mouse.y);
      }
      if (s.anchorDragging) {
        s.rope[0].pos = new Vec2(mouse.x, mouse.y);
        s.rope[0].prev = new Vec2(mouse.x, mouse.y);
      }
      s.integrate();
    }
  }

  function renderAll(alpha) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of systems) s.render(alpha, ctx);
  }

  function loop(now) {
    let elapsed = (now - lastFrame) / 1000; lastFrame = now;
    if (elapsed > 0.25) elapsed = 0.25;
    accumulator += elapsed;
    while (accumulator >= DT) { integrateAll(); accumulator -= DT; }
    renderAll(accumulator / DT);
    if (running) requestAnimationFrame(loop);
  }

  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", onResize);

  function stop() {
    running = false;
    window.removeEventListener("resize", onResize);
  }
  container.__hangly_stop = stop;

  addSystem(120);
  requestAnimationFrame(loop);
})();
