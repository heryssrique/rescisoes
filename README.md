# 🚀 Sistema de Gestão de Rescisões (Desligest)

Um sistema completo para acompanhamento e gestão de processos de desligamento de funcionários, com foco em automação, controle de prazos e auditoria.

---

## ✨ Funcionalidades Principais

- **📦 Gestão de Processos:** Acompanhamento completo desde o comunicado até o pagamento final.
- **🕒 Controle de Prazos Automático:** Cálculo automático de prazos de 7 e 10 dias corridos conforme a legislação.
- **📝 Checklist Dinâmico:** Lista de tarefas pendentes organizada por etapas (Comunicado, Documentação, Homologação, Pagamento).
- **🛡️ Auditoria Automática:** O sistema registra automaticamente quem alterou qual campo e o valor antigo/novo no histórico.
- **🔍 Filtros Avançados:** Busca textual e filtros por Status, Motivo, Empresa (Coligada) e Intervalo de Datas.
- **📊 Estados em Kanban:** Visualize os processos em colunas conforme a etapa atual.
- **📥 Importação e Arquivo:** Suporte para importação em lote e arquivamento de processos finalizados.
- **🎭 UI Premium:** Interface inspirada em glassmorphism com animações fluidas usando Framer Motion.

---

## 🛠️ Tecnologias Utilizadas

### Front-end
- **React 19** (Vite)
- **Framer Motion** (Animações)
- **Lucide React** (Ícones)
- **Date-fns** (Manipulação de datas)
- **Vanilla CSS** (Variables & Glassmorphism)

### Back-end
- **Node.js + Express 5**
- **MongoDB + Mongoose**
- **CORS & Dotenv**

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js instalado
- MongoDB rodando localmente ou uma URI do MongoDB Atlas

### Configuração
1.  **Clone o repositório** e entre na pasta.
2.  **Configurações do Servidor:**
    ```bash
    cd server
    cp .env.example .env
    npm install
    ```
    *Edite o arquivo `.env` com sua URL do MongoDB se necessário.*

3.  **Configurações do Cliente:**
    ```bash
    cd ..
    npm install
    ```

### Execução em Desenvolvimento
Na raiz do projeto, execute o seguinte comando:
```bash
npm run dev
```
*Isso iniciará simultaneamente o Vite (porta 5173) e o servidor Express (porta 3001).*

---

## 📂 Estrutura de Pastas

```text
├── server/            # API Express e Modelos Mongoose
│   ├── models/        # Schemas do banco de dados
│   ├── routes/        # Endpoints da API (Audit logs implementados aqui)
│   └── seed/          # Scripts para popular dados iniciais
├── src/               # Front-end React
│   ├── components/    # Componentes da interface (ListView, Kanban, Modals)
│   ├── context/       # Estado global (AppContext)
│   ├── data/          # Dados estáticos e templates
│   └── utils/         # Formatadores e utilitários de data
└── public/            # Ativos estáticos
```

---

## 📝 Auditoria de Alterações
O sistema possui um mecanismo de auditoria nativo no back-end. Ao atualizar qualquer dado de um desligamento via API, o servidor compara as mudanças e injeta automaticamente no array de histórico do documento o detalhamento da alteração, garantindo total rastreabilidade.

---

## 🤝 Contribuição
1.  Faça um Fork do projeto
2.  Crie uma Branch para sua feature (`git checkout -b feature/minha-feature`)
3.  Faça o Commit das mudanças (`git commit -m 'Add: nova feature'`)
4.  Push para a Branch (`git push origin feature/minha-feature`)
5.  Abra um Pull Request
