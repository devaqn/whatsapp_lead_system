/**
 * ROTAS: STATUS
 * 
 * Define as rotas HTTP para verificar o status do sistema.
 * 
 * Rotas disponíveis:
 * - GET /status  - Status detalhado de todos os serviços
 * - GET /health  - Health check simples
 */

const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

/**
 * GET /status
 * 
 * Retorna status detalhado da aplicação
 * 
 * Inclui:
 * - Informações da aplicação (nome, versão, ambiente)
 * - Status do WhatsApp (conectado ou não)
 * - Status do banco de dados (conectado ou não)
 * - Status da API
 * - Health geral (ok ou degraded)
 * 
 * Exemplo de resposta:
 * {
 *   "success": true,
 *   "data": {
 *     "application": {
 *       "name": "WhatsApp Lead System",
 *       "version": "1.0.0",
 *       "environment": "production",
 *       "uptime": 3600
 *     },
 *     "services": {
 *       "whatsapp": { "connected": true, "status": "online" },
 *       "database": { "connected": true, "status": "online" },
 *       "api": { "status": "online" }
 *     },
 *     "health": "ok"
 *   }
 * }
 */
router.get('/', statusController.getStatus);

/**
 * GET /health
 * 
 * Health check simples
 * 
 * Usado por:
 * - Load balancers
 * - Monitoramento (Uptime Robot, Pingdom, etc)
 * - Kubernetes health probes
 * - Docker healthcheck
 * 
 * Retorna apenas status básico sem detalhes
 * 
 * Exemplo de resposta:
 * {
 *   "status": "ok",
 *   "timestamp": "2025-02-04T12:00:00.000Z"
 * }
 */
router.get('/health', statusController.getHealthCheck);

// Exporta o router para ser usado no app.js
module.exports = router;
