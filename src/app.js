/**
 * APP.JS - CONFIGURAÇÃO DO EXPRESS
 * 
 * Este arquivo configura a aplicação Express.
 * Express é um framework web para Node.js que facilita criar APIs REST.
 * 
 * Responsabilidades:
 * - Configurar middlewares (CORS, JSON parser, etc)
 * - Registrar rotas
 * - Configurar tratamento de erros
 * - Documentar endpoints disponíveis
 * 
 * Este arquivo NÃO inicia o servidor.
 * O servidor é iniciado em server.js
 */

const express = require('express');
const log = require('./utils/logger');

// Importa as rotas
const leadRoutes = require('./routes/leadRoutes');
const statusRoutes = require('./routes/statusRoutes');

/**
 * Cria a aplicação Express
 */
const app = express();

// ==========================================
// MIDDLEWARES GLOBAIS
// ==========================================

/**
 * Middleware: JSON Parser
 * 
 * Permite que a aplicação receba e envie JSON
 */
app.use(express.json());

/**
 * Middleware: URL Encoded
 * 
 * Permite receber dados de formulários
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Middleware: CORS
 * 
 * Permite que a API seja acessada de outros domínios
 * Importante se você quiser criar um frontend separado
 */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responde requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

/**
 * Middleware: Request Logger
 * 
 * Loga todas as requisições recebidas
 * Útil para debug e auditoria
 */
app.use((req, res, next) => {
  log.info('Requisição recebida', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
  
  next();
});

// ==========================================
// ROTAS
// ==========================================

/**
 * Rota raiz
 * 
 * GET /
 * 
 * Retorna informações sobre a API
 */
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Lead System API',
    version: '1.0.0',
    status: 'online',
    documentation: {
      endpoints: [
        {
          path: 'GET /status',
          description: 'Status detalhado do sistema',
        },
        {
          path: 'GET /health',
          description: 'Health check simples',
        },
        {
          path: 'GET /leads',
          description: 'Lista todos os leads (com filtros)',
          queryParams: ['status', 'priority', 'intent', 'page', 'limit'],
        },
        {
          path: 'GET /leads/stats',
          description: 'Estatísticas dos leads',
        },
        {
          path: 'GET /leads/:phoneNumber',
          description: 'Busca lead específico',
        },
        {
          path: 'PATCH /leads/:phoneNumber/status',
          description: 'Atualiza status do lead',
          body: { status: 'novo | em_atendimento | finalizado' },
        },
      ],
    },
  });
});

/**
 * Registra as rotas de status
 * 
 * Prefixo: /status
 * Exemplos: /status, /health
 */
app.use('/status', statusRoutes);
app.use('/health', statusRoutes);

/**
 * Registra as rotas de leads
 * 
 * Prefixo: /leads
 * Exemplos: /leads, /leads/5511999999999
 */
app.use('/leads', leadRoutes);

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

/**
 * Middleware: Rota não encontrada (404)
 * 
 * Este middleware captura todas as requisições que não
 * bateram com nenhuma rota definida
 */
app.use((req, res) => {
  log.warn('Rota não encontrada', {
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /status',
      'GET /health',
      'GET /leads',
      'GET /leads/stats',
      'GET /leads/:phoneNumber',
      'PATCH /leads/:phoneNumber/status',
    ],
  });
});

/**
 * Middleware: Tratamento global de erros
 * 
 * Este middleware captura todos os erros não tratados
 * que acontecem durante o processamento de requisições
 */
app.use((err, req, res, next) => {
  log.error('Erro não tratado na aplicação:', err);

  // Não expõe detalhes do erro em produção
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: isDevelopment ? err.message : 'Ocorreu um erro inesperado',
    ...(isDevelopment && { stack: err.stack }),
  });
});

// Exporta a aplicação para ser usada em server.js
module.exports = app;
