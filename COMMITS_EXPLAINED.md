# 📜 HISTÓRICO DE COMMITS EXPLICADO

Este documento explica cada commit do projeto em ordem cronológica, mostrando a evolução do sistema.

---

## Commit 1: `init: estrutura inicial do projeto`

**O que foi feito:**
- Criação do `package.json` com todas as dependências necessárias
- Definição de scripts npm (start, dev, pm2)
- Configuração do `.gitignore` para não commitar arquivos sensíveis
- Arquivo `.env.example` como template de configuração
- Configuração do PM2 (`ecosystem.config.js`) para rodar em produção
- Licença MIT

**Por que nesta ordem:**
Antes de escrever qualquer código, é essencial configurar o projeto corretamente. O `package.json` define as dependências, o `.gitignore` protege dados sensíveis, e o `.env.example` serve de documentação para as variáveis necessárias.

**Arquivos principais:**
- `package.json`
- `.gitignore`
- `.env.example`
- `ecosystem.config.js`
- `LICENSE`

---

## Commit 2: `setup: configuração do servidor Express`

**O que foi feito:**
- Sistema de logs com Pino (`logger.js`)
- Conexão com MongoDB (`database.js`)
- Modelo de Lead com schema completo (`Lead.js`)
- Métodos auxiliares para gerenciamento de leads
- Índices otimizados para buscas rápidas

**Por que nesta ordem:**
Depois da estrutura inicial, precisamos das fundações: logs (para debug), banco de dados (para persistência) e modelos (para estruturar os dados). Estes são serviços core que todo o resto depende.

**Arquivos principais:**
- `src/utils/logger.js` - Sistema centralizado de logs
- `src/utils/database.js` - Gerencia conexão MongoDB
- `src/models/Lead.js` - Schema do lead no banco

**O que aprender:**
- Como estruturar logs de forma profissional
- Como gerenciar conexão com MongoDB com Mongoose
- Como criar schemas com validações e métodos

---

## Commit 3: `feat: conexão com WhatsApp (Baileys)`

**O que foi feito:**
- Implementação completa da conexão via Baileys
- Gerenciamento de QR Code
- Autenticação multi-file (salva sessão para não precisar escanear toda vez)
- Reconexão automática em caso de queda
- Listeners de eventos (connection, creds, messages)
- Tratamento de desconexão e logout

**Por que nesta ordem:**
Com as fundações prontas, começamos a funcionalidade principal: conectar ao WhatsApp. Este é o primeiro componente funcional do bot.

**Arquivos principais:**
- `src/bot/connect.js` - Gerencia toda a conexão

**O que aprender:**
- Como usar Baileys para conectar ao WhatsApp
- Como gerenciar QR Code e autenticação
- Como lidar com reconexão automática
- Event-driven architecture

---

## Commit 4: `feat: handler de mensagens`

**O que foi feito:**
- Handler principal que processa TODAS as mensagens recebidas
- Fluxo de boas-vindas automático e personalizável
- Service do WhatsApp com funções auxiliares (formatar número, extrair texto, etc)
- Validação de mensagens (ignora mensagens do próprio bot, de status, etc)
- Roteamento de mensagens (individual vs grupo)
- Simulação de "digitando..." para conversa natural
- Marcação de mensagens como lidas

**Por que nesta ordem:**
Com a conexão pronta, precisamos processar as mensagens que chegam. O handler é o "cérebro" que decide o que fazer com cada mensagem.

**Arquivos principais:**
- `src/bot/messageHandler.js` - Processa todas as mensagens
- `src/bot/flows/welcomeFlow.js` - Fluxo de boas-vindas (PERSONALIZÁVEL!)
- `src/services/whatsappService.js` - Funções auxiliares do WhatsApp

**O que aprender:**
- Como processar mensagens do WhatsApp
- Como criar fluxos de conversa
- Como extrair informações de mensagens
- Padrão Service para encapsular lógica reutilizável

---

## Commit 5: `feat: integração com IA`

**O que foi feito:**
- Service de IA com suporte a OpenAI (GPT) e Google Gemini
- Classificação automática de mensagens
- Detecção de intenção (orçamento, dúvida, suporte, outro)
- Análise de sentimento (positivo, neutro, negativo)
- Definição de prioridade (baixa, média, alta)
- Fallback automático se a IA falhar
- Geração de resposta automática contextualizada
- Prompt engineering otimizado

**Por que nesta ordem:**
Com as mensagens sendo processadas, agora adicionamos inteligência para classificá-las automaticamente. Isso permite priorização e respostas personalizadas.

**Arquivos principais:**
- `src/services/aiService.js` - Integração com OpenAI e Gemini

**O que aprender:**
- Como integrar com APIs de IA
- Prompt engineering (como escrever prompts que funcionam)
- Como fazer fallback (plano B se algo falhar)
- Como trabalhar com respostas em JSON

---

## Commit 6: `feat: salvamento de leads`

**O que foi feito:**
- Service completo de gerenciamento de leads
- Criação e busca de leads (idempotente - pode chamar várias vezes)
- Adição de mensagens ao histórico
- Atualização de classificação de IA
- Atualização de status (novo, em_atendimento, finalizado)
- Listagem com filtros e paginação
- Busca por telefone
- Estatísticas agregadas (dashboard data)

