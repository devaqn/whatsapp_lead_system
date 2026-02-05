/**
 * SERVICE: GERENCIAMENTO DE LEADS
 * 
 * Este serviço gerencia todas as operações relacionadas a leads.
 * É a camada intermediária entre os controllers/handlers e o banco de dados.
 * 
 * Responsabilidades:
 * - Criar novos leads
 * - Buscar leads existentes
 * - Atualizar informações de leads
 * - Adicionar mensagens ao histórico
 * - Listar leads com filtros
 * 
 * Por que usar um service?
 * - Separa a lógica de negócio do acesso ao banco
 * - Facilita testes
 * - Permite reutilizar código em diferentes partes da aplicação
 */

const Lead = require('../models/Lead');
const log = require('../utils/logger');

/**
 * Cria um novo lead ou retorna um existente
 * 
 * Esta função é "idempotente": pode ser chamada várias vezes
 * com o mesmo número e não criará duplicatas.
 * 
 * @param {String} phoneNumber - Número do WhatsApp (formato: 5511999999999)
 * @param {String} name - Nome do contato
 * @returns {Object} - Lead criado ou encontrado
 */
function createOrGetLead(phoneNumber, name = 'Não informado') {
  try {
    log.info('Buscando ou criando lead', { phoneNumber });

    const lead = Lead.findOrCreate(phoneNumber, name);

    log.info('Lead obtido com sucesso', { 
      phoneNumber,
      isNew: Lead.countMessages(phoneNumber) === 0
    });

    return lead;

  } catch (error) {
    log.error('Erro ao criar/buscar lead:', error);
    throw error;
  }
}

/**
 * Adiciona uma mensagem ao histórico do lead
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @param {String} text - Texto da mensagem
 * @param {String} sender - Quem enviou ('lead' ou 'bot')
 * @returns {Object} - Mensagem criada
 */
function addMessage(phoneNumber, text, sender = 'lead') {
  try {
    log.info('Adicionando mensagem ao lead', { phoneNumber, sender });

    const message = Lead.addMessage(phoneNumber, text, sender);

    const totalMessages = Lead.countMessages(phoneNumber);

    log.info('Mensagem adicionada com sucesso', { 
      phoneNumber,
      totalMessages
    });

    return message;

  } catch (error) {
    log.error('Erro ao adicionar mensagem:', error);
    throw error;
  }
}

/**
 * Atualiza a classificação de IA do lead
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @param {Object} classification - Objeto com intent, sentiment e priority
 * @returns {Object} - Lead atualizado
 */
function updateClassification(phoneNumber, classification) {
  try {
    log.info('Atualizando classificação do lead', { phoneNumber });

    const lead = Lead.updateClassification(phoneNumber, classification);

    log.info('Classificação atualizada com sucesso', { 
      phoneNumber,
      ...classification
    });

    return lead;

  } catch (error) {
    log.error('Erro ao atualizar classificação:', error);
    throw error;
  }
}

/**
 * Atualiza o status do lead
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @param {String} status - Novo status (novo, em_atendimento, finalizado)
 * @returns {Object} - Lead atualizado
 */
function updateStatus(phoneNumber, status) {
  try {
    log.info('Atualizando status do lead', { phoneNumber, status });

    const lead = Lead.updateStatus(phoneNumber, status);

    if (!lead) {
      throw new Error(`Lead ${phoneNumber} não encontrado`);
    }

    log.info('Status atualizado com sucesso', { phoneNumber, status });

    return lead;

  } catch (error) {
    log.error('Erro ao atualizar status:', error);
    throw error;
  }
}

/**
 * Lista todos os leads com filtros opcionais
 * 
 * @param {Object} filters - Filtros (status, priority, intent)
 * @param {Object} options - Opções de paginação e ordenação
 * @returns {Object} - { leads, pagination }
 */
function listLeads(filters = {}, options = {}) {
  try {
    log.info('Listando leads', { filters, options });

    // Configurações padrão
    const {
      page = 1,
      limit = 50,
      sortBy = 'lastInteraction',
      sortOrder = 'desc',
    } = options;

    // Busca os leads
    const result = Lead.findAll(filters, {
      page,
      limit,
      sortBy,
      sortOrder: sortOrder.toUpperCase(),
    });

    const pagination = {
      total: result.total,
      page,
      limit,
      pages: Math.ceil(result.total / limit),
    };

    log.info('Leads listados com sucesso', { 
      total: result.total,
      page,
      limit,
      returned: result.leads.length 
    });

    return {
      leads: result.leads,
      pagination,
    };

  } catch (error) {
    log.error('Erro ao listar leads:', error);
    throw error;
  }
}

/**
 * Busca um lead específico pelo número
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @returns {Object|null} - Lead encontrado ou null
 */
function getLeadByPhone(phoneNumber) {
  try {
    log.info('Buscando lead por telefone', { phoneNumber });

    const lead = Lead.findByPhoneWithMessages(phoneNumber);

    if (!lead) {
      log.warn('Lead não encontrado', { phoneNumber });
      return null;
    }

    log.info('Lead encontrado', { phoneNumber });
    return lead;

  } catch (error) {
    log.error('Erro ao buscar lead:', error);
    throw error;
  }
}

/**
 * Obtém estatísticas dos leads
 * 
 * Útil para dashboards e relatórios
 * 
 * @returns {Object} - Objeto com estatísticas
 */
function getStats() {
  try {
    log.info('Obtendo estatísticas de leads');

    const stats = Lead.getStats();

    log.info('Estatísticas obtidas com sucesso', stats);

    return stats;

  } catch (error) {
    log.error('Erro ao obter estatísticas:', error);
    throw error;
  }
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
  createOrGetLead,
  addMessage,
  updateClassification,
  updateStatus,
  listLeads,
  getLeadByPhone,
  getStats,
};
