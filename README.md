# 🚀 Sistema de Gestão de Rescisões (DesliGest)

O **DesliGest** é uma plataforma corporativa premium para o acompanhamento e gestão de desligamentos, projetada para departamentos de Recursos Humanos que buscam **máxima eficiência**, **controle rigoroso de prazos** e **rastreabilidade total**.

![Version](https://img.shields.io/badge/version-2.4.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Node](https://img.shields.io/badge/Node-22-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?logo=mongodb)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?logo=progressive-web-apps)

---

## ✨ Funcionalidades de Elite

### 📊 Dashboard Executivo
*   Gráficos interativos de pizza e barras com **exportação para PNG/XLSX**.
*   Filtros dinâmicos por período (dia, semana, mês, ano, customizado).
*   Comparação de sazonalidade ano a ano.
*   Visão de turnover por coligada e motivos de desligamento.

### 📅 Calendário de Prazos
*   Visão mensal interativa de todos os vencimentos de pagamentos.
*   Navegação intuitiva com acesso direto aos detalhes do processo.
*   Indicadores visuais de urgência (vencido, hoje, próximo).

### 🛡️ Histórico e Auditoria Global
*   **Monitoramento em Tempo Real**: Todas as atividades do sistema em um único lugar.
*   **Rastreabilidade Total**: Sistema compara e registra automaticamente quem alterou cada campo (diff automático).
*   **Conformidade LGPD**: Cada alteração é registrada com usuário, data e valor anterior/novo.

### 📎 Gestão de Documentos e Anexos
*   Anexe PDFs, comprovantes e fotos diretamente no card de cada colaborador.
*   **Controle de Documentos Assinados**: Item TRCT (h3) agora possui estado signed/unsigned com motivo.
*   Histórico de anexos integrado para controle documental simplificado.

### 📋 Fluxo de Trabalho Otimizado
*   **Quadro Kanban**: Visualize o gargalo operacional por etapas.
*   **Checklist Dinâmico**: 17 etapas automáticas organizadas por fase (Comunicado, Documentação, Homologação, Pagamento, Conclusão).
*   Itens podem ser marcados como "Não Aplicável".
*   **Lista de Pendentes**: Visão dedicada para processos "Pagos" sem comprovante.
*   **Arquivados com Filtro**: Histórico completo com filtro por período e motivo.

### ⚡ Performance e Estabilidade
*   **Controle de Concorrência**: Optimistic Locking com verificação de versão (HTTP 409).
*   **Busca com Debounce**: Interface ultra-responsiva.
*   **Auto-Logout**: Deslogamento automático após 30 minutos de inatividade.
*   **Modo Performance**: Alternar animações para melhor desempenho.
*   **Cache Protegido**: Dados sensíveis são removidos do localStorage no logout.

### 🧮 Calculadora de Rescisões
*   **Simulação Completa**: Suporte a todos os tipos (Sem/CJ, Justa Causa, Pedido, Acordo Mútuo, Término Contrato, Falecimento, Aposentadoria).
*   **Módulos de Cálculo**:
  *   Saldo de Salário
  *   Aviso Prévio (indenizado/trabalhado)
  *   Férias (vencidas + proporcionais)
  *   13º Salário (proporcional)
  *   Multa FGTS (40% + depósito)
  *   INSS e IRRF (com deductions)
*   **Verbas Customizáveis**: Adicione/edit/remova proventos e descontos.
*   **Recálculo Automático**: Impostos são recalculados ao alterar verbas.
*   **Memória de Cálculo**: Explicação detalhada com base legal.
*   **Exportação PDF**: Relatório completo para arquivo.
*   **Botão "Prévia"**: Envia dados do processo para a calculadora com um clique.

### 💳 Gerador de Holerites (Standalone)
*   Página 독립na para geração de demonstrativos de pagamento.
*   Modelo "Concreta Construções" incluso.
*   Salvar/carregar modelos no navegador.
*   Impressão otimizada para 2 vias em uma página A4.

### 🔐 Segurança Empresarial
*   **JWT Obrigatório**: Token obrigatório sem fallbacks.
*   **RBAC Completo**: Papéis Admin e RH com permissões granulares.
*   **Sanitização**: Proteção contra NoSQL Injection, XSS e ReDoS.
*   **Rate Limiting**: Proteção contra ataques de força bruta.
*   **Helmet**: Headers de segurança HTTP.
*   **Logs Protegidos**: Query strings com PII não são logadas.

### 🌐 Progressive Web App
*   Instale como aplicativo nativo no desktop ou mobile.
*   Service Worker com estratégia Stale-While-Revalidate.
*   Notificações nativas do browser para alertas de prazo.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, Framer Motion, Lucide React, Recharts, date-fns, XLSX, jsPDF |
| **Backend** | Node.js 22, Express 5, Mongoose 9, JWT, Zod, bcrypt |
| **Database** | MongoDB (Mongoose ODM) |
| **Email** | Nodemailer (SMTP configurável) |
| **Scheduler** | node-cron (resumos diários) |
| **Logging** | Winston (logs de erro e acesso) |
| **Deploy** | Vercel (frontend), Render (backend) |

---

## 📂 Arquitetura do Sistema

```
├── server/                    # API Backend
│   ├── index.js              # Entry point, middleware, routes
│   ├── models/               # Mongoose schemas (User, Desligamento, Link)
│   ├── routes/               # API routes (auth, desligamentos, links)
│   ├── middleware/           # Auth, validation, error handling
│   ├── schemas/              # Zod validation schemas
│   ├── services/             # Cron, email
│   ├── scripts/              # CLI migration tools
│   └── utils/                # Logger
├── src/                      # Frontend React
│   ├── components/           # 20+ React components (views)
│   ├── context/              # AppContext (state + actions)
│   ├── data/                 # Constants, checklist template
│   ├── services/             # API client
│   └── utils/calculators/    # Rescisão calculation engine
├── public/                   # PWA assets
├── holerite_gerador.html     # Gerador standalone de holerites
└── package.json              # Root scripts (dev combined)
```

---

## 🚀 Guia de Início Rápido

### Pré-requisitos
*   **Node.js** (v18 ou superior)
*   **MongoDB** (Local ou Atlas)

### Configuração Inicial

1. **Backend**:
```bash
cd server
npm install
cp .env.example .env
# Configure: MONGODB_URI, JWT_SECRET, ADMIN_EMAIL
```

2. **Frontend**:
```bash
npm install
```

3. **Execução Combinada**:
```bash
npm run dev
```
*   **Frontend**: `http://localhost:5173`
*   **Backend API**: `http://localhost:3001`

---

## 🔐 Variáveis de Ambiente

### Backend (`server/.env`)
| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (padrão: 3001) |
| `NODE_ENV` | ambiente (production/development) |
| `MONGODB_URI` | String de conexão MongoDB |
| `JWT_SECRET` | **Obrigatório** - chave de assinatura JWT |
| `FRONTEND_ORIGIN` | URL do frontend para CORS |
| `ADMIN_EMAIL` | Email do admin inicial |
| `MAIL_HOST/PORT/USER/PASS` | Configuração SMTP |

### Frontend (`.env.production`)
| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL da API em produção |

---

## 📋 Tipos de Rescisão Suportados

1.  **Pedido de Demissão** - Iniciativa do empregado
2.  **Demissão sem Justa Causa** - Desligamento pelo empregador
3.  **Demissão com Justa Causa** - Dispensa disciplinar
4.  **Acordo Mútuo** - CLT Art. 484-A (§6)
5.  **Término Antecipado — Empresa** - Contrato prazo determinado
6.  **Término Antecipado — Empregado**
7.  **Término de Contrato** - Fim de prazo determinado
8.  **Falecimento** - Morte do empregado
9.  **Aposentadoria** - Aposentadoria do empregado

---

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia frontend + backend
npm run dev:client   # Apenas frontend (Vite)
npm run dev:server   # Apenas backend (nodemon)
npm run build        # Build de produção
npm run seed         # Popula dados iniciais no banco

# Server
cd server && npm run dev    # Desenvolvimento
cd server && npm run start  # Produção
cd server && npm run seed   # Seed de dados
```

---

## 🏢 Sobre o Projeto

**DesliGest (v2.4.0)** - Soluções Inteligentes em RH

Este documento detalha o funcionamento interno, arquitetura e decisões técnicas do sistema. Para informações sobre correções de segurança aplicadas, consulte [SECURITY_FIXES.md](SECURITY_FIXES.md).

---

## 👤 Autor

**Henrique Silva** - [GitHub](https://github.com/heryssrique)

---

> [!TIP]
> **Dica Executiva**: Utilize a visão de **Calendário** para planejar datas de pico no início do mês, a **Lista de Pendentes** para cobranças de comprovantes, e o **Histórico Global** para auditorias rápidas de conformidade.