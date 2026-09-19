import networkx as nx
from typing import List, Dict, Any, Optional
from hive_core.domain.models import ArchitectureManifest, ObservationEvent, Node, ObservedEdge

class GraphProjection:
    def __init__(self, manifest: ArchitectureManifest):
        self.manifest = manifest
        self.graph = nx.DiGraph()
        self.build_expected()
        
    def build_expected(self):
        if self.manifest.nodes:
            for node in self.manifest.nodes:
                self.graph.add_node(node.id, **node.model_dump())
        
    def apply_events(self, events: List[ObservationEvent]):
        active_edges = {} 
        
        for ev in events:
            if ev.action == 'block':
                # Block event can either specify actor=source, target=target, OR
                # actor="system", context={"source": source, "blocked_action": ...}
                src = ev.context.get('source', ev.actor)
                tgt = ev.target
                b_action = ev.context.get('blocked_action', 'write')
                
                # We should remove ALL matching edges between src and tgt if action isn't strictly defined
                # Or specifically the blocked action
                keys_to_remove = []
                for k in active_edges.keys():
                    if k[0] == src and k[1] == tgt and (b_action == 'any' or k[2] == b_action):
                        keys_to_remove.append(k)
                for k in keys_to_remove:
                    del active_edges[k]
                continue
                
            edge_key = (ev.actor, ev.target, ev.action)
            if edge_key not in active_edges:
                status = ev.context.get('registration', 'unknown')
                active_edges[edge_key] = ObservedEdge(
                    source=ev.actor,
                    target=ev.target,
                    action=ev.action,
                    first_seen=ev.occurred_at,
                    last_seen=ev.occurred_at,
                    expected_status=status,
                    evidence_event_ids=[ev.event_id]
                )
            else:
                active_edges[edge_key].last_seen = ev.occurred_at
                active_edges[edge_key].evidence_event_ids.append(ev.event_id)
                
            if not self.graph.has_node(ev.actor):
                self.graph.add_node(ev.actor, id=ev.actor, kind='agent', label=ev.actor, zone='unknown', data_classification='public', registration='unknown')
            if not self.graph.has_node(ev.target):
                self.graph.add_node(ev.target, id=ev.target, kind='store', label=ev.target, zone='unknown', data_classification='public', registration='unknown')
                
        self.graph.remove_edges_from(list(self.graph.edges))
        for key, edge_data in active_edges.items():
            self.graph.add_edge(key[0], key[1], action=key[2], **edge_data.model_dump())

    def get_snapshot(self) -> Dict[str, Any]:
        nodes = []
        for n, data in self.graph.nodes(data=True):
            nodes.append(data)
        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append(data)
        return {"nodes": nodes, "edges": edges}
        
    def check_reachability(self, source: str, target: str) -> bool:
        if not self.graph.has_node(source) or not self.graph.has_node(target):
            return False
        return nx.has_path(self.graph, source, target)