import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Lock, Mail, User as UserIcon, Loader } from 'lucide-react';

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
      backgroundImage: 'var(--bg-gradient)'
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: 'var(--bg-card)', 
        padding: '32px 24px', borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 48, height: 48, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <Users size={24} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>DesliGest</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {isLogin ? 'Faça login para acessar o sistema' : 'Crie sua conta no sistema'}
          </p>
        </div>

        {state.error && (
          <div className="alert alert-warning" style={{ marginBottom: 20 }}>
            {state.error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
                <input required className="form-input" style={{ paddingLeft: 36 }} placeholder="Seu nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
              <input required type="email" className="form-input" style={{ paddingLeft: 36 }} placeholder="seu@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
              <input required type="password" minLength={6} className="form-input" style={{ paddingLeft: 36 }} placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          {isLogin ? (
            <>Não tem uma conta? <button type="button" onClick={() => { setIsLogin(false); dispatch({ type: 'CLEAR_ERROR' }); }} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Cadastre-se</button></>
          ) : (
            <>Já tem uma conta? <button type="button" onClick={() => { setIsLogin(true); dispatch({ type: 'CLEAR_ERROR' }); }} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Fazer login</button></>
          )}
        </div>
      </div>
    </div>
  );
}
