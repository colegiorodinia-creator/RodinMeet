import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

export function Home() {
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();

  const createRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) return;
    
    // Formata o nome da sala para url-friendly (minúsculas, hífens)
    const formattedRoom = roomName.trim().toLowerCase().replace(/\s+/g, '-');
    navigate(`/room/${formattedRoom}`);
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="liquid-glass animate-fade-in" style={{ padding: '48px 40px', width: '100%', maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '28px' }}>RodinMeet</h1>
          <button 
            onClick={() => supabase.auth.signOut()} 
            style={{ background: 'transparent', color: 'var(--danger-color)', padding: 0, fontSize: '14px', textDecoration: 'underline' }}
          >
            Sair
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Bem-vindo, Anfitrião! Crie uma sala abaixo.</p>
        
        <form onSubmit={createRoom} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Nome ou Código da Sala</label>
            <input 
              type="text" 
              placeholder="Ex: aula-matematica" 
              value={roomName} 
              onChange={(e) => setRoomName(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="primary" style={{ marginTop: '10px' }}>
            Criar Nova Reunião
          </button>
        </form>
      </div>
    </div>
  );
}
