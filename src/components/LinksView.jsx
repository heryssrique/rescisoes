import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ExternalLink, Calculator, BookOpen, Globe, Search, Plus, Pencil, Trash2, X, Check, Loader, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Cálculos', 'Legislação', 'Portais', 'Consultas', 'Geral'];

const categoryIcons = {
  'Cálculos': <Calculator size={24} />,
  'Legislação': <BookOpen size={24} />,
  'Portais': <Globe size={24} />,
  'Consultas': <Search size={24} />,
  'Geral': <ExternalLink size={24} />
};

const categoryColors = {
  'Cálculos': 'var(--accent-blue)',
  'Legislação': 'var(--accent-orange)',
  'Portais': 'var(--accent-purple)',
  'Consultas': 'var(--accent-teal)',
  'Geral': 'var(--accent-indigo)'
};

function LinkFormModal({ link, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    label: link?.label || '',
    url: link?.url || '',
    category: link?.category || 'Geral',
    description: link?.description || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

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
            {link ? 'Editar Link' : 'Novo Link'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              required
              className="form-input"
              placeholder="Ex: Cálculo Exato"
              value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })}
              style={{ height: 42 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL</label>
            <input
              required
              type="url"
              className="form-input"
              placeholder="https://exemplo.com"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              style={{ height: 42 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select
              className="form-input"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ height: 42 }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição (opcional)</label>
            <input
              className="form-input"
              placeholder="Breve descrição do link"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ height: 42 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
              {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (
                <><Check size={16} /> {link ? 'Salvar' : 'Adicionar'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function LinksView() {
  const { state, actions } = useApp();
  const linksUteis = state.linksUteis || [];
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = () => {
    setEditingLink(null);
    setShowModal(true);
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    setError('');
    try {
      if (editingLink) {
        await actions.updateLink(editingLink.id || editingLink._id, formData);
      } else {
        await actions.addLink(formData);
      }
      setShowModal(false);
      setEditingLink(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (link) => {
    if (!confirm(`Excluir o link "${link.label}"?`)) return;
    setDeleting(link.id || link._id);
    try {
      await actions.deleteLink(link.id || link._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await actions.seedLinks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
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

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Links e Ferramentas Úteis</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Atalhos para sites e portais que auxiliam no processamento de rescisões e cálculos trabalhistas.</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Novo Link
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 8 }}>×</button>
        </div>
      )}

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 20 
        }}
      >
        {linksUteis.map((link) => (
          <motion.div
            key={link.id || link._id}
            variants={item}
            className="card"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16, 
              padding: 24, 
              border: '1px solid var(--border)',
              transition: 'all 0.3s',
              position: 'relative'
            }}
          >
            {/* Botões de ação */}
            <div style={{
              position: 'absolute', top: 12, right: 12,
              display: 'flex', gap: 4
            }}>
              <button
                onClick={() => handleEdit(link)}
                style={{
                  background: 'var(--bg-default)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                  color: 'var(--text-muted)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center'
                }}
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(link)}
                disabled={deleting === (link.id || link._id)}
                style={{
                  background: 'var(--bg-default)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                  color: 'var(--accent-red)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center',
                  opacity: deleting === (link.id || link._id) ? 0.5 : 1
                }}
                title="Excluir"
              >
                {deleting === (link.id || link._id) 
                  ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Trash2 size={14} />}
              </button>
            </div>

            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 12, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: `${categoryColors[link.category] || categoryColors['Geral']}15`,
              color: categoryColors[link.category] || categoryColors['Geral']
            }}>
              {categoryIcons[link.category] || categoryIcons['Geral']}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: 10, 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                color: 'var(--text-muted)', 
                marginBottom: 4,
                letterSpacing: 0.5
              }}>
                {link.category}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {link.label}
              </h3>
              {link.description && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                  {link.description}
                </p>
              )}
            </div>

            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                fontSize: 13, 
                fontWeight: 600, 
                color: categoryColors[link.category] || categoryColors['Geral'],
                textDecoration: 'none'
              }}
            >
              Acessar site <ExternalLink size={14} />
            </a>
          </motion.div>
        ))}
      </motion.div>

      {linksUteis.length === 0 && (
        <div style={{ 
          textAlign: 'center', padding: '60px 0', 
          border: '2px dashed var(--border)', borderRadius: 16, 
          color: 'var(--text-muted)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
        }}>
          <Globe size={40} style={{ opacity: 0.3 }} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nenhum link cadastrado</p>
            <p style={{ fontSize: 13, marginBottom: 20 }}>Adicione links úteis ou carregue os links padrão.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Adicionar Link
            </button>
            <button className="btn" onClick={handleSeed} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {seeding 
                ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <Download size={16} />}
              Carregar Padrão
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <LinkFormModal
            link={editingLink}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditingLink(null); }}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
