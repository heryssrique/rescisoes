import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Database, Download, FileSpreadsheet, AlertTriangle, ShieldAlert, Users, Plus, X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { DEFAULT_COLIGADAS } from '../data/initialData';

export function SettingsView() {
  const { state, actions } = useApp();
  const { desligamentos, archivedDesligamentos } = state;

  const [coligadasList, setColigadasList] = useState(() => {
    let coligadosObj = DEFAULT_COLIGADAS;
    try {
      const saved = localStorage.getItem('desligest_coligadas');
      if (saved) coligadosObj = JSON.parse(saved);
    } catch (e) {}
    return Object.entries(coligadosObj).map(([code, data]) => ({ code, nome: data.nome, color: data.color }));
  });

  const handleExportData = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      desligamentos,
      archivedDesligamentos,
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `desligest_backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleRequestNotifications = () => {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações de área de trabalho.');
      return;
    }
    actions.requestNotificationPermission();
  };

  const handleSaveColigadas = () => {
    const newColigadas = {};
    coligadasList.forEach(c => {
      if (c.code.trim()) newColigadas[c.code] = { nome: c.nome, color: c.color };
    });
    localStorage.setItem('desligest_coligadas', JSON.stringify(newColigadas));
    alert('Padrões de empresas salvos e atualizados no sistema!');
    window.location.reload();
  };

  const updateColigada = (index, field, value) => {
    const newList = [...coligadasList];
    newList[index][field] = value;
    setColigadasList(newList);
  };

  const addColigada = () => setColigadasList([...coligadasList, { code: '', nome: '', color: '#3b82f6' }]);
  const removeColigada = (index) => setColigadasList(coligadasList.filter((_, i) => i !== index));

  return (
    <motion.div 
      className="page-content"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Configurações do Sistema</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gerencie preferências, notificações e dados da plataforma.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24 }}>
        
        {/* Main Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <section className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Users size={18} color="var(--accent-blue)" />
              Padrões de Empresas (Coligadas)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Configure aqui os códigos, os nomes comerciais e as cores padrão (usadas nos gráficos e painéis) para representar diferentes unidades/empresas do grupo. 
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {coligadasList.map((coligada, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input 
                    className="form-input" 
                    placeholder="Cód." 
                    value={coligada.code}
                    onChange={e => updateColigada(idx, 'code', e.target.value)}
                    style={{ width: '80px', padding: '8px' }}
                  />
                  <input 
                    className="form-input" 
                    placeholder="Nome da Empresa" 
                    value={coligada.nome}
                    onChange={e => updateColigada(idx, 'nome', e.target.value)}
                    style={{ flex: 1, padding: '8px' }}
                  />
                  <input 
                    type="color" 
                    value={coligada.color}
                    onChange={e => updateColigada(idx, 'color', e.target.value)}
                    style={{ width: 40, height: 36, padding: 0, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
                  />
                  <button className="btn btn-icon" onClick={() => removeColigada(idx)} style={{ color: 'var(--text-muted)' }} title="Remover">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
              <button className="btn" onClick={addColigada} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 13 }}>
                <Plus size={14} /> Adicionar Empresa
              </button>
              <button className="btn btn-primary" onClick={handleSaveColigadas} style={{ fontSize: 13 }}>
                <Save size={14} /> Salvar Padrões
              </button>
            </div>
          </section>

          <section className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Bell size={18} color="var(--accent-yellow)" />
              Notificações
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Ative as notificações para receber alertas no seu navegador sobre processos que estão próximos do vencimento ou atrasados.
            </p>
            <button className="btn" onClick={handleRequestNotifications}>
              Ativar Notificações no Navegador
            </button>
            {'Notification' in window && Notification.permission === 'granted' && (
              <span style={{ marginLeft: 16, fontSize: 12, color: 'var(--accent-green)' }}>
                ✓ Notificações ativadas
              </span>
            )}
            {'Notification' in window && Notification.permission === 'denied' && (
              <span style={{ marginLeft: 16, fontSize: 12, color: 'var(--accent-red)' }}>
                ✕ Notificações bloqueadas pelo navegador
              </span>
            )}
          </section>

          <section className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Database size={18} color="var(--accent-purple)" />
              Exportação de Dados
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Exporte todos os seus dados de desligamentos ativos e arquivados para um arquivo JSON estruturado. Recomendado para backup local.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn" onClick={handleExportData} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <Download size={14} />
                Fazer Backup (.json)
              </button>
            </div>
          </section>

          <section className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--accent-red)' }}>
              <ShieldAlert size={18} />
              Zona de Perigo
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Cuidado: Ações nesta área afetam diretamente a integridade dos dados operacionais da plataforma. Se certifique de possuir um backup antes de prosseguir.
            </p>
            
            <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h4 style={{ fontSize: 14, color: '#ef4444', marginBottom: 8 }}>Apagar todos os dados</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Isso removerá instantaneamente todos os processos de desligamento. Para segurança, nós exigimos confirmação dupla, mas a ação é irreversível e você perderá o histórico.
              </p>
              <button 
                className="btn" 
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                onClick={() => {
                  if (confirm('ATENÇÃO: Deseja apagar todas as rescisões ativas e do histórico permanentemente?')) {
                    if (confirm('Tem certeza absoluta? Essa ação NÃO PODE ser defeita.')) {
                      alert('Recurso em desenvolvimento: A limpeza global de banco de dados por segurança foi suspensa temporariamente nesta versão.');
                    }
                  }
                }}
              >
                Limpar Banco de Dados
              </button>
            </div>
          </section>

        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>
              Sobre o Sistema
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Versão</span>
                <span style={{ fontWeight: 600 }}>v2.4.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Armazenamento</span>
                <span style={{ fontWeight: 600 }}>MongoDB Nuvem</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status API</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Online</span>
              </div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                DesliGest - Gestão Operacional de Desligamentos de Excelência.
              </p>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
