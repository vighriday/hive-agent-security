import React from 'react';
import { SwarmLab } from '../features/swarm-lab/SwarmLab';
import { Replay } from '../features/replay/Replay';

export function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#07080A', color: '#EDEAE3', fontFamily: 'Lato, system-ui, sans-serif' }}>
      <header style={{ padding: '1rem 2rem', background: 'rgba(7,8,10,0.9)', borderBottom: '1px solid #222', position: 'sticky', top: 0 }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#F2EFE9', letterSpacing: '2px', textTransform: 'uppercase' }}>
          <span style={{ color: '#7FF0C0' }}>▲</span> HIVE
        </h1>
      </header>
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', fontFamily: 'Lora, serif', fontWeight: 400 }}>
            Population-level security for autonomous systems.
          </h1>
          <p style={{ color: '#8A9096', fontSize: '1.2rem', maxWidth: '800px', lineHeight: 1.6 }}>
            HIVE is a defensive, local-first cybersecurity platform for finding risky behaviour that emerges between individually legitimate agents, resources, shared state, permissions, and egress paths.
          </p>
        </div>
        
        <SwarmLab />
        <Replay />
      </main>
    </div>
  );
}