import React, { useState, useEffect } from 'react';
import { resetReplay, advanceReplay, fetchState, fetchFindings, applyPlan } from '../../shared/api/client';

export function Replay() {
  const [state, setState] = useState<any>(null);
  const [findings, setFindings] = useState<any>(null);
  const [playing, setPlaying] = useState(false);

  const loadState = async () => {
    const s = await fetchState();
    setState(s);
    const f = await fetchFindings();
    setFindings(f);
  };

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(async () => {
      await advanceReplay();
      await loadState();
    }, 1000);
    return () => clearInterval(iv);
  }, [playing]);

  const handleReset = async () => {
    setPlaying(false);
    await resetReplay();
    await loadState();
  };

  const handleApply = async (fId: string, pId: string) => {
    await applyPlan(fId, pId);
    await loadState();
  };

  return (
    <div style={{ padding: '2rem', borderTop: '1px solid #333' }}>
      <h2 style={{ color: '#7FF0C0', textTransform: 'uppercase', letterSpacing: '2px' }}>Live Telemetry (P0 Scenario)</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => setPlaying(!playing)} style={{ background: playing ? '#333' : '#7FF0C0', color: playing ? '#FFF' : '#000', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer' }}>
          {playing ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
        <button onClick={handleReset} style={{ background: 'transparent', color: '#868C93', padding: '0.5rem 1rem', border: '1px solid #333', cursor: 'pointer' }}>
          ⟳ RESET
        </button>
        <button onClick={async () => { await advanceReplay(); await loadState(); }} style={{ background: 'transparent', color: '#868C93', padding: '0.5rem 1rem', border: '1px solid #333', cursor: 'pointer' }}>
          ⏭ STEP
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1, padding: '1rem', background: '#0a0b0e', border: '1px solid #222' }}>
          <h3 style={{ color: '#FFF' }}>NetworkX Graph State</h3>
          <p style={{ color: '#868C93' }}>Cursor: {state?.cursor} | Nodes: {state?.graph?.nodes?.length} | Edges: {state?.graph?.edges?.length}</p>
          <pre style={{ color: '#7FF0C0', fontSize: '12px' }}>
            {JSON.stringify(state?.graph?.edges, null, 2)}
          </pre>
        </div>
        
        <div style={{ flex: 1, padding: '1rem', background: '#0a0b0e', border: '1px solid #222' }}>
          <h3 style={{ color: '#FFF' }}>Detection Engine</h3>
          {findings?.findings?.length > 0 ? (
            findings.findings.map((f: any, i: number) => (
              <div key={i} style={{ borderLeft: '4px solid #F4543C', paddingLeft: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ color: '#F4543C', margin: 0 }}>{f.id} - {f.severity}</h4>
                <p style={{ color: '#EDEAE3' }}>{f.explanation}</p>
                {findings.plans?.map((p: any) => (
                  <div key={p.id} style={{ marginTop: '1rem', padding: '1rem', background: '#1a1a1a' }}>
                    <p style={{ color: '#7FF0C0', margin: 0 }}>Proposed Action: {p.recommended_action}</p>
                    <button onClick={() => handleApply(f.id, p.id)} style={{ background: '#F4543C', color: '#FFF', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', marginTop: '1rem' }}>
                      ⚡ APPLY CONTAINMENT
                    </button>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p style={{ color: '#868C93' }}>No emergent threats detected in current graph topology.</p>
          )}
        </div>
      </div>
    </div>
  );
}