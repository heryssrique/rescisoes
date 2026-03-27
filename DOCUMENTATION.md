# 📚 Documentação Técnica (DesliGest)

Este documento detalha o funcionamento interno, arquitetura e decisões técnicas tomadas no desenvolvimento do **DesliGest (v2.1.0)**.

## 🏗️ Arquitetura de Software

O sistema segue o padrão **MERN (MongoDB, Express, React, Node)** de forma moderada, com comunicação REST API.

### Front-end (React 19)

#### 1. Gerenciamento de Estado (AppContext)
*   **Provider**: O `AppProvider` (`src/context/AppContext.jsx`) centraliza o estado global.
*   **Reducer**: Utiliza `useReducer` para lidar com transições de estado complexas (Autenticação, CRUD de desligamentos, Notificações).
*   **Memoização**: O `value` do Context é envolvido em `useMemo`, garantindo que consumidores não re-renderizem a menos que o estado mude significativamente.

#### 2. Roteamento de Visualização (Self-Contained Views)
O roteamento não utiliza bibliotecas externas, mas sim um sistema de `state.view` controlado por dispatch, o que permite:
*   Transições animadas perfeitas entre telas via `AnimatePresence`.
*   Mantém o estado do formulário/detalhes sem recarregar a página.

#### 3. Componentes-Chave
*   **ListView**: Agrega e filtra processos. Implementa **Debounce Search** para eficiência de busca em grandes listas.
*   **CalendarView**: Renderiza uma grade de dias calculada via `date-fns`. Gerencia eventos de pagamento com `useMemo`.
*   **DetailView**: Centraliza o checklist, anexos e histórico específico do colaborador.

---

### Back-end (Node.js/Express)

#### 1. Modelo de Dados (Mongoose)
O esquema de desligamento (`server/models/Desligamento.js`) inclui:
*   `checklist`: Array de objetos com status de conclusão e data.
*   `historico`: Log de auditoria que cresce conforme as alterações.
*   `anexos`: Array de metadados de arquivos.

#### 2. Middleware de Auditoria
A API possui lógica que intercepta requisições `PUT/PATCH` para comparar o estado anterior do documento com o novo, injetando automaticamente no histórico o diferencial (diff).

---

## ⚡ Otimizações de Performance

### Memoização Crítica
Foram aplicados padrões preventivos de renderização excessiva:
*   **React.memo**: Em componentes repetitivos pesados (ex: `TermCard`).
*   **useCallback**: Para funções passadas como props que disparariam re-renderizações de filhos.
*   **useMemo**: Para cálculos de estatísticas de dashboard e filtragem de listas.

---

## 📅 Fluxo de Notificações
O motor de notificações (`AppContext.generateNotifications`) roda sempre que a lista de desligamentos muda ou o ID de notificações lidas é atualizado:
1.  Filtra processos `ativos`.
2.  Ignora processos marcados como **PAGO**, **CANCELADO** ou com o item de checklist **Depósito** (`p1`) concluído.
3.  Calcula a diferença entre `hoje` e `dataPagamento`.
4.  Gera alertas: **Vencido** (atrasado), **Hoje** (urgente), **Próximo** (até 3 dias).

---

## 📂 Formatos de Dados (JSON Example - Desligamento)

```json
{
  "nome": "João Silva",
  "cargo": "Analista Pleno",
  "coligada": "1",
  "status": "documentacao",
  "dataDesligamento": "2026-03-22",
  "dataPagamento": "2026-04-01",
  "checklist": [
    { "id": "p1", "label": "Depósito", "done": false }
  ],
  "historico": [
    { "data": "2026-03-27T10:00:00", "acao": "Anexo adicionado: Rescisao.pdf" }
  ]
}
```

---

## 🛠️ Manutenibilidade e Escalabilidade
O projeto foi desenhado sob o princípio de **Baixo Acoplamento**:
*   Novas etapas de checklist podem ser adicionadas em `src/data/initialData.js` sem tocar na lógica do componente.
*   O backend é agnóstico em relação à UI, permitindo futuras versões Mobile.
