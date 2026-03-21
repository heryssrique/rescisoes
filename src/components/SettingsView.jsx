import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Database, Download, FileSpreadsheet, AlertTriangle, ShieldAlert, Users, Plus, X, Save, FileText, ListChecks, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { DEFAULT_COLIGADAS, DEFAULT_MOTIVOS, DEFAULT_CHECKLIST_TEMPLATE } from '../data/initialData';

export function SettingsView() {
  const { state, actions } = useApp();
  const { desligamentos, archivedDesligamentos } = state;

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

  const handleSaveMotivos = () => {
    const valid = motivosList.filter(m => m.value.trim() && m.label.trim());
    localStorage.setItem('desligest_motivos', JSON.stringify(valid));
    alert('Padrões de motivos salvos e atualizados no sistema!');
    window.location.reload();
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
    localStorage.setItem('desligest_checklist', JSON.stringify(valid));
    alert('Checklist padrão salvo e atualizado nas novas rescisões!');
    window.location.reload();
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

  const [activeTab, setActiveTab] = useState('empresas');

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
            onClick={() => setActiveTab('empresas')}
          >
            <Users size={16} /> Padrões de Empresas
          </button>
          <button 
            className={`btn ${activeTab === 'motivos' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'motivos' ? 'var(--accent-indigo)' : 'transparent', color: activeTab === 'motivos' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => setActiveTab('motivos')}
          >
            <FileText size={16} /> Motivos de Desligamento
          </button>
          <button 
            className={`btn ${activeTab === 'checklist' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'checklist' ? 'var(--accent-green)' : 'transparent', color: activeTab === 'checklist' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => setActiveTab('checklist')}
          >
            <ListChecks size={16} /> Checklist Automático
          </button>
          <button 
            className={`btn ${activeTab === 'sistema' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'sistema' ? 'var(--accent-purple)' : 'transparent', color: activeTab === 'sistema' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}
            onClick={() => setActiveTab('sistema')}
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
                        <select className="form-input" value={motivo.class} onChange={e => updateMotivo(idx, 'class', e.target.value)} style={{ padding: '8px 12px', background: '#fff' }}>
                          <option value="motivo-pedido">Azul (Padrão/Pedido)</option>
                          <option value="motivo-demissao">Laranja (Demissão/Alerta)</option>
                          <option value="motivo-acordo">Amarelo (Acordo Mútuo)</option>
                          <option value="motivo-justa">Vermelho (Justa Causa/Crítico)</option>
                          <option value="motivo-aposentadoria">Verde (Aposentadoria)</option>
                          <option value="motivo-termino">Roxo (Término Contrato)</option>
                        </select>
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
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {checklistList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <div style={{ flex: 2 }}>
                        <input className="form-input" placeholder="Descreva a tarefa..." value={item.label} onChange={e => updateChecklist(idx, 'label', e.target.value)} style={{ padding: '10px 14px', fontSize: 14, background: 'var(--bg-secondary)', border: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Pertence à fase:</span>
                        <select className="form-input" value={item.etapa} onChange={e => updateChecklist(idx, 'etapa', e.target.value)} style={{ padding: '8px 12px', fontSize: 13, background: 'var(--bg-card)' }}>
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
                    </div>
                  ))}
                </div>
                
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
                    onClick={() => {
                      if (confirm('ATENÇÃO: Deseja apagar todas as rescisões ativas e do histórico permanentemente?')) {
                        if (confirm('Tem certeza absoluta? Essa ação NÃO PODE ser defeita.')) {
                          alert('Por segurança, habilitar esta função requer liberação do administrador de ambiente AWS.');
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
