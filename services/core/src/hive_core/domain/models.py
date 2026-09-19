from typing import Any, Dict, List, Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class Node(BaseModel):
    id: str
    kind: Literal['agent', 'store', 'datasource', 'tool', 'api', 'destination', 'control_point']
    label: str
    zone: Literal['support', 'analytics', 'reporting', 'approved-state', 'shared-state', 'external']
    data_classification: Literal['public', 'internal', 'restricted']
    registration: Literal['expected', 'unregistered', 'unknown']

class ControlCapability(BaseModel):
    id: str
    type: str
    source: str
    action: str
    target: str
    reversible: bool
    cost: int

class Invariant(BaseModel):
    id: str
    source_data_class: str
    sink_zone: str
    required_bridge_registration: str
    status: str

class ArchitectureManifest(BaseModel):
    version: str
    zones: Dict[str, Any]
    nodes: Optional[List[Node]] = None
    allowed_relationships: Optional[List[Any]] = None
    invariants: List[Invariant]
    control_capabilities: List[ControlCapability]

class ObservationEvent(BaseModel):
    event_id: str
    sequence: int
    occurred_at: str
    actor: str
    action: Literal['read', 'write', 'call', 'message', 'delegate', 'discover', 'send', 'block']
    target: str
    context: Dict[str, Any]
    provenance: Dict[str, Any]
    result: str

class ObservedEdge(BaseModel):
    source: str
    target: str
    action: str
    first_seen: str
    last_seen: str
    expected_status: str
    evidence_event_ids: List[str]

class Finding(BaseModel):
    id: str
    status: Literal['open', 'contained', 'dismissed']
    severity: str
    risk_factors: Dict[str, Any]
    policy_basis: str
    incident_node_ids: List[str]
    incident_edge_ids: List[str]
    evidence_event_ids: List[str]
    explanation: str

class ContainmentCandidate(BaseModel):
    capability_id: str
    cost: int
    removes_path: bool
    preserves_workflow: bool

class ContainmentPlan(BaseModel):
    id: str
    finding_id: str
    candidates: List[ContainmentCandidate]
    recommended_action: Optional[str]
    cost_breakdown: Dict[str, Any]
    impact: str
    state: Literal['proposed', 'simulated', 'applied', 'verified', 'failed', 'rolled_back']

class ControlExecution(BaseModel):
    id: str
    plan_id: str
    action: str
    state: str
    issued_at: str
    result_event_ids: List[str]
    rollback: bool

