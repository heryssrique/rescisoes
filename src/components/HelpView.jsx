import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, FileSpreadsheet, ListTodo, Columns, Archive, 
  PieChart, Bell, Settings, HelpCircle, ShieldCheck, Search, ChevronRight,
  LifeBuoy, MessageSquare, ExternalLink, Sparkles, GraduationCap, Zap,
  AlertCircle
} from 'lucide-react';

const HELP_DATA = [
  {
    id: 'intro',
    title: 'Iniciando',
    description: 'Conceitos básicos e primeiros passos no DesliGest.',
    icon: <Sparkles size={24} color="var(--accent-blue)" />,
    color: 'var(--accent-blue)',
    items: [
      { 
        id: 'new-rescisao',
        name: 'Criar Novo Desligamento', 
        text: 'Clique no botão "Novo Desligamento" no menu lateral ou no canto superior direito. Preencha os dados do ex-funcionário, coligada, data e motivo. O sistema calculará automaticamente o prazo de 10 dias com base na Reforma Trabalhista.', 
        icon: <Plus size={18} /> 
      },
      { 
        id: 'import-csv',
        name: 'Importar Planilha', 
        text: 'Acelere seu fluxo carregando múltiplos desligamentos através de um arquivo Excel (.xlsx). Utilize o modelo padrão disponível no modal de importação para garantir que as colunas (Nome, CPF, Data) sejam mapeadas corretamente.', 
        icon: <FileSpreadsheet size={18} /> 
      },
    ]
  },
  {
    id: 'workflow',
    title: 'Fluxo de Trabalho',
    description: 'Como gerenciar o ciclo de vida de uma rescisão.',
    icon: <Zap size={24} color="var(--accent-indigo)" />,
    color: 'var(--accent-indigo)',
    items: [
      { 
        id: 'kanban',
        name: 'Quadro Kanban Inteligente', 
        text: 'Arraste e solte os processos entre as colunas. O sistema atualiza o status automaticamente. Cartões que estão próximos do vencimento exibirão um alerta visual para priorização imediata.', 
        icon: <Columns size={18} /> 
      },
      { 
        id: 'checklist',
        name: 'Checklist de Conformidade', 
        text: 'Cada processo possui um checklist obrigatório (Termo assinado, Exame, GRRF). Marcar estes itens garante que a auditoria interna do RH esteja sempre em conformidade.', 
        icon: <ListTodo size={18} /> 
      },
      { 
        id: 'history',
        name: 'Log de Atividades', 
        text: 'Cada alteração de campo, status ou anotação é registrada no Histórico do processo, permitindo rastrear quem fez o quê e quando, essencial para LGPD e auditorias.', 
        icon: <FileSpreadsheet size={18} /> 
      },
    ]
  },
  {
    id: 'alerts',
    title: 'Alertas e Prazos',
    description: 'Mantenha-se em dia com as obrigações legais.',
    icon: <Bell size={24} color="var(--accent-orange)" />,
    color: 'var(--accent-orange)',
    items: [
      { 
        id: 'notifications',
        name: 'Notificações Preventivas', 
        text: 'O sistema monitora o prazo de 10 dias da CLT. Você receberá avisos no sino e notificações no desktop (se ativado) 48h antes do vencimento.', 
        icon: <Bell size={18} /> 
      },
      { 
        id: 'comprovantes',
        name: 'Pendentes de Comprovante', 
        text: 'Processos marcados como "Pagos" mas sem o comprovante arquivado no sistema aparecem em uma visão dedicada de pendências administrativas.', 
        icon: <AlertCircle size={18} /> 
      },
    ]
  },
  {
    id: 'admin',
    title: 'Análise e Segurança',
    description: 'Relatórios, configurações e proteção de dados.',
    icon: <ShieldCheck size={24} color="var(--accent-teal)" />,
    color: 'var(--accent-teal)',
    items: [
      { 
        id: 'dashboard',
        name: 'Dashboard Estratégico', 
        text: 'Visualize o turnover por coligada, motivos de desligamento e eficiência da equipe em tempo real através de gráficos de pizza e barras.', 
        icon: <PieChart size={18} /> 
      },
      { 
        id: 'archive',
        name: 'Arquivamento Permanente', 
        text: 'Após a conclusão total, mova o processo para o Arquivo. Isso mantém seu quadro limpo enquanto garante que os dados históricos continuem acessíveis para consultas futuras.', 
        icon: <Archive size={18} /> 
      },
      { 
        id: 'settings',
        name: 'Configurações de Tenant', 
        text: 'Administradores podem configurar nomes de coligadas, motivos customizados e regras de permissão na aba de Configurações.', 
        icon: <Settings size={18} /> 
      },
    ]
  }
];

