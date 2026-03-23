import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Plus, FileSpreadsheet, ListTodo, Columns, Archive, 
  PieChart, Bell, Settings, HelpCircle, ShieldCheck
} from 'lucide-react';

export function HelpView() {
  const sections = [
    {
      title: 'Iniciando',
      icon: <BookOpen size={20} color="var(--accent-blue)" />,
      items: [
        { name: 'Criar Novo Desligamento', text: 'Clique no botão "Novo Desligamento" no menu lateral ou no canto superior direito. Preencha os dados do ex-funcionário, coligada, data e motivo. O sistema calculará automaticamente o prazo com base no aviso prévio.', icon: <Plus size={16} /> },
        { name: 'Importar Planilha', text: 'Permite carregar múltiplos desligamentos através de um arquivo Excel (.xlsx). A planilha deve seguir o modelo padrão com colunas de Nome, Cargo, CTPS, Coligada, etc.', icon: <FileSpreadsheet size={16} /> },
      ]
    },
    {
      title: 'Visualização e Gerenciamento',
      icon: <Columns size={20} color="var(--accent-indigo)" />,
      items: [
        { name: 'Modo Lista', text: 'Exibe os processos em uma tabela interativa ou lista de cartões (em telas menores). Ideal para organizar por data de vencimento.', icon: <ListTodo size={16} /> },
        { name: 'Quadro Kanban', text: 'Arraste e solte os processos entre as colunas "Nova Rescisão", "Em Processamento", "Aguardando Assinatura" e "Pago" para gerenciar visualmente cada etapa.', icon: <Columns size={16} /> },
        { name: 'Detalhes do Processo', text: 'Clique sobre qualquer registro para abrir a visão completa. Lá você pode editar dados, preencher o checklist do processo (como depósito e comprovação arquivada) e registrar um histórico cronológico de atividades.', icon: <HelpCircle size={16} /> },
      ]
    },
    {
      title: 'Controle Financeiro e Notificações',
      icon: <Bell size={20} color="var(--toast-warning)" />,
      items: [
        { name: 'Central de Notificações', text: 'O sino no topo avisa sobre processos que vencem hoje, nos próximos 3 dias, ou os que já estão atrasados, garantindo que nenhum pagamento passe do prazo da Reforma Trabalhista (10 dias a contar do término do contrato).', icon: <Bell size={16} /> },
        { name: 'Pendentes de Comprovante', text: 'Existe uma aba especial para processos que já foram "Pagos" ou tiveram a etapa de Depósito marcada, mas que ainda não tiveram seus comprovantes arquivados definitivamente no Drive/Pasta do RH.', icon: <AlertTriangle size={16} /> },
      ]
    },
    {
      title: 'Administração Avançada',
      icon: <Settings size={20} color="var(--accent-teal)" />,
      items: [
        { name: 'Estatísticas Globais', text: 'Acesse o dashboard gerencial para ver gráficos em tempo real da distribuição por empresa coligada e os motivos de saída mais comuns (Pedidos de Demissão vs Dispensa sem Justa Causa).', icon: <PieChart size={16} /> },
        { name: 'Processos Arquivados', text: 'Limpe o painel principal! Após um processo receber o pagamento e o comprovante, você pode "Arquivá-lo". Ele desaparecerá do fluxo e constará eternamente nesta aba como documentação finalizada.', icon: <Archive size={16} /> },
        { name: 'Preferências Gerais', text: 'Lá você regula os nomes das empresas de seu conglomerado. Estes nomes aparecerão nos formulários.', icon: <Settings size={16} /> },
        { name: 'Segurança (Acesso Autenticado)', text: 'Os dados agora estão protegidos por um sistema individual de banco de dados e contas autenticadas. Cada conta só acessa mediante login.', icon: <ShieldCheck size={16} /> },
      ]
    }
  ];

  return (
    <div className="help-view fade-in" style={{ padding: '24px', maxWidth: 900, margin: '0 auto', width: '100%', height: '100%', overflowY: 'auto' }}>
      <header style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Central de Ajuda DesliGest</h1>
        <p style={{ color: 'var(--text-muted)' }}>Mapeamento oficial de funcionalidades e guia de uso corporativo do sistema.</p>
      </header>

      <div style={{ display: 'grid', gap: 24 }}>
        {sections.map((sec, i) => (
          <motion.section 
            key={i} 
            className="card" 
            style={{ padding: 24, borderLeft: '4px solid', borderLeftColor: sec.icon.props.color || 'var(--accent-blue)' }}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          >
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, marginBottom: 20, color: 'var(--text-main)' }}>
              {sec.icon}
              {sec.title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sec.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: 'var(--bg-main)', padding: '16px', borderRadius: 8 }}>
                  <div style={{ padding: 8, background: 'var(--bg-card)', borderRadius: 8, color: 'var(--text-muted)' }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>{item.name}</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 24, color: 'var(--text-muted)', fontSize: 13 }}>
        DesliGest &copy; {new Date().getFullYear()} - O Seu Portal de Gestão de RH.
      </div>
    </div>
  );
}

// Emulador do AlertTriangle
function AlertTriangle(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  );
}
