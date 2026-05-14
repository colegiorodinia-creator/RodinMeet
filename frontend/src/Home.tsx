import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

const TAGS = [
  { value: '6_ano', label: '6º ano' },
  { value: '7_ano', label: '7º ano' },
  { value: '8_ano', label: '8º ano' },
  { value: '9_ano', label: '9º ano' },
  { value: '1_serie', label: '1ª série' },
  { value: '2_serie', label: '2ª série' },
  { value: 'terceirao', label: 'Terceirão' },
  { value: 'interno', label: 'Interno' },
];

export function Home() {
  const [roomName, setRoomName] = useState('');
  const [tag, setTag] = useState(TAGS[0].value);
  const navigate = useNavigate();

  const createRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) return;
    
    // Formata o nome da sala para url-friendly (minúsculas, hífens)
    const formattedRoom = roomName.trim().toLowerCase().replace(/\s+/g, '-');
    navigate(`/room/${formattedRoom}?tag=${tag}`);
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="liquid-glass animate-fade-in" style={{ padding: '48px 40px', width: '100%', maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '28px' }}>RodinMeet</h1>
          <button 
            type="button"
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

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Turma / Destino (Gravação)</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)',
                borderRadius: '14px',
                fontSize: '1rem',
                appearance: 'none', // hide default arrow to use custom or let it be
                cursor: 'pointer'
              }}
            >
              {TAGS.map(t => (
                <option key={t.value} value={t.value} style={{ background: '#1c1c1e', color: '#fff' }}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="primary" style={{ marginTop: '10px' }}>
            Criar Nova Reunião
          </button>
        </form>
      </div>
    </div>
  );
}
