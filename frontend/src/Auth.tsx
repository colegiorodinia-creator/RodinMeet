import React, { useState } from 'react';
import { supabase } from './lib/supabase';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  
  // Campos de Formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.error_description || error.message);
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
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

          <button type="submit" className="primary" style={{ marginTop: '10px' }} disabled={loading}>
            {loading ? 'Carregando...' : 'Entrar no Sistema'}
          </button>
        </form>

      </div>
    </div>
  );
};
