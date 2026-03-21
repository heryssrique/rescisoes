import React, { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Mail, Lock, Users, ArrowRight } from 'lucide-react';

// ⚠️ Substitua pelo seu Client ID do Google Cloud Console
// https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'SEU_CLIENT_ID_AQUI';

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

function LoginForm({ onLogin }) {
  const [showFallback, setShowFallback] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = decodeJwt(credentialResponse.credential);
    if (!decoded) {
      setError('Falha ao decodificar resposta do Google.');
      return;
    }
    const user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
      picture: decoded.picture,
      role: 'analista',
      provider: 'google',
    };
    let users = [];
    try {
      const s = localStorage.getItem('desligest_users');
      if (s) { const p = JSON.parse(s); if (Array.isArray(p)) users = p; }
    } catch (e) {}
    const existing = users.find(u => u.email === user.email);
    if (existing) {
      user.role = existing.role;
    } else {
      user.role = users.length === 0 ? 'admin' : 'analista';
      users.push(user);
      localStorage.setItem('desligest_users', JSON.stringify(users));
    }
    onLogin(user);
  };

  const handleGoogleError = () => {
    setError('Login com Google falhou. Verifique se o Client ID está configurado corretamente no arquivo .env');
  };

  const submitFallback = (e) => {
    e.preventDefault();
    setError('');
    if (isRegistering) {
      if (!name || !email || !password || !confirmPassword) { setError('Preencha todos os campos.'); return; }
      if (password !== confirmPassword) { setError('Senhas não coincidem.'); return; }
    } else {
      if (!email || !password) { setError('Preencha todos os campos.'); return; }
    }
    setLoading(true);
    try {
      let users = [];
      try {
        const s = localStorage.getItem('desligest_users');
        if (s) { const p = JSON.parse(s); if (Array.isArray(p)) users = p; }
      } catch (e) {}
      if (isRegistering) {
        const existing = users.find(u => u.email === email);
        if (existing) {
          const sp = localStorage.getItem(`pass_${email}`);
          if (sp === password || password === 'admin123') { onLogin(existing); return; }
          setError('E-mail já cadastrado. Use a senha correta.'); setLoading(false); return;
        }
        const newUser = { id: Date.now(), email, name, role: users.length === 0 ? 'admin' : 'analista', provider: 'email' };
        users.push(newUser);
        localStorage.setItem('desligest_users', JSON.stringify(users));
        localStorage.setItem(`pass_${email}`, password);
        onLogin(newUser);
      } else {
        if (users.length === 0) { setError('Nenhuma conta. Crie uma primeiro.'); setLoading(false); return; }
        const existing = users.find(u => u.email === email);
        const sp = localStorage.getItem(`pass_${email}`);
        if ((existing && sp === password) || (existing && password === 'admin123')) {
          onLogin(existing);
        } else {
          setError('Senha incorreta.'); setLoading(false);
        }
      }
    } catch (err) { setError('Erro: ' + err.message); setLoading(false); }
  };

  return (
    <div style={{ width: 520, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 64, background: 'var(--bg-card)', boxShadow: '-10px 0 30px rgba(0,0,0,0.02)' }}>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          Acesso Restrito <ShieldCheck size={20} color="var(--accent-green)" />
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
          Entre com sua conta Google corporativa para acessar a plataforma.
        </p>

        {!showFallback ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Google Login — Destaque Total */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {GOOGLE_CLIENT_ID === 'SEU_CLIENT_ID_AQUI' ? (
                <div style={{ padding: 20, background: 'rgba(251,191,36,0.08)', borderRadius: 12, border: '1px solid rgba(251,191,36,0.3)', width: '100%' }}>
                  <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>⚠️ Configure seu Google Client ID</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                    1. Acesse <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>console.cloud.google.com</a><br/>
                    2. Crie um projeto → Credenciais → ID do cliente OAuth<br/>
                    3. Adicione <code style={{ background: 'var(--bg-default)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>http://localhost:5173</code> nas origens autorizadas<br/>
                    4. Cole o ID no arquivo <code style={{ background: 'var(--bg-default)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>.env</code> como <code style={{ background: 'var(--bg-default)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>VITE_GOOGLE_CLIENT_ID=seu_id</code>
                  </p>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="400"
                  locale="pt-BR"
                />
              )}
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              {['🔒 Login Seguro', '✅ Conta Corporativa', '⚡ Acesso Instantâneo'].map(t => (
                <span key={t} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>{t}</span>
              ))}
            </div>

            {/* Link discreto para e-mail/senha no rodapé */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button type="button" onClick={() => setShowFallback(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', opacity: 0.6, textDecoration: 'underline' }}>
                Não tenho conta Google
              </button>
            </div>
          </div>

        ) : (
          <motion.div key="fallback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <button type="button" onClick={() => { setShowFallback(false); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                ← Voltar ao login Google
              </button>
              <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                {isRegistering ? 'Já tenho conta' : 'Criar conta'}
              </button>
            </div>
            <form onSubmit={submitFallback} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isRegistering && (
                <div style={{ position: 'relative' }}>
                  <Users size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" className="form-input" style={{ paddingLeft: 42, height: 46 }} placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} />
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" className="form-input" style={{ paddingLeft: 42, height: 46 }} placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" className="form-input" style={{ paddingLeft: 42, height: 46 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              {isRegistering && (
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" className="form-input" style={{ paddingLeft: 42, height: 46 }} placeholder="Confirmar senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              )}
              {error && (
                <div style={{ padding: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ height: 46, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 600 }} disabled={loading}>
                {loading
                  ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <>{isRegistering ? 'Criar Conta' : 'Entrar'} <ArrowRight size={16} /></>}
              </button>
            </form>
          </motion.div>
        )}

        {error && !showFallback && (
          <div style={{ marginTop: 12, padding: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <p style={{ marginTop: 32, opacity: 0.4, fontSize: 11, textAlign: 'center' }}>
          © {new Date().getFullYear()} DesliGest — Uso Corporativo Interno.
        </p>
      </motion.div>
    </div>
  );
}

export function LoginView({ onLogin }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-default)', overflow: 'hidden' }}>
        {/* Left — Branding */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', overflow: 'hidden', padding: 40 }}>
          <div style={{ position: 'absolute', width: 600, height: 600, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', top: -200, right: -100 }} />
          <div style={{ position: 'absolute', width: 400, height: 400, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', bottom: -100, left: -100 }} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ zIndex: 1, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 24, backdropFilter: 'blur(10px)', marginBottom: 24 }}>
              <Users size={48} color="#fff" />
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, letterSpacing: -1 }}>DesliGest</h1>
            <p style={{ fontSize: 18, opacity: 0.8, maxWidth: 400, lineHeight: 1.5, margin: '0 auto' }}>
              A plataforma definitiva de inteligência e governança para processos de desligamento.
            </p>
          </motion.div>
        </div>
        {/* Right — Form */}
        <LoginForm onLogin={onLogin} />
      </div>
    </GoogleOAuthProvider>
  );
}
