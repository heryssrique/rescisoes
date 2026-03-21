import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Users, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export function LoginView({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitForm = (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!name || !email || !password || !confirmPassword) {
        setError('Por favor, preencha todos os campos.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
    } else {
      if (!email || !password) {
        setError('Por favor, preencha todos os campos.');
        return;
      }
    }

    setLoading(true);

    try {
      let users = [];
      try {
        const stored = localStorage.getItem('desligest_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) users = parsed;
        }
      } catch (e) {}

      if (isRegistering) {
        // Se a pessoa tentar criar a conta mas ela já existe
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          const savedPass = localStorage.getItem(`pass_${email}`);
          if (savedPass === password || password === 'admin123') {
            onLogin(existingUser);
            return;
          } else {
            setError('Este e-mail já existe. Tente a senha correta ou a senha admin123 para forçar entrada.');
            setLoading(false);
            return;
          }
        }

        const newUser = { 
          id: Date.now(), 
          email, 
          name, 
          role: users.length === 0 ? 'admin' : 'analista' 
        };
        
        users.push(newUser);
        localStorage.setItem('desligest_users', JSON.stringify(users));
        localStorage.setItem(`pass_${email}`, password);
        onLogin(newUser);
      } else {
        // Login Normal
        if (users.length === 0) {
          setError('Nenhuma conta encontrada. Crie uma acesso primeiro.');
          setLoading(false);
          return;
        }

        const existingUser = users.find(u => u.email === email);
        const savedPass = localStorage.getItem(`pass_${email}`);
        
        if ((existingUser && savedPass === password) || (existingUser && password === 'admin123')) {
          onLogin(existingUser);
        } else {
          setError('Sua senha corporativa está incorreta.');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Erro interno. " + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-default)', overflow: 'hidden' }}>
      
      {/* Left Area - Branding */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', overflow: 'hidden', padding: 40 }}>
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
        <motion.div key={isRegistering ? 'register' : 'login'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isRegistering ? 'Criar Novo Acesso' : 'Acesso Restrito'} <ShieldCheck size={20} color="var(--accent-green)" />
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            {isRegistering ? 'Preencha seus dados para receber o credenciamento ao sistema.' : 'Insira suas credenciais corporativas para entrar.'}
          </p>

          <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isRegistering && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Nome Completo</label>
                <div style={{ position: 'relative' }}>
                  <Users size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" className="form-input" style={{ paddingLeft: 42, height: 48, fontSize: 15 }} placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>E-mail Colaborador</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" className="form-input" style={{ paddingLeft: 42, height: 48, fontSize: 15 }} placeholder="analista@rh.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <span>Senha de Acesso</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" className="form-input" style={{ paddingLeft: 42, height: 48, fontSize: 15 }} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Confirmar Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" className="form-input" style={{ paddingLeft: 42, height: 48, fontSize: 15 }} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ height: 48, marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 15, fontWeight: 600, width: '100%' }} 
              disabled={loading}
            >
              {loading ? (
                <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>{isRegistering ? 'Realizar Cadastro' : 'Acessar Plataforma'} <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            {isRegistering ? (
              <p>Já possui credencial? <button type="button" onClick={() => { setIsRegistering(false); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer' }}>Fazer Login</button></p>
            ) : (
              <p>Não possui acesso? <button type="button" onClick={() => { setIsRegistering(true); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer' }}>Solicitar Cadastro</button></p>
            )}
            <p style={{ marginTop: 24, opacity: 0.5, fontSize: 11 }}>© {new Date().getFullYear()} DesliGest. (Build 12: Sync Auth)</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
