import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Lock, Mail, User as UserIcon, Loader, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function AuthView() {
  const { actions, dispatch, state } = useApp();

  // Modes: 'login' | 'register' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login');

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [resetForm, setResetForm] = useState({ token: '', newPassword: '', confirmPassword: '' });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    dispatch({ type: 'CLEAR_ERROR' });
    setSuccess(null);
  }, [mode, dispatch]);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setLoading(true);
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      await actions.login(loginForm.email, loginForm.password);
      setSuccess({ type: 'login', message: 'Login realizado com sucesso!' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setLoading(true);
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      await actions.register(registerForm.name, registerForm.email, registerForm.password);
      setSuccess({ type: 'register', message: 'Cadastro realizado com sucesso! Faça login.' });
      setMode('login');
      setRegisterForm({ name: '', email: '', password: '' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setLoading(true);
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const res = await actions.forgotPassword(forgotForm.email);
      // Se o servidor retornar o token (dev mode), mostramos para o usuário
      if (res.devResetToken) {
        setSuccess({
          type: 'forgot',
          message: `Token gerado para ${forgotForm.email}: ${res.devResetToken}. ` +
                 `Em produção, você receberia um e-mail com o link.`,
          token: res.devResetToken
        });
      } else {
        setSuccess({
          type: 'forgot',
          message: res.message || 'Se o e-mail estiver cadastrado, as instruções foram enviadas.'
        });
      }
      setForgotForm({ email: '' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      dispatch({ type: 'SET_ERROR', message: 'As senhas não coincidem.' });
      return;
    }
    if (resetForm.newPassword.length < 6) {
      dispatch({ type: 'SET_ERROR', message: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      await actions.resetPassword(resetForm.token, resetForm.newPassword);
      setSuccess({
        type: 'reset',
        message: 'Senha redefinida com sucesso! Faça login com sua nova senha.'
      });
      setResetForm({ token: '', newPassword: '', confirmPassword: '' });
      setMode('login');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  const BackButton = ({ onClick }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'absolute', top: 20, left: 24,
        background: 'none', border: 'none', color: 'var(--text-muted)',
        cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 14
      }}
    >
      <ArrowLeft size={16} /> Voltar
    </button>
  );

  // Success Message Component
  const SuccessMessage = () => {
    if (!success) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 16, marginBottom: 20, borderRadius: 'var(--radius-md)',
          background: success.type === 'error' ? '#fee2e2' : '#dcfce7',
          border: '1px solid', borderColor: success.type === 'error' ? '#fecaca' : '#bbf7d0',
          color: success.type === 'error' ? '#991b1b' : '#166534',
          fontSize: 14, display: 'flex', alignItems: 'center', gap: 10
        }}
      >
        {success.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
        <span>{success.message}</span>
      </motion.div>
    );
  };

  // Shared styles for inputs
  const inputBaseStyle = { height: 42, paddingLeft: 42 };

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

          {mode === 'login' && <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Faça login para acessar o sistema</p>}
          {mode === 'register' && <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Crie sua conta no sistema</p>}
          {mode === 'forgot' && <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Digite seu e-mail para redefinir a senha</p>}
          {mode === 'reset' && <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Digite o token e a nova senha</p>}
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

        <SuccessMessage />

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required type="email" className="form-input" style={inputBaseStyle} placeholder="seu@email.com" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required type="password" minLength={6} className="form-input" style={inputBaseStyle} placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', fontSize: 13 }}>
                Esqueceu a senha?
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, height: 44, fontSize: 15 }} disabled={loading}>
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Entrar'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required className="form-input" style={inputBaseStyle} placeholder="Seu nome" value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required type="email" className="form-input" style={inputBaseStyle} placeholder="seu@email.com" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required type="password" minLength={6} className="form-input" style={inputBaseStyle} placeholder="••••••••" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, height: 44, fontSize: 15 }} disabled={loading}>
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Cadastrar'}
            </button>
          </form>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">E-mail Cadastrado</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required type="email" className="form-input" style={inputBaseStyle} placeholder="seu@email.com" value={forgotForm.email} onChange={e => setForgotForm({...forgotForm, email: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, height: 44, fontSize: 15 }} disabled={loading}>
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Enviar Instruções'}
            </button>

            <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, width: '100%' }}>
              <ArrowLeft size={14} /> Voltar para Login
            </button>
          </form>
        )}

        {/* Reset Password Form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Token de Recuperação</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required className="form-input" style={inputBaseStyle} placeholder="Cole o token recebido" value={resetForm.token} onChange={e => setResetForm({...resetForm, token: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required type="password" minLength={6} className="form-input" style={inputBaseStyle} placeholder="••••••••" value={resetForm.newPassword} onChange={e => setResetForm({...resetForm, newPassword: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input required type="password" minLength={6} className="form-input" style={inputBaseStyle} placeholder="••••••••" value={resetForm.confirmPassword} onChange={e => setResetForm({...resetForm, confirmPassword: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, height: 44, fontSize: 15 }} disabled={loading}>
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Redefinir Senha'}
            </button>

            <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, width: '100%' }}>
              <ArrowLeft size={14} /> Voltar para Login
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          {mode === 'login' && (
            <>Não tem uma conta? <button type="button" onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Cadastre-se</button></>
          )}
          {mode === 'register' && (
            <>Já tem uma conta? <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Fazer login</button></>
          )}
        </div>
      </motion.div>
    </div>
  );
}
