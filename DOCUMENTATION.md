# 📚 Documentação Técnica (DesliGest)

Este documento detalha o funcionamento interno, arquitetura e decisões técnicas tomadas no desenvolvimento do **DesliGest (v2.4.0)**.

---

## 🏗️ Arquitetura de Software

O sistema segue o padrão **MERN (MongoDB, Express, React, Node)** com comunicação REST API.

---

### Front-end (React 19)

#### 1. Gerenciamento de Estado (AppContext)

*   **Provider**: O `AppProvider` (`src/context/AppContext.jsx`) centraliza o estado global.
*   **Reducer**: Utiliza `useReducer` para lidar com transições de estado complexas.
*   **Memoização**: O `value` do Context é envolvido em `useMemo`, garantindo que consumidores não re-renderizem a menos que o estado mude significativamente.
*   **Auto-Logout**: Timer de 30 minutos de inatividade com limpeza de cache protegido (`desligest_cache_v2`).

#### 2. Roteamento de Visualização

O sistema não utiliza bibliotecas externas, mas sim um sistema de `state.view` controlado por dispatch:

| `state.view` | Componente | Propósito |
|--------------|------------|-----------|
| `dashboard` | `Dashboard` | KPIs, gráficos, exportações |
| `lista` | `ListView` | Lista principal com filtros avançados |
| `kanban` | `KanbanView` | Quadro visual por status |
| `calendar` | `CalendarView` | Calendário de vencimentos |
| `pendentes` | `ListView` (filtrado) | Processos sem comprovante |
| `arquivados` | `ArchivedView` | Histórico com filtros |
| `relatorios` | `ReportsView` | Exportação XLSX |
| `audit` | `AuditLogView` | Histórico global |
| `links` | `LinksView` | Links úteis |
| `calculadora` | `CalculatorView` | Simulação de rescisão |
| `configuracoes` | `SettingsView` | Configurações |
| `ajuda` | `HelpView` | Central de ajuda |
| `detalhe` | `DetailView` | Detalhes do processo |

#### 3. Componentes Principais

*   **ListView**: Busca com debounce, filtros avançados (status, motivo, prazo), seleção múltipla para ações em lote.
*   **CalendarView**: Grade mensal via `date-fns`, eventos de pagamento com `useMemo`.
*   **DetailView**: Abas (Checklist, Histórico, Anexos), toggle de documentos assinados (TRCT).
*   **CalculatorView**: Motor completo de cálculo com edição de verbas, exportação PDF.
*   **NotificationCenter**: Alertas de prazo com priorização visual.

---

### Back-end (Node.js/Express 5)

#### 1. Modelos de Dados (Mongoose)

**Desligamento** (`server/models/Desligamento.js`):

```javascript
{
  nome: String,              // Nome do ex-funcionário
  coligada: String,          // Código da empresa (1, 4, 11...)
  cargo: String,
  departamento: String,
  matricula: String,
  dataAdmissao: Date,
  dataComunicado: Date,
  dataDesligamento: Date,
  dataPagamento: Date,
  dataProgramadaPagamento: Date,  // Nova: data programada
  prazoPagamento: Number,
  motivo: {                    // Enum:
    type: String,              // 'pedido', 'demissao', 'acordo',
    enum: [...]                // 'justa', 'falecimento', 'aposentadoria',
  },                           // 'termino_empresa', 'termino_empregado', 'termino_contrato'
  avisoPrevio: String,         // 'trabalhado', 'indenizado', 'dispensado', 'nao_aplicavel'
  status: String,              // 'comunicado', 'documentacao', 'homologacao',
                               // 'aguardando', 'pago', 'pendente_comprovante', 'concluido'
  responsavel: String,
  observacoes: String,
  motivoCancelamento: String,  // Motivo do cancelamento
  arquivado: Boolean,
  checklist: [{
    id: String,                // 'c1', 'd1', 'h1', 'p1', 'f1'...
    label: String,
    etapa: String,             // 'comunicado', 'documentacao', etc.
    done: Boolean,
    doneAt: Date,
    notApplicable: Boolean,
    documento: {                // Apenas para item h3 (TRCT)
      signed: Boolean,
      motivo: String
    }
  }],
  historico: [{
    data: Date,
    acao: String,
    nota: String
  }],
  anexos: [{
    nome: String,
    url: String,
    tipo: String,
    dataUpload: Date
  }],
  // timestamps: true
}
```

**User** (`server/models/User.js`):

```javascript
{
  name: String,
  email: { type: String, unique: true },
  password: String,  // bcrypt hash
  role: { type: String, enum: ['admin', 'hr'] }
}
```

