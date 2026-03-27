import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Lock, Mail, User as UserIcon, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export function AuthView() {
  const { actions, dispatch, state } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      if (isLogin) {
        await actions.login(form.email, form.password);
      } else {
        await actions.register(form.name, form.email, form.password);
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',
      background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: 24,
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background Animated Blobs */}
      <div className="animated-bg">
        <div className="bg-blob bg-blob-1" style={{ opacity: 0.2 }}></div>
        <div className="bg-blob bg-blob-2" style={{ opacity: 0.2 }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%', maxWidth: 400, background: 'var(--bg-card)', 
          padding: '40px 32px', borderRadius: 'var(--radius-xl)', 
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(16px)', position: 'relative', zIndex: 1
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 54, height: 54, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))',
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
          }}>
            <Users size={28} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px' }}>DesliGest</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
            {isLogin ? 'Faça login para acessar o sistema' : 'Crie sua conta no sistema'}
          </p>
        </div>

        {state.error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="alert alert-warning" 
            style={{ marginBottom: 20, fontSize: 13 }}
          >
            {state.error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required className="form-input" style={{ paddingLeft: 42, height: 42 }} placeholder="Seu nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
              <input required type="email" className="form-input" style={{ paddingLeft: 42, height: 42 }} placeholder="seu@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
              <input required type="password" minLength={6} className="form-input" style={{ paddingLeft: 42, height: 42 }} placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, height: 44, fontSize: 15 }} disabled={loading}>
            {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          {isLogin ? (
            <>Não tem uma conta? <button type="button" onClick={() => { setIsLogin(false); dispatch({ type: 'CLEAR_ERROR' }); }} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Cadastre-se</button></>
          ) : (
            <>Já tem uma conta? <button type="button" onClick={() => { setIsLogin(true); dispatch({ type: 'CLEAR_ERROR' }); }} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Fazer login</button></>
          )}
        </div>
      </motion.div>
    </div>
  );
}