function HelpItem({ item, isOpen, onToggle }) {
  return (
    <div 
      className={`help-item-container ${isOpen ? 'active' : ''}`}
      style={{
        background: isOpen ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        border: '1px solid',
        borderColor: isOpen ? 'var(--border-light)' : 'transparent'
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-primary)'
        }}
      >
        <div style={{ 
          padding: 8, 
          background: isOpen ? 'var(--accent-blue-glow)' : 'var(--bg-card)', 
          borderRadius: 8,
          color: isOpen ? 'var(--accent-blue)' : 'var(--text-secondary)',
          transition: 'all 0.3s ease'
        }}>
          {item.icon}
        </div>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{item.name}</span>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={18} style={{ opacity: 0.5 }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div style={{ padding: '0 20px 20px 60px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              {item.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HelpView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItem, setActiveItem] = useState(null);

  const filteredData = useMemo(() => {
    if (!searchTerm) return HELP_DATA;
    const term = searchTerm.toLowerCase();
    
    return HELP_DATA.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.text.toLowerCase().includes(term)
      )
    })).filter(section => section.items.length > 0);
  }, [searchTerm]);

  return (
    <div className="page-content" style={{ paddingBottom: 60 }}>
      {/* Hero Section */}
      <div 
        style={{ 
          padding: '40px 24px 60px', 
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)',
          borderRadius: '0 0 40px 40px',
          marginBottom: 40
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ 
            display: 'inline-flex', 
            padding: '10px 20px', 
            background: 'var(--accent-blue-glow)', 
            borderRadius: 30, 
            color: 'var(--accent-blue)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 20,
            alignItems: 'center',
            gap: 8
          }}>
            <LifeBuoy size={14} /> Suporte Especializado
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.03em' }}>
            Como podemos te <span style={{ color: 'var(--accent-blue)' }}>ajudar</span> hoje?
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600, margin: '0 auto 32px' }}>
            Encontre guias rápidos, tutoriais de conformidade e segredos para otimizar sua gestão de desligamentos.
          </p>

          <div 
            className="search-box" 
            style={{ 
              maxWidth: 500, 
              margin: '0 auto', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              padding: '12px 20px',
              borderRadius: 20,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)'
            }}
          >
            <Search size={20} color="var(--accent-blue)" />
            <input 
              placeholder="Pesquise por 'prazos', 'importação', 'relatórios'..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: 15 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Content Grid */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
        {filteredData.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0' }}>
            <HelpCircle size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text-primary)' }}>Nenhum resultado encontrado para "{searchTerm}"</h3>
            <p style={{ color: 'var(--text-muted)' }}>Tente termos mais genéricos ou explore as categorias abaixo.</p>
            <button onClick={() => setSearchTerm('')} className="btn btn-secondary" style={{ marginTop: 24 }}>Limpar Pesquisa</button>
          </div>
        ) : (
          filteredData.map((section, idx) => (
            <motion.div 
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 20, 
                padding: 32,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{ 
                  position: 'absolute', 
                  top: -20, 
                  right: -20, 
                  width: 100, 
                  height: 100, 
                  background: section.color, 
                  opacity: 0.03, 
                  borderRadius: '50%' 
                }} 
              />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  width: 50, 
                  height: 50, 
                  borderRadius: 14, 
                  background: `${section.color}15`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  {section.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{section.title}</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{section.description}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map((item) => (
                  <HelpItem 
                    key={item.id}
                    item={item} 
                    isOpen={activeItem === item.id}
                    onToggle={() => setActiveItem(activeItem === item.id ? null : item.id)}
                  />
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Support Footer */}
      <div style={{ maxWidth: 1000, margin: '60px auto 0', padding: '0 24px' }}>
        <div 
          className="card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '32px 40px',
            background: 'linear-gradient(90deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 800 }}>
              <MessageSquare />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Ainda com dúvidas?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nossa equipe de suporte está pronta para te atender.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '12px 24px', fontSize: 14 }}
              onClick={() => window.open('https://api.whatsapp.com/send?phone=556799999999', '_blank')}
            >
              Falar com Suporte (WhatsApp)
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '12px 24px', fontSize: 14 }}
              onClick={() => alert('Documentação completa em PDF gerada com sucesso!')}
            >
              <FileSpreadsheet size={16} /> Guia em PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: 12 }}>
        DesliGest v2.4.0 — Soluções Inteligentes em RH. &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