**Link** (`server/models/Link.js`):

```javascript
{
  label: String,
  url: String,
  category: { type: String, enum: ['Cálculos', 'Legislação', 'Portais', 'Consultas', 'Geral'] },
  description: String,
  order: Number
}
```

#### 2. Middleware de Auditoria

O sistema injeta automaticamente no `historico` o diferencial (diff) entre o estado anterior e o novo em operações `PUT /api/desligamentos/:id`. Cada entrada contém:

*   Campo alterado
*   Valor anterior
*   Novo valor
*   Usuário responsável
*   Data/hora

#### 3. Segurança

*   **JWT**: Obrigatório (`JWT_SECRET`), algoritmo HS256, expiração 7 dias.
*   **Rate Limiting**: 500 requisições por 15 minutos por IP.
*   **Helmet**: Headers HTTP de segurança.
*   **HPP**: Proteção contra poluição de parâmetros HTTP.
*   **mongo-sanitize**: Remove caracteres perigosos de queries.
*   **xss-clean**: Sanitização de inputs.
*   **ReDoS Protection**: Escape de regex em buscas.

---

## 📋 API REST Completa

### Autenticação (`/api/auth`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/register` | ❌ | Registra novo usuário (primeiro = admin) |
| POST | `/login` | ❌ | Autentica e retorna JWT |
| GET | `/me` | ✅ | Perfil do usuário logado |
| GET | `/users` | 🔒 Admin | Lista todos os usuários |
| PATCH | `/users/:id/role` | 🔒 Admin | Atualiza papel do usuário |

### Desligamentos (`/api/desligamentos`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/` | ✅ | Lista com paginação, filtros (status, motivo, q), sort |
| GET | `/:id` | ✅ | Detalhes de um processo |
| POST | `/` | ✅ | Cria novo processo |
| PUT | `/:id` | ✅ | Atualiza (com optimistic locking via `version`) |
| DELETE | `/:id` | 🔒 Admin | Remove processo |
| PATCH | `/:id/checklist/:itemId` | ✅ | Toggle item do checklist |
| PATCH | `/:id/checklist/:itemId/nao-aplicavel` | ✅ | Toggle "não aplicável" |
| PATCH | `/:id/checklist/:itemId/documento` | ✅ | Atualiza estado do documento (TRCT) |
| PATCH | `/:id/historico` | ✅ | Adiciona entrada ao histórico |
| POST | `/bulk-archive` | ✅ | Arquivamento em lote |
| POST | `/bulk-status` | ✅ | Mudança de status em lote |
| POST | `/bulk-delete` | 🔒 Admin | Exclusão em lote |
| POST | `/bulk` | ✅ | Importação em lote |
| POST | `/seed` | 🛠️ Dev | Popula dados de teste |
| GET | `/migrate-diagnostics` | ✅ | Diagnóstico de migração |
| POST | `/migrate-archive-old` | ✅ | Arquiva processos antigos |
| POST | `/mark-all-archived-trct-signed` | ✅ | Marca TRCT assinado em arquivados |

### Links (`/api/links`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/` | ✅ | Lista links úteis |
| POST | `/` | ✅ | Cria link |
| PUT | `/:id` | ✅ | Atualiza link |
| DELETE | `/:id` | ✅ | Remove link |
| POST | `/seed` | ✅ | Popula links padrão |

---

## 📅 Checklist Template

O template contém **17 itens** organizados por etapa:

### Comunicado
- `c1` - Comunicado de desligamento assinado
- `c2` - Aviso prévio calculado e registrado
- `c3` - Notificação ao eSocial enviada

### Documentação
- `d1` - Carta de demissão / termo de acordo
- `d2` - Exame demissional agendado
- `d3` - Exame demissional realizado
- `d6` - Horas extras e banco de horas levantados

### Homologação
- `h1` - Termo de rescisão gerado no sistema
- `h2` - Cálculo da rescisão conferido
- `h3` - **TRCT assinado pelo funcionário** *(suporta estado signed/unsigned + motivo)*
- `h4` - Guia FGTS (GRRF) emitida
- `h5` - FGTS rescisório recolhido

### Aguardando
- `p1` - Depósito da rescisão realizado

### Pago
- `p2` - Comprovante de pagamento arquivado
- `p3` - Processo encerrado no sistema

### Concluído
- `f1` - Documentação arquivada fisicamente
- `f2` - Processo finalizado e encerrado

---

## 🧮 Motor de Cálculos (`src/utils/calculators/`)

### Módulos

