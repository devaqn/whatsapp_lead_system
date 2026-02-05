/**
 * CONTROLLER: LEADS
 * 
 * Este controller gerencia as requisições HTTP relacionadas a leads.
 * Ele é a ponte entre as rotas (Express) e os services.
 * 
 * Responsabilidades:
 * - Receber requisições HTTP
 * - Validar parâmetros
 * - Chamar os services apropriados
 * - Formatar e retornar respostas
 * - Tratar erros e retornar status codes corretos
 * 
 * Por que usar controllers?
 * - Separa a lógica HTTP da lógica de negócio
 * - Facilita testes
 * - Deixa as rotas mais limpas
 */

const leadService = require('../services/leadService');
const log = require('../utils/logger');

/**
 * Lista todos os leads
 * 
 * GET /leads
 * 
 * Query params:
 * - status: filtrar por status (novo, em_atendimento, finalizado)
 * - priority: filtrar por prioridade (baixa, média, alta)
 * - intent: filtrar por intenção (orçamento, dúvida, suporte, outro)
 * - page: página atual (padrão: 1)
 * - limit: itens por página (padrão: 50)
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 */
async function listLeads(req, res) {
  try {
    log.api('GET', '/leads', 'pending', req.query);

    // Extrai parâmetros de query
    const { status, priority, intent, page, limit, sortBy, sortOrder } = req.query;

    // Monta filtros
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (intent) filters.intent = intent;

    // Monta opções de paginação
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortBy: sortBy || 'lastInteraction',
      sortOrder: sortOrder || 'desc',
    };

    // Busca os leads
    const result = await leadService.listLeads(filters, options);

    log.api('GET', '/leads', 200, { 
      total: result.pagination.total,
      returned: result.leads.length 
    });

    // Retorna sucesso
    res.status(200).json({
      success: true,
      data: result.leads,
      pagination: result.pagination,
    });

  } catch (error) {
    log.error('Erro no controller listLeads:', error);
    log.api('GET', '/leads', 500);

    res.status(500).json({
      success: false,
      error: 'Erro ao listar leads',
      message: error.message,
    });
  }
}

/**
 * Busca um lead específico por telefone
 * 
 * GET /leads/:phoneNumber
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 */
async function getLeadByPhone(req, res) {
  try {
    const { phoneNumber } = req.params;

    log.api('GET', `/leads/${phoneNumber}`, 'pending');

    // Busca o lead
    const lead = await leadService.getLeadByPhone(phoneNumber);

    if (!lead) {
      log.api('GET', `/leads/${phoneNumber}`, 404);
      
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado',
      });
    }

    log.api('GET', `/leads/${phoneNumber}`, 200);

    res.status(200).json({
      success: true,
      data: lead,
    });

  } catch (error) {
    log.error('Erro no controller getLeadByPhone:', error);
    log.api('GET', `/leads/${req.params.phoneNumber}`, 500);

    res.status(500).json({
      success: false,
      error: 'Erro ao buscar lead',
      message: error.message,
    });
  }
}

/**
 * Atualiza o status de um lead
 * 
 * PATCH /leads/:phoneNumber/status
 * 
 * Body:
 * - status: novo status (novo, em_atendimento, finalizado)
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 */
async function updateLeadStatus(req, res) {
  try {
    const { phoneNumber } = req.params;
    const { status } = req.body;

    log.api('PATCH', `/leads/${phoneNumber}/status`, 'pending', { status });

    // Validação
    if (!status) {
      log.api('PATCH', `/leads/${phoneNumber}/status`, 400);
      
      return res.status(400).json({
        success: false,
        error: 'Status não informado',
      });
    }

    const validStatuses = ['novo', 'em_atendimento', 'finalizado'];
    if (!validStatuses.includes(status)) {
      log.api('PATCH', `/leads/${phoneNumber}/status`, 400);
      
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
        validStatuses,
      });
    }

    // Atualiza o status
    const lead = await leadService.updateStatus(phoneNumber, status);

    log.api('PATCH', `/leads/${phoneNumber}/status`, 200);

    res.status(200).json({
      success: true,
      data: lead,
    });

  } catch (error) {
    log.error('Erro no controller updateLeadStatus:', error);
    log.api('PATCH', `/leads/${req.params.phoneNumber}/status`, 500);

    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar status',
      message: error.message,
    });
  }
}

/**
 * Obtém estatísticas dos leads
 * 
 * GET /leads/stats
 * 
 * Retorna contagens por status, prioridade e intenção
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 */
async function getStats(req, res) {
  try {
    log.api('GET', '/leads/stats', 'pending');

    const stats = await leadService.getStats();

    log.api('GET', '/leads/stats', 200, stats);

    res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error) {
    log.error('Erro no controller getStats:', error);
    log.api('GET', '/leads/stats', 500);

    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
      message: error.message,
    });
  }
}

// Exporta as funções para serem usadas nas rotas
module.exports = {
  listLeads,
  getLeadByPhone,
  updateLeadStatus,
  getStats,
};
