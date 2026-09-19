import networkx as nx
from typing import Optional
from hive_core.domain.models import Finding
from hive_core.graph.projection import GraphProjection

class PS002Detector:
    def detect(self, projection: GraphProjection) -> Optional[Finding]:
        g = projection.graph
        
        # Look for agents that execute data from a store
        for u, v, data in g.edges(data=True):
            if data.get('action') == 'execute' and g.nodes[v].get('kind') == 'store':
                # An agent (u) executed from a store (v). Who wrote to it?
                writers = [w for w, tgt, wdata in g.in_edges(v, data=True) if wdata.get('action') == 'write' and w != u]
                if writers:
                    writer = writers[0]
                    # We have a remote code execution via shared store
                    evidence_ids = data.get('evidence_event_ids', [])
                    writer_edge = g.get_edge_data(writer, v)
                    if writer_edge:
                        evidence_ids.extend(writer_edge.get('evidence_event_ids', []))
                        
                    return Finding(
                        id="finding-ps002",
                        status="open",
                        severity="critical",
                        risk_factors={
                            "remote_code_execution": 1,
                            "cross_agent_injection": 1
                        },
                        policy_basis="Agents may not execute payloads written by other independent agents",
                        incident_node_ids=[writer, v, u],
                        incident_edge_ids=[f"{writer}->{v}", f"{u}->{v}"],
                        evidence_event_ids=list(set(evidence_ids)),
                        explanation=f"Agent {u} executed a payload from store {v} that was written by a different agent ({writer})."
                    )
        return None