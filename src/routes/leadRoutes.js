/**
 * ROTAS: LEADS
 * 
 * Define as rotas HTTP para gerenciar leads.
 * 
 * Rotas disponíveis:
 * - GET    /leads           - Lista todos os leads (com filtros)
 * - GET    /leads/stats     - Estatísticas dos leads
 * - GET    /leads/:phone    - Busca lead específico
 * - PATCH  /leads/:phone/status - Atualiza status do lead
 */

const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

/**
 * GET /leads/stats
 * 
 * Obtém estatísticas dos leads
 * 
 * IMPORTANTE: Esta rota deve vir ANTES de /leads/:phoneNumber
 * Senão o Express vai entender "stats" como um phoneNumber
 */
router.get('/stats', leadController.getStats);

/**
 * GET /leads
 * 
 * Lista todos os leads com filtros opcionais
 * 
 * Query params (opcionais):
 * - status: filtrar por status (novo, em_atendimento, finalizado)
 * - priority: filtrar por prioridade (baixa, média, alta)
 * - intent: filtrar por intenção (orçamento, dúvida, suporte, outro)
 * - page: número da página (padrão: 1)
 * - limit: itens por página (padrão: 50)
 * - sortBy: campo para ordenar (padrão: lastInteraction)
 * - sortOrder: ordem (asc ou desc, padrão: desc)
 * 
 * Exemplos:
 * - GET /leads
 * - GET /leads?status=novo
 * - GET /leads?priority=alta&status=novo
 * - GET /leads?page=2&limit=20
 */
router.get('/', leadController.listLeads);

/**
 * GET /leads/:phoneNumber
 * 
 * Busca um lead específico pelo número de telefone
 * 
 * Params:
 * - phoneNumber: número do WhatsApp (formato: 5511999999999)
 * 
 * Exemplo:
 * - GET /leads/5511999999999
 */
router.get('/:phoneNumber', leadController.getLeadByPhone);

/**
 * PATCH /leads/:phoneNumber/status
 * 
 * Atualiza o status de um lead
 * 
 * Params:
 * - phoneNumber: número do WhatsApp
 * 
 * Body:
 * - status: novo status (novo, em_atendimento, finalizado)
 * 
 * Exemplo:
 * PATCH /leads/5511999999999/status
 * Body: { "status": "em_atendimento" }
 */
router.patch('/:phoneNumber/status', leadController.updateLeadStatus);

// Exporta o router para ser usado no app.js
module.exports = router;
