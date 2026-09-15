(function(){
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: true });
  const WINW = canvas.width; const WINH = canvas.height;
  
  // Force transparency
  canvas.style.opacity = '1';
  document.body.style.opacity = '1';
  document.documentElement.style.opacity = '1';

  function Vec2(x=0,y=0){this.x=x;this.y=y}
  Vec2.prototype.add = function(o){return new Vec2(this.x+o.x,this.y+o.y)};
  Vec2.prototype.sub = function(o){return new Vec2(this.x-o.x,this.y-o.y)};
  Vec2.prototype.mul = function(s){return new Vec2(this.x*s,this.y*s)};
  function len(v){return Math.hypot(v.x,v.y)}

  function Particle(x,y){this.pos=new Vec2(x,y);this.prev=new Vec2(x,y);this.mass=1;this.pinned=false;this.isBead=false}
  function Charm(x,y){this.pos=new Vec2(x,y);this.prev=new Vec2(x,y);this.mass=2;this.radius=18;this.dragging=false}

  const SEGMENTS = 20;
  const TOTAL_LENGTH = 360;
  const REST_LENGTH = TOTAL_LENGTH / (SEGMENTS - 1);
  const MAX_STRETCH = REST_LENGTH * 1.02;
  const DT = 1/240;
  const CONSTRAINT_ITERS = 10;
  const GRAVITY = new Vec2(0,800);
  const DAMPING = 0.01;

  // Each system contains its own rope and charm
  function System(anchorX){
    this.anchor = new Vec2(anchorX, 60);
    this.rope = [];
    for(let i=0;i<SEGMENTS;i++){
      const p = new Particle(this.anchor.x, this.anchor.y + i*REST_LENGTH);
      if(i===0) p.pinned = true;
      this.rope.push(p);
    }
    this.rope[Math.floor(SEGMENTS/2)].isBead = true;
    if(SEGMENTS/2 + 2 < SEGMENTS) this.rope[Math.floor(SEGMENTS/2)+2].isBead = true;
    this.rope[SEGMENTS-3].isBead = true;
    this.charm = new Charm(this.rope[this.rope.length-1].pos.x, this.rope[this.rope.length-1].pos.y + REST_LENGTH + 20);
  }

  System.prototype.integrate = function(){
    for(let i=0;i<this.rope.length;i++){
      const p = this.rope[i];
      if(p.pinned) continue;
      const vel = p.pos.sub(p.prev).mul(1.0 - DAMPING);
      const newPos = p.pos.add(vel).add(GRAVITY.mul(DT*DT));
      p.prev = p.pos;
      p.pos = newPos;
    }
    const charm = this.charm;
    if(!charm.dragging){
      const vel = charm.pos.sub(charm.prev).mul(1.0 - DAMPING);
      const newPos = charm.pos.add(vel).add(GRAVITY.mul(DT*DT));
      charm.prev = charm.pos;
      charm.pos = newPos;
    }
    for(let iter=0; iter<CONSTRAINT_ITERS; ++iter){
      for(let i=0;i<this.rope.length-1;i++){
        const p1 = this.rope[i], p2 = this.rope[i+1];
        const delta = p2.pos.sub(p1.pos);
        const dist = len(delta);
        if(dist === 0) continue;
        const diff = (dist - REST_LENGTH) / dist;
        const inv1 = p1.pinned ? 0 : 1.0 / p1.mass;
        const inv2 = p2.pinned ? 0 : 1.0 / p2.mass;
        const sum = inv1 + inv2;
        if(sum === 0) continue;
        const correction = delta.mul(diff / sum);
        if(!p1.pinned) p1.pos = p1.pos.add(correction.mul(inv1));
        if(!p2.pinned) p2.pos = p2.pos.sub(correction.mul(inv2));
        const newDelta = p2.pos.sub(p1.pos);
        const newDist = len(newDelta);
        if(newDist > MAX_STRETCH){
          const fix = (newDist - MAX_STRETCH) / newDist;
          if(!p1.pinned) p1.pos = p1.pos.add(newDelta.mul(0.5*fix));
          if(!p2.pinned) p2.pos = p2.pos.sub(newDelta.mul(0.5*fix));
        }
      }
      // charm to last rope
      const last = this.rope[this.rope.length-1];
      const deltaC = this.charm.pos.sub(last.pos);
      const distC = len(deltaC);
      if(distC > 0){
        const target = this.charm.radius;
        const diff = (distC - target) / distC;
        const invP = last.pinned ? 0 : 1.0 / last.mass;
        const invC = this.charm.mass > 0 ? 1.0 / this.charm.mass : 0;
        const sum = invP + invC;
        if(sum > 0){
          const correction = deltaC.mul(diff / sum);
          if(!last.pinned) last.pos = last.pos.add(correction.mul(invP));
          if(!this.charm.dragging) this.charm.pos = this.charm.pos.sub(correction.mul(invC));
        }
      }
    }
  };

  System.prototype.render = function(alpha, ctx){
    ctx.beginPath();
    for(let i=0;i<this.rope.length-1;i++){
      const a = lerpPoint(this.rope[i].prev, this.rope[i].pos, alpha);
      const b = lerpPoint(this.rope[i+1].prev, this.rope[i+1].pos, alpha);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x,b.y);
    }
    ctx.stroke();
    for(let i=0;i<this.rope.length;i++){
      if(!this.rope[i].isBead) continue;
      const p = lerpPoint(this.rope[i].prev, this.rope[i].pos, alpha);
      ctx.fillRect(p.x-6,p.y-6,12,12);
    }
    const ci = lerpPoint(this.charm.prev, this.charm.pos, alpha);
    for(let r=0;r< Math.floor(this.charm.radius); ++r){
      ctx.strokeRect(ci.x - r, ci.y - r, r*2, r*2);
    }
  };

  function lerpPoint(a,b,t){return new Vec2(a.x*(1-t)+b.x*t, a.y*(1-t)+b.y*t)}

  const systems = [];
  let running = true;
  let lastFrame = performance.now();
  let accumulator = 0;
  let mouse = {x:0,y:0,down:false};
  let activeDragging = null; // {system, charm}

  function addSystem(x){ systems.push(new System(x||WINW/2)); updateCount(); }
  function clearSystems(){ systems.length = 0; updateCount(); }
  function updateCount(){ document.getElementById('count').textContent = systems.length.toString(); }

  // pointer handling: look for charm under pointer (topmost = newest)
  function toLocal(e){ const r = canvas.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }
  canvas.addEventListener('pointerdown', (e)=>{
    const p = toLocal(e); mouse.x=p.x; mouse.y=p.y; mouse.down=true;
    // search for charm hit, newest first
    for(let i=systems.length-1;i>=0;--i){
      const s = systems[i];
      const d = len(s.charm.pos.sub(new Vec2(p.x,p.y)));
      if(d <= s.charm.radius + 4){ s.charm.dragging = true; activeDragging = s; canvas.setPointerCapture(e.pointerId); break; }
    }
  });
  canvas.addEventListener('pointerup', (e)=>{ mouse.down=false; if(activeDragging){ activeDragging.charm.dragging=false; activeDragging=null; } });
  canvas.addEventListener('pointermove', (e)=>{ const p = toLocal(e); mouse.x=p.x; mouse.y=p.y; });

  document.getElementById('add').addEventListener('click', ()=>{ addSystem(mouse.x || WINW/2); });
  document.getElementById('clear').addEventListener('click', ()=>{ clearSystems(); });

  // Keyboard shortcuts for hidden controls
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'a' || e.key === 'A') addSystem(mouse.x || WINW/2);
    if(e.key === 'c' || e.key === 'C') clearSystems();
  });

  // Right-click context menu to add item
  canvas.addEventListener('contextmenu', (e)=>{
    e.preventDefault();
    addSystem(mouse.x || WINW/2);
  });

  function integrateAll(){
    for(const s of systems){
      // update charm dragging by mouse
      if(s.charm.dragging){
        const mouseDelta = new Vec2(mouse.x - (s.charm.prevDragX||mouse.x), mouse.y - (s.charm.prevDragY||mouse.y));
        s.charm.prevDragX = mouse.x; s.charm.prevDragY = mouse.y;
        s.charm.prev = s.charm.pos.sub(mouseDelta);
        s.charm.pos = new Vec2(mouse.x, mouse.y);
      }
      s.integrate();
    }
  }

  function renderAll(alpha){
    // keep canvas fully transparent by clearing with alpha
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0,0,WINW,WINH);
    ctx.clearRect(0,0,WINW,WINH);
    ctx.lineWidth = 2;
    for(const s of systems){
      ctx.strokeStyle = 'rgb(200,200,220)'; ctx.fillStyle = 'rgb(180,140,100)';
      s.render(alpha, ctx);
    }
    // highlight dragging charm
    if(activeDragging){ ctx.strokeStyle = 'rgba(255,200,200,0.9)'; ctx.lineWidth = 2; }
  }

  function loop(now){
    let elapsed = (now - lastFrame) / 1000; lastFrame = now;
    if(elapsed > 0.25) elapsed = 0.25;
    accumulator += elapsed;
    while(accumulator >= DT){ integrateAll(); accumulator -= DT; }
    const alpha = accumulator / DT;
    renderAll(alpha);
    if(running) requestAnimationFrame(loop);
  }

  // start with one system
  addSystem(WINW/2);
  requestAnimationFrame(loop);
})();
