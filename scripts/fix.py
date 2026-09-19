import re
import shutil

def fix():
    shutil.copy("frontend/Layout language rebuild/HIVE.dc.html", "apps/console/index.html")
    with open("apps/console/index.html", "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update support.js path
    content = content.replace('<script src="./support.js"></script>', '<script src="/support.js"></script>')

    # 2. Speed up animations by scaling 'e' (elapsed time)
    # The time is tracked via `const t = (now - this.t0) / 1000; const e = t - g.t0;`
    # We can just change `const e = t - g.t0;` to `const e = (t - g.t0) * 3;` to speed everything up 3x!
    # "fast but not abrupt too". 3x is usually a good multiplier.
    content = content.replace("const e = t - g.t0;", "const e = (t - g.t0) * 3.5;")

    # 3. Inject API calls properly
    # Original onReplay block:
    # onReplay: () => {
    #   const g = this.graphs.hero;
    #   if(!g) return;
    #   g.t0 = null; g.lastPh = -1; g.phase = 0; g.layout = 0;
    #   this.hero.dev = 0.08; this.hero.target = 0.08; this.hero.inter = 183;
    #   for(const id in g.nodes){ const n = g.nodes[id]; if(n.ph > 0) n.op = 0; }
    # }
    
    # We'll use a precise replacement.
    target_onreplay = """onReplay: () => {
          const g = this.graphs.hero;
          if(!g) return;"""
          
    replacement_onreplay = """onReplay: () => {
          fetch('http://127.0.0.1:8000/api/v1/replays/p0_scenario/reset', {method: 'POST'}).catch(() => {});
          const g = this.graphs.hero;
          if(!g) return;"""
          
    content = content.replace(target_onreplay, replacement_onreplay)

    # heroTick injection
    target_herotick = """if(ph !== g.lastPh){
        g.lastPh = ph;"""
        
    replacement_herotick = """if(ph !== g.lastPh){
        if (ph === 3) { fetch('http://127.0.0.1:8000/api/v1/findings').catch(() => {}); }
        g.lastPh = ph;"""
        
    content = content.replace(target_herotick, replacement_herotick)

    with open("apps/console/index.html", "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    fix()

