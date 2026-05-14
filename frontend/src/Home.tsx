import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ChevronDown } from 'lucide-react';

function CustomSelect({ options, value, onChange }: { options: {value: string, label: string}[], value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '15px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {selectedOption?.label}
        <ChevronDown size={18} style={{ opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div 
          className="liquid-glass custom-scrollbar"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 10,
            padding: '8px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxHeight: '220px',
            overflowY: 'auto',
            background: 'rgba(10, 10, 12, 0.96)',
            backdropFilter: 'blur(24px)'
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: option.value === value ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                background: option.value === value ? 'var(--primary-color)' : 'transparent',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: option.value === value ? 500 : 400
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
            <CustomSelect 
              options={TAGS} 
              value={tag} 
              onChange={(val) => setTag(val)} 
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
