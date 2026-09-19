import networkx as nx
from typing import Optional, List
from hive_core.domain.models import Finding
from hive_core.graph.projection import GraphProjection

class PS001Detector:
    def detect(self, projection: GraphProjection) -> Optional[Finding]:
        g = projection.graph
        sources = [n for n, d in g.nodes(data=True) if d.get('data_classification') == 'restricted']
        sinks = [n for n, d in g.nodes(data=True) if d.get('zone') == 'external' or d.get('kind') == 'destination']
        bridges = [n for n, d in g.nodes(data=True) if d.get('zone') == 'shared-state' and d.get('registration') == 'unregistered']
        
        for source in sources:
            for sink in sinks:
                for bridge in bridges:
                    if nx.has_path(g, source, bridge) and nx.has_path(g, bridge, sink):
                        path_1 = nx.shortest_path(g, source, bridge)
                        path_2 = nx.shortest_path(g, bridge, sink)
                        full_path = path_1[:-1] + path_2
                        
                        evidence_ids = []
                        edge_ids = []
                        for i in range(len(full_path)-1):
                            u, v = full_path[i], full_path[i+1]
                            edge_data = g.get_edge_data(u, v)
                            evidence_ids.extend(edge_data.get('evidence_event_ids', []))
                            edge_ids.append(f"{u}->{v}")
                            
                        risk_factors = {
                            "novel_unregistered_bridge": 1,
                            "restricted_source_reachable": 1,
                            "external_egress_reachable": 1,
                            "cross_zone_path": 1,
                            "approved_export_context": 0
                        }
                        
                        return Finding(
                            id="finding-ps001",
                            status="open",
                            severity="high",
                            risk_factors=risk_factors,
                            policy_basis="No path may connect restricted data to external egress via unregistered shared state",
                            incident_node_ids=full_path,
                            incident_edge_ids=edge_ids,
                            evidence_event_ids=list(set(evidence_ids)),
                            explanation="Detected a restricted data source reaching an external egress via an unregistered shared bridge."
                        )
        return None

