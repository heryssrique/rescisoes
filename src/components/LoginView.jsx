import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Lock, Mail, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export function LoginView() {
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    // MOCK: Simular tempo de resposta de API
    setTimeout(() => {
      // Simulação de banco LocalStorage
      let users = [];
      try {
        const stored = localStorage.getItem('desligest_users');
        if (stored) users = JSON.parse(stored);
      } catch (e) {}

      // Se não houver nenhum usuário no sistema, o primeiro a logar "cria" a conta Admin mestre
      if (users.length === 0) {
        const newUser = { id: 1, email, name: email.split('@')[0], role: 'admin' };
        localStorage.setItem('desligest_users', JSON.stringify([newUser]));
        localStorage.setItem(`pass_${email}`, password); // Mock simples
        dispatch({ type: 'LOGIN', payload: newUser });
        return;
      }

      // Validar conta existente
      const existingUser = users.find(u => u.email === email);
      const savedPass = localStorage.getItem(`pass_${email}`);
      
      // Backdoor genérico ou senha cadastrada
      if ((existingUser && savedPass === password) || (password === 'admin123' && existingUser)) {
        dispatch({ type: 'LOGIN', payload: existingUser });
      } else if (!existingUser) {
        // Permitir que novas contas sejam criadas na hora se colocar a senha mestre
        if (password === 'admin123') {
          const newUser = { id: Date.now(), email, name: email.split('@')[0], role: 'analista' };
          users.push(newUser);
          localStorage.setItem('desligest_users', JSON.stringify(users));
          localStorage.setItem(`pass_${email}`, password);
          dispatch({ type: 'LOGIN', payload: newUser });
        } else {
          setError('Credenciais inválidas. Tente novamente ou use a senha mestre (admin123) para criar acesso.');
          setLoading(false);
        }
      } else {
        setError('Senha incorreta.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-default)', overflow: 'hidden' }}>
      
      {/* Left Area - Branding */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', overflow: 'hidden', padding: 40 }}>
        {/* Background shapes */}
        <div style={{ position: 'absolute', width: 600, height: 600, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', top: -200, right: -100 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', bottom: -100, left: -100 }} />
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 24, backdropFilter: 'blur(10px)', marginBottom: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <Users size={48} color="#fff" />
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, letterSpacing: -1 }}>DesliGest</h1>
          <p style={{ fontSize: 18, opacity: 0.8, maxWidth: 400, lineHeight: 1.5, margin: '0 auto' }}>
            A plataforma definitiva de inteligência e governança para processos de desligamento.
          </p>
        </motion.div>
      </div>

      {/* Right Area - Form */}
      <div style={{ width: 500, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 64, background: 'var(--bg-card)', boxShadow: '-10px 0 30px rgba(0,0,0,0.02)' }}>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            Acesso Restrito <ShieldCheck size={20} color="var(--accent-green)" />
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            Insira suas credenciais corporativas para entrar.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>E-mail Colaborador</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: 42, height: 48, fontSize: 15 }} 
                  placeholder="analista@rh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <span>Senha de Acesso</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: 42, height: 48, fontSize: 15 }} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertTriangle size={16} /> {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ height: 48, marginTop: 8, display: 'flex', justifyContent: 'center', fontSize: 15, fontWeight: 600, background: 'var(--text-primary)', color: 'var(--bg-default)' }}
              disabled={loading}
            >
              {loading ? (
                <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>Acessar Plataforma <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            <p>Se for seu primeiro acesso, o sistema validará automaticamente seu cadastro.</p>
            <p style={{ marginTop: 8, opacity: 0.5 }}>© {new Date().getFullYear()} DesliGest. Uso Interno.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
