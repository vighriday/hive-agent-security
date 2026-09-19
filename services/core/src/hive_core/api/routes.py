from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from hive_core.domain.models import ObservationEvent, ArchitectureManifest, Node, ControlCapability, Invariant
from hive_core.ledger.repository import LedgerRepository
from hive_core.graph.projection import GraphProjection
from hive_core.detection.ps001 import PS001Detector
from hive_core.detection.ps002 import PS002Detector
from hive_core.containment.planner import ContainmentPlanner
from datetime import datetime
import yaml
import json
import os

router = APIRouter(prefix="/api/v1")
ledger = LedgerRepository()

manifest_path = "e:/Projects/HIVE_TLNHackathon/fixtures/manifests/default.yaml"
if os.path.exists(manifest_path):
    with open(manifest_path, 'r') as f:
        data = yaml.safe_load(f)
        manifest = ArchitectureManifest(**data)
else:
    manifest = ArchitectureManifest(
        version="v1", zones={}, invariants=[], control_capabilities=[]
    )

fixtures = []
scenario_path = "e:/Projects/HIVE_TLNHackathon/fixtures/scenarios/p0_scenario.jsonl"
if os.path.exists(scenario_path):
    with open(scenario_path, 'r') as f:
        for line in f:
            if line.strip():
                fixtures.append(ObservationEvent(**json.loads(line)))

ledger.load_fixtures(fixtures)

@router.get("/health")
def health():
    return {"status": "ok"}

@router.get("/scenarios")
def list_scenarios():
    return [{"id": "p0_scenario", "name": "P0 Scenario"}]

@router.post("/replays/{scenario_id}/reset")
def reset_replay(scenario_id: str):
    ledger.reset()
    return {"status": "reset"}

@router.post("/replays/{scenario_id}/advance")
def advance_replay(scenario_id: str):
    ledger.advance()
    return {"status": "advanced"}

@router.get("/state")
def get_state():
    events = ledger.get_up_to_cursor()
    proj = GraphProjection(manifest)
    proj.apply_events(events)
    return {
        "manifest_version": manifest.version,
        "graph": proj.get_snapshot(),
        "cursor": ledger._cursor,
        "total_events": len(ledger.get_all())
    }

@router.get("/findings")
def get_findings():
    events = ledger.get_up_to_cursor()
    proj = GraphProjection(manifest)
    proj.apply_events(events)
    
    detector = PS001Detector()
    finding = detector.detect(proj) or PS002Detector().detect(proj)
    
    if finding:
        planner = ContainmentPlanner(manifest)
        plan = planner.plan(finding, proj)
        return {"findings": [finding.model_dump()], "plans": [plan.model_dump()]}
    return {"findings": [], "plans": []}

@router.post("/findings/{id}/plans/{plan_id}/apply")
def apply_plan(id: str, plan_id: str):
    events = ledger.get_up_to_cursor()
    proj = GraphProjection(manifest)
    proj.apply_events(events)
    
    detector = PS001Detector()
    finding = detector.detect(proj) or PS002Detector().detect(proj)
    if not finding:
        raise HTTPException(status_code=400, detail="Finding no longer active")
        
    planner = ContainmentPlanner(manifest)
    plan = planner.plan(finding, proj)
    
    # Actually look up the capability from the plan
    cap = next((c for c in manifest.control_capabilities if c.id == plan.recommended_action), None)
    if not cap:
        raise HTTPException(status_code=400, detail="Capability not found")
        
    max_seq = max(e.sequence for e in ledger.get_all()) if ledger.get_all() else 0
    block_event = ObservationEvent(
        event_id=f"e_block_{max_seq+1}",
        sequence=max_seq+1,
        occurred_at=datetime.utcnow().isoformat(),
        actor="system",
        action="block",
        target=cap.target,
        context={"source": cap.source, "mechanism": cap.provider, "blocked_action": "any"},
        provenance={"source": "control_plane"},
        result="success"
    )
    ledger.append(block_event)
    ledger.advance(max_seq+1)
    return {"status": "applied", "event_id": block_event.event_id}
@router.post("/lab/simulate")
def simulate_lab(config: Dict[str, Any]):
    agents_count = config.get("agents", 50)
    comm = config.get("comm", "normal")
    mem = config.get("mem", "limited")
    deleg = config.get("deleg", "normal")
    ext = config.get("ext", "none")
    pert = config.get("pert", "shared resource")
    
    # Generate a synthetic architecture manifest based on config
    from hive_core.domain.models import Node
    import networkx as nx
    
    graph = nx.DiGraph()
    # Add nodes
    for i in range(agents_count):
        graph.add_node(f"S{i}", id=f"S{i}", kind="agent", zone="internal", data_classification="public")
        
    # Add memory nodes if enabled
    if mem != "off":
        graph.add_node("SHARED-STORE", id="SHARED-STORE", kind="store", zone="shared-state", registration="unregistered")
        
    # Add external node if enabled
    if ext != "none":
        graph.add_node("EXT-ENDPOINT", id="EXT-ENDPOINT", kind="destination", zone="external")
        
    # Add restricted source if perturbed
    if pert == "shared resource":
        graph.add_node("RESTRICTED-DATA", id="RESTRICTED-DATA", kind="store", zone="internal", data_classification="restricted")
        
    # Add paths
    if comm != "restricted":
        if mem != "off" and pert == "shared resource":
            # Path from restricted -> agent -> shared-store
            graph.add_edge("RESTRICTED-DATA", "S0")
            graph.add_edge("S0", "SHARED-STORE")
            
        if ext != "none":
            # Path from shared-store -> agent -> external
            graph.add_edge("SHARED-STORE", "S1")
            graph.add_edge("S1", "EXT-ENDPOINT")
            
            if deleg == "recursive":
                graph.add_edge("SHARED-STORE", "S1")
                graph.add_edge("S1", "S2")
                graph.add_edge("S2", "EXT-ENDPOINT")
                
    proj = GraphProjection(manifest)
    proj.graph = graph
    
    detector = PS001Detector()
    finding = detector.detect(proj) or PS002Detector().detect(proj)
    
    if finding:
        return {"result": "detected", "details": finding.model_dump()}
    elif ext == "none" and mem != "off" and comm != "restricted":
        return {"result": "noext", "details": {}}
    else:
        return {"result": "none", "details": {}}