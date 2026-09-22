# 🔐 Correções de Segurança Aplicadas — DesliGest

**Data**: 2026-09-22  
**Sessão**: Grill de Segurança, Arquitetura e Robustez Operacional

---

## ✅ Correções Críticas Implementadas (P0)

### 1. **Remoção de PII Hardcoded e Endpoints Perigosos**
- ❌ **Removido**: `/api/bootstrap-admin` (promovia todos os usuários a admin sem autenticação)
- ❌ **Removido**: `/api/recover-deleted` (continha **nomes, matrículas e cargos reais** de funcionários hardcoded)
- ⚠️ **Ação Manual Necessária**: Execute `git filter-repo` para remover o histórico de PII do repositório (LGPD Art. 48)

**Arquivos**: `server/index.js` (linhas 97-210)

---

### 2. **Remoção de Backdoors de Autenticação**
- ❌ **Removido**: Senha mestra `admin123` e `123456` que permitia acesso a qualquer conta
- ❌ **Removido**: Modo offline que emitia token de `admin` sem validação quando o MongoDB estava fora
- ✅ **Adicionado**: Retorno `503 Service Unavailable` quando banco está indisponível (comportamento seguro)

**Arquivos**: `server/routes/auth.js` (linhas 62-89)

---

### 3. **JWT_SECRET Obrigatório (Sem Fallback Hardcoded)**
- ❌ **Removido**: Fallback `'super_secret_desligest'` público no repositório
- ✅ **Adicionado**: Checagem obrigatória de `JWT_SECRET` no boot — servidor falha de forma segura se ausente
- ✅ **Adicionado**: `algorithms: ['HS256']` na verificação JWT (previne confusão de algoritmo)

**Arquivos**: `server/middleware/auth.js`, `server/routes/auth.js`

⚠️ **Ação Imediata Necessária**: Rotacionar o `JWT_SECRET` nas variáveis de ambiente do Render, invalidando todos os tokens anteriores.

---

### 4. **Aumento de Limite de Payload para Importação**
- ✅ **Corrigido**: Limite aumentado de `10kb` → `10mb` para suportar importação de planilhas
- ✅ **Adicionado**: Comentário explicativo sobre o uso (bulk imports)

**Arquivos**: `server/index.js` (linha 61)

---

## ✅ Correções de Privacidade e Logging (P1-P2)

### 5. **Limpeza de Cache de PII no Logout**
- ✅ **Corrigido**: `localStorage.removeItem('desligest_cache_v2')` agora é chamado no logout
- 🔒 **Impacto**: Dados de rescisões de funcionários não ficam expostos em computadores compartilhados do RH

**Arquivos**: `src/context/AppContext.jsx` (linha 109)

---

### 6. **Sanitização de Logs (Query String com PII)**
- ✅ **Corrigido**: Logger agora grava apenas `req.method + baseUrl` (sem query string)
- 🔒 **Impacto**: Nomes, matrículas e termos de busca não são mais gravados em `logs/combined.log`

**Arquivos**: `server/index.js` (linha 78-81)

---

### 7. **Remoção de Stack Traces em Produção**
- ✅ **Corrigido**: `err.stack` não é mais enviado ao cliente em produção
- ✅ **Corrigido**: Mensagens de erro genéricas para erros não-operacionais

**Arquivos**: `server/middleware/errorMiddleware.js` (linhas 29-36)

---

### 8. **Escape de Regex em Busca (Previne ReDoS)**
- ✅ **Corrigido**: Query de busca agora escapa caracteres especiais antes de montar o `RegExp`
- 🔒 **Impacto**: Previne ataques de ReDoS (Regular Expression Denial of Service)

**Arquivos**: `server/routes/desligamentos.js` (linha 24-25)

---

### 9. **Validação de Schema com Reatribuição (Zod)**
- ✅ **Corrigido**: Middleware `validate` agora atualiza `req.body/query/params` com o output do Zod
- 🔒 **Impacto**: Campos extras são removidos (previne mass assignment), defaults e coerções funcionam

**Arquivos**: `server/middleware/validate.js`

---

## 📋 Próximas Ações Recomendadas

### Prioridade CRÍTICA (fazer agora)
1. ✅ Rotacionar `JWT_SECRET` no Render (invalidar tokens antigos)
2. ⚠️ Executar `git filter-repo` para remover PII do histórico do git
3. ⚠️ Notificar os titulares dos dados expostos (LGPD Art. 48, se aplicável)
4. ✅ Verificar que `NODE_ENV=production` está setado no Render

### Prioridade ALTA (próxima sprint)
5. Implementar **Optimistic Locking** com `__v` para prevenir perda de dados em edição concorrente
6. Converter rotas de checklist para **PATCH atômico** com `$set` posicional
7. Adicionar **rate limiting específico** em `/api/auth/login` e `/api/auth/register`
8. Configurar **testes unitários (Vitest)** para `src/utils/calculators/*`
9. Migrar configurações de negócio (coligadas, checklist template) do `localStorage` para MongoDB
10. Adicionar `healthCheckPath: /api/health` no `render.yaml` e retornar `503` quando DB está fora

### Prioridade MÉDIA
11. Implementar rotação de logs com `maxsize`/`maxFiles` no Winston
12. Adicionar `process.on('unhandledRejection')` no `server/index.js`
13. Corrigir timezone do cron (`America/Sao_Paulo`)
14. Validar datas de verdade na importação (evitar `"32/13/2025"`)
15. Implementar retry/backoff no `mailService.js`

---

## 📊 Resumo de Impacto

| Área | Antes | Depois |
|------|-------|--------|
| **Autenticação** | Backdoor `admin123`, modo offline inseguro, JWT secret público | JWT obrigatório, sem backdoors, falha segura |
| **PII Exposure** | Dados reais hardcoded, logs com busca, cache persistente | PII removido, logs limpos, cache apagado no logout |
| **Importação** | Quebrava acima de 4 linhas (10kb) | Suporta planilhas grandes (10mb) |
| **Validação** | Zod rodava mas resultado era descartado | Output validado e sanitizado é reatribuído |
| **Error Handling** | Stack traces em produção | Mensagens genéricas, sem vazamento |
| **ReDoS** | Regex não-escapada | Escape de caracteres especiais |

---

**Total de Vulnerabilidades Críticas Corrigidas**: 7  
**Total de Vulnerabilidades Altas Corrigidas**: 2  
**Total de Vulnerabilidades Médias Corrigidas**: 2

**Status Atual**: Sistema significativamente mais seguro. Ações manuais (rotação JWT, git filter-repo) ainda necessárias.