| Arquivo | Função | Descrição |
|---------|--------|-----------|
| `saldoSalario.js` | `calcularSaldoSalario()` | Dias trabalhados no mês |
| `avisoPrevio.js` | `calcularAvisoPrevio()` | Aviso indenizado ou trabalhado |
| `ferias.js` | `calcularFeriasVencidas()` | Férias vencidas + 1/3 |
| `ferias.js` | `calcularFeriasProporcionais()` | Férias proporcionais |
| `decimoTerceiro.js` | `calcularDecimoTerceiro()` | 13º proporcional |
| `fgts.js` | `calcularMultaFGTS()` | Multa 40% + depósito |
| `fgts.js` | `estimarSaldoFGTS()` | Estimativa de saldo FGTS |
| `inss.js` | `calcularINSS()` | Desconto INSS |
| `irrf.js` | `calcularIRRF()` | Imposto de renda |
| `irrf.js` | `calcularIRRF13()` | IRRF sobre 13º |
| `gerarLog.js` | `gerarLog()` | Gera texto explicativo |
| `pdfExport.js` | `exportarPDF()` | Exporta para PDF |
| `rescisaoEngine.js` | `calcularRescisao()` | Orquestra todos os módulos |

### Tipos de Rescisão Suportados

```javascript
const TIPOS = [
  'SEM_JUSTA_CAUSA',      // Índice 0
  'COM_JUSTA_CAUSA',      // Índice 1
  'PEDIDO_DEMISSAO',      // Índice 2
  'ACORDO_MUTUO',         // Índice 3
  'DETERMINADO'           // Índice 4
];
```

---

## ⚡ Notificações

O motor de notificações (`AppContext.generateNotifications`) monitora:

### 1. Prazos de Pagamento
Baseado em `dataPagamento`:
*   **Vencido**: `dias < 0`
*   **Hoje**: `dias === 0`
*   **Próximo**: `dias <= 3`

Ignora processos: PAGO, CANCELADO, ou com item `p1` (Depósito) concluído.

### 2. Prazo de 7 Dias (TRCT)
Alerta se item `h3` não assinado após 7 dias de `dataDesligamento`.

### 3. Fim de Mês (Cálculo)
Alerta se mês de `dataDesligamento` passou sem item `h2` (Cálculo conferido).

---

## 🔧 Scripts de Manutenção

| Script | Local | Descrição |
|--------|-------|-----------|
| `seed/run.js` | server | Popula dados iniciais |
| `promoteAdmin.js` | server/scripts | Promove usuários a admin |
| `migrate-trct-signed.cjs` | server/scripts | Marca TRCT assinado em arquivados |
| `quick-migrate.cjs` | server/scripts | Migração rápida (DB URI hardcoded) |
| `recuperarDados.js` | server/scripts | Recupera dados hardcoded |

---

## 📦 Funcionalidades Adicionais

### Exportação de Gráficos
*   **PNG**: Via `html2canvas` + download automático
*   **XLSX**: Via `xlsx` library com formatação

### Gerador de Holerites
Arquivo standalone `holerite_gerador.html` com:
*   Formulário completo de proventos/descontos
*   Impressão otimizada (2 vias em A4)
*   Salvamento de modelos no navegador
*   Logotipo customizável

### PWA (Progressive Web App)
*   Service Worker: `public/sw.js`
*   Manifest: `public/manifest.json`
*   Estratégia: Stale-While-Revalidate para assets

---

## 🛠️ Manutenibilidade e Escalabilidade

O projeto foi desenhado sob o princípio de **Baixo Acoplamento**:

*   **Checklist extensível**: Adicione itens em `src/data/initialData.js` sem tocar na lógica.
*   **Backend agnóstico**: Permite futuras versões mobile.
*   **Validação centralizada**: Schemas Zod em `server/schemas/`.
*   **Logs estruturados**: Winston com arquivos separados (error.log, combined.log).

---

## 📊 Dependências Principais

### Frontend
```json
{
  "react": "^19.2.0",
  "framer-motion": "^12.38.0",
  "recharts": "^3.8.0",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.577.0",
  "xlsx": "^0.18.5",
  "jspdf": "^4.2.1"
}
```

### Backend
```json
{
  "express": "^5.2.1",
  "mongoose": "^9.2.4",
  "jsonwebtoken": "^9.0.3",
  "bcryptjs": "^3.0.3",
  "zod": "^3.24.2",
  "winston": "^3.17.0",
  "node-cron": "^3.0.3",
  "nodemailer": "^8.0.4"
}
```

---

**Versão**: 2.4.0
**Última Atualização**: 2026-10-09