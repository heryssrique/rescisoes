import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Plus, Pencil, Trash2, X, Check, Loader, Shield, User as UserIcon, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'var(--accent-purple)' },
  { value: 'hr', label: 'RH', color: 'var(--accent-blue)' }
];

function UserFormModal({ user, onSave, onClose, saving, currentUserId }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'hr',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!user && !form.password) {
      setError('Senha é obrigatória para novos usuários');
      return;
    }
    if (form.password && form.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    onSave(form);
  };

  const isEditing = !!user;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)'
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)', padding: 32,
          width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isEditing ? 'Editar Função do Usuário' : 'Novo Usuário'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-warning" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!isEditing && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="user-name">Nome Completo</label>
                <input
                  required
                  id="user-name"
                  name="name"
                  className="form-input"
                  placeholder="Ex: João Silva"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ height: 42 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-email">E-mail</label>
                <input
                  required
                  id="user-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="usuario@exemplo.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ height: 42 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-password">Senha</label>
                <input
                  required
                  id="user-password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ height: 42 }}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="user-role">Função</label>
            <select
              id="user-role"
              name="role"
              className="form-input"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ height: 42 }}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {isEditing && (
            <div style={{
              padding: 12,
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              color: 'var(--text-muted)'
            }}>
              <strong>Nota:</strong> Apenas a função pode ser alterada. Para mudar nome, e-mail ou senha, o usuário deve fazer isso através do seu próprio perfil.
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
              {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (
                <><Check size={16} /> {isEditing ? 'Salvar' : 'Criar Usuário'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function UsersView() {
  const { state, actions, dispatch } = useApp();
  const users = state.users || [];
  const currentUser = state.user;

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se o usuário é admin
    if (currentUser?.role !== 'admin') {
      dispatch({ type: 'SET_VIEW', view: 'lista' });
      return;
    }

    // Carrega os usuários
    const load = async () => {
      try {
        setLoading(true);
        await actions.fetchUsers();
      } catch (err) {
        setError(err.message || 'Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    setError('');
    try {
      if (editingUser) {
        // Edição: apenas role
        await actions.updateUserRole(editingUser._id, formData.role);
      } else {
        // Criação: name, email, password
        await actions.addUser(formData.name, formData.email, formData.password);
      }
      setShowModal(false);
      setEditingUser(null);
    } catch (err) {
      setError(err.message || 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (user._id === currentUser?.id) {
      setError('Você não pode deletar sua própria conta.');
      return;
    }

    if (!confirm(`Excluir o usuário "${user.name}"?\n\nEsta ação não pode ser desfeita.`)) return;

    setDeleting(user._id);
    setError('');
    try {
      await actions.deleteUser(user._id);
    } catch (err) {
      setError(err.message || 'Erro ao deletar usuário');
    } finally {
      setDeleting(null);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getRoleInfo = (role) => ROLES.find(r => r.value === role) || ROLES[1];

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={28} />
            Gerenciar Usuários
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Controle de acesso e permissões do sistema. Total: <strong>{users.length}</strong> {users.length === 1 ? 'usuário' : 'usuários'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            {error}
          </span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20
        }}
      >
        {users.map((user) => {
          const roleInfo = getRoleInfo(user.role);
          const isCurrentUser = user._id === currentUser?.id;

          return (
            <motion.div
              key={user._id}
              variants={item}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                position: 'relative',
                borderLeft: `4px solid ${roleInfo.color}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${roleInfo.color}20, ${roleInfo.color}40)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: roleInfo.color
                  }}>
                    {user.role === 'admin' ? <Shield size={24} /> : <UserIcon size={24} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.name}
                      {isCurrentUser && (
                        <span style={{
                          marginLeft: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'var(--accent-green)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          VOCÊ
                        </span>
                      )}
                    </h3>
                    <div style={{
                      marginTop: 4,
                      padding: '3px 8px',
                      background: `${roleInfo.color}20`,
                      color: roleInfo.color,
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 4,
                      display: 'inline-block'
                    }}>
                      {roleInfo.label}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                <Mail size={14} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
              </div>

              {user.createdAt && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -4 }}>
                  Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => handleEdit(user)}
                  className="btn"
                  style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                >
                  <Pencil size={14} /> Editar Função
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  disabled={deleting === user._id || isCurrentUser}
                  className="btn"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    fontSize: 13,
                    opacity: isCurrentUser ? 0.5 : 1,
                    cursor: isCurrentUser ? 'not-allowed' : 'pointer'
                  }}
                  title={isCurrentUser ? 'Você não pode deletar sua própria conta' : 'Deletar usuário'}
                >
                  {deleting === user._id ? (
                    <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <><Trash2 size={14} /> Deletar</>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {users.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          color: 'var(--text-muted)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)'
        }}>
          <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: 16, margin: 0 }}>Nenhum usuário encontrado</p>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <UserFormModal
            user={editingUser}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingUser(null);
            }}
            saving={saving}
            currentUserId={currentUser?.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
