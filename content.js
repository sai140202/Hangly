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

  // Small floating control bar (kept minimal so overlay is nearly invisible)
  const controls = document.createElement("div");
  Object.assign(controls.style, {
    position: "fixed", top: "25px", right: "25px",
    display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px",
    fontFamily: "sans-serif", fontSize: "14px", pointerEvents: "auto", zIndex: "2147483647"
  });

  const menuBtn = document.createElement("button");
  menuBtn.innerHTML = "⚙️";
  Object.assign(menuBtn.style, {
    padding: "6px", background: "rgba(20,20,24,0.8)", color: "#fff", border: "none",
    borderRadius: "8px", cursor: "pointer", fontSize: "16px"
  });
  controls.appendChild(menuBtn);

  const menuPanel = document.createElement("div");
  Object.assign(menuPanel.style, {
    display: "none", background: "rgba(30,30,35,0.95)", padding: "12px",
    borderRadius: "8px", color: "#fff", width: "220px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)", backdropFilter: "blur(4px)"
  });

  menuPanel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <strong style="font-size:14px;margin:0;">Hangly</strong>
      <div style="white-space:nowrap;">
        <button id="__hg_stop" title="Remove Hangly" style="background:#e74c3c;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;margin-right:6px;display:inline-block;">Stop</button>
        <button id="__hg_close_menu" title="Close Menu" style="background:#555;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;display:inline-block;">Close</button>
      </div>
    </div>
    <div style="font-size:12px;margin-bottom:4px;color:#ccc;">Thread Design:</div>
    <select id="__hg_thread_select" style="width:100%;padding:4px;border-radius:4px;background:#333;color:#fff;border:1px solid #555;margin-bottom:10px;font-size:12px;">
      <option value="web">Spiderman Web</option>
      <option value="rope">Rope</option>
      <option value="chain">Chain</option>
    </select>
    <label style="background:#3498db;color:white;padding:6px;border-radius:4px;cursor:pointer;display:block;text-align:center;margin-bottom:10px;font-size:13px;">
      Upload Custom Image
      <input type="file" id="__hg_upload" accept="image/*" style="display:none;">
    </label>
    <div style="font-size:12px;margin-bottom:6px;color:#ccc;">Select Charm:</div>
    <div id="__hg_gallery" style="display:flex;gap:6px;flex-wrap:wrap;max-height:120px;overflow-y:auto;padding-bottom:4px;"></div>
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
        width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", cursor: "pointer",
        border: id === selectedImageId ? "2px solid #2ecc71" : "2px solid transparent"
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
          position: "absolute", top: "-5px", right: "-5px", background: "#e74c3c", color: "white",
          border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px",
          cursor: "pointer", padding: "0", margin: "0", display: "block",
          textAlign: "center", lineHeight: "18px", fontFamily: "sans-serif",
          boxShadow: "0 2px 4px rgba(0,0,0,0.5)"
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
    ctx.save();
    
    if (selectedThread === "rope") {
      ctx.strokeStyle = "#c08552";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 3]);
    } else if (selectedThread === "chain") {
      ctx.strokeStyle = "#bdc3c7";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
    } else { // "web"
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    for (let i = 0; i < this.rope.length - 1; i++) {
      const a = lerpPt(this.rope[i].prev, this.rope[i].pos, alpha);
      const b = lerpPt(this.rope[i + 1].prev, this.rope[i + 1].pos, alpha);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    // Secondary strokes for extra visual depth
    if (selectedThread === "chain") {
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
    } else if (selectedThread === "rope") {
      ctx.strokeStyle = "#8b5a2b";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 3]);
      ctx.lineDashOffset = 3;
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
    const size = r * 2.4;
    if (imageReady) {
      ctx.drawImage(charmImage, -size / 2, -size / 2, size, size);
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
