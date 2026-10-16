# DesliGest - Gestão de Rescisões

## Resumo

Este repositório contém o **DesliGest**, uma SPA para gestão de rescisões trabalhistas brasileiras, construída com React, Framer Motion e um backend em Node.js/Express. O sistema foi migrado para **Vercel Functions** para maior performance e eficiência de custo.

## Backend (`api/`)

### Principais Características

- **App Express Modular**: O arquivo `api/index.js` exporta o app como um handler de função serverless da Vercel.
- **Cache de Conexão com Banco de Dados**: O arquivo `api/db.cjs` implementa cache da conexão com o MongoDB para evitar a exaustão do pool de conexões entre invocações serverless.
- **Middleware Seletivo**: O middleware `requireDB` garante a conexão com o banco apenas para rotas de dados (`/api/auth`, `/api/desligamentos`, `/api/links`), permitindo que `/api/health` e erros 404 funcionem sem depender do banco.
- **Cron Job**: O resumo diário por e-mail é agendado via Vercel Cron (`/api/cron/resumo-diario`), protegido por `Authorization: Bearer ${CRON_SECRET}`.
- **Logs de Produção**: O `api/utils/logger.cjs` utiliza apenas o transport de console em produção; logs em arquivo são habilitados apenas quando `NODE_ENV !== 'production'`.

### Variáveis de Ambiente Necessárias

```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=sua-chave-secreta
CRON_SECRET=seu-segredo-do-cron
MAILTRAP_TOKEN=seu-token-mailtrap
MAIL_FROM=noreply@desligest.com
FRONTEND_URL=https://rescisoes.vercel.app
ADMIN_EMAIL=admin@desligest.com
NODE_ENV=production
```

**Nota**: NÃO defina `VITE_API_URL` na Vercel. O frontend deve usar caminhos relativos `/api` (mesmo domínio, sem problemas de CORS).

### Rotas da API

- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Perfil do usuário logado
- `GET /api/auth/users` - Lista todos os usuários (apenas admin)
- `PATCH /api/auth/users/:id/role` - Altera função do usuário (apenas admin)
- `DELETE /api/auth/users/:id` - Deleta usuário (apenas admin)
- `POST /api/auth/forgot-password` - Solicita recuperação de senha
- `POST /api/auth/reset-password` - Redefine a senha com token
- `GET /api/health` - Verificação de integridade (não requer DB)
- `GET /api/cron/resumo-diario` - Resumo diário (protegido por CRON_SECRET)

## Frontend (`src/`)

### Build e Saída

- Os arquivos estáticos são gerados na pasta `dist/`.
- O roteamento HTML5 é gerenciado via rewrites no `vercel.json`.
- O frontend utiliza caminhos relativos `/api` para todas as chamadas de API.

## Configuração da Vercel

### vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "index.js": {
      "runtime": "nodejs20.x",
      "maxDuration": 300
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "crons": [
    { "path": "/api/cron/resumo-diario", "schedule": "30 8 * * *" }
  ]
}
```

## Implantação

### Pré-requisitos

1. Vercel CLI: `npm i -g vercel`
2. Conta Vercel e projeto vinculado (`vercel link`)
3. Variáveis de ambiente configuradas no dashboard da Vercel ou via `vercel env add`

### Comandos de Deploy

```bash
# Deploy de preview
vercel deploy

# Deploy para produção
vercel --prod

# Configurar variáveis de ambiente
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add CRON_SECRET
vercel env add MAILTRAP_TOKEN
vercel env add MAIL_FROM
vercel env add FRONTEND_URL
vercel env add ADMIN_EMAIL
vercel env add NODE_ENV
```

### Verificação

1. **Local**: `npm run dev:server` inicia o servidor Express localmente.
2. **Vercel Preview**: Verifique os Runtime Logs para:
   - "MongoDB conectado com sucesso"
   - "Iniciando resumo diário (Vercel Cron)..." às 08:30 UTC.
3. **Produção**: Teste o login e operações de dados.
4. **Cron**: Teste `/api/cron/resumo-diario` com e sem o header `Bearer CRON_SECRET`.

## Problemas Conhecidos

- **xlsx@0.18.5 Vulnerabilidade**: Poluição de protótipo/ReDoS de alta severidade. A instalação via CDN do SheetJS foi bloqueada pela config `EALLOWREMOTE` do npm. Este problema permanece conhecido.

## Rollback

Se necessário, retorne para a implantação no Render:
1. Reverta as mudanças no diretório `api/`.
2. Restaure o `render.yaml` com o comando de start apropriado.
3. Configure `VITE_API_URL` no frontend.

## Benefícios da Arquitetura

- **Otimização de Cold Start**: Conexão com MongoDB cacheada entre invocações.
- **Eficiência de Custo**: Funções Serverless com precificação de CPU Ativa.
- **Confiabilidade**: Failover automático e escalonamento.
- **Conformidade**: Sem escritas em disco em produção (logs vão para o console).
- **Segurança**: Sem problemas de CORS (frontend e backend no mesmo domínio).

## Critérios de Sucesso

- [x] Build concluído com sucesso (`npm run build`)
- [x] Servidor local inicia e responde ao `/api/health`
- [x] Rotas protegidas por `requireDB` retornam erro apropriado quando o DB está indisponível
- [x] Rota de cron responde corretamente com e sem autenticação
- [x] Deploy da Vercel cria a função e o cron job com sucesso
- [x] Frontend carrega e usa caminhos `/api` relativos sem erros de CORS
