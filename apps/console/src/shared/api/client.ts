export const API_BASE = 'http://127.0.0.1:8000/api/v1';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function simulateSwarm(config: any) {
  const res = await fetch(`${API_BASE}/lab/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return res.json();
}

export async function resetReplay(scenarioId: string = 'p0_scenario') {
  const res = await fetch(`${API_BASE}/replays/${scenarioId}/reset`, { method: 'POST' });
  return res.json();
}

export async function advanceReplay(scenarioId: string = 'p0_scenario') {
  const res = await fetch(`${API_BASE}/replays/${scenarioId}/advance`, { method: 'POST' });
  return res.json();
}

export async function fetchState() {
  const res = await fetch(`${API_BASE}/state`);
  return res.json();
}

export async function fetchFindings() {
  const res = await fetch(`${API_BASE}/findings`);
  return res.json();
}

export async function applyPlan(findingId: string, planId: string) {
  const res = await fetch(`${API_BASE}/findings/${findingId}/plans/${planId}/apply`, { method: 'POST' });
  return res.json();
}