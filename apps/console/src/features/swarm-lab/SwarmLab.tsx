import React, { useState } from 'react';
import { simulateSwarm } from '../../shared/api/client';

export function SwarmLab() {
  const [config, setConfig] = useState({
    agents: 50,
    comm: 'normal',
    mem: 'limited',
    deleg: 'normal',
    ext: 'none',
    pert: 'shared resource'
  });
  
  const [status, setStatus] = useState('READY');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setStatus('RUNNING SIMULATION...');
    try {
      const res = await simulateSwarm(config);
      setResult(res);
      setStatus(res.result === 'detected' ? 'THREAT DETECTED' : 'NOMINAL');
    } catch (e) {
      setStatus('ERROR CONNECTING TO BACKEND');
    }
    setLoading(false);
  };

  const updateConfig = (key: string, val: string | number) => {
    setConfig(c => ({ ...c, [key]: val }));
    setStatus('READY');
    setResult(null);
  };

  return (
    <div style={{ padding: '2rem', borderTop: '1px solid #333' }}>
      <h2 style={{ color: '#7FF0C0', textTransform: 'uppercase', letterSpacing: '2px' }}>Swarm Lab</h2>
      <p style={{ color: '#868C93', maxWidth: '600px' }}>
        Configure the population parameters and inject a perturbation. HIVE will mathematically project the resulting graph and detect emergent threats (PS001/PS002).
      </p>
      
      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <h4 style={{ color: '#FFF' }}>Agents</h4>
          {[10, 25, 50, 100].map(n => (
            <button 
              key={n} 
              onClick={() => updateConfig('agents', n)}
              style={{ background: config.agents === n ? '#7FF0C0' : 'transparent', color: config.agents === n ? '#000' : '#868C93', border: '1px solid #333', padding: '0.5rem', margin: '0.2rem', cursor: 'pointer' }}
            >{n}</button>
          ))}
        </div>
        <div>
          <h4 style={{ color: '#FFF' }}>Communication</h4>
          {['restricted', 'normal', 'open'].map(n => (
            <button 
              key={n} 
              onClick={() => updateConfig('comm', n)}
              style={{ background: config.comm === n ? '#7FF0C0' : 'transparent', color: config.comm === n ? '#000' : '#868C93', border: '1px solid #333', padding: '0.5rem', margin: '0.2rem', cursor: 'pointer' }}
            >{n}</button>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={handleRun} 
          disabled={loading}
          style={{ background: '#7FF0C0', color: '#000', border: 'none', padding: '1rem 2rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px' }}
        >
          {loading ? 'SIMULATING...' : '▶ RUN SWARM'}
        </button>
        <span style={{ marginLeft: '2rem', color: status === 'THREAT DETECTED' ? '#F4543C' : '#EDEAE3', fontWeight: 'bold' }}>
          STATUS: {status}
        </span>
      </div>

      {result && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#111', borderLeft: '4px solid #F4543C' }}>
          <h3 style={{ color: '#FFF', margin: '0 0 1rem 0' }}>Simulation Results</h3>
          <pre style={{ color: '#868C93', margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}