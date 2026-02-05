# 🤖 WhatsApp Lead System

Sistema completo de atendimento e captação de leads via WhatsApp, utilizando Node.js, Baileys e Inteligência Artificial para classificação automática de mensagens.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Fluxo de Funcionamento](#fluxo-de-funcionamento)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [API REST](#api-rest)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Logs](#logs)
- [Deployment](#deployment)
- [Avisos Importantes](#avisos-importantes)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Sobre o Projeto

Este projeto foi desenvolvido com fins **educacionais** e para **portfólio**, demonstrando boas práticas de desenvolvimento backend com Node.js, incluindo:

- ✅ Arquitetura limpa e organizada
- ✅ Separação de responsabilidades
- ✅ Código amplamente comentado
- ✅ Padrões de projeto
- ✅ Integração com APIs de IA
- ✅ Gerenciamento de estado e sessões
- ✅ API REST completa
- ✅ Sistema de logs robusto

### 🎓 Objetivo Educacional

O código foi escrito pensando em desenvolvedores júnior, com comentários explicativos em **cada função**, **cada arquivo** e **cada decisão técnica**.

## ⚙️ Funcionalidades

### Bot de WhatsApp
- ✅ Conexão automática via QR Code
- ✅ Reconexão automática em caso de queda
- ✅ Detecção de primeira mensagem
- ✅ Fluxo de boas-vindas personalizado
- ✅ Respostas automáticas contextualizadas
- ✅ Simulação de "digitando..." para conversas naturais
- ✅ Marcação de mensagens como lidas

### Inteligência Artificial
- ✅ Classificação automática de mensagens
- ✅ Detecção de intenção (orçamento, dúvida, suporte, outro)
- ✅ Análise de sentimento (positivo, neutro, negativo)
- ✅ Definição de prioridade (baixa, média, alta)
- ✅ Suporte a OpenAI (GPT) e Google Gemini
- ✅ Fallback automático em caso de falha

### Gerenciamento de Leads
- ✅ Salvamento automático no MongoDB
- ✅ Histórico completo de conversas
- ✅ Rastreamento de status (novo, em_atendimento, finalizado)
- ✅ Metadados enriquecidos (classificação IA)
- ✅ Timestamps de interações

### API REST
- ✅ Listagem de leads com filtros
- ✅ Busca por número de telefone
- ✅ Atualização de status
- ✅ Estatísticas e analytics
- ✅ Health check para monitoramento

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB

### WhatsApp
- **Baileys** (whiskeysockets) - Biblioteca para WhatsApp Web

### Inteligência Artificial
- **OpenAI API** - GPT-3.5/GPT-4
- **Google Gemini** - Gemini Pro
- **Axios** - Cliente HTTP

### Utilitários
- **dotenv** - Gerenciamento de variáveis de ambiente
- **Pino** - Sistema de logs
- **QRCode Terminal** - Exibição de QR Code
- **PM2** - Gerenciador de processos

### Desenvolvimento
- **Nodemon** - Auto-reload em desenvolvimento

## 🏗️ Arquitetura

O projeto segue princípios de **Clean Architecture** e **SOLID**:

```
┌─────────────┐
│   Routes    │  ← Define endpoints HTTP
└──────┬──────┘
       │
┌──────▼──────┐
│ Controllers │  ← Gerencia requisições/respostas
└──────┬──────┘
       │
┌──────▼──────┐
│  Services   │  ← Lógica de negócio
└──────┬──────┘
       │
┌──────▼──────┐
│   Models    │  ← Schemas do banco de dados
└─────────────┘
```

### Camadas

1. **Routes**: Define rotas HTTP (GET, POST, PATCH, etc)
2. **Controllers**: Valida entrada, chama services, formata saída
3. **Services**: Contém toda a lógica de negócio
4. **Models**: Define estrutura dos dados no MongoDB
5. **Utils**: Funções auxiliares reutilizáveis
6. **Bot**: Lógica específica do WhatsApp

## 🔄 Fluxo de Funcionamento

### Quando uma mensagem chega:

```
1. WhatsApp recebe mensagem
   ↓
2. messageHandler valida e extrai dados
   ↓
3. Busca/cria lead no MongoDB
   ↓
4. Adiciona mensagem ao histórico
   ↓
5. [Se primeira mensagem] → Executa fluxo de boas-vindas
   ↓
6. Envia mensagem para IA classificar
   ↓
7. IA retorna: intent, sentiment, priority
   ↓
8. Atualiza lead com classificação
   ↓
9. Envia resposta automática personalizada
   ↓
10. Marca mensagem como lida
```

### Fluxo de Boas-Vindas

```
Lead envia primeira mensagem
   ↓
1. Saudação personalizada (usa o nome)
   ↓
2. Apresentação da empresa
   ↓
3. Expectativas de tempo de resposta
   ↓
Aguarda classificação da IA
```

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 6+ ([Download](https://www.mongodb.com/try/download/community)) ou conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** ([Download](https://git-scm.com/))
- Conta na **OpenAI** ([Criar](https://platform.openai.com/signup)) OU **Google AI** ([Criar](https://ai.google.dev/))

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/whatsapp-lead-system.git
cd whatsapp-lead-system
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
nano .env  # ou use seu editor preferido
```

## ⚙️ Configuração

### Arquivo `.env`

```env
# Servidor
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/whatsapp_leads

# IA - Escolha uma opção
AI_PROVIDER=openai  # ou 'gemini'

# OpenAI (se escolheu openai)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# Google Gemini (se escolheu gemini)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-pro

# Personalização
BOT_NAME=Assistente Virtual
COMPANY_NAME=Minha Empresa
```

### Obter API Keys

**OpenAI:**
1. Acesse https://platform.openai.com/api-keys
2. Clique em "Create new secret key"
3. Copie a chave e cole no `.env`

**Google Gemini:**
1. Acesse https://aistudio.google.com/app/apikey
2. Clique em "Get API key"
3. Copie a chave e cole no `.env`

## 💻 Como Usar

### Desenvolvimento (com auto-reload)

```bash
npm run dev
```

### Produção

```bash
npm start
```

### Com PM2 (recomendado para produção)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
npm run pm2:start

# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Parar
npm run pm2:stop
```

### Primeira execução

1. Execute o projeto
2. Um **QR Code** aparecerá no terminal
3. Abra o WhatsApp no celular
4. Vá em **Aparelhos conectados** > **Conectar um aparelho**
5. Escaneie o QR Code
6. Aguarde a mensagem "✅ WhatsApp conectado com sucesso!"
7. Envie uma mensagem para o número conectado

## 📡 API REST

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Status do Sistema
```http
GET /status
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "application": {
      "name": "WhatsApp Lead System",
      "version": "1.0.0",
      "environment": "development",
      "uptime": 3600
    },
    "services": {
      "whatsapp": { "connected": true, "status": "online" },
      "database": { "connected": true, "status": "online" }
    },
    "health": "ok"
  }
}
```

#### 2. Listar Leads
```http
GET /leads?status=novo&priority=alta&page=1&limit=20
```

**Query Parameters:**
- `status` (opcional): novo, em_atendimento, finalizado
- `priority` (opcional): baixa, média, alta
- `intent` (opcional): orçamento, dúvida, suporte, outro
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 50)

**Resposta:**
```json
{
  "success": true,
  "data": [...leads],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

#### 3. Buscar Lead por Telefone
```http
GET /leads/5511999999999
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "phoneNumber": "5511999999999",
    "name": "João Silva",
    "messages": [...],
    "intent": "orçamento",
    "sentiment": "positivo",
    "priority": "alta",
    "status": "novo"
  }
}
```

#### 4. Atualizar Status do Lead
```http
PATCH /leads/5511999999999/status
Content-Type: application/json

{
  "status": "em_atendimento"
}
```

#### 5. Estatísticas
```http
GET /leads/stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "novo": 50,
      "em_atendimento": 70,
      "finalizado": 30
    },
    "byPriority": {
      "baixa": 40,
      "média": 80,
      "alta": 30
    },
    "byIntent": {
      "orçamento": 60,
      "dúvida": 50,
      "suporte": 30,
      "outro": 10
    }
  }
}
```

## 📁 Estrutura de Pastas

```
whatsapp-lead-system/
├── src/
│   ├── bot/                    # Lógica do WhatsApp
│   │   ├── connect.js          # Conexão com WhatsApp
│   │   ├── messageHandler.js   # Processamento de mensagens
│   │   └── flows/              # Fluxos de conversa
│   │       └── welcomeFlow.js  # Fluxo de boas-vindas
│   ├── controllers/            # Controllers da API
│   │   ├── leadController.js   # CRUD de leads
│   │   └── statusController.js # Status do sistema
│   ├── models/                 # Schemas do MongoDB
│   │   └── Lead.js             # Modelo de Lead
│   ├── routes/                 # Rotas da API
│   │   ├── leadRoutes.js       # Rotas de leads
│   │   └── statusRoutes.js     # Rotas de status
│   ├── services/               # Lógica de negócio
│   │   ├── aiService.js        # Integração com IA
│   │   ├── leadService.js      # Gerenciamento de leads
│   │   └── whatsappService.js  # Funções do WhatsApp
│   ├── utils/                  # Utilitários
│   │   ├── database.js         # Conexão MongoDB
│   │   └── logger.js           # Sistema de logs
│   ├── app.js                  # Configuração Express
│   └── server.js               # Ponto de entrada
├── auth_info/                  # Sessão do WhatsApp (auto-gerado)
├── logs/                       # Arquivos de log (auto-gerado)
├── .env                        # Variáveis de ambiente
├── .env.example                # Exemplo de .env
├── .gitignore                  # Arquivos ignorados pelo git
├── ecosystem.config.js         # Configuração PM2
├── package.json                # Dependências
└── README.md                   # Este arquivo
```

## 📊 Logs

Os logs são salvos em:
- `logs/app.log` - Todos os logs
- `logs/error.log` - Apenas erros
- `logs/pm2-out.log` - Saída do PM2
- `logs/pm2-error.log` - Erros do PM2

### Visualizar logs em tempo real

```bash
# Com npm
npm run dev

# Com PM2
pm2 logs whatsapp-lead-system
```

## 🌐 Deployment

### Opção 1: VPS (DigitalOcean, AWS, etc)

```bash
# 1. Clonar repositório
git clone <seu-repo>
cd whatsapp-lead-system

# 2. Instalar dependências
npm install --production

# 3. Configurar .env
nano .env

# 4. Iniciar com PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Opção 2: Docker

```dockerfile
# Criar Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Opção 3: Heroku

```bash
# Adicionar Procfile
echo "web: npm start" > Procfile

# Deploy
heroku create meu-app
git push heroku main
```

## ⚠️ Avisos Importantes

### Uso Educacional

Este projeto foi criado para fins **educacionais** e de **portfólio**. Não é um produto oficial do WhatsApp ou Meta.

### Termos de Uso do WhatsApp

- ❌ Não use para SPAM
- ❌ Não envie mensagens não solicitadas
- ❌ Respeite a privacidade dos usuários
- ✅ Use apenas para atendimento legítimo
- ✅ Tenha consentimento dos contatos

### Limitações

- Não é afiliado ao WhatsApp ou Meta
- Usa WhatsApp Web (não é API oficial)
- Pode quebrar se o WhatsApp atualizar o protocolo
- Requer WhatsApp ativo no celular

### Segurança

- ✅ Nunca compartilhe seu arquivo `.env`
- ✅ Mantenha as credenciais seguras
- ✅ Use HTTPS em produção
- ✅ Implemente autenticação na API se expor publicamente

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Boas práticas

- Mantenha o código comentado
- Siga o estilo existente
- Teste suas alterações
- Atualize a documentação se necessário

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ para fins educacionais e de portfólio.

---

## 📚 Recursos Adicionais

### Documentação Relacionada

- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Google Gemini](https://ai.google.dev/docs)

### Próximos Passos Sugeridos

- [ ] Adicionar interface web para gerenciar leads
- [ ] Implementar webhook para notificações
- [ ] Adicionar suporte a áudio/imagem
- [ ] Criar dashboard com gráficos
- [ ] Implementar autenticação JWT na API
- [ ] Adicionar testes automatizados
- [ ] Criar documentação OpenAPI/Swagger

---

**⭐ Se este projeto te ajudou, deixe uma estrela!**
