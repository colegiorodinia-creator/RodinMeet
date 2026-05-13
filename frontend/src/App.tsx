import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './Auth';
import { Home } from './Home';
import { Room } from './Room';

function App() {
  const [session, setSession] = useState<Session | any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Checa Bypass Local
    if (localStorage.getItem('rodin_bypass_auth') === 'true') {
      setSession({ user: { user_metadata: { full_name: 'Anfitrião (Modo Offline)' } } });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch((error) => {
      console.error('Erro ao obter sessão do Supabase:', error);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Carregando...</div>;
  }

  return (
    <Routes>
      {/* Rota raiz (Home): Protegida por login (Apenas Anfitrião cria reuniões) */}
      <Route 
        path="/" 
        element={session ? <Home /> : <Auth />} 
      />
      
      {/* Rota da Sala: Pública (Qualquer pessoa pode acessar, anfitrião ou convidado) */}
      <Route 
        path="/room/:roomId" 
        element={<Room />} 
      />

      {/* Rota de fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
