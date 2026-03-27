# 🚀 Sistema de Gestão de Rescisões (DesliGest)

O **DesliGest** é uma plataforma corporativa premium para o acompanhamento e gestão de desligamentos, projetada para departamentos de Recursos Humanos que buscam **máxima eficiência**, **controle rigoroso de prazos** e **rastreabilidade total**.

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Node](https://img.shields.io/badge/Node-20-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?logo=mongodb)

---

## ✨ Funcionalidades de Elite

### 🗓️ Calendário de Prazos (Novo!)
*   Visão mensal interativa de todos os vencimentos de pagamentos.
*   Navegação intuitiva com acesso direto aos detalhes do processo por um clique.

### 🛡️ Histórico e Auditoria Global (Novo!)
*   **Monitoramento em Tempo Real**: Veja todas as atividades do sistema em um único lugar.
*   **Integridade de Dados**: O sistema compara e registra automaticamente quem alterou cada campo, garantindo total conformidade (Compliance).

### 📎 Gestão de Documentos e Anexos (Novo!)
*   Centralização radical: Anexe PDFs, comprovantes e fotos diretamente no card de cada colaborador.
*   Histórico de anexos integrado para controle documental simplificado.

### ⚡ Performance Computacional (Novo!)
*   **Busca com Debounce**: Interface ultra-responsiva que economiza CPU e elimina atrasos de digitação.
*   **Memoização Inteligente**: Renderização otimizada para suportar milhares de itens sem perda de fluidez.

### 📦 Funcionalidades Core
*   **Checklist Dinâmico**: 15+ etapas automáticas organizadas por fluxo de trabalho (Comunicado, Documentação, Homologação, Pagamento).
*   **Dashboard Executivo**: Estatísticas gráficas por motivo de desligamento e por empresa (Coligada).
*   **Quadro Kanban**: Visualize o gargalo operacional por etapas do processo.
*   **Importação Inteligente**: Suporte para importação em lote via planilha CSV.
*   **Modos Dark & Light**: Interface adaptativa premium com animações via *Framer Motion*.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React 19, Vite, Framer Motion, Lucide icons, Date-fns |
| **Backend** | Node.js, Express (Express 5/Latest), Mongoose |
| **Database** | MongoDB (Capped Collections para Audit logs) |
| **DevOps** | Git, NPM Scripts, ESLint |

---

## 🚀 Guia de Início Rápido

### Pré-requisitos
*   **Node.js** (v18 ou superior)
*   **MongoDB** (Local ou Atlas)

### Configuração Inicial

1. **Servidor (Backend)**:
```bash
cd server
npm install
cp .env.example .env # Configure sua MONGODB_URI e JWT_SECRET
```

2. **Cliente (Frontend)**:
```bash
npm install
```

### Execução Combinada (Recommended)
Na raiz do projeto:
```bash
npm run dev
```
*   **Frontend**: `http://localhost:5173`
*   **Backend API**: `http://localhost:3001`

---

## 📂 Arquitetura do Sistema

```text
├── server/            # API Service Layer
│   ├── models/        # Schemas do banco de dados (User, Desligamento)
│   ├── routes/        # Router logic e Middlewares de Auditoria
│   └── seed/          # Initial data generation
├── src/               # UI Layer (React SPA)
│   ├── components/    # Atomic and composite components
│   ├── context/       # Global State (AppProvider + useReducer)
│   ├── data/          # Constants and workflow templates
│   └── utils/         # Date logic and formatters
```

---

## 🔐 Segurança e Boas Práticas
*   **RBAC (Role-Based Access Control)**: O sistema suporta diferentes níveis de permissão (Admin/Operador).
*   **Segurança de Dados**: Sanitização de inputs e hashing de senhas.
*   **UX Inclusiva**: Contraste aprimorado para o modo claro e animações suaves para redução de carga cognitiva.

---

## 🏢 Sobre o Projeto
Desenvolvido para ser a solução definitiva em gestão de rescisões, focando em reduzir erros de prazo e garantir que nenhum documento seja esquecido durante as etapas críticas do desligamento.

---

## 👤 Autor
**Heryssrique Silva** - [GitHub](https://github.com/heryssrique)

---

> [!TIP]
> **Dica Executiva**: Utilize a visão de **Calendário** para planejar datas de pico de pagamento no início do mês e a **Auditoria Global** para revisões rápidas de conformidade.