**Por que nesta ordem:**
Com mensagens classificadas, precisamos salvá-las no banco. O leadService é a camada que gerencia TODA interação com leads no banco de dados.

**Arquivos principais:**
- `src/services/leadService.js` - CRUD completo de leads

**O que aprender:**
- Padrão Repository/Service
- Como fazer operações no MongoDB com Mongoose
- Agregações (para estatísticas)
- Paginação
- Queries otimizadas

---

## Commit 7: `feat: rotas da API`

**O que foi feito:**
- Controller de leads (lista, busca, atualiza)
- Controller de status (health check)
- Rotas REST completas (/leads, /leads/:phone, /status)
- Aplicação Express com todos os middlewares
- CORS configurado (permite acessar de outros domínios)
- Tratamento de erros global
- Logger de requisições HTTP
- Documentação de endpoints na rota raiz

**Por que nesta ordem:**
Com toda a lógica pronta, criamos a API REST para expor funcionalidades via HTTP. Isso permite criar frontends, integrações, dashboards, etc.

**Arquivos principais:**
- `src/controllers/leadController.js` - Gerencia requisições de leads
- `src/controllers/statusController.js` - Health check
- `src/routes/leadRoutes.js` - Define rotas de leads
- `src/routes/statusRoutes.js` - Define rotas de status
- `src/app.js` - Configuração do Express

**O que aprender:**
- Padrão MVC (Model-View-Controller)
- Como criar APIs REST profissionais
- Middlewares do Express
- Tratamento de erros HTTP
- CORS

---

## Commit 8: `chore: logs e tratamento de erros`

**O que foi feito:**
- Servidor principal com inicialização sequencial
- Validação de variáveis de ambiente (antes de iniciar)
- Shutdown gracioso (desliga tudo organizadamente)
- Tratamento de uncaughtException e unhandledRejection
- Integração completa de todos os componentes
- Desconexão organizada de serviços
- Mensagens informativas durante inicialização

**Por que nesta ordem:**
Com todos os componentes prontos, criamos o arquivo que INICIA TUDO. O server.js é o ponto de entrada que orquestra a inicialização de todos os serviços na ordem correta.

**Arquivos principais:**
- `src/server.js` - Arquivo principal (ponto de entrada)

**O que aprender:**
- Como inicializar múltiplos serviços na ordem correta
- Shutdown gracioso (não deixa requisições pela metade)
- Tratamento de erros não capturados
- Process signals (SIGTERM, SIGINT)

---

## Commit 9: `docs: README profissional`

**O que foi feito:**
- Documentação completa do projeto
- Badges informativos
- Índice navegável
- Explicação detalhada de funcionalidades e arquitetura
- Guia de instalação passo a passo
- Documentação completa da API REST com exemplos
- Estrutura de pastas explicada
- Guia de deployment (VPS, Docker, Heroku)
- Avisos legais e de segurança
- Recursos adicionais

**Por que nesta ordem:**
Com o projeto funcional, documentamos TUDO. Um README profissional é essencial para portfólio e para outros desenvolvedores entenderem o projeto.

**Arquivos principais:**
- `README.md` - Documentação completa

**O que aprender:**
- Como escrever documentação profissional
- Como estruturar um README
- Markdown avançado

---

## Commit 10: `docs: guia rápido de início`

**O que foi feito:**
- Guia de início rápido (5 minutos)
- Comandos essenciais
- Troubleshooting de problemas comuns
- Guia de personalização

**Arquivos principais:**
- `QUICK_START.md` - Início rápido

---

## 🎯 RESUMO DA ORDEM

```
1. init       → Estrutura e configuração base
2. setup      → Fundações (logs, banco, modelos)
3. feat       → WhatsApp (conexão)
4. feat       → WhatsApp (mensagens)
5. feat       → IA (classificação)
6. feat       → Persistência (salvar leads)
7. feat       → API REST (expor funcionalidades)
8. chore      → Orquestração (juntar tudo)
9. docs       → Documentação completa
10. docs      → Guia rápido
```

---

## 💡 LIÇÕES IMPORTANTES

### 1. Ordem Importa
Não dá para criar a API antes do banco de dados. Não dá para processar mensagens antes de conectar ao WhatsApp. A ordem dos commits reflete dependências reais.

### 2. Separação de Responsabilidades
Cada commit faz UMA coisa bem feita. Não mistura funcionalidades. Isso facilita:
- Entender o que mudou
- Reverter se necessário
- Code review
- Aprendizado

### 3. Commits Explicativos
As mensagens de commit explicam O QUE e POR QUE, não apenas o que mudou nos arquivos.

### 4. Incremental é Melhor
Melhor 10 commits pequenos e focados do que 1 commit gigante com tudo misturado.

---

## 🔍 PARA EXPLORAR

Use `git log` para ver o histórico:

```bash
# Ver todos os commits
git log --oneline

# Ver detalhes de um commit específico
git show <commit-hash>

# Ver o que mudou em cada commit
git log -p

# Ver estatísticas
git log --stat
```

---

**Este histórico foi pensado para ser EDUCATIVO!** 📚
