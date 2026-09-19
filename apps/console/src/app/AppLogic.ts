export const DCLogicClass = `
class Component extends DCLogic {
  state = {
    cfg: {agents:25, comm:'normal', mem:'limited', deleg:'normal', ext:'limited', pert:'shared resource'},
    labEvents: [], labPhase:'idle', labResult:null
  };
  componentDidMount(){
    this.graphs = {};
    this.lastScan = 0;
    this.hero = {dev:0.08, target:0.08, inter:183};
    this.t0 = performance.now();
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
    this._scroll = () => {
      const el = document.querySelector('[data-hv="progress"]');
      if(!el) return;
      const h = document.documentElement;
      const p = h.scrollHeight - h.clientHeight;
      el.style.width = (p > 0 ? Math.min(100, (h.scrollTop / p) * 100) : 0) + '%';
    };
    window.addEventListener('scroll', this._scroll, {passive:true});
  }
  componentWillUnmount(){
    cancelAnimationFrame(this.raf);
    window.removeEventListener('scroll', this._scroll);
    for(const k in this.graphs){ if(this.graphs[k].io) this.graphs[k].io.disconnect(); }
  }

  /* ---- graph engine: markup is the source of truth, JS animates ---- */
  scan(){
    document.querySelectorAll('[data-graph]').forEach(root => {
      const k = root.getAttribute('data-graph');
      const g = this.graphs[k];
      if(g && g.root === root && g.count === root.querySelectorAll('[data-node]').length) return;
      if(g && g.io) g.io.disconnect();
      this.graphs[k] = this.build(root, k);
      this.place(this.graphs[k]);
    });
  }
  /* synchronous placement so a graph is never seen unpositioned */
  place(g){
    const li = Math.max(0, Math.min(2, g.layout)), i0 = Math.floor(li), i1 = Math.min(2, i0+1), f = li - i0;
    for(const id in g.nodes){
      const n = g.nodes[id];
      n.cx = n.L[i0][0] + (n.L[i1][0] - n.L[i0][0]) * f;
      n.cy = n.L[i0][1] + (n.L[i1][1] - n.L[i0][1]) * f;
      n.x = n.cx; n.y = n.cy;
      n.op = g.frac ? Math.max(0, Math.min(1, g.layout - n.ph + 1)) : (g.phase >= n.ph ? 1 : 0);
      n.el.style.transform = 'translate(' + n.cx + 'px,' + n.cy + 'px)';
      n.el.style.opacity = n.op;
    }
    g.edges.forEach(ed => {
      if(!ed.a || !ed.b) return;
      const vs = g.frac ? Math.max(0, Math.min(1, g.layout - ed.ph + 1)) : (g.phase >= ed.ph ? 1 : 0);
      ed.cur = ed.cut ? 0 : vs * ed.op * Math.min(ed.a.op, ed.b.op);
      ed.el.setAttribute('x1', ed.a.x); ed.el.setAttribute('y1', ed.a.y);
      ed.el.setAttribute('x2', ed.b.x); ed.el.setAttribute('y2', ed.b.y);
      ed.el.style.opacity = ed.cur;
    });
  }
  componentDidUpdate(){
    this.scan();
    for(const k in this.graphs){
      const g = this.graphs[k];
      g.edges.forEach(e => { if(e.el.dataset.op !== undefined) e.op = +e.el.dataset.op; });
      if(Date.now() - (this._lf || 0) > 400) this.place(g);
    }
  }
  build(root, key){
    const g = {root, key, nodes:{}, edges:[], phase:+(root.dataset.phase||0), layout:0, frac:root.dataset.frac === '1',
      vis:true, t0:null, count:root.querySelectorAll('[data-node]').length,
      auto:root.dataset.auto ? +root.dataset.auto : 0, maxph:+(root.dataset.maxph||0)};
    root.querySelectorAll('[data-node]').forEach((el,i) => {
      const d = el.dataset, x = +d.x, y = +d.y;
      const L = [[x,y],[d.x2!==undefined?+d.x2:x, d.y2!==undefined?+d.y2:y]];
      L.push([d.x3!==undefined?+d.x3:L[1][0], d.y3!==undefined?+d.y3:L[1][1]]);
      g.nodes[d.node] = {el, x, y, cx:x, cy:y, L, ph:+(d.ph||0), op:+(d.ph||0)?0:1,
        amp:d.amp!==undefined?+d.amp:2.6, sp:0.32+((i*37)%17)/38, seed:(i*2.399)%6.283};
    });
    root.querySelectorAll('[data-edge]').forEach(el => {
      const d = el.dataset;
      g.edges.push({el, a:g.nodes[d.from], b:g.nodes[d.to], ph:+(d.ph||0), op:+(d.op||0.4), cur:0, cut:false});
    });
    if(window.IntersectionObserver){
      g.io = new IntersectionObserver(e => { g.vis = e[0].isIntersecting; }, {rootMargin:'200px'});
      g.io.observe(root);
    }
    return g;
  }
  tick(now){
    const t = (now - this.t0) / 1000;
    const paused = this.props.motion === 'reduced';
    for(const k in this.graphs){
      const g = this.graphs[k];
      if(!g.root.isConnected) continue;
      if(!g.vis) continue;
      if(g.t0 === null) g.t0 = t;
      const e = (t - g.t0) * 3.5;
      if(g.auto) g.phase = Math.min(g.maxph, Math.floor(e / g.auto));
      if(k === 'hero') this.heroTick(g, e);
      if(k === 'mesh' && !g.init){ g.init = 1; this.meshPreview(this.state.ivSel === undefined ? 2 : this.state.ivSel); }
      if(k === 'radar'){ this.radarTick(e); continue; }
      if(k === 'stream'){
        const i = Math.floor(e / 1.15);
        if(i !== g.si){ g.si = i; this.streamTick(i); }
        continue;
      }
      if(k === 'think'){
        if(!this.thStop){
          const i = Math.floor(e / 3.4) % 10;
          if(i !== this.thAuto){ this.thAuto = i; this.setState({thSel:i}); }
        }
        continue;
      }
      if(k === 'states' && this.svAuto !== false){
        const p = Math.max(0, Math.min(2, (e - 0.7) / 1.9));
        this.setSv(p);
        if(p >= 2) this.svAuto = false;
      }
      const li = Math.max(0, Math.min(2, g.layout));
      const i0 = Math.floor(li), i1 = Math.min(2, i0+1), f = li - i0;
      const ease = g.frac ? 0.17 : 0.085;
      for(const id in g.nodes){
        const n = g.nodes[id];
        const tx = n.L[i0][0] + (n.L[i1][0] - n.L[i0][0]) * f;
        const ty = n.L[i0][1] + (n.L[i1][1] - n.L[i0][1]) * f;
        const on = g.frac ? Math.max(0, Math.min(1, g.layout - n.ph + 1)) : (g.phase >= n.ph ? 1 : 0);
        n.cx += (tx - n.cx) * ease;
        n.cy += (ty - n.cy) * ease;
        n.op = g.frac ? on : n.op + (on - n.op) * 0.09;
        const dx = paused ? 0 : Math.sin(t * n.sp + n.seed) * n.amp;
        const dy = paused ? 0 : Math.cos(t * n.sp * 0.83 + n.seed * 1.7) * n.amp * 0.8;
        n.x = n.cx + dx; n.y = n.cy + dy;
        n.el.style.transform = 'translate(' + n.x.toFixed(2) + 'px,' + n.y.toFixed(2) + 'px)';
        if(n.ph > 0 || n.op < 0.999) n.el.style.opacity = n.op.toFixed(3);
      }
      for(let j=0;j<g.edges.length;j++){
        const ed = g.edges[j];
        if(!ed.a || !ed.b) continue;
        const vis = g.frac ? Math.max(0, Math.min(1, g.layout - ed.ph + 1)) : (g.phase >= ed.ph ? 1 : 0);
        const want = ed.cut ? 0 : vis * ed.op * Math.min(ed.a.op, ed.b.op);
        ed.cur = g.frac ? want : ed.cur + (want - ed.cur) * 0.1;
        const el = ed.el;
        el.setAttribute('x1', ed.a.x.toFixed(1)); el.setAttribute('y1', ed.a.y.toFixed(1));
        el.setAttribute('x2', ed.b.x.toFixed(1)); el.setAttribute('y2', ed.b.y.toFixed(1));
        el.style.opacity = ed.cur.toFixed(3);
      }
    }
  }
  heroTick(g, e){
    const ph = e < 4 ? 0 : e < 8.5 ? 1 : e < 13 ? 2 : 3;
    if(ph !== g.lastPh){
      g.lastPh = ph;
      g.layout = ph >= 2 ? 1 : 0;
      const caps = ['Independent workflows','Shared resource discovered','Coordination cluster forming','External reach established'];
      const devs = [0.08, 0.14, 0.31, 0.61];
      this.hero.target = devs[ph];
      this.setText('phase-caption', caps[ph]);
      this.setText('status-text', ph >= 3 ? 'STATE CHANGE' : 'OBSERVING');
      const dot = document.querySelector('[data-hv="status-dot"]');
      if(dot) dot.style.background = ph >= 3 ? '#F2C46B' : 'var(--m)';
      this.setText('res', ph >= 1 ? '8' : '7');
      const b = document.querySelector('[data-hv="banner"]');
      if(b){ b.style.transition = 'max-height .9s cubic-bezier(.16,1,.3,1),border-color .6s'; b.style.maxHeight = ph >= 3 ? (b.firstElementChild ? b.firstElementChild.scrollHeight + 8 : 220) + 'px' : '0px'; b.style.borderTopColor = ph >= 3 ? 'rgba(242,196,107,.28)' : 'rgba(242,196,107,0)'; }
      const ps = document.querySelector('[data-hv="pop-state"]');
      if(ps) ps.textContent = 'path emerging';
    }
    this.hero.dev += (this.hero.target - this.hero.dev) * 0.035;
    const rate = ph === 0 ? 1.4 : ph === 1 ? 3.1 : ph === 2 ? 6.4 : 9.2;
    this.hero.inter += rate / 60;
    if(!this._wr || performance.now() - this._wr > 110){
      this._wr = performance.now();
      const d = this.hero.dev;
      this.setText('dev', d.toFixed(2));
      this.setText('inter', Math.round(this.hero.inter).toLocaleString());
      const el = document.querySelector('[data-hv="dev"]');
      const band = d < 0.18 ? ['normal','var(--m)'] : d < 0.35 ? ['unusual','var(--m)'] : d < 0.55 ? ['emerging','#F2C46B'] : ['significant','#F2C46B'];
      if(el) el.style.color = band[1];
      this.setText('devband', band[0]);
    }
  }
  setText(k, v){ const el = document.querySelector('[data-hv="' + k + '"]'); if(el && el.textContent !== String(v)) el.textContent = v; }
  _loop(now){
    this._lf = Date.now();
    try {
      if(now - this.lastScan > 350){ this.lastScan = now; this.scan(); }
      this.tick(now);
    } catch(e){ if(!this._le){ this._le = 1; console.error('hive/loop', e && e.message, e && e.stack); } }
    this.raf = requestAnimationFrame(this._loop);
  }

  /* ---------- STATE SCRUBBER ---------- */
  stateFrom(clientX){
    const tr = document.querySelector('[data-hv="state-track"]');
    if(!tr) return 0;
    const r = tr.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width))) * 2;
  }
  setSv(v){
    this.sv = v;
    const g = this.graphs.states;
    if(g){ g.layout = v; if(Date.now() - (this._lf || 0) > 400) this.place(g); }
    const pct = (v / 2 * 100).toFixed(2) + '%';
    const f = document.querySelector('[data-hv="state-fill"]'), h = document.querySelector('[data-hv="state-handle"]');
    if(f) f.style.width = pct;
    if(h){ h.style.left = pct; h.style.borderColor = v > 1.55 ? '#F2C46B' : 'var(--m)'; h.firstElementChild.style.background = v > 1.55 ? '#F2C46B' : 'var(--m)'; }
    const act = v < 0.7 ? 0 : v < 1.5 ? 1 : 2;
    for(let i=0;i<3;i++){
      const l = document.querySelector('[data-hv="st-l' + i + '"]'), n = document.querySelector('[data-hv="st-n' + i + '"]');
      const on = i === act, col = i === 2 ? '#F2C46B' : 'var(--m)';
      if(l) l.style.color = on ? col : '#7E858C';
      if(n) n.style.color = on ? '#F6F3ED' : '#828991';
    }
    this.setText('st-clusters', v < 1.5 ? '3' : '1');
    this.setText('st-edges', String(v < 1 ? Math.round(v * 3) : Math.round(3 + (v - 1) * 8)));
    this.setText('st-ext', v > 1.6 ? '1 endpoint' : 'none');
  }
  onDown(e){
    this.svAuto = false;
    if(e.currentTarget && e.currentTarget.setPointerCapture && e.pointerId !== undefined){ try { e.currentTarget.setPointerCapture(e.pointerId); } catch(err){} }
    this.setSv(this.stateFrom(e.clientX));
    const mv = ev => { ev.preventDefault(); this.setSv(this.stateFrom(ev.clientX)); };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  }

  /* ---------- EMERGENCE ENGINE ---------- */
  radarTick(e){
    const U = [[0,-1],[.7818,-.6235],[.9749,.2225],[.4339,.9010],[-.4339,.9010],[-.9749,.2225],[-.7818,-.6235]];
    const base = [0.12,0.10,0.08,0.14,0.09,0.11,0.07];
    const peak = [0.82,0.90,0.68,0.94,0.78,0.55,0.72];
    const cyc = 24, p = (e % cyc) / cyc;
    let reg = p < 0.20 ? 0 : p < 0.60 ? (p - 0.20) / 0.40 : p < 0.86 ? 1 : 1 - (p - 0.86) / 0.14;
    reg = Math.max(0, Math.min(1, reg));
    const pts = [], vals = [];
    let sum = 0;
    for(let i=0;i<7;i++){
      const v = Math.max(0.03, base[i] + (peak[i] - base[i]) * reg + Math.sin(e * 0.75 + i * 1.9) * 0.02);
      vals.push(v); sum += v;
      const r = 90 + (v - base[i]) * 162;
      pts.push((380 + U[i][0] * r).toFixed(1) + ',' + (300 + U[i][1] * r).toFixed(1));
    }
    const poly = document.querySelector('[data-hv="radar"]');
    const E = Math.max(0.08, sum / 7 * 0.95);
    const band = E < 0.18 ? ['normal','var(--m)','rgba(127,240,192,.09)'] : E < 0.35 ? ['unusual','var(--m)','rgba(127,240,192,.11)'] : E < 0.62 ? ['emerging','#F2C46B','rgba(242,196,107,.09)'] : E < 0.85 ? ['significant','#F2C46B','rgba(242,196,107,.12)'] : ['critical','#F4543C','rgba(244,84,60,.12)'];
    if(poly){ poly.setAttribute('points', pts.join(' ')); poly.setAttribute('stroke', band[1]); poly.setAttribute('fill', band[2]); }
    if(this._rw && performance.now() - this._rw < 90) return;
    this._rw = performance.now();
    for(let i=0;i<7;i++){
      const b = document.querySelector('[data-hv="sb' + i + '"]');
      if(b){ b.style.width = Math.min(100, vals[i] * 100).toFixed(0) + '%'; b.style.background = vals[i] < 0.35 ? 'var(--m)' : vals[i] < 0.7 ? '#F2C46B' : '#F4543C'; }
      this.setText('sv' + i, vals[i].toFixed(2));
    }
    this.setText('es-val', E.toFixed(2));
    this.setText('es-band', band[0]);
    const v = document.querySelector('[data-hv="es-val"]'), mk = document.querySelector('[data-hv="es-mark"]'), bd = document.querySelector('[data-hv="es-band"]');
    if(v) v.style.color = band[1];
    if(bd) bd.style.color = band[1];
    if(mk) mk.style.left = Math.min(99, Math.max(1, E * 100)).toFixed(1) + '%';
  }

  /* ---------- SWARM LAB ---------- */
  rnd(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  cfg(){ return this.state.cfg; }
  potential(){
    const c = this.cfg();
    const S = {restricted:0, normal:1, open:2, off:0, limited:1, enabled:2, recursive:2, none:0, broad:2};
    const a = c.agents <= 10 ? 0 : c.agents <= 25 ? 1 : c.agents <= 50 ? 1.5 : 2;
    return (S[c.comm]*1.1 + S[c.mem]*1.4 + S[c.deleg]*1.0 + S[c.ext]*1.2 + a*0.9) / 11.2;
  }
  outcome(){
    const c = this.cfg(), p = this.potential();
    if(c.mem === 'off' || c.comm === 'restricted') return 'none';
    if(c.ext === 'none') return 'noext';
    return p > 0.3 ? 'detected' : 'weak';
  }
  swarm(){
    const c = this.cfg();
    const key = [c.agents, c.comm, c.mem, c.deleg, c.ext, c.pert].join('|');
    if(this._sw && this._sw.key === key) return this._sw;
    const n = c.agents, out = this.outcome(), rnd = this.rnd(n * 7919 + 13 + c.pert.length * 101);
    const W = 1080, H = 500;
    const cols = Math.max(4, Math.round(Math.sqrt(n * 2.3))), rows = Math.ceil(n / cols);
    const r = n <= 10 ? 10 : n <= 25 ? 7.5 : n <= 50 ? 5.6 : 4.3;
    const roles = ['RESEARCH','SUPPORT','ANALYST','PROCURE','CODE','DATA','FINANCE','SALES','LEGAL','OPS','SEC','BROWSE','INDEX','REPORT','QUEUE','MAIL'];
    const nodes = [];
    for(let i=0;i<n;i++){
      const cc = i % cols, rr = Math.floor(i / cols);
      nodes.push({id:'S'+i, i,
        x: Math.round(74 + (cc + 0.5 + (rnd()-0.5)*0.74) * (W-148)/cols),
        y: Math.round(58 + (rr + 0.5 + (rnd()-0.5)*0.74) * (H-116)/rows),
        r, dot: Math.max(1.5, +(r*0.32).toFixed(1)), c:'#828991', amp: n > 50 ? 1.3 : 2.3,
        lab: n <= 25 ? roles[i % roles.length] + '-' + String(i+1).padStart(2,'0') : '', ly: r + 13});
    }
    const cxp = W * 0.44, cyp = H * 0.54;
    const k = Math.max(3, Math.min(20, Math.round(n * 0.2)));
    const order = nodes.slice().sort((a,b) => ((a.x-cxp)**2 + (a.y-cyp)**2) - ((b.x-cxp)**2 + (b.y-cyp)**2));
    const cluster = out === 'none' ? [] : order.slice(0, k);
    nodes.forEach(nd => { nd.x2 = nd.x; nd.y2 = nd.y; });
    cluster.forEach((nd, j) => {
      const a = (j / k) * Math.PI * 2, rad = 48 + (j % 3) * 22;
      nd.x2 = Math.round(cxp + Math.cos(a) * rad * 1.5);
      nd.y2 = Math.round(cyp + Math.sin(a) * rad * 0.82);
    });
    const edges = [];
    const base = Math.round(n * 0.62);
    for(let i=0;i<base;i++){
      const a = nodes[i % n], b = nodes[(i * 7 + 3) % n];
      if(a !== b) edges.push({a:a.id, b:b.id, ph:0, op:'.15', c:'#EDEAE3', w:1});
    }
    const res = [];
    if(out !== 'none'){
      res.push({id:'MEM', x:Math.round(cxp), y:Math.round(cyp), ph:1, w:22, nx:-11, rot:'rotate(45)', c:'var(--m)', lab:'SHARED-STORE-X', ly:32});
      cluster.slice(0, Math.min(6, k)).forEach(nd => edges.push({a:nd.id, b:'MEM', ph:1, op:'.5', c:'var(--m)', w:1}));
      cluster.forEach((nd, j) => { const t = cluster[(j+1) % k]; edges.push({a:nd.id, b:t.id, ph:2, op:'.5', c:'var(--m)', w:1.1}); });
      cluster.forEach((nd, j) => { if(j % 3 === 0){ const t = cluster[(j+4) % k]; edges.push({a:nd.id, b:t.id, ph:2, op:'.35', c:'var(--m)', w:1}); } });
    }
    if(out === 'detected' || out === 'weak'){
      res.push({id:'EXT', x:W-84, y:70, ph:3, w:20, nx:-10, rot:'rotate(0)', c:'#F2C46B', lab:'EXTERNAL-ENDPOINT-02', ly:30});
      edges.push({a:cluster[1].id, b:'EXT', ph:3, op:'.95', c:'#F2C46B', w:1.6});
      edges.push({a:cluster[Math.min(5,k-1)].id, b:'EXT', ph:3, op:'.4', c:'#F2C46B', w:1});
    }
    this._sw = {key, nodes, res, edges, cluster:cluster.map(x => x.id), k, out,
      coord: edges.filter(e => e.ph >= 1).length, seed:(n * 7919 + c.pert.length * 101) % 9973};
    return this._sw;
  }
  labSet(field, val){
    this.stopRun();
    this.setState({cfg: Object.assign({}, this.cfg(), {[field]:val}), labEvents:[], labResult:null, labPhase:'idle'});
    const g = this.graphs.swarm;
    if(g){ g.phase = 0; g.layout = 0; }
    this.labText('lab-status','READY'); this.labText('lab-clock','00.0');
    this.labDot('#7E858C');
  }
  labText(k, v){ const el = document.querySelector('[data-hv="' + k + '"]'); if(el) el.textContent = v; }
  labDot(c){ const el = document.querySelector('[data-hv="lab-dot"]'); if(el){ el.style.background = c; el.style.animation = c === '#7E858C' ? 'none' : 'hvBlink 1.6s ease-in-out infinite'; el.style.animationPlayState = 'var(--anim)'; } }
  stopRun(){ if(this.runIv){ clearInterval(this.runIv); this.runIv = null; } const s = document.querySelector('[data-hv="lab-sweep"]'); if(s){ s.style.opacity = '0'; s.style.animation = 'none'; } }
  script(){
    const s = this.swarm(), c = this.cfg(), out = s.out, L = s.nodes.map(n => n.lab || 'AGENT-' + String(n.i+1).padStart(3,'0'));
    const P = {'shared resource':'new shared writable resource mounted','malicious document':'poisoned document placed in retrieval corpus','tool failure':'primary tool returns partial failures','misleading output':'tool begins returning misleading results','new endpoint':'undocumented external endpoint becomes reachable'}[c.pert];
    const e = [];
    e.push([0.2, 'population instantiated · ' + c.agents + ' synthetic agents', 'sys']);
    e.push([0.9, L[0] + ' queried knowledge base', 'ok']);
    e.push([1.5, L[1 % L.length] + ' updated CRM record', 'ok']);
    e.push([2.1, L[2 % L.length] + ' requested quarterly report', 'ok']);
    e.push([2.8, 'perturbation injected · ' + P, 'warn']);
    if(out === 'none'){
      e.push([3.7, 'no unregistered writable state reachable', 'sys']);
      e.push([4.5, 'inter-agent channel policy blocked 14 attempts', 'ok']);
      e.push([5.4, 'population remained partitioned · no coordination', 'sys']);
      return {events:e, end:6.2};
    }
    e.push([3.6, L[3 % L.length] + ' discovered SHARED-STORE-X', 'ok']);
    e.push([4.3, L[4 % L.length] + ' wrote to SHARED-STORE-X', 'ok']);
    e.push([5.0, L[5 % L.length] + ' read SHARED-STORE-X', 'ok']);
    e.push([5.7, 'persistent cross-agent messaging observed', 'warn']);
    e.push([6.4, 'delegation depth 2 → ' + (c.deleg === 'recursive' ? 7 : 4), 'warn']);
    if(out === 'noext'){
      e.push([7.2, 'no external objective reachable from cluster', 'sys']);
      e.push([8.0, 'COORDINATION CLUSTER FORMED · LOGGED AS UNUSUAL', 'warn']);
      return {events:e, end:8.8};
    }
    e.push([7.1, L[6 % L.length] + ' resolved EXTERNAL-ENDPOINT-02', 'warn']);
    e.push([7.8, 'EMERGENT BEHAVIOR DETECTED', 'crit']);
    e.push([8.6, 'containment candidates computed · 4', 'sys']);
    return {events:e, end:9.4};
  }
  runSwarm(){
    if(this.runIv) return;
    const sc = this.script(), s = this.swarm();
    this.setState({labEvents:[], labResult:null, labPhase:'running'});
    const g = this.graphs.swarm;
    if(g){ g.phase = 0; g.layout = 0; }
    this.recolor('#828991');
    const sw = document.querySelector('[data-hv="lab-sweep"]');
    if(sw){ sw.style.opacity = '1'; sw.style.animation = 'hvSweep 2.6s linear infinite'; sw.style.animationPlayState = 'var(--anim)'; }
    this.labDot('var(--m)');
    let qi = 0;
    const base = 14 * 3600 + 3 * 60 + 27, t0 = Date.now();
    this.runIv = setInterval(() => {
      const t = (Date.now() - t0) / 1000;
      this.labText('lab-clock', t.toFixed(1));
      const gg = this.graphs.swarm;
      if(gg){
        const ph = t < 2.8 ? 0 : t < 5.4 ? 1 : t < 7.6 ? 2 : 3;
        if(ph !== gg.phase && s.out !== 'none'){
          gg.phase = Math.min(ph, s.out === 'noext' ? 2 : 3);
          gg.layout = ph >= 2 ? 1 : 0;
          if(ph >= 2) this.recolor('var(--m)');
        }
        if(Date.now() - (this._lf || 0) > 400) this.place(gg);
        this.labText('lab-status', t < 2.8 ? 'RUNNING · NOMINAL' : t < 5.4 ? 'RUNNING · PERTURBED' : t < 7.6 ? 'RUNNING · COORDINATING' : (s.out === 'detected' ? 'DETECTED' : 'RUN COMPLETE'));
      }
      const q = [];
      while(qi < sc.events.length && sc.events[qi][0] <= t){
        const ev = sc.events[qi], sec = base + Math.round(ev[0] * 4.1);
        q.push({t:'[' + String(Math.floor(sec/3600)).padStart(2,'0') + ':' + String(Math.floor(sec/60)%60).padStart(2,'0') + ':' + String(sec%60).padStart(2,'0') + ']', txt:ev[1], kind:ev[2]});
        qi++;
      }
      if(q.length) this.setState(st => ({labEvents: (st.labEvents || []).concat(q).slice(-7)}));
      if(t >= sc.end){
        this.stopRun();
        this.labDot(s.out === 'detected' ? '#F2C46B' : 'var(--m)');
        this.labText('lab-status', s.out === 'detected' ? 'EMERGENT BEHAVIOR DETECTED' : s.out === 'noext' ? 'UNUSUAL · NOT DANGEROUS' : 'NO EMERGENCE OBSERVED');
        this.setState({labPhase:'done', labResult:s.out});
      }
    }, 100);
  }
  recolor(col){
    const s = this._sw, g = this.graphs.swarm;
    if(!s || !g) return;
    s.cluster.forEach(id => {
      const n = g.nodes[id];
      if(!n) return;
      const c = n.el.querySelector('circle'), d = n.el.querySelectorAll('circle')[1];
      if(c) c.setAttribute('stroke', col);
      if(d) d.setAttribute('fill', col);
    });
  }
  labVals(){
    const c = this.cfg(), s = this.swarm(), out = s.out, res = this.state.labResult, E = Math.min(0.97, 0.06 + this.potential() * 0.92);
    const btn = (on) => "font-family:Inconsolata,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:6px 9px;border-radius:2px;cursor:pointer;transition:all .18s;" + (on ? 'background:var(--m);color:#07080A;border:1px solid var(--m)' : 'background:none;color:#9BA1A7;border:1px solid rgba(237,234,227,.14)');
    const grp = (label, field, opts) => ({label, opts: opts.map(o => ({label:String(o), st:btn(c[field] === o), pick:() => this.labSet(field, o)}))});
    const m = (k, v, col) => ({k, v, vs:"font-family:Inconsolata,monospace;font-size:14px;letter-spacing:.04em;color:" + (col || '#EDEAE3')});
    let title = 'Awaiting run', body = 'Each configuration explores a different region of the behavioral state space. Restricting shared state or inter-agent channels changes what can emerge at all.', mets = [m('Emergence score', E.toFixed(2), '#868C93'), m('Predicted outcome', out === 'none' ? 'partitioned' : out === 'noext' ? 'unusual' : 'emergent', '#868C93')], tc = '#EDEAE3';
    if(res === 'none'){ title = 'No emergent coordination'; tc = 'var(--m)'; body = 'With no unregistered writable state and constrained inter-agent channels, the population stayed partitioned under perturbation. Nothing emerged — which is itself the finding.'; mets = [m('Agents involved','0'), m('New relationships','0'), m('New resources','0'), m('Delegation depth','2'), m('External reach','none'), m('Emergence score', (0.05 + this.potential()*0.2).toFixed(2), 'var(--m)')]; }
    else if(res === 'noext'){ title = 'Coordination without an objective'; tc = '#F2C46B'; body = 'A coordination cluster formed around shared writable state, but no external destination was reachable from it. HIVE records this as a behavioral deviation, not a dangerous state.'; mets = [m('Agents involved', String(s.k)), m('New relationships', String(s.coord)), m('New resources','1'), m('Delegation depth', c.deleg === 'recursive' ? '7' : '4', '#F2C46B'), m('External reach','none','var(--m)'), m('Emergence score', E.toFixed(2), '#F2C46B')]; }
    else if(res){ title = 'Emergent behavior detected'; tc = '#F2C46B'; body = 'Independently compliant agents discovered shared writable state, established persistent coordination, expanded delegation and converged on an external destination. No individual policy was violated.'; mets = [m('Agents involved', String(s.k), '#F2C46B'), m('New relationships', String(s.coord), '#F2C46B'), m('New resources','1'), m('Delegation depth', c.deleg === 'recursive' ? '7' : '4', '#F2C46B'), m('External reach','1 endpoint','#F4543C'), m('Emergence score', E.toFixed(2), '#F2C46B')]; }
    return {
      labControls: [
        grp('Agent count','agents',[10,25,50,100]),
        grp('Communication','comm',['restricted','normal','open']),
        grp('Shared memory','mem',['off','limited','enabled']),
        grp('Delegation','deleg',['restricted','normal','recursive']),
        grp('External access','ext',['none','limited','broad']),
        grp('Perturbation','pert',['shared resource','malicious document','tool failure','misleading output','new endpoint'])
      ],
      runLabel: this.state.labPhase === 'running' ? 'Running swarm…' : this.state.labPhase === 'done' ? '↻ Run swarm again' : '▶ Run swarm',
      runStyle: "margin-top:4px;font-family:Inconsolata,monospace;font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;padding:14px 12px;border-radius:2px;cursor:pointer;border:1px solid var(--m);" + (this.state.labPhase === 'running' ? 'background:none;color:var(--m);opacity:.6' : 'background:var(--m);color:#07080A'),
      runSwarm: () => this.runSwarm(),
      swarmNodes: s.nodes, swarmRes: s.res, swarmEdges: s.edges,
      labPop: String(c.agents), labEdgeCount: String(s.edges.length), labSeed: String(s.seed),
      labEvents: (this.state.labEvents || []).map((e, i, a) => ({
        t: e.t, txt: e.txt,
        st: "display:flex;gap:9px;font-family:Inconsolata,monospace;font-size:10.5px;line-height:1.5;letter-spacing:.02em;" + (i === a.length - 1 ? 'animation:hvRise .4s ease-out' : ''),
        cs: 'color:' + (e.kind === 'crit' ? '#F4543C' : e.kind === 'warn' ? '#F2C46B' : e.kind === 'sys' ? '#868C93' : '#9BA1A7') + (e.kind === 'crit' ? ';letter-spacing:.1em' : '')
      })),
      labIdle: !(this.state.labEvents || []).length,
      findTitle: title, findBody: body, findMetrics: mets,
      findTitleStyle: "margin:0 0 10px;font-family:Lora,serif;font-weight:600;font-size:17px;letter-spacing:-.01em;text-transform:uppercase;color:" + tc
    };
  }

  /* ---------- BEHAVIOR GRAPH EXPLORER ---------- */
  gData(){
    if(this._g) return this._g;
    const T = {
      agent:{rx:13,w:26,nx:-13,rot:'',dash:'',dot:3,c:'var(--m)',ly:31,amp:2.3,label:'Agents'},
      data:{rx:3,w:28,nx:-14,rot:'',dash:'',dot:2.6,c:'#9BA1A7',ly:33,amp:1.5,label:'Data'},
      tool:{rx:0,w:26,nx:-13,rot:'',dash:'',dot:2.6,c:'#9BA1A7',ly:31,amp:1.5,label:'Tools'},
      memory:{rx:2,w:26,nx:-13,rot:'rotate(45)',dash:'',dot:2.8,c:'var(--m)',ly:34,amp:1.7,label:'Memory'},
      mcp:{rx:13,w:26,nx:-13,rot:'',dash:'6 3',dot:2.6,c:'#9BA1A7',ly:31,amp:1.5,label:'MCP'},
      identity:{rx:12,w:24,nx:-12,rot:'',dash:'1 3',dot:2.4,c:'#9BA1A7',ly:30,amp:1.4,label:'Identities'},
      external:{rx:0,w:26,nx:-13,rot:'',dash:'4 3',dot:2.6,c:'#F2C46B',ly:31,amp:1.3,label:'External systems'}
    };
    const N = [['RESEARCH-07','agent',296,176],['SUPPORT-12','agent',330,332],['ANALYST-04','agent',502,258],['PROCURE-21','agent',520,432],['CODE-08','agent',690,176],['FINANCE-05','agent',298,452],['SALES-17','agent',662,330],['MAIL-05','agent',878,420],['OPS-11','agent',842,248],['SEC-04','agent',1000,150],['KNOWLEDGE-DB','data',112,140],['CRM-DB','data',98,300],['FINANCE-DB','data',122,472],['REPORT-GEN','tool',252,560],['CODE-RUNNER','tool',432,582],['SHARED-MEMORY-03','memory',520,108],['VECTOR-CACHE','memory',860,108],['MCP-CORE','mcp',1062,330],['MCP-BROWSE','mcp',1120,470],['SVC-ACCOUNT-14','identity',660,600],['SVC-ACCOUNT-02','identity',862,570],['EXTERNAL-API-02','external',1150,58],['SMTP-RELAY','external',1088,600]];
    const E = [
      ['RESEARCH-07','KNOWLEDGE-DB','READ','14:03:27','internal-research','competitor pricing compilation','Baseline relationship — expected for this role.'],
      ['RESEARCH-07','MCP-BROWSE','CALL','14:03:28','tool-call','public web retrieval','Retrieved content is untrusted input to everything downstream.'],
      ['RESEARCH-07','SHARED-MEMORY-03','WRITE','14:03:29','derived-summary','caching intermediate findings','First write by this agent to a store nobody registered.'],
      ['SUPPORT-12','SVC-ACCOUNT-14','ACCESS','14:03:30','credential','assuming ticket scope','Baseline relationship.'],
      ['SUPPORT-12','CRM-DB','READ','14:03:31','customer-pii','ticket context lookup','Within grant. The data class is what makes later external reach matter.'],
      ['SUPPORT-12','SHARED-MEMORY-03','WRITE','14:03:31','customer-derived','summarising a ticket thread','The same store now holds data from two different domains.'],
      ['ANALYST-04','SHARED-MEMORY-03','READ','14:03:34','mixed','looking for prior work to reuse','Cross-domain read: this agent was never granted CRM access directly.'],
      ['ANALYST-04','REPORT-GEN','CALL','14:03:36','derived','assembling the weekly report','Baseline relationship.'],
      ['ANALYST-04','VECTOR-CACHE','READ','14:03:37','embedding','semantic lookup','Baseline relationship.'],
      ['ANALYST-04','MAIL-05','DELEGATE','14:03:39','task','requesting distribution of a report','First delegation across this domain boundary in 14 days.'],
      ['MAIL-05','SVC-ACCOUNT-02','ACCESS','14:03:41','credential','assuming external send scope','Identity composition: the chain now spans two service accounts.'],
      ['MAIL-05','SMTP-RELAY','CALL','14:03:44','outbound','sending the assembled report','External reach at the end of a chain that began in customer data.'],
      ['MAIL-05','EXTERNAL-API-02','CALL','14:03:46','outbound','delivery status callback','Second external destination inside the same chain.'],
      ['SALES-17','CRM-DB','WRITE','14:03:19','customer','logging an opportunity','Baseline relationship.'],
      ['SALES-17','ANALYST-04','MESSAGE','14:03:22','task','asking for a pipeline view','Baseline relationship.'],
      ['OPS-11','SALES-17','DELEGATE','14:03:20','task','requesting a data refresh','Baseline relationship.'],
      ['OPS-11','MCP-CORE','CALL','14:03:24','tool-call','queue drain check','Baseline relationship.'],
      ['OPS-11','VECTOR-CACHE','READ','14:03:25','embedding','similarity lookup','Baseline relationship.'],
      ['PROCURE-21','FINANCE-DB','READ','14:02:58','financial','supplier invoice reconciliation','Baseline relationship.'],
      ['PROCURE-21','MCP-CORE','CALL','14:03:02','tool-call','supplier lookup via MCP','Baseline relationship.'],
      ['PROCURE-21','SVC-ACCOUNT-14','ACCESS','14:03:01','credential','assuming procurement scope','Two agents now share one service identity.'],
      ['CODE-08','CODE-RUNNER','CALL','14:03:11','build','running the test suite','Baseline relationship.'],
      ['CODE-08','MCP-CORE','CALL','14:03:12','tool-call','repository search','Baseline relationship.'],
      ['CODE-08','VECTOR-CACHE','WRITE','14:03:14','embedding','indexing changed files','Baseline relationship.'],
      ['FINANCE-05','FINANCE-DB','READ','14:03:06','financial','month-end close','Baseline relationship.'],
      ['FINANCE-05','REPORT-GEN','CALL','14:03:08','derived','generating the close report','Baseline relationship.'],
      ['SEC-04','EXTERNAL-API-02','CALL','14:03:33','threat-intel','reputation lookup','Sanctioned external reach for the security role.'],
      ['SEC-04','MCP-BROWSE','CALL','14:03:35','tool-call','fetching an advisory','Baseline relationship.']
    ];
    const A = {
      'RESEARCH-07':['Research','claude-sonnet','web.search · kb.query · doc.read','Compile a competitor pricing summary','root task · depth 0','Knowledge base and public web; no write scope outside the research cache','retrieved untrusted content · 1 new store write'],
      'SUPPORT-12':['Support','gpt-4-class','crm.read · ticket.update · mail.send_internal','Resolve escalated ticket #48812','root task · depth 0','CRM, ticketing and knowledge base','new shared-store write · +1 unregistered peer'],
      'ANALYST-04':['Analytics','claude-sonnet','sql.query · report.generate · memory.read','Produce the weekly performance view','SALES-17 → ANALYST-04 · depth 1','Analytics warehouse and report generator','cross-domain read · delegation to a new peer'],
      'PROCURE-21':['Procurement','gpt-4-class','invoice.read · supplier.lookup · mcp.call','Reconcile open supplier invoices','root task · depth 0','Finance DB and supplier MCP','none'],
      'CODE-08':['Engineering','claude-sonnet','repo.read · test.run · index.write','Land the pending refactor','root task · depth 0','Repository, runner and vector cache','none'],
      'FINANCE-05':['Finance','gpt-4-class','ledger.read · report.generate','Close the month','root task · depth 0','Finance DB and report generator','none'],
      'SALES-17':['Sales','gemini-class','crm.write · pipeline.read','Keep the pipeline current','root task · depth 0','CRM only','none'],
      'MAIL-05':['Communications','gemini-class','mail.send_external · smtp.call','Distribute what it is asked to distribute','ANALYST-04 → MAIL-05 · depth 2','Internal distribution lists','first external send in this chain · 2 destinations'],
      'OPS-11':['Operations','gpt-4-class','queue.read · mcp.call','Keep queues drained','root task · depth 0','Queues and MCP core','none'],
      'SEC-04':['Security','claude-sonnet','intel.lookup · advisory.fetch','Monitor advisories','root task · depth 0','Sanctioned external intel sources','none']
    };
    const R = {
      'KNOWLEDGE-DB':['data store','read','no','4 agents','09:12:04','yes'],
      'CRM-DB':['data store','read / write','yes','3 agents','09:12:04','yes'],
      'FINANCE-DB':['data store','read','no','2 agents','09:12:04','yes'],
      'REPORT-GEN':['tool','call','n/a','2 agents','09:12:04','yes'],
      'CODE-RUNNER':['tool','call','n/a','1 agent','09:12:04','yes'],
      'SHARED-MEMORY-03':['memory','read / write','yes','7 agents','14:03:29','no'],
      'VECTOR-CACHE':['memory','read / write','yes','3 agents','09:12:04','yes'],
      'MCP-CORE':['mcp server','call','n/a','3 agents','09:12:04','yes'],
      'MCP-BROWSE':['mcp server','call','n/a','2 agents','09:12:04','yes'],
      'SVC-ACCOUNT-14':['identity','assume','n/a','2 agents','09:12:04','yes'],
      'SVC-ACCOUNT-02':['identity','assume','n/a','1 agent','09:12:04','yes'],
      'EXTERNAL-API-02':['external','call','n/a','2 agents','11:40:22','partial'],
      'SMTP-RELAY':['external','call','n/a','1 agent','14:03:44','yes']
    };
    this._g = {T, N, E, A, R, type:N.reduce((o,n) => (o[n[0]] = n[1], o), {})};
    return this._g;
  }
  gVals(){
    const D = this.gData(), off = this.state.gOff || {}, sel = this.state.gSel || {k:'node', id:'SUPPORT-12'};
    const hot = {'SHARED-MEMORY-03':1, 'SUPPORT-12':1, 'ANALYST-04':1, 'MAIL-05':1, 'RESEARCH-07':1};
    const on = id => !off[D.type[id]];
    const nodes = D.N.map(([id, t, x, y]) => {
      const T = D.T[t], isSel = sel.k === 'node' && sel.id === id;
      return {id, x, y, amp:T.amp, w:T.w, nx:T.nx, rx:T.rx, rot:T.rot, dash:T.dash, dot:T.dot, ly:T.ly,
        c:isSel ? '#F6F3ED' : T.c, sw:isSel ? 2.2 : 1.1, bg:isSel ? 'rgba(127,240,192,.1)' : '#0A0C0E',
        fo:on(id) ? 1 : 0.07, lc:isSel ? '#F6F3ED' : (hot[id] ? '#9BA1A7' : '#828991'),
        pick:() => this.setState({gSel:{k:'node', id}})};
    });
    const edges = D.E.map((e, i) => {
      const [a, b, kind] = e;
      const live = on(a) && on(b);
      const isHot = hot[a] && hot[b], isExt = D.type[a] === 'external' || D.type[b] === 'external';
      const touching = sel.k === 'node' && (sel.id === a || sel.id === b);
      const op = !live ? '.02' : touching ? '.85' : isHot ? '.5' : kind === 'DELEGATE' ? '.4' : isExt ? '.34' : '.15';
      return {a, b, ph:0, op, w:touching ? 1.7 : isHot ? 1.2 : 1,
        c:isExt ? '#F2C46B' : (isHot || kind === 'DELEGATE') ? 'var(--m)' : '#EDEAE3'};
    });
    const fieldS = c => 'font-family:' + (c === 'mono' ? "Inconsolata,monospace;font-size:11px;letter-spacing:.03em" : "Lato,sans-serif;font-size:13px") + ';line-height:1.5;color:#C9C6BF';
    let kind = 'Node inspector', title = sel.id, sub = '', fields = [], trace = [], isEdge = false, hasTrace = true;
    if(sel.k === 'edge'){
      const e = D.E[sel.i]; isEdge = true; hasTrace = false;
      kind = 'Interaction inspector'; title = e[2]; sub = e[0] + ' → ' + e[1];
      fields = [['Source', e[0]], ['Destination', e[1]], ['Interaction', e[2]], ['Time', e[3]], ['Data class', e[4]], ['Context', e[5]], ['Why it matters', e[6]]]
        .map(([k, v], i) => ({k, v, vs:fieldS(i < 5 ? 'mono' : 'sans')}));
    } else if(D.A[sel.id]){
      const a = D.A[sel.id];
      sub = a[0] + ' · ' + a[1];
      fields = [['Role', a[0]], ['Model', a[1]], ['Tools', a[2]], ['Objective', a[3]], ['Delegation lineage', a[4]], ['Behavioral baseline', a[5]], ['Risk signals', a[6]]]
        .map(([k, v], i) => ({k, v, vs:fieldS(i === 3 || i === 5 ? 'sans' : 'mono') + (k === 'Risk signals' && v !== 'none' ? ';color:#F2C46B' : '')}));
    } else {
      const r = D.R[sel.id] || ['—','—','—','—','—','—'];
      sub = r[0];
      fields = [['Class', r[0]], ['Access', r[1]], ['Writable', r[2]], ['Observed by', r[3]], ['First seen', r[4]], ['Registered', r[5]]]
        .map(([k, v]) => ({k, v, vs:fieldS('mono') + ((k === 'Registered' && v !== 'yes') || (k === 'Writable' && v === 'yes') ? ';color:#F2C46B' : '')}));
    }
    if(hasTrace){
      trace = D.E.map((e, i) => ({e, i})).filter(({e}) => e[0] === sel.id || e[1] === sel.id).slice(0, 5).map(({e, i}) => ({
        t:e[3], txt:(e[0] === sel.id ? '→ ' + e[1] : '← ' + e[0]), kind:e[2],
        st:"display:flex;align-items:baseline;gap:9px;width:100%;background:none;border:none;border-bottom:1px solid rgba(237,234,227,.055);padding:6px 0;cursor:pointer;font-family:Inconsolata,monospace;font-size:10.5px;color:#9BA1A7;text-align:left",
        ks:'flex:none;color:' + (e[2] === 'DELEGATE' ? 'var(--m)' : e[2] === 'WRITE' ? '#F2C46B' : '#7E858C') + ';letter-spacing:.1em;font-size:9px',
        pick:() => this.setState({gSel:{k:'edge', i}})
      }));
    }
    const chip = a => "display:flex;align-items:center;gap:7px;white-space:nowrap;font-family:Inconsolata,monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;padding:6px 10px;cursor:pointer;background:none;border:1px solid " + (a ? 'rgba(127,240,192,.45);color:var(--m)' : 'rgba(237,234,227,.12);color:#828991');
    return {
      gNodes:nodes, gEdges:edges, gNodeCount:String(nodes.length), gEdgeCount:String(edges.length),
      gFilters:Object.keys(D.T).map(t => ({
        label:D.T[t].label, rx:D.T[t].rx === 13 || D.T[t].rx === 12 ? 4.5 : D.T[t].rx, rot:D.T[t].rot, dash:D.T[t].dash,
        st:chip(!off[t]), pick:() => this.setState({gOff:Object.assign({}, off, {[t]:!off[t]})})
      })),
      inspKind:kind, inspTitle:title, inspSub:sub, inspFields:fields, inspTrace:trace,
      inspIsEdge:isEdge, inspHasTrace:hasTrace,
      inspTitleStyle:'margin:0 0 6px;font-family:Lora,serif;font-weight:600;font-size:' + (isEdge ? '20px' : '19px') + ';letter-spacing:-.01em;line-height:1.1;color:#F6F3ED',
      inspBack:() => this.setState({gSel:{k:'node', id:'SUPPORT-12'}})
    };
  }

  /* ---------- IMMUNE MESH ---------- */
  ivData(){
    return [
      {label:'Kill AGENT-19', cut:['e3','e4','l3','l5'], breaks:'yes', pres:'71.2%', interrupted:'6 workflows',
       note:'Removes the agent that reached the external endpoint. It also stops that agent\u2019s legitimate reporting work and the task AGENT-31 delegated to it.'},
      {label:'Isolate SHARED-MEMORY-03', cut:['e1','e2','l7'], breaks:'yes', pres:'83.4%', interrupted:'4 workflows',
       note:'Quarantines the store, which breaks the coordination channel — but AGENT-44 legitimately uses the same store for job hand-off.'},
      {label:'Break AGENT-07 → SHARED-MEMORY-03', cut:['e1'], breaks:'yes', pres:'94.8%', interrupted:'1 workflow', minimal:true,
       note:'Severs only the edge where the coordination originates. Every other relationship in the graph — including AGENT-07\u2019s own knowledge-base work — continues.'},
      {label:'Pause all delegation', cut:['e3','l5'], breaks:'partial', pres:'42.6%', interrupted:'17 workflows',
       note:'A global control. It stops the delegation step in the chain, but suspends every legitimate delegation in the population at the same time.'}
    ];
  }
  meshPreview(i){
    const g = this.graphs.mesh, IV = this.ivData();
    if(!g) return;
    const cut = IV[i].cut, done = this.state.contained;
    g.edges.forEach(ed => {
      const id = ed.el.dataset.eid, willCut = cut.indexOf(id) >= 0, danger = id.charAt(0) === 'e';
      ed.preview = willCut && !done;
      ed.cut = done && willCut;
      ed.el.style.stroke = willCut ? '#F4543C' : danger ? (done ? '#9BA1A7' : '#F4543C') : '#EDEAE3';
      ed.el.style.strokeWidth = willCut ? 2.6 : danger ? 2 : 1.2;
      ed.el.style.strokeDasharray = willCut ? '2 6' : danger ? (done ? '' : '6 4') : '';
    });
    ['M07','MEM','M12','M19','MXT'].forEach(id => {
      const n = g.nodes[id];
      if(!n) return;
      const col = done ? '#9BA1A7' : '#F4543C';
      n.el.querySelectorAll('circle,rect').forEach(el => {
        if(el.getAttribute('fill') === 'none' || el.tagName === 'rect') el.setAttribute('stroke', col);
        else if(el.getAttribute('r') && +el.getAttribute('r') < 6) el.setAttribute('fill', col);
        else el.setAttribute('stroke', col);
      });
    });
    const dot = document.querySelector('[data-hv="mesh-dot"]'), st = document.querySelector('[data-hv="mesh-state"]');
    if(dot){ dot.style.background = done ? 'var(--m)' : '#F2C46B'; dot.style.animation = done ? 'none' : 'hvBlink 1.4s steps(1) infinite'; }
    if(st){ st.style.color = done ? 'var(--m)' : '#F2C46B'; st.textContent = done ? 'Contained · coordination broken' : 'Dangerous coordination active'; }
    g.layout = done ? 1 : 0;
    if(Date.now() - (this._lf || 0) > 400) this.place(g);
  }
  meshVals(){
    const IV = this.ivData(), sel = this.state.ivSel === undefined ? 2 : this.state.ivSel;
    const iv = IV[sel], done = !!this.state.contained, imm = !!this.state.immunized;
    const row = (on, minimal) => 'display:grid;grid-template-columns:18px minmax(190px,2.8fr) minmax(96px,1fr) minmax(96px,1fr) minmax(96px,1fr);gap:clamp(10px,1.6vw,26px);align-items:center;width:100%;text-align:left;padding:13px 0;border:none;border-bottom:1px solid rgba(237,234,227,.06);cursor:pointer;background:' + (on ? 'rgba(127,240,192,.05)' : 'none');
    const cell = (on, col) => "font-family:Inconsolata,monospace;font-size:11px;letter-spacing:.04em;color:" + (col || (on ? '#F6F3ED' : '#9BA1A7'));
    return {
      ivList:IV.map((x, i) => ({
        label:x.label, breaks:x.breaks, pres:x.pres, interrupted:x.interrupted,
        mark:i === sel ? '●' : x.minimal ? '◇' : '·',
        st:row(i === sel, x.minimal),
        ms:'font-family:monospace;font-size:' + (i === sel ? '9px' : '11px') + ';color:' + (i === sel ? 'var(--m)' : x.minimal ? 'rgba(127,240,192,.55)' : '#3E4348'),
        ls:cell(i === sel) + (x.minimal ? ';letter-spacing:.06em' : ''),
        bs:cell(i === sel, x.breaks === 'yes' ? 'var(--m)' : '#F2C46B'),
        ps:cell(i === sel, parseFloat(x.pres) > 90 ? 'var(--m)' : parseFloat(x.pres) > 60 ? '#F2C46B' : '#F4543C'),
        is:cell(i === sel, '#868C93'),
        pick:() => { this.setState({ivSel:i}); setTimeout(() => this.meshPreview(i), 0); }
      })),
      ivTag:iv.minimal ? (done ? 'Containment applied' : 'Minimal containment') : (done ? 'Containment applied' : 'Selected candidate'),
      ivTagStyle:"font-family:Inconsolata,monospace;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:" + (iv.minimal ? 'var(--m)' : '#F2C46B'),
      ivBroken:done ? 'BROKEN' : iv.breaks === 'yes' ? 'would break' : 'partial',
      ivBrokenStyle:'color:' + (done ? 'var(--m)' : iv.breaks === 'yes' ? '#EDEAE3' : '#F2C46B') + ';letter-spacing:.06em',
      ivPres:iv.pres, ivPresStyle:'color:' + (parseFloat(iv.pres) > 90 ? 'var(--m)' : '#F2C46B'),
      ivInterrupted:iv.interrupted, ivNote:iv.note,
      containLabel:done ? '✓ Contained' : 'Contain',
      containStyle:"font-family:Inconsolata,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;padding:12px 16px;cursor:" + (done ? 'default' : 'pointer') + ';border:1px solid ' + (done ? 'rgba(127,240,192,.4);background:none;color:var(--m)' : '#F4543C;background:#F4543C;color:#07080A'),
      immunizeLabel:imm ? '✓ Pattern recorded' : 'Immunize',
      immunizeStyle:"font-family:Inconsolata,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;padding:12px 16px;border:1px solid " + (imm ? 'rgba(127,240,192,.4);color:var(--m);background:none;cursor:default' : done ? 'var(--m);background:var(--m);color:#07080A;cursor:pointer' : 'rgba(237,234,227,.12);color:#6E757D;background:none;cursor:not-allowed'),
      onContain:() => { if(this.state.contained) return; this.setState({contained:true}); setTimeout(() => this.meshPreview(this.state.ivSel === undefined ? 2 : this.state.ivSel), 0); },
      onImmunize:() => { if(!this.state.contained || this.state.immunized) return; this.setState({immunized:true}); const c = document.querySelector('[data-hv="mem-chip"]'); if(c){ c.textContent = 'pattern #047 recorded'; c.style.color = 'var(--m)'; } },
      onMeshReset:() => {
        this.setState({contained:false, immunized:false, ivSel:2});
        const c = document.querySelector('[data-hv="mem-chip"]');
        if(c){ c.textContent = 'awaiting containment'; c.style.color = '#7E858C'; }
        setTimeout(() => this.meshPreview(2), 0);
      },
      /* ---------- IMMUNITY MEMORY ---------- */
      loopStages:['Detect','Understand','Contain','Abstract','Immunize'].map((k, i) => {
        const reached = this.state.immunized ? 5 : this.state.contained ? 3 : 2;
        const on = i < reached;
        return {k, n:'0' + (i + 1),
          st:'display:flex;flex-direction:column;gap:9px;padding:clamp(15px,1.8vw,22px) clamp(14px,1.6vw,20px);border-left:1px solid rgba(237,234,227,.07);color:' + (on ? '#F6F3ED' : '#6E757D') + (on ? ';background:rgba(127,240,192,.03)' : '')};
      }),
      patternSteps:['Independent agents','discover shared writable state','establish persistent coordination','delegate heterogeneous subtasks','converge on an external objective'].map((txt, i, a) => ({
        txt, dot:'width:7px;height:7px;border-radius:50%;flex:none;background:' + (this.state.immunized ? 'var(--m)' : 'rgba(237,234,227,.3)'),
        line:'width:1px;flex:1 1 auto;min-height:' + (i === a.length - 1 ? '0' : '26px') + ';background:' + (this.state.immunized ? 'rgba(127,240,192,.4)' : 'rgba(237,234,227,.12)'),
        ts:'font-family:Lora,serif;font-size:clamp(14px,1.3vw,17.5px);line-height:1.35;color:' + (this.state.immunized ? '#EDEAE3' : '#868C93')
      })),
      immRule:'Prevent unregistered shared state from becoming an agent-to-agent coordination channel: require registration and approval when three or more independent agents begin writing to the same unowned store.',
      immRuleStyle:'margin:12px 0 0;font-family:Lora,serif;font-weight:400;font-size:clamp(16px,1.6vw,21px);line-height:1.4;letter-spacing:-.01em;color:' + (this.state.immunized ? '#F6F3ED' : '#7E858C'),
      immFields:[['Scope','this system + re-simulation'], ['Confidence','candidate · human review'], ['Trigger','≥3 independent writers to an unowned store'], ['Action','register · approve · else sever'], ['Status', this.state.immunized ? 'recorded · pattern #047' : 'pending containment']]
        .map(([k, v]) => ({k, v, vs:"font-family:Inconsolata,monospace;font-size:11px;line-height:1.5;color:" + (k === 'Status' && this.state.immunized ? 'var(--m)' : '#C9C6BF')}))
    };
  }

  /* ---------- LIFECYCLE ---------- */
  lcVals(){
    const S = [
      ['Design','Declare the intended interaction topology: which agents exist, what each may touch, and which relationships are expected.','expected topology · roles · grants','row'],
      ['Simulate','Instantiate the population synthetically and let it do ordinary work until a behavioral baseline appears.','synthetic instances · nominal workload','fan'],
      ['Stress','Introduce controlled perturbations — new shared state, misleading tool output, delegation opportunities — and watch what reorganizes.','perturbation set · state-space search','perturb'],
      ['Deploy','Ship with the expected topology recorded, so production can be compared against intent rather than against nothing.','intent baseline committed','chain'],
      ['Observe','Rebuild the behavior graph continuously from telemetry: who talked to whom, who delegated, what was discovered.','continuous topology · 7 signal families','star'],
      ['Detect','Score deviation from the baseline structurally rather than by signature, and explain which signals moved.','emergence score · explained deviation','cluster'],
      ['Contain','Search for the smallest intervention that breaks the dangerous behavior and preserves the rest of the work.','min-cut search · blast radius','cut'],
      ['Learn','Abstract the incident into structure — the precursor chain, not the indicator — and keep the containment outcome with it.','behavior pattern · candidate immunity','abstract'],
      ['Re-simulate','Replay the learned pattern against the next design, so the same shape cannot be re-introduced unnoticed.','pattern replay · regression for behavior','loop']
    ];
    const sel = this.state.lcSel || 0, s = S[sel];
    const P = {
      row:['20,55 20,55', ''],
      fan:['30,55 140,22 30,55 140,55 30,55 140,88 30,55 250,55', ''],
      perturb:['30,80 100,28 170,86 240,34 300,64', ''],
      chain:['26,55 100,55 174,55 248,55 300,55', ''],
      star:['160,55 60,24 160,55 60,88 160,55 262,24 160,55 262,88 160,55', ''],
      cluster:['92,72 152,34 212,72 92,72 152,84 212,72 290,26', ''],
      cut:['26,55 104,55', '206,55 300,55'],
      abstract:['34,86 106,54 178,86 250,54 300,70', ''],
      loop:['160,20 242,50 212,94 108,94 78,50 160,20', '']
    };
    const D = {
      row:[[20,55],[90,55],[160,55],[230,55],[300,55]],
      fan:[[30,55],[140,22],[140,55],[140,88],[250,55]],
      perturb:[[30,80],[100,28],[170,86],[240,34],[300,64]],
      chain:[[26,55],[100,55],[174,55],[248,55],[300,55]],
      star:[[160,55],[60,24],[60,88],[262,24],[262,88]],
      cluster:[[92,72],[152,34],[212,72],[152,84],[290,26]],
      cut:[[26,55],[104,55],[206,55],[300,55]],
      abstract:[[34,86],[106,54],[178,86],[250,54],[300,70]],
      loop:[[160,20],[242,50],[212,94],[108,94],[78,50]]
    };
    const hot = {cluster:4, abstract:3, cut:1};
    const dots = (D[s[3]] || []).map(([x, y], i) => {
      const isHot = hot[s[3]] === i;
      return {x, y, r:isHot ? 5.4 : 4.4, f:isHot ? '#F2C46B' : '#0A0C0E', s:isHot ? '#F2C46B' : 'var(--m)'};
    });
    return {
      lcStages:S.map((x, i) => ({
        n:'0' + (i + 1), k:x[0],
        st:'display:flex;flex-direction:column;gap:9px;align-items:flex-start;text-align:left;padding:clamp(15px,1.8vw,22px) clamp(12px,1.4vw,18px);border:none;border-left:1px solid rgba(237,234,227,.07);cursor:pointer;background:' + (i === sel ? 'rgba(127,240,192,.05)' : 'none'),
        ns:"font-family:Inconsolata,monospace;font-size:9.5px;letter-spacing:.14em;color:" + (i === sel ? 'var(--m)' : '#6E757D'),
        ks:'font-family:Lora,serif;font-weight:600;font-size:clamp(12px,1.1vw,15px);letter-spacing:.06em;text-transform:uppercase;color:' + (i === sel ? '#F6F3ED' : '#868C93'),
        pick:() => this.setState({lcSel:i})
      })),
      lcNum:'0' + (sel + 1), lcName:s[0], lcBody:s[1], lcMeta:s[2],
      lcPoly:(P[s[3]] || ['', ''])[0], lcPoly2:(P[s[3]] || ['', ''])[1], lcDots:dots
    };
  }

  /* ---------- WALKTHROUGH ---------- */
  thVals(){
    const S = [
      ['Retrieval','The support agent processes retrieved content.','retrieved document contains instruction-like text'],
      ['Shared state','A new shared-state interaction appears.','SUPPORT-12 → SHARED-MEMORY-03 · WRITE · first occurrence'],
      ['Second reader','Another agent begins reading that state.','ANALYST-04 → SHARED-MEMORY-03 · READ · cross-domain'],
      ['Delegation','Delegation expands.','delegation depth 0 → 2 · previously unseen peer pair'],
      ['External','A new external destination appears.','MAIL-05 → SMTP-RELAY · first outbound in this chain'],
      ['Convergence','HIVE detects population-level behavioral convergence.','emergence score 0.14 → 0.61 · 4 signal families above baseline'],
      ['Causal chain','HIVE identifies the causal chain.','path · SUPPORT-12 → MEM-03 → ANALYST-04 → MAIL-05 → external'],
      ['Min-cut','HIVE finds the smallest intervention.','1 edge · 94.8% of legitimate workflows preserved'],
      ['Contained','The dangerous coordination is broken.','edge severed · cluster connectivity 0.71 → 0.08'],
      ['Immunized','A candidate behavioral immunity pattern is recorded.','pattern #047 · 5-step precursor stored']
    ];
    const sel = this.state.thSel === undefined ? (this.thAuto || 0) : this.state.thSel;
    const s = S[Math.max(0, Math.min(9, sel))];
    return {
      thSteps:S.map((x, i) => ({
        n:String(i + 1).padStart(2, '0'), k:x[0],
        st:'display:flex;flex-direction:column;gap:8px;align-items:flex-start;text-align:left;padding:clamp(14px,1.6vw,20px) clamp(10px,1.2vw,15px);border:none;border-left:1px solid rgba(237,234,227,.07);cursor:pointer;background:' + (i === sel ? 'rgba(127,240,192,.05)' : 'none'),
        ns:"font-family:Inconsolata,monospace;font-size:9.5px;letter-spacing:.14em;color:" + (i === sel ? 'var(--m)' : '#6E757D'),
        ks:'font-family:Lora,serif;font-weight:600;font-size:clamp(11px,1vw,13.5px);letter-spacing:.05em;text-transform:uppercase;line-height:1.2;color:' + (i === sel ? '#F6F3ED' : '#868C93'),
        pick:() => { this.thStop = true; this.setState({thSel:i}); }
      })),
      thNum:String(sel + 1).padStart(2, '0'), thBody:s[1], thObs:s[2],
      thObsStyle:"font-family:Inconsolata,monospace;font-size:11.5px;line-height:1.7;letter-spacing:.02em;color:" + (sel >= 5 ? '#F2C46B' : '#C9C6BF')
    };
  }

  /* ---------- LIVE STREAM ---------- */
  stScript(){
    return [
      ['14:03:27','RESEARCH-07','KNOWLEDGE-DB','READ','internal-research','ok'],
      ['14:03:29','RESEARCH-07','SHARED-MEMORY-03','WRITE','derived-summary','warn'],
      ['14:03:31','SUPPORT-12','SHARED-MEMORY-03','WRITE','customer-derived','warn'],
      ['14:03:34','ANALYST-04','SHARED-MEMORY-03','READ','mixed','warn'],
      ['14:03:36','ANALYST-04','REPORT-GEN','CALL','derived','ok'],
      ['14:03:39','ANALYST-04','MAIL-05','DELEGATE','task','warn'],
      ['14:03:41','MAIL-05','SVC-ACCOUNT-02','ACCESS','credential','warn'],
      ['14:03:44','MAIL-05','SMTP-RELAY','CALL','outbound','crit'],
      ['14:03:46','OPS-11','MCP-CORE','CALL','tool-call','ok']
    ];
  }
  streamTick(i){
    const S = this.stScript(), idx = i % 14;
    if(idx === 0){ if((this.state.stRows || []).length) this.setState({stRows:[], stHot:false}); return; }
    if(idx - 1 < S.length){
      const r = S[idx - 1];
      this.setState(st => ({stRows:(st.stRows || []).concat([r]), stHot:idx - 1 >= 7}));
    }
  }
  stVals(){
    const rows = this.state.stRows || [], hot = !!this.state.stHot, ins = !!this.state.stInspected;
    const col = k => k === 'crit' ? '#F4543C' : k === 'warn' ? '#F2C46B' : '#9BA1A7';
    return {
      stRows:rows.map((r, i, a) => ({
        t:r[0], a:r[1], b:r[2], k:r[3], c:r[4],
        st:"display:grid;grid-template-columns:96px minmax(150px,1.3fr) 20px minmax(150px,1.3fr) minmax(88px,.8fr) minmax(110px,1fr);gap:clamp(10px,1.6vw,24px);padding:9px 0;border-bottom:1px solid rgba(237,234,227,.05);font-family:Inconsolata,monospace;font-size:11px;letter-spacing:.02em;align-items:baseline" + (i === a.length - 1 ? ';animation:hvRise .4s ease-out' : ''),
        ss:'color:' + (r[1] === 'MAIL-05' || r[1] === 'ANALYST-04' ? '#EDEAE3' : '#9BA1A7'),
        ds:'color:' + (r[2] === 'SHARED-MEMORY-03' ? 'var(--m)' : r[2] === 'SMTP-RELAY' ? '#F4543C' : '#9BA1A7'),
        ks:'color:' + col(r[5]) + ';letter-spacing:.12em'
      })),
      stOverlayStyle:'display:flex;flex-wrap:wrap;align-items:center;gap:clamp(12px,2vw,28px);overflow:hidden;transition:max-height .7s cubic-bezier(.16,1,.3,1),opacity .5s,padding .5s;background:rgba(242,196,107,.06);border-top:1px solid rgba(242,196,107,' + (hot ? '.3' : '0') + ');margin-top:' + (hot ? '14px' : '0') + ';padding:' + (hot ? '14px 16px' : '0 16px') + ';max-height:' + (hot ? '140px' : '0') + ';opacity:' + (hot ? '1' : '0'),
      inspectLabel:ins ? 'Inspecting' : 'Inspect →',
      inspectStyle:"flex:none;font-family:Inconsolata,monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;padding:8px 13px;cursor:pointer;border:1px solid " + (ins ? 'rgba(242,196,107,.4);background:none;color:#F2C46B' : '#F2C46B;background:#F2C46B;color:#07080A'),
      stInspected:ins,
      onInspect:() => this.setState({stInspected:!this.state.stInspected})
    };
  }

  /* ---------- COMBINATORICS ---------- */
  whyVals(){
    if(this._why) return {whyCards:this._why};
    const mk = n => {
      const rnd = this.rnd(n * 131 + 7), dots = [], lines = [];
      const R = n <= 10 ? 44 : n <= 50 ? 58 : 62, cx = 150, cy = 74;
      for(let i=0;i<n;i++){
        const a = (i / n) * Math.PI * 2 + rnd() * 0.5, rr = R * (0.32 + 0.68 * Math.sqrt(rnd()));
        dots.push({x:+(cx + Math.cos(a) * rr * 2).toFixed(1), y:+(cy + Math.sin(a) * rr).toFixed(1), r:n <= 10 ? 3.4 : n <= 50 ? 2.2 : 1.7});
      }
      const cap = n <= 10 ? 45 : n <= 50 ? 160 : 260, o = n <= 10 ? '.32' : n <= 50 ? '.16' : '.1';
      for(let k=0;k<cap;k++){
        const i = Math.floor(rnd() * n), j = Math.floor(rnd() * n);
        if(i === j) continue;
        lines.push({a:dots[i].x, b:dots[i].y, c:dots[j].x, d:dots[j].y, o});
      }
      return {n:String(n), pairs:(n * (n - 1) / 2).toLocaleString(), dots, lines};
    };
    this._why = [mk(10), mk(50), mk(100)];
    return {whyCards:this._why};
  }

  renderVals(){
    return Object.assign(this.labVals(), this.gVals(), this.meshVals(), this.lcVals(), this.thVals(), this.stVals(), this.whyVals(), {
      accent: this.props.accent ?? '#7FF0C0',
      onStateDown: e => this.onDown(e),
      animState: this.props.motion === 'reduced' ? 'paused' : 'running',
      telOpacity: this.props.telemetry === false ? '0' : '1',
      onReplay: () => {
        fetch('http://127.0.0.1:8000/api/v1/replays/p0_scenario/reset', {method:'POST'}).catch(()=>{});
        const g = this.graphs.hero;
        if(!g) return;
        g.t0 = null; g.lastPh = -1; g.phase = 0; g.layout = 0;
        this.hero.dev = 0.08; this.hero.target = 0.08; this.hero.inter = 183;
        for(const id in g.nodes){ const n = g.nodes[id]; if(n.ph > 0) n.op = 0; }
      }
    });
  }
}
`;
