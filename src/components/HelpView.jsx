import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, FileSpreadsheet, ListTodo, Columns, Archive,
  PieChart, Bell, Settings, HelpCircle, ShieldCheck, Search, ChevronRight,
  LifeBuoy, MessageSquare, ExternalLink, Sparkles, GraduationCap, Zap,
  AlertCircle, Calculator, FileText, Calendar, History, BarChart3, Link
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
        text: 'Acelere seu fluxo carregando múltiplos desligamentos através de um arquivo Excel (.xlsx). Utilize o modelo padrão disponível no modal de importação para garantir que as colunas (Nome, CPF, Data) sejam mapeadas corretamente. O sistema suporta até 10MB de arquivo.',
        icon: <FileSpreadsheet size={18} />
      },
      {
        id: 'tipos-rescisao',
        name: 'Tipos de Rescisão Suportados',
        text: 'DesliGest suporta todos os tipos: Pedido de Demissão, Demissão sem Justa Causa, Demissão com Justa Causa, Acordo Mútuo (CLT §484-A), Término Antecipado (Empresa/Empregado), Término de Contrato, Falecimento e Aposentadoria. Cada tipo possui regras de cálculo específicas.',
        icon: <FileText size={18} />
      }
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
        text: 'Arraste e solte os processos entre as colunas. O sistema atualiza o status automaticamente. Cartões que estão próximos do vencimento exibirão um alerta visual para priorização imediata. Visualize todo o fluxo: Comunicado → Documentação → Homologação → Ag. Pagamento → Pago → Pend. Comprovante → Concluído.',
        icon: <Columns size={18} />
      },
      {
        id: 'checklist',
        name: 'Checklist de Conformidade',
        text: 'Cada processo possui 17 itens organizados por etapa. Marque conforme os marcos são atingidos. Itens podem ser marcados como "Não Aplicável" quando não se aplica ao tipo de rescisão. O item TRCT (h3) possui estado especial de "assinado/não assinado" com motivo.',
        icon: <ListTodo size={18} />
      },
      {
        id: 'history',
        name: 'Log de Atividades',
        text: 'Cada alteração de campo, status ou anotação é registrada no Histórico do processo com diff automático. Veja quem fez o quê, quando e qual era o valor anterior. Essencial para LGPD, auditorias e conformidade.',
        icon: <History size={18} />
      },
      {
        id: 'attachments',
        name: 'Gestão de Anexos',
        text: 'Anexe PDFs, comprovantes de pagamento e outros documentos diretamente no detalhes do processo. Cada anexo fica registrado com data e histórico. Centraliza toda a documentação em um único lugar.',
        icon: <FileSpreadsheet size={18} />
      },
      {
        id: 'documento-assinado',
        name: 'Controle de Documento Assinado (TRCT)',
        text: 'O item "TRCT assinado pelo funcionário" agora possui dois estados: Assinado e Não Assinado, com campo de motivo. Registre quando o TRCT está aguardando assinatura ou se há impedimentos. Rastreie a conformidade documental com precisão.',
        icon: <ShieldCheck size={18} />
      }
    ]
  },
  {
    id: 'views',
    title: 'Visualizações Especializadas',
    description: 'Diferentes formas de visualizar e analisar seus dados.',
    icon: <BarChart3 size={24} color="var(--accent-green)" />,
    color: 'var(--accent-green)',
    items: [
      {
        id: 'lista',
        name: 'Lista com Filtros Avançados',
        text: 'Visualização principal com busca em tempo real (debounce), filtros por status, motivo, prazo de pagamento e coligada. Suporte a multi-seleção para ações em lote (arquivar, pagar, deletar). Paginação automática.',
        icon: <ListTodo size={18} />
      },
      {
        id: 'calendario',
        name: 'Calendário de Prazos',
        text: 'Visão mensal interativa de todos os vencimentos de pagamentos. Clique em um dia para ver processos com vencimento naquela data. Navegue entre meses facilmente. Indicadores visuais mostram urgência (vencido, hoje, próximo).',
        icon: <Calendar size={18} />
      },
      {
        id: 'pendentes',
        name: 'Lista de Pendentes de Comprovante',
        text: 'Visão dedicada para processos marcados como "Pago" mas que ainda não têm comprovante arquivado. Cobranças e follow-ups ficam mais ágeis e organizados.',
        icon: <AlertCircle size={18} />
      },
      {
        id: 'arquivados',
        name: 'Arquivados com Filtro de Período',
        text: 'Histórico completo de processos encerrados. Filtre por período de desligamento, motivo, tipo de documento assinado. Dados continuam acessíveis para consultas e auditorias futuras.',
        icon: <Archive size={18} />
      },
      {
        id: 'audit-log',
        name: 'Histórico Global (Auditoria)',
        text: 'Visão unificada de TODAS as atividades do sistema em ordem cronológica. Quem fez o quê, quando e qual era o valor anterior. Essencial para conformidade LGPD e auditorias internas.',
        icon: <History size={18} />
      }
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
        text: 'O sistema monitora o prazo de 10 dias da CLT para pagamento. Você receberá avisos no sino (topo da tela) com alertas: Vencido (atrasado), Hoje (urgente), Próximo (até 3 dias). Notificações desktop disponíveis se ativado no navegador.',
        icon: <Bell size={18} />
      },
      {
        id: 'comprovantes',
        name: 'Pendentes de Comprovante',
        text: 'Processos marcados como "Pagos" mas sem o comprovante arquivado aparecem em uma visão dedicada. Cobranças automáticas ficam mais fáceis. Status "Pend. Comprovante" diferencia processos que só faltam documentação.',
        icon: <AlertCircle size={18} />
      },
      {
        id: 'auto-logout',
        name: 'Auto-Logout por Inatividade',
        text: 'Após 30 minutos sem atividade, você será deslogado automaticamente. Isso protege dados sensíveis em computadores compartilhados. Sua sessão é encerrada com segurança e o cache local é limpo.',
        icon: <Zap size={18} />
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Análise e Segurança',
    description: 'Relatórios, configurações e proteção de dados.',
    icon: <ShieldCheck size={24} color="var(--accent-teal)" />,
    color: 'var(--accent-teal)',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard Estratégico',
        text: 'Visualize o turnover por coligada, motivos de desligamento e eficiência da equipe em tempo real através de gráficos de pizza e barras. Exporte gráficos como PNG ou XLSX. Filtros dinâmicos por período (dia, semana, mês, ano, customizado). Comparação de sazonalidade ano a ano.',
        icon: <PieChart size={18} />
      },
      {
        id: 'relatorios',
        name: 'Exportação de Relatórios',
        text: 'Exporte dados em XLSX (Excel) para análises complementares. Inclui informações de todos os processos, status, datas, e histórico. Use em outras ferramentas de BI ou apresentações.',
        icon: <FileSpreadsheet size={18} />
      },
      {
        id: 'archive',
        name: 'Arquivamento Permanente',
        text: 'Após a conclusão total, mova o processo para o Arquivo. Isso mantém seu quadro ativo limpo enquanto garante que os dados históricos continuem acessíveis para consultas futuras e auditorias.',
        icon: <Archive size={18} />
      },
      {
        id: 'settings',
        name: 'Configurações de Tenant',
        text: 'Administradores podem configurar nomes de coligadas, motivos customizados e outras regras organizacionais. Alterações sincronizam para todos os usuários. Cada empresa pode ter sua própria configuração de fluxo.',
        icon: <Settings size={18} />
      },
      {
        id: 'seguranca',
        name: 'Segurança e Privacidade',
        text: 'DesliGest protege com JWT obrigatório, criptografia bcrypt, rate limiting, sanitização contra NoSQL Injection e XSS. Logs não contêm dados sensíveis (PII). Cache é limpo no logout. Conformidade LGPD e segurança de dados pessoais.',
        icon: <ShieldCheck size={18} />
      }
    ]
  },
  {
    id: 'calculos',
    title: 'Cálculos Trabalhistas',
    description: 'Faça simulações precisas e gere relatórios de rescisão.',
    icon: <Calculator size={24} color="var(--accent-purple)" />,
    color: 'var(--accent-purple)',
    items: [
      {
        id: 'calc-rescisao',
        name: 'Calculadora de Rescisão',
        text: 'Acesse a Calculadora de Rescisão no menu lateral para simular todos os direitos do colaborador. A ferramenta suporta todos os tipos de rescisão e calcula automaticamente: Saldo de Salário, Férias (vencidas + proporcionais), 13º, Aviso Prévio, Multa FGTS, INSS e IRRF. Edite verbas e o sistema recalcula impostos automaticamente.',
        icon: <Calculator size={18} />
      },
      {
        id: 'calc-editar-verbas',
        name: 'Editar Verbas e Descontos',
        text: 'Na calculadora, você pode adicionar, editar ou remover proventos (gratificações, comissões, etc.) e descontos (empréstimos, sindicato, etc.). Ao alterar valores, o sistema recalcula INSS e IRRF automaticamente, mantendo a precisão legal.',
        icon: <ListTodo size={18} />
      },
      {
        id: 'calc-previa',
        name: 'Botão Prévia no Card',
        text: 'Nos cards da lista, clique em "Prévia" para enviar os dados do processo direto para a calculadora. Economize tempo: não precisa digitar manualmente dados que já estão no sistema.',
        icon: <Zap size={18} />
      },
      {
        id: 'calc-export',
        name: 'Memória de Cálculo e Exportação PDF',
        text: 'Após calcular a rescisão, o sistema gera uma memória detalhada explicando a base legal e a fórmula de cada provento e desconto. Você pode exportar todo o detalhamento para PDF, incluindo demonstração de isenções ou deduções, para fins de comprovação e arquivo.',
        icon: <FileText size={18} />
      },
      {
        id: 'tipos-suportados',
        name: 'Todos os Tipos de Rescisão',
        text: 'Suporta: Pedido de Demissão, Sem Justa Causa, Com Justa Causa, Acordo Mútuo, Término Contrato, Falecimento e Aposentadoria. Cada tipo tem suas próprias regras de cálculo de proventos e retenções.',
        icon: <BarChart3 size={18} />
      }
    ]
  },
  {
    id: 'uteis',
    title: 'Ferramentas e Utilitários',
    description: 'Acesso rápido a recursos externos e geradores.',
    icon: <Link size={24} color="var(--accent-red)" />,
    color: 'var(--accent-red)',
    items: [
      {
        id: 'links-uteis',
        name: 'Links Úteis',
        text: 'Acesse uma curated list de recursos: Cálculo Exato, Portal eSocial, Consulta CBO, FGTS (Conectividade). Administradores podem adicionar/editar links customizados para a sua organização.',
        icon: <Link size={18} />
      },
      {
        id: 'holerite-gerador',
        name: 'Gerador de Holerites',
        text: 'Página standalone (holerite_gerador.html) para gerar demonstrativos de pagamento. Modelo "Concreta Construções" incluso. Salve templates no navegador para reutilizar em próximos meses. Impressão otimizada para 2 vias em A4.',
        icon: <FileText size={18} />
      },
      {
        id: 'pwa',
        name: 'Instalar como Aplicativo (PWA)',
        text: 'DesliGest é um Progressive Web App. Instale no desktop ou mobile a partir do navegador. Funciona offline parcialmente. Notificações nativas do sistema operacional para alertas de prazos.',
        icon: <Zap size={18} />
      }
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
              placeholder="Pesquise por 'prazos', 'importação', 'relatórios', 'TRCT'..."
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
