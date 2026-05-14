import React, { useState } from 'react';
import { supabase } from './lib/supabase';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Campos de Formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMsg(error?.error_description || error?.message || 'Erro ao conectar com o servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="liquid-glass animate-fade-in" style={{ padding: '48px 40px', width: '100%', maxWidth: '450px' }}>
        <h1 style={{ marginBottom: '12px', fontSize: '28px' }}>PortalRodin</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Autentique-se para acessar o RodinMeet
        </p>

        {errorMsg && (
          <div style={{ padding: '12px', marginBottom: '20px', background: 'rgba(255, 69, 58, 0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', borderRadius: '8px', fontSize: '14px' }}>
            {errorMsg}
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>E-mail Institucional</label>
            <input 
              type="email" 
              placeholder="colegiorodin@gmail.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Senha</label>
            <input 
              type="password" 
              placeholder="Sua senha" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="button" 
            onClick={handleLogin}
            className="primary" 
            style={{ marginTop: '10px' }} 
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Entrar no Sistema'}
          </button>
        </form>

      </div>
    </div>
  );
};
