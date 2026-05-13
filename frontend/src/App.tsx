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
    // Escuta evento de login forçado para não precisar recarregar a página
    const handleForceLogin = () => {
      setSession({ user: { user_metadata: { full_name: 'Anfitrião (Offline)' } } });
    };
    window.addEventListener('force_login', handleForceLogin);

    // Checa Bypass Local inicial
    if (localStorage.getItem('rodin_bypass_auth') === 'true') {
      handleForceLogin();
      setLoading(false);
      return () => window.removeEventListener('force_login', handleForceLogin);
    }

    // Tenta pegar a sessão do Supabase com timeout de 2 segundos para evitar tela de carregamento infinita
    const fetchSession = async () => {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
        const res = await Promise.race([supabase.auth.getSession(), timeout]) as any;
        if (res && res.data && res.data.session) {
          setSession(res.data.session);
        }
      } catch (err) {
        console.warn('Supabase offline ou lento. Usando fallback.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      window.removeEventListener('force_login', handleForceLogin);
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
