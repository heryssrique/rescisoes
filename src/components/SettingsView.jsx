import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { Bell, Database, Download, FileSpreadsheet, AlertTriangle, ShieldAlert, Users, Plus, X, Save, FileText, ListChecks, Settings, GripVertical, Archive, Columns, Link } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { format } from 'date-fns';
import * as api from '../services/api';
import { DEFAULT_COLIGADAS, DEFAULT_MOTIVOS, DEFAULT_CHECKLIST_TEMPLATE, DEFAULT_STATUS_FLOW, DEFAULT_LINKS_UTEIS } from '../data/initialData';
import { fireExtravagantConfetti } from '../utils/confettiHelper';
import { Sparkles, Zap, Trophy, PartyPopper } from 'lucide-react';

function ChecklistItem({ item, idx, updateChecklist, removeChecklistItem }) {
  const controls = useDragControls();
  
  return (
    <Reorder.Item 
      key={item.id} 
      value={item}
      dragListener={false}
      dragControls={controls}
      style={{ 
        display: 'flex', 
        gap: 12, 
        alignItems: 'center', 
        padding: '10px 12px', 
        background: 'var(--bg-card)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        userSelect: 'none'
      }}
    >
      <div 
        style={{ cursor: 'grab', color: 'var(--text-muted)', padding: '4px' }}
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical size={18} />
      </div>
      <div style={{ flex: 2 }}>
        <input 
          className="form-input" 
          placeholder="Descreva a tarefa..." 
          value={item.label} 
          onChange={e => updateChecklist(idx, 'label', e.target.value)} 
          style={{ padding: '10px 14px', fontSize: 14, background: 'var(--bg-secondary)', border: 'none', width: '100%' }} 
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Fase:</span>
        <select 
          className="form-input" 
          value={item.etapa} 
          onChange={e => updateChecklist(idx, 'etapa', e.target.value)} 
          style={{ padding: '8px 12px', fontSize: 13, background: 'var(--bg-card)' }}
        >
          <option value="comunicado">1. Comunicado</option>
          <option value="documentacao">2. Documentação</option>
          <option value="homologacao">3. Homologação</option>
          <option value="aguardando">4. Ag. Pagamento</option>
          <option value="pago">5. Processo Fechado</option>
        </select>
      </div>
      <button className="btn btn-icon" onClick={() => removeChecklistItem(idx)} style={{ color: '#ef4444' }}>
        <X size={16} />
      </button>
    </Reorder.Item>
  );
}
export function SettingsView() {
  const { state, actions } = useApp();
  const { desligamentos, archivedDesligamentos } = state;
  const { toast, confirm: showConfirm } = useToast();

  // Estado das Coligadas
  const [coligadasList, setColigadasList] = useState(() => {
    let coligadosObj = DEFAULT_COLIGADAS;
    try {
      const saved = localStorage.getItem('desligest_coligadas');
      if (saved) coligadosObj = JSON.parse(saved);
    } catch (e) {}
    return Object.entries(coligadosObj).map(([code, data]) => ({ code, nome: data.nome, color: data.color }));
  });

  // Estado dos Motivos
  const [motivosList, setMotivosList] = useState(() => {
    try {
      const saved = localStorage.getItem('desligest_motivos');
      return saved ? JSON.parse(saved) : DEFAULT_MOTIVOS;
    } catch { return DEFAULT_MOTIVOS; }
  });

  // Estado do Checklist
  const [checklistList, setChecklistList] = useState(() => {
    try {
      const saved = localStorage.getItem('desligest_checklist');
      return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST_TEMPLATE;
    } catch { return DEFAULT_CHECKLIST_TEMPLATE; }
  });

  // Estado do Fluxo
  const [statusFlowList, setStatusFlowList] = useState(() => {
    try {
      const saved = localStorage.getItem('desligest_status_flow');
      return saved ? JSON.parse(saved) : DEFAULT_STATUS_FLOW;
    } catch { return DEFAULT_STATUS_FLOW; }
  });

  const [linksList, setLinksList] = useState(() => {
    try {
      const saved = localStorage.getItem('desligest_links');
      return saved ? JSON.parse(saved) : DEFAULT_LINKS_UTEIS;
    } catch { return DEFAULT_LINKS_UTEIS; }
  });

  const [confettiStyle, setConfettiStyle] = useState(() => {
    return localStorage.getItem('desligest_confetti_style') || 'firework';
  });

  const handleSaveConfettiStyle = (style) => {
    setConfettiStyle(style);
    localStorage.setItem('desligest_confetti_style', style);
    toast('Estilo de comemoração salvo!');
  };

  const handlePreviewConfetti = () => {
    fireExtravagantConfetti(confettiStyle);
  };

  const handleSaveMotivos = () => {
    const valid = motivosList.filter(m => m.value.trim() && m.label.trim());
    actions.updateConfig('motivos', 'desligest_motivos', valid);
    toast('Motivos de desligamento atualizados!');
  };

  const updateMotivo = (index, field, value) => {
    const newList = [...motivosList];
    newList[index][field] = value;
    setMotivosList(newList);
  };
  const addMotivo = () => setMotivosList([...motivosList, { value: '', label: '', class: 'motivo-demissao' }]);
  const removeMotivo = (index) => setMotivosList(motivosList.filter((_, i) => i !== index));

  const handleSaveChecklist = () => {
    const valid = checklistList.filter(c => c.id.trim() && c.label.trim() && c.etapa);
    actions.updateConfig('checklistTemplate', 'desligest_checklist', valid);
    toast('Checklist padrão atualizado!');
  };

  const updateChecklist = (index, field, value) => {
    const newList = [...checklistList];
    newList[index][field] = value;
    setChecklistList(newList);
  };
  const addChecklistItem = () => setChecklistList([...checklistList, { id: `cx${Date.now()}`, label: '', etapa: 'comunicado' }]);
  const removeChecklistItem = (index) => setChecklistList(checklistList.filter((_, i) => i !== index));

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
      toast('Este navegador não suporta notificações de área de trabalho.', 'warning');
      return;
    }
    actions.requestNotificationPermission();
  };

  const [isMigrating, setIsMigrating] = useState(false);
  const handleMigrateOld = async () => {
    const ok = await showConfirm(
      'Deseja arquivar todos os processos com data de pagamento anterior a 01/03/2026? Esta ação também marcará o comprovante de pagamento como arquivado.',
      { title: 'Arquivamento em Lote', confirmText: 'Arquivar', type: 'warning' }
    );
    if (!ok) return;
    
    setIsMigrating(true);
    try {
      const res = await api.migrateArchiveOld();
      toast(`${res.updated} processos foram arquivados com sucesso!`);
      await actions.fetchAll();
      await actions.fetchArchived();
    } catch (err) {
      toast(`Erro na migração: ${err.message}`, 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSaveColigadas = () => {
    const newColigadas = {};
    coligadasList.forEach(c => {
      if (c.code.trim()) newColigadas[c.code] = { nome: c.nome, color: c.color };
    });
    actions.updateConfig('coligadas', 'desligest_coligadas', newColigadas);
    toast('Empresas e filiais atualizadas!');
  };

  const updateColigada = (index, field, value) => {
    const newList = [...coligadasList];
    newList[index][field] = value;
    setColigadasList(newList);
  };

  const addColigada = () => setColigadasList([...coligadasList, { code: '', nome: '', color: '#3b82f6' }]);
  const removeColigada = (index) => setColigadasList(coligadasList.filter((_, i) => i !== index));

  const handleSaveStatusFlow = () => {
    actions.updateConfig('statusFlow', 'desligest_status_flow', statusFlowList);
    toast('Fluxo do Kanban atualizado!');
  };

  const updateStatusFlow = (index, field, value) => {
    const newList = [...statusFlowList];
    newList[index][field] = value;
    setStatusFlowList(newList);
  };

  const addStatusFlow = () => {
    const newId = `custom_${Date.now().toString(36)}`;
    setStatusFlowList([...statusFlowList, { key: newId, label: 'Nova Etapa', short: 'Nova', color: 'var(--accent-blue)' }]);
  };

  const removeStatusFlow = (index) => {
    if (statusFlowList.length <= 1) return;
    setStatusFlowList(statusFlowList.filter((_, i) => i !== index));
  };

  const handleSaveLinks = () => {
    actions.updateConfig('linksUteis', 'desligest_links', linksList);
    toast('Links úteis atualizados!');
  };

  const addLink = () => setLinksList([...linksList, { id: Date.now().toString(), label: '', url: '', category: 'Geral' }]);
  const updateLink = (index, field, value) => {
    const newList = [...linksList];
    newList[index][field] = value;
    setLinksList(newList);
  };
  const removeLink = (index) => setLinksList(linksList.filter((_, i) => i !== index));

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('desligest_settings_tab') || 'empresas';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('desligest_settings_tab', tabId);
  };

  return (
    <motion.div 
      className="page-content"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 24, flexShrink: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={28} color="var(--accent-purple)" />
          Configurações do Projeto
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Personalize as regras de negócio, dados mestre e preferências da sua operação de RH.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 32, flex: 1, minHeight: 0 }}>
        
        {/* Settings Sidebar (Tabs) */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button 
            className={`btn ${activeTab === 'empresas' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'empresas' ? 'var(--accent-blue)' : 'transparent', color: activeTab === 'empresas' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => handleTabChange('empresas')}
          >
            <Users size={16} /> Padrões de Empresas
          </button>
          <button 
            className={`btn ${activeTab === 'motivos' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'motivos' ? 'var(--accent-indigo)' : 'transparent', color: activeTab === 'motivos' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => handleTabChange('motivos')}
          >
            <FileText size={16} /> Motivos de Desligamento
          </button>
          <button 
            className={`btn ${activeTab === 'checklist' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'checklist' ? 'var(--accent-green)' : 'transparent', color: activeTab === 'checklist' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => handleTabChange('checklist')}
          >
            <ListChecks size={16} /> Checklist Automático
          </button>
          <button 
            className={`btn ${activeTab === 'fluxo' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'fluxo' ? 'var(--accent-orange)' : 'transparent', color: activeTab === 'fluxo' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => handleTabChange('fluxo')}
          >
            <Columns size={16} /> Etapas do Kanban
          </button>
          <button 
            className={`btn ${activeTab === 'links' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'links' ? 'var(--accent-blue)' : 'transparent', color: activeTab === 'links' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => handleTabChange('links')}
          >
            <Link size={16} /> Links Úteis
          </button>
          <button 
            className={`btn ${activeTab === 'celebration' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'celebration' ? 'var(--accent-pink)' : 'transparent', color: activeTab === 'celebration' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => handleTabChange('celebration')}
          >
            <PartyPopper size={16} /> Estilo de Comemoração
          </button>
          <button 
            className={`btn ${activeTab === 'sistema' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'sistema' ? 'var(--accent-purple)' : 'transparent', color: activeTab === 'sistema' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => handleTabChange('sistema')}
          >
            <Database size={16} /> Sistema e Dados
          </button>
        </div>

        {/* Settings Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 16, paddingBottom: 40 }}>
          <AnimatePresence mode="wait">
            {activeTab === 'empresas' && (
              <motion.section 
                key="empresas" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                className="card" style={{ padding: 32, borderColor: 'transparent', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Users size={20} color="var(--accent-blue)" />
                    Coligadas e Filiais
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                    Cadastre os códigos internos, razão social/fantasia e a cor de marca que irá representar cada unidade de negócio nos gráficos e cartões Kanban.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                  {coligadasList.map((coligada, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg-secondary)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Código</label>
                        <input className="form-input" placeholder="001" value={coligada.code} onChange={e => updateColigada(idx, 'code', e.target.value)} style={{ width: 80, padding: '8px 12px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nome Comercial</label>
                        <input className="form-input" placeholder="Nome da Filial/Empresa" value={coligada.nome} onChange={e => updateColigada(idx, 'nome', e.target.value)} style={{ padding: '8px 12px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cor</label>
                        <div style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--bg-card)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                          <input type="color" value={coligada.color} onChange={e => updateColigada(idx, 'color', e.target.value)} style={{ position: 'absolute', top: -10, left: -10, width: 60, height: 60, padding: 0, border: 'none', cursor: 'pointer' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-end', height: '100%' }}>
                        <button className="btn btn-icon" onClick={() => removeColigada(idx)} style={{ color: 'var(--accent-red)', marginTop: 20 }} title="Remover Filial">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                  <button className="btn" onClick={addColigada} style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                    <Plus size={16} /> Adicionar Nova Unidade
                  </button>
                  <button className="btn" onClick={handleSaveColigadas} style={{ background: 'var(--accent-blue)', color: '#fff', padding: '10px 24px', fontWeight: 600, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                    <Save size={16} /> Salvar Padrões de Empresas
                  </button>
                </div>
              </motion.section>
            )}

            {activeTab === 'motivos' && (
              <motion.section 
                key="motivos" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                className="card" style={{ padding: 32, borderColor: 'transparent', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <FileText size={20} color="var(--accent-indigo)" />
                    Motivos de Desligamento
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                    Mapeie as opções de motivos que o RH poderá escolher ao abrir um processo. Você pode agrupar ou recriar tipos de rescisão à vontade.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {motivosList.map((motivo, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 12 }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>ID do Sistema</label>
                        <input className="form-input" placeholder="ex: pedido_demissao" value={motivo.value} onChange={e => updateMotivo(idx, 'value', e.target.value)} style={{ padding: '8px 12px' }} />
                      </div>
                      <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Nome de Exibição (Tela)</label>
                        <input className="form-input" placeholder="Pedido de Demissão" value={motivo.label} onChange={e => updateMotivo(idx, 'label', e.target.value)} style={{ padding: '8px 12px' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Cor da Etiqueta Visual</label>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <select 
                            className="form-input" 
                            value={motivo.class} 
                            onChange={e => updateMotivo(idx, 'class', e.target.value)} 
                            style={{ padding: '8px 12px', background: 'var(--bg-card)' }}
                          >
                            <option value="motivo-pedido">🔵 Azul (Padrão/Pedido)</option>
                            <option value="motivo-demissao">🟠 Laranja (Demissão/Alerta)</option>
                            <option value="motivo-acordo">🟡 Amarelo (Acordo Mútuo)</option>
                            <option value="motivo-justa">🔴 Vermelho (Justa Causa/Crítico)</option>
                            <option value="motivo-aposentadoria">🟢 Verde (Aposentadoria)</option>
                            <option value="motivo-termino">🟣 Roxo (Término Contrato)</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-end', height: '100%' }}>
                        <button className="btn btn-icon" onClick={() => removeMotivo(idx)} style={{ color: 'var(--accent-red)', marginTop: 20 }}>
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                  <button className="btn" onClick={addMotivo} style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                    <Plus size={16} /> Adicionar Nova Categoria
                  </button>
                  <button className="btn" onClick={handleSaveMotivos} style={{ background: 'var(--accent-indigo)', color: '#fff', padding: '10px 24px', fontWeight: 600, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                    <Save size={16} /> Salvar Motivos
                  </button>
                </div>
              </motion.section>
            )}

            {activeTab === 'checklist' && (
              <motion.section 
                key="checklist" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                className="card" style={{ padding: 32, borderColor: 'transparent', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <ListChecks size={20} color="var(--accent-green)" />
                    Fluxos & Tarefas Obrigatórias
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                    Configure os "To-Dos" que o sistema vai exigir que a equipe marque como concluído ao longo do andamento do Kanban.
                  </p>
                </div>
                
                <Reorder.Group 
                  axis="y" 
                  values={checklistList} 
                  onReorder={setChecklistList}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}
                >
                  {checklistList.map((item, idx) => (
                    <ChecklistItem 
                      key={item.id} 
                      item={item} 
                      idx={idx} 
                      updateChecklist={updateChecklist} 
                      removeChecklistItem={removeChecklistItem} 
                    />
                  ))}
                </Reorder.Group>
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                  <button className="btn" onClick={addChecklistItem} style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                    <Plus size={16} /> Inserir Tarefa
                  </button>
                  <button className="btn" onClick={handleSaveChecklist} style={{ background: 'var(--accent-green)', color: '#fff', padding: '10px 24px', fontWeight: 600, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                    <Save size={16} /> Atualizar Checklist Global
                  </button>
                </div>
              </motion.section>
            )}

            {activeTab === 'fluxo' && (
              <motion.section 
                key="fluxo" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                className="card" style={{ padding: 32, borderColor: 'transparent', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Columns size={20} color="var(--accent-orange)" />
                      Fluxo & Colunas do Kanban
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                      Personalize as colunas do seu quadro Kanban. Arraste para reordenar, renomeie as etapas e escolha as cores.
                    </p>
                  </div>
                  <button className="btn btn-secondary" onClick={addStatusFlow} style={{ padding: '10px 16px', fontSize: 13, gap: 8 }}>
                    <Plus size={16} /> Nova Etapa
                  </button>
                </div>
                
                <Reorder.Group axis="y" values={statusFlowList} onReorder={setStatusFlowList} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {statusFlowList.map((step, idx) => (
                    <Reorder.Item 
                      key={step.key} 
                      value={step}
                      style={{ 
                        display: 'flex', 
                        gap: 12, 
                        alignItems: 'center', 
                        background: 'var(--bg-secondary)', 
                        padding: '12px 16px', 
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <GripVertical size={18} />
                      </div>

                      <div style={{ width: 100, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>ID Status</label>
                        <input className="form-input" value={step.key} readOnly style={{ padding: '8px 12px', opacity: 0.7, fontSize: 11, background: 'var(--bg-card)' }} />
                      </div>

                      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Nome da Coluna</label>
                        <input className="form-input" placeholder="Ex: Triagem" value={step.label} onChange={e => updateStatusFlow(idx, 'label', e.target.value)} style={{ padding: '8px 12px' }} />
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Abreviação</label>
                        <input className="form-input" placeholder="Ex: Tria." value={step.short} onChange={e => updateStatusFlow(idx, 'short', e.target.value)} style={{ padding: '8px 12px' }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Cor</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            position: 'absolute', 
                            left: 10, 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            background: step.color,
                            boxShadow: `0 0 8px ${step.color}66`,
                            pointerEvents: 'none'
                          }} />
                          <select 
                            className="form-input" 
                            value={step.color} 
                            onChange={e => updateStatusFlow(idx, 'color', e.target.value)}
                            style={{ padding: '7px 10px 7px 28px', fontSize: 13, background: 'var(--bg-card)', minWidth: 110 }}
                          >
                            <option value="var(--accent-blue)">Azul</option>
                            <option value="var(--accent-indigo)">Índigo</option>
                            <option value="var(--accent-purple)">Roxo</option>
                            <option value="var(--accent-pink)">Rosa</option>
                            <option value="var(--accent-red)">Vermelho</option>
                            <option value="var(--accent-orange)">Laranja</option>
                            <option value="var(--accent-yellow)">Amarelo</option>
                            <option value="var(--accent-green)">Verde</option>
                            <option value="var(--accent-teal)">Ciano</option>
                          </select>
                        </div>
                      </div>

                      <button className="btn btn-icon" onClick={() => removeStatusFlow(idx)} style={{ color: 'var(--accent-red)', marginTop: 18 }}>
                        <X size={18} />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                  <button className="btn" onClick={handleSaveStatusFlow} style={{ background: 'var(--accent-orange)', color: '#fff', padding: '10px 24px', fontWeight: 600, boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }}>
                    <Save size={16} /> Salvar Fluxo do Kanban
                  </button>
                </div>
              </motion.section>
            )}

            {activeTab === 'links' && (
              <motion.section 
                key="links" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                className="card" style={{ padding: 32, borderColor: 'transparent', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Link size={20} color="var(--accent-blue)" />
                      Configurar Links Úteis
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                      Adicione links para calculadoras, sites de legislação ou portais governamentais que auxiliam no processo.
                    </p>
                  </div>
                  <button className="btn btn-secondary" onClick={addLink} style={{ padding: '10px 16px', fontSize: 13, gap: 8 }}>
                    <Plus size={16} /> Novo Link
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {linksList.map((link, idx) => (
                    <div key={link.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 12 }}>
                      <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Título do Link</label>
                        <input className="form-input" placeholder="Ex: Cálculo de Rescisão" value={link.label} onChange={e => updateLink(idx, 'label', e.target.value)} style={{ padding: '8px 12px' }} />
                      </div>
                      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>URL (Link Completo)</label>
                        <input className="form-input" placeholder="https://..." value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)} style={{ padding: '8px 12px' }} />
                      </div>
                      <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Categoria</label>
                        <select className="form-input" value={link.category} onChange={e => updateLink(idx, 'category', e.target.value)} style={{ padding: '7px 10px', fontSize: 13, background: 'var(--bg-card)' }}>
                          <option value="Cálculos">Cálculos</option>
                          <option value="Legislação">Legislação</option>
                          <option value="Portais">Portais</option>
                          <option value="Consultas">Consultas</option>
                          <option value="Geral">Geral</option>
                        </select>
                      </div>
                      <button className="btn btn-icon" onClick={() => removeLink(idx)} style={{ color: 'var(--accent-red)', marginTop: 18 }}>
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                  <button className="btn" onClick={handleSaveLinks} style={{ background: 'var(--accent-blue)', color: '#fff', padding: '10px 24px', fontWeight: 600, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                    <Save size={16} /> Salvar Links
                  </button>
                </div>
              </motion.section>
            )}

            {activeTab === 'celebration' && (
              <motion.section 
                key="celebration" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div className="card" style={{ padding: 32, borderColor: 'transparent', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <PartyPopper size={24} color="var(--accent-pink)" />
                      Personalização da Celebração
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                      Escolha o estilo visual para comemorar quando um processo é marcado como pago.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18, marginBottom: 32 }}>
                    {[
                      { id: 'royal_gold', name: 'Royal Gold & Diamonds', desc: 'O ápice do luxo: ouro e diamantes cascateantes.', icon: <Trophy size={20} />, color: 'var(--accent-yellow)' },
                      { id: 'midnight_fireworks', name: 'Midnight Fireworks', desc: 'Física realista de morteiros profissionais.', icon: <Sparkles size={20} />, color: 'var(--accent-blue)' },
                      { id: 'neon_corporate', name: 'Neon Corporate High-Tech', desc: 'Inovação pura com cores elétricas rápidas.', icon: <Zap size={20} />, color: 'var(--accent-pink)' },
                      { id: 'classic_rh', name: 'Classic RH Pride', desc: 'Canhões clássicos unificados com cores da marca.', icon: <PartyPopper size={20} />, color: 'var(--accent-indigo)' },
                      { id: 'random', name: 'Surpresa Aleatória', desc: 'Alterna entre todos os estilos premium.', icon: <Settings size={20} />, color: 'var(--text-secondary)' },
                    ].map(style => (
                      <motion.div 
                        key={style.id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSaveConfettiStyle(style.id)}
                        style={{ 
                          padding: 24, 
                          borderRadius: 20, 
                          border: `2px solid ${confettiStyle === style.id ? style.color : 'var(--border)'}`,
                          background: confettiStyle === style.id ? `${style.color}08` : 'var(--bg-card)',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s ease, background 0.2s ease',
                          boxShadow: confettiStyle === style.id ? `0 10px 25px -5px ${style.color}33` : '0 4px 12px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4
                        }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${style.color}15`, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          {style.icon}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{style.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{style.desc}</div>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                    <button 
                      className="btn" 
                      onClick={handlePreviewConfetti} 
                      style={{ background: 'var(--accent-pink)', color: '#fff', padding: '12px 28px', fontWeight: 700, boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)', gap: 10 }}
                    >
                      <Zap size={18} /> Testar Efeito Agora
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === 'sistema' && (
              <motion.section 
                key="sistema" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-yellow)', flexShrink: 0 }}>
                    <Bell size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Alertas no Navegador</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                      Permitir que o sistema envie push notifications nativos via Desktop sempre que um desligamento estiver vencendo nas próximas 48 horas.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <button className="btn" onClick={handleRequestNotifications} style={{ border: '1px solid var(--border)' }}>
                        Ativar Notificações OS
                      </button>
                      {'Notification' in window && Notification.permission === 'granted' && (
                        <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)' }} /> Permissão Ativa
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)', flexShrink: 0 }}>
                    <Download size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Retenção e Backup de Dados</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                      Extraia toda a base de Arquivados e Processos Ativos do localStorage para um arquivo estruturado de segurança (JSON).
                    </p>
                    <button className="btn" onClick={handleExportData} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontWeight: 600 }}>
                      Gerar Snapshot de Segurança (.json)
                    </button>
                  </div>
                </div>

                <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'flex-start', gap: 20, borderLeft: '4px solid var(--accent-orange)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(249, 115, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-orange)', flexShrink: 0 }}>
                    <Archive size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Migração de Dados (Corte 01/03/2026)</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                      Arquiva em lote todos os processos com data de pagamento anterior a 01/03/2026 e marca o item de "Comprovante de pagamento" como concluído.
                    </p>
                    <button 
                      className="btn" 
                      onClick={handleMigrateOld} 
                      disabled={isMigrating}
                      style={{ background: 'var(--accent-orange)', color: '#fff', fontWeight: 600, opacity: isMigrating ? 0.7 : 1 }}
                    >
                      {isMigrating ? 'Migrando...' : 'Executar Arquivamento em Lote'}
                    </button>
                  </div>
                </div>

                <div className="card" style={{ padding: 24, background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#ef4444' }}>
                    <ShieldAlert size={20} />
                    Reset Fabril (Cuidado)
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                    Esta ação purgará 100% dos dados dos caches. Não afeta as configurações mestras (Empresas/Motivos), apenas limpa Kanban, Dashboard e Arquivados.
                  </p>
                  <button 
                    className="btn" 
                    style={{ background: '#ef4444', color: '#fff', fontWeight: 600 }}
                    onClick={async () => {
                      const ok = await showConfirm(
                        'Deseja apagar todas as rescisões ativas e do histórico permanentemente?',
                        { title: 'ATENÇÃO: Reset Fabril', confirmText: 'Excluir Tudo', type: 'danger' }
                      );
                      if (ok) {
                        const ok2 = await showConfirm(
                          'Tem certeza absoluta? Essa ação NÃO PODE ser desfeita.',
                          { title: 'Última Confirmação', confirmText: 'Sim, excluir', type: 'danger' }
                        );
                        if (ok2) {
                          toast('Por segurança, habilitar esta função requer liberação do administrador de ambiente AWS.', 'warning');
                        }
                      }
                    }}
                  >
                    Exterminar Lotes de Dados
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
