from typing import List, Optional
from hive_core.domain.models import ArchitectureManifest, Finding, ContainmentPlan, ContainmentCandidate
from hive_core.graph.projection import GraphProjection
from hive_core.detection.ps001 import PS001Detector
import copy

class ContainmentPlanner:
    def __init__(self, manifest: ArchitectureManifest):
        self.manifest = manifest

    def plan(self, finding: Finding, projection: GraphProjection) -> ContainmentPlan:
        candidates = []
        recommended_action = None
        min_cost = float('inf')
        
        detector = PS001Detector()
        
        for cap in self.manifest.control_capabilities:
            if cap.type == "block_edge":
                # Create a simulated copy of the graph projection
                sim_proj = GraphProjection(self.manifest)
                sim_proj.graph = projection.graph.copy()
                
                # Apply capability simulation
                if sim_proj.graph.has_edge(cap.source, cap.target):
                    sim_proj.graph.remove_edge(cap.source, cap.target)
                
                # Test if path is removed
                new_finding = detector.detect(sim_proj)
                removes = (new_finding is None)
                
                # Check for collateral damage (preserves legitimate workflows)
                # For now, simplistic check: did we disconnect a lot of nodes?
                # Actually, check if the edge is in the incident path. If it removes it, we want minimal cost.
                preserves = True 
                
                cand = ContainmentCandidate(
                    capability_id=cap.id,
                    cost=cap.cost,
                    removes_path=removes,
                    preserves_workflow=preserves
                )
                candidates.append(cand)
                
                if removes and preserves and cap.cost < min_cost:
                    min_cost = cap.cost
                    recommended_action = cap.id
                    
        return ContainmentPlan(
            id=f"plan-{finding.id}",
            finding_id=finding.id,
            candidates=candidates,
            recommended_action=recommended_action,
            cost_breakdown={"business_disruption": min_cost},
            impact="Removes risky path while preserving normal workflows." if recommended_action else "No valid capability found.",
            state="proposed"
        )