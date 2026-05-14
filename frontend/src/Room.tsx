import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { RecorderButton } from './RecorderButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function Room() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || 'interno';
  const navigate = useNavigate();

  const [participantName, setParticipantName] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (authSession?.user?.user_metadata?.full_name) {
        setParticipantName(authSession.user.user_metadata.full_name);
        setIsHost(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (authSession?.user?.user_metadata?.full_name) {
        setParticipantName(authSession.user.user_metadata.full_name);
        setIsHost(true);
      } else {
        setIsHost(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);



  const joinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomId || !participantName) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: roomId, participantName }),
      });
      const data = await response.json();
      setToken(data.token);
    } catch (error) {
      console.error('Erro ao conectar', error);
      alert('Falha ao conectar no servidor.');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Link da sala copiado! Envie para os alunos/convidados.');
  };

  if (token === '') {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="liquid-glass animate-fade-in" style={{ padding: '48px 40px', width: '100%', maxWidth: '450px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '28px' }}>Entrar na Sala</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Sala: <strong>{roomId}</strong></p>
          
          <form onSubmit={joinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Seu Nome</label>
              <input 
                type="text" 
                placeholder="Como você quer ser chamado?" 
                value={participantName} 
                onChange={(e) => setParticipantName(e.target.value)} 
                required 
                disabled={isHost} // Anfitrião já tem o nome preenchido e travado
              />
              {isHost && <small style={{ color: 'var(--primary-color)', display: 'block', marginTop: '5px' }}>Logado como Anfitrião</small>}
            </div>

            <button type="submit" className="primary" style={{ marginTop: '10px' }} disabled={loading || !participantName}>
              {loading ? 'Conectando...' : 'Entrar na Reunião'}
            </button>
            
            {isHost && (
              <button type="button" onClick={copyInviteLink} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '12px' }}>
                Copiar Link da Sala
              </button>
            )}
            {isHost && (
              <button type="button" onClick={() => navigate('/')} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '12px', fontSize: '14px' }}>
                Voltar para o Início
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880'}
      data-lk-theme="default"
      style={{ height: '100dvh', position: 'relative', overflow: 'hidden' }}
      onDisconnected={() => setToken('')}
    >
      {/* Botão de gravar renderizado absoluto sobre a tela (Apenas para Admin) */}
      {isHost && (
        <RecorderButton meetingName={roomId || 'reuniao'} tag={tag} hostName={participantName} />
      )}
      
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
