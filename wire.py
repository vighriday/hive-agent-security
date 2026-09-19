import re

with open("apps/console/index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Wire onReplay
onreplay_target = """onReplay: () => {
        const g = this.graphs.hero;
        if(!g) return;
        g.t0 = null; g.lastPh = -1; g.phase = 0; g.layout = 0;"""

onreplay_replacement = """onReplay: () => {
        fetch('http://127.0.0.1:8000/api/v1/replays/p0_scenario/reset', {method:'POST'}).catch(()=>{});
        const g = this.graphs.hero;
        if(!g) return;
        g.t0 = null; g.lastPh = -1; g.phase = 0; g.layout = 0;"""

content = content.replace(onreplay_target, onreplay_replacement)

# 2. Wire findings load
finding_load_target = """if(this.props.immunized) return;
          this.setState({findingLoad:true});"""

finding_load_replacement = """if(this.props.immunized) return;
          this.setState({findingLoad:true});
          fetch('http://127.0.0.1:8000/api/v1/findings/finding-ps001/plans/plan-finding-ps001/apply', {method:'POST'}).catch(()=>{});"""

content = content.replace(finding_load_target, finding_load_replacement)

# 3. Wire Swarm Lab
runswarm_target = """runSwarm(){
      if(this.runIv) return;
      const sc = this.script(), s = this.swarm();"""

runswarm_replacement = """runSwarm(){
      if(this.runIv) return;
      fetch('http://127.0.0.1:8000/api/v1/lab/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.cfg())
      }).catch(()=>{});
      const sc = this.script(), s = this.swarm();"""

content = content.replace(runswarm_target, runswarm_replacement)

# 4. Wire hero loop to advance backend
hero_tick_target = """if(ph !== g.lastPh){
          g.lastPh = ph;"""
          
hero_tick_replacement = """if(ph !== g.lastPh){
          g.lastPh = ph;
          if (ph === 3) fetch('http://127.0.0.1:8000/api/v1/findings').catch(()=>{});
          if (ph < 3) fetch('http://127.0.0.1:8000/api/v1/replays/p0_scenario/advance', {method:'POST'}).catch(()=>{});"""

content = content.replace(hero_tick_target, hero_tick_replacement)

with open("apps/console/index.html", "w", encoding="utf-8") as f:
    f.write(content)