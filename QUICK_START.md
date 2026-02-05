# 🚀 INSTRUÇÕES RÁPIDAS DE USO

## ⚡ Começando em 3 minutos

### 1. Instalar dependências
```bash
npm install
npm install pino-pretty --save-dev
```

### 2. Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
# OBRIGATÓRIO: AI_PROVIDER e API_KEY da IA escolhida
nano .env
```

**IMPORTANTE**: Não precisa mais de MongoDB! O banco SQLite é criado automaticamente.

### 3. Rodar o projeto
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# OU

# Produção
npm start
```

### 4. Escanear QR Code
- Um QR Code aparecerá no terminal
- Abra WhatsApp no celular
- Vá em "Aparelhos conectados"
- Escaneie o QR Code

### 5. Testar
- Envie uma mensagem para o número conectado
- O bot responderá automaticamente
- Acesse http://localhost:3000/leads para ver os leads

## 📡 Endpoints da API

```bash
# Status do sistema
curl http://localhost:3000/status

# Listar todos os leads
curl http://localhost:3000/leads

# Listar leads novos
curl http://localhost:3000/leads?status=novo

# Buscar lead específico
curl http://localhost:3000/leads/5511999999999

# Estatísticas
curl http://localhost:3000/leads/stats

# Atualizar status
curl -X PATCH http://localhost:3000/leads/5511999999999/status \
  -H "Content-Type: application/json" \
  -d '{"status":"em_atendimento"}'
```

## 🔑 Variáveis de Ambiente Essenciais

```env
# IA - Escolha OpenAI OU Gemini
AI_PROVIDER=openai

# OpenAI (se escolheu openai)
OPENAI_API_KEY=sk-...

# Gemini (se escolheu gemini)  
GEMINI_API_KEY=...

# Personalização
COMPANY_NAME=Minha Empresa

# Banco (opcional, já tem padrão)
DATABASE_PATH=./database/leads.db
```

## 💾 Banco de Dados LOCAL

**SQLite** - Banco em arquivo, zero configuração!

- ✅ Não precisa instalar nada
- ✅ Arquivo criado automaticamente em `./database/leads.db`
- ✅ Fácil backup (é só um arquivo)
- ✅ Migração futura para PostgreSQL/MySQL é simples

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento com auto-reload
npm run dev

# Produção
npm start

# PM2 (produção com gerenciamento)
npm run pm2:start    # Iniciar
npm run pm2:logs     # Ver logs
npm run pm2:restart  # Reiniciar
npm run pm2:stop     # Parar
```

## 📁 Arquivos Importantes

- `src/server.js` - Arquivo principal
- `src/bot/messageHandler.js` - Lógica de mensagens
- `src/bot/flows/welcomeFlow.js` - Fluxo de boas-vindas (PERSONALIZE AQUI!)
- `src/services/aiService.js` - Integração com IA
- `database/leads.db` - Banco de dados (criado automaticamente)
- `.env` - Variáveis de ambiente (NUNCA COMMITE!)

## 🎯 Personalizando o Bot

### Mudar mensagens de boas-vindas
Edite: `src/bot/flows/welcomeFlow.js`

### Mudar classificação da IA
Edite: `src/services/aiService.js` (const CLASSIFICATION_PROMPT)

### Mudar status possíveis
Edite: `src/models/Lead.js` (queries SQL)

## ❗ Problemas Comuns

### QR Code não aparece
- Verifique se porta 3000 está livre
- Verifique conexão com internet

### "AI_PROVIDER não definida"
- Você esqueceu de criar o arquivo .env
- Copie .env.example para .env e configure

### "OPENAI_API_KEY não configurada"
- Adicione sua API key no .env
- Ou mude AI_PROVIDER para 'gemini' e configure GEMINI_API_KEY

### Bot não responde
- Verifique logs em logs/app.log
- Verifique se WhatsApp está conectado (GET /status)

## 📞 Testando

1. Execute o projeto
2. Escaneie o QR Code
3. Envie "Olá" para o número
4. Bot responderá automaticamente
5. Acesse http://localhost:3000/leads
6. Veja o lead salvo no banco SQLite!

## 📂 Onde estão os dados?

```
database/
  └── leads.db          # Banco SQLite (criado automaticamente)
  
auth_info/              # Sessão do WhatsApp (criado ao escanear QR)

logs/                   # Logs da aplicação
  ├── app.log
  └── error.log
```

## 🔄 Migração Futura (quando quiser)

Quando o projeto crescer, é fácil migrar de SQLite para PostgreSQL/MySQL:

1. Instalar driver do banco (pg para Postgres, mysql2 para MySQL)
2. Atualizar `src/utils/database.js` 
3. Ajustar queries em `src/models/Lead.js`
4. Pronto!

## 🎓 Aprendendo com o Código

Todo o código está **amplamente comentado**:
- Cada arquivo tem explicação no topo
- Cada função tem comentários
- Cada decisão técnica está documentada

Leia os arquivos nesta ordem:
1. `src/server.js` - Entenda como tudo inicia
2. `src/utils/database.js` - Como funciona o SQLite
3. `src/models/Lead.js` - Como salvamos os dados
4. `src/bot/connect.js` - Como conecta ao WhatsApp
5. `src/bot/messageHandler.js` - Como processa mensagens

## 📚 Documentação Completa

Leia o README.md para documentação completa!

---

**Dúvidas?** Leia os comentários no código! 😊
