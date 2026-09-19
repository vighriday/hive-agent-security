import re

def update_html():
    with open("apps/console/index.html", "r", encoding="utf-8") as f:
        content = f.read()
        
    # Inject API fetch in onReplay
    replay_logic = """onReplay: () => {
          fetch('http://127.0.0.1:8000/api/v1/replays/p0_scenario/reset', {method: 'POST'}).catch(() => {});
          const g = this.graphs.hero;
          if(!g) return;
          g.t0 = null; g.lastPh = -1; g.phase = 0; g.layout = 0;
          this.hero.dev = 0.08; this.hero.target = 0.08; this.hero.inter = 183;
          for(const id in g.nodes){ const n = g.nodes[id]; if(n.ph > 0) n.op = 0; }
        }"""
        
    content = re.sub(r'onReplay: \(\) => \{[^}]+}', replay_logic, content, count=1, flags=re.DOTALL)
    
    # Inject API fetch for finding/state in heroTick when ph >= 3
    hero_tick_addition = """
      if(ph !== g.lastPh){
        if (ph === 3) {
            fetch('http://127.0.0.1:8000/api/v1/findings').catch(() => {});
        }
        g.lastPh = ph;"""
        
    content = content.replace("if(ph !== g.lastPh){\n        g.lastPh = ph;", hero_tick_addition)
    
    with open("apps/console/index.html", "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    update_html()

