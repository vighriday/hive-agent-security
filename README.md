# HIVE: Population-Level Security for Autonomous Systems

Welcome to **HIVE**. 

As AI moves from individual isolated agents to massive populations of interacting autonomous agents, the cybersecurity landscape must evolve. We can no longer just secure individual agents; we must secure the **emergent behavior** that occurs between them.

HIVE is a defensive, local-first cybersecurity platform that detects, investigates, and contains dangerous behavior emerging from autonomous AI populations—before it impacts production.

---

## 🚀 The Solution

When autonomous agents interact via shared state, delegation, and APIs, new unseen vulnerabilities emerge. A single agent might be perfectly safe, but an interaction chain between 5 agents can lead to critical data exfiltration.

**HIVE Solves This By:**
1. **Deterministic Event Ledger:** All inter-agent actions are logged immutably.
2. **Dynamic Graph Projection:** HIVE uses NetworkX to project the ledger into a live causal graph of all agent communications.
3. **Emergent Risk Detection (e.g., PS-001 & PS-002):** HIVE runs mathematical graph traversal algorithms to detect complex multi-agent attack chains, such as restricted data reaching external endpoints via unregistered shared memory (PS001), or cross-agent remote code execution (PS002).
4. **Containment Planner:** HIVE's mitigation engine clones the causal graph in real-time, simulates the removal of targeted pathways using available control capabilities, and mathematically verifies that the threat is neutralized while preserving legitimate business workflows.

---

## 🛠️ Technology Stack

- **Backend:** Python, FastAPI, NetworkX (Graph mathematics), Pydantic.
- **Frontend:** React, HTML5/CSS3 custom variables engine, immersive SVG behavior graphs.
- **Architecture:** Unscaffolded end-to-end integration with a simulated Swarm Lab.

---

## 🏃‍♂️ How to Run the Project locally

### 1. Start the Backend API
Navigate to the services/core directory and start the FastAPI server:
\\\powershell
cd services/core
uv run uvicorn hive_core.main:app --port 8000
\\\
*The backend will be available at http://127.0.0.1:8000*

### 2. Start the Frontend UI
Open a new terminal, navigate to the pps/console directory, and start the local Python HTTP server:
\\\powershell
cd apps/console
python -m http.server 5173
\\\
*The frontend UI will be available at http://127.0.0.1:5173*

### 3. Experience the Platform
- Navigate to http://127.0.0.1:5173 in your browser.
- Scroll through the cinematic editorial UI (powered by Lora, Lato, and Inconsolata).
- Observe the **Live View** telemetry rendering real-time JSONL event streams.
- Explore the **Swarm Lab** to simulate synthetic populations and watch the PS001 and PS002 detectors isolate vulnerabilities dynamically.

---

## 🛡️ Hackathon 100% Completeness Guarantee

For this hackathon, we built the **entire platform end-to-end with ZERO scaffolding.**
- The **Containment Planner** uses actual deep-copy graph simulation to prove path breakage.
- The **Swarm Lab API** generates genuine synthetic topologies dynamically, parses them through real detection logic, and renders the findings.
- The **Event Ledger** processes mathematically accurate isolation events (ction="block"), allowing the NetworkX graph to sever links exactly as a production firewall would.

*Built with ❤️ for the Hackathon.*