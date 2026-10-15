# Deploy do backend na Vercel — plano de execução

Runbook para publicar o DesliGest (frontend + API) num único projeto Vercel.
A migração de código já está feita e commitada (`bd15ec6`). O que falta aqui é
só a parte que exige a sua conta.

O Render continua funcionando em paralelo. Nada neste roteiro o desliga, então
dá para parar no meio sem quebrar o que está no ar.

---

## Antes de começar

### 1. Liberar o acesso no MongoDB Atlas

Em **Network Access**, adicione `0.0.0.0/0` (permitir de qualquer lugar).

Funções serverless não têm IP fixo. Se a allowlist hoje só tem o IP do Render,
a Vercel **não vai conseguir conectar** e o sintoma será `/api/health`
respondendo `db: disconnected` sem erro óbvio.

### 2. Ter os valores das variáveis em mãos

Pegue no painel do Render, em **Environment**:

- `MONGODB_URI`
- `JWT_SECRET` — tem que ser **o mesmo** do Render; se mudar, todos os tokens
  JWT já emitidos são invalidados e todo mundo é deslogado
- `MAILTRAP_TOKEN`
- `MAIL_FROM`
- `FRONTEND_URL`
- `ADMIN_EMAIL`

E gere um segredo novo para o cron:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Passo a passo

### 1. Autenticar e vincular o projeto

```bash
vercel login
vercel link
```

### 2. Cadastrar as variáveis de ambiente

```bash
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add MAILTRAP_TOKEN production
vercel env add MAIL_FROM production
vercel env add FRONTEND_URL production
vercel env add ADMIN_EMAIL production
vercel env add NODE_ENV production        # valor: production
vercel env add CRON_SECRET production     # o segredo gerado acima
```

> **Não defina `VITE_API_URL`.**
>
> Com frontend e API no mesmo projeto, o front usa `/api` relativo
> ([src/services/api.js](src/services/api.js) cai nesse default) — mesmo
> domínio, sem CORS. Se você definir essa variável apontando para o Render,
> o deploy da Vercel vai continuar chamando o Render.

Repita com `preview` em vez de `production` se quiser testar o preview contra
o banco real.

### 3. Deploy de preview (não mexe na produção)

```bash
vercel
```

### 4. Validar no preview

Nesta ordem, usando a URL que o comando acima devolveu:

1. **`/api/health`** → deve responder `db: connected`.
   Se vier `disconnected`, o problema é o passo 1 (Atlas) ou a `MONGODB_URI`.
2. **Login** com um usuário real.
3. **Abrir e editar um desligamento** — confirma leitura e escrita no banco.
4. **Cron**, nas duas pontas:

```bash
# sem token → espera 401
curl -i https://SEU-PREVIEW.vercel.app/api/cron/resumo-diario

# com token → espera 200 e o JSON com as contagens
curl -i -H "Authorization: Bearer SEU_CRON_SECRET" \
  https://SEU-PREVIEW.vercel.app/api/cron/resumo-diario
```

5. **Runtime Logs** no painel da Vercel: as linhas do Winston devem aparecer,
   e **não** deve haver erro de permissão ao gravar em `logs/`.

### 5. Promover para produção

Só depois que os cinco itens acima passarem:

```bash
vercel --prod
```

### 6. Confirmar o cron no dia seguinte

O agendamento está em [vercel.json](vercel.json): `30 8 * * *`.
No painel, em **Settings → Cron Jobs**, confirme que a entrada aparece e que a
primeira execução rodou. O e-mail só é enviado se houver pendência — ausência
de e-mail num dia tranquilo é o comportamento correto, não falha.

---

## Rollback

Enquanto o Render estiver no ar, ele é a rede de segurança.

- **Deploy ruim na Vercel:** no painel, **Deployments → deploy anterior →
  Promote to Production**. É instantâneo.
- **Voltar inteiro para o Render:** defina `VITE_API_URL` na Vercel apontando
  para a URL do Render e refaça o deploy. O front volta a bater lá.

---

## Cortar o Render (só quando estiver convencido)

Depois de alguns dias estáveis:

1. Remover o serviço no painel do Render.
2. Apagar [render.yaml](render.yaml).
3. Remover `node-cron` das dependências em [api/package.json](api/package.json)
   e apagar [api/services/cronService.js](api/services/cronService.js) — a
   partir daí só o Vercel Cron é usado.

---

## Limites e pontos de atenção

**Body de 4,5 MB por requisição.** O Express aceita 10 MB
(`express.json({ limit: '10mb' })`), mas a função corta em 4,5 MB e devolve
`413`. Afeta a importação em massa de CSV (`POST /api/desligamentos/bulk`):
importações grandes precisam ir em lotes menores. Não há upload de arquivo no
sistema, então é só esse caminho.

**`maxDuration` de 60s** está em [vercel.json](vercel.json). Se alguma
importação grande estourar, dá para subir (300s em qualquer plano).

**Primeira requisição após inatividade é mais lenta** (cold start + conexão com
o Atlas). O cache em [api/db.js](api/db.js) faz as seguintes reaproveitarem a
conexão.

---

## Pendências de segurança (não bloqueiam o deploy)

Encontradas durante o mapeamento, já existiam antes da migração:

- **`POST /api/desligamentos/seed` não tem autenticação** — só é barrado por
  `NODE_ENV === 'production'`. Com `NODE_ENV` configurado corretamente está
  coberto em produção, mas vale exigir autenticação de admin.
- **CORS aberto:** o `else` do callback em [api/index.js](api/index.js) faz
  `callback(null, true)`, liberando qualquer origem. Com tudo no mesmo domínio
  isso deixa de ser o caminho crítico, mas a allowlist está inócua hoje.
- **`POST /api/auth/forgot-password` devolve `devResetToken` no corpo da
  resposta** fora de produção.
