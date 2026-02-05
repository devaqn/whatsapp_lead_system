/**
 * MODEL: LEAD
 * 
 * Este arquivo define as funções para manipular Leads no SQLite.
 * 
 * Com SQLite, não usamos schemas como no MongoDB.
 * Em vez disso, criamos funções que executam queries SQL.
 * 
 * Campos armazenados na tabela LEADS:
 * - id: ID único (auto-incremento)
 * - phoneNumber: número do WhatsApp (único)
 * - name: nome do lead
 * - intent: intenção (orçamento, dúvida, suporte, outro)
 * - sentiment: sentimento (positivo, neutro, negativo)
 * - priority: prioridade (baixa, média, alta)
 * - status: status (novo, em_atendimento, finalizado)
 * - lastInteraction: data da última interação
 * - createdAt: data de criação
 * - updatedAt: data de atualização
 * 
 * Campos na tabela MESSAGES:
 * - id: ID único
 * - phoneNumber: relaciona com o lead
 * - text: texto da mensagem
 * - sender: quem enviou (lead ou bot)
 * - timestamp: quando foi enviada
 */

const { getDB } = require('../utils/database');
const log = require('../utils/logger');

/**
 * Busca ou cria um lead
 * 
 * Se o lead não existir, cria um novo.
 * Se existir, retorna o existente.
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @param {String} name - Nome do lead
 * @returns {Object} - Lead encontrado ou criado
 */
function findOrCreate(phoneNumber, name = 'Não informado') {
  try {
    const db = getDB();

    // Tenta buscar o lead existente
    const existing = db.prepare(`
      SELECT * FROM leads WHERE phoneNumber = ?
    `).get(phoneNumber);

    if (existing) {
      return existing;
    }

    // Se não existe, cria um novo
    const insert = db.prepare(`
      INSERT INTO leads (phoneNumber, name)
      VALUES (?, ?)
    `);

    const result = insert.run(phoneNumber, name);

    // Busca o lead recém-criado
    const newLead = db.prepare(`
      SELECT * FROM leads WHERE id = ?
    `).get(result.lastInsertRowid);

    log.info('Novo lead criado', { phoneNumber });

    return newLead;

  } catch (error) {
    log.error('Erro em findOrCreate:', error);
    throw error;
  }
}

/**
 * Busca um lead por número de telefone
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @returns {Object|null} - Lead encontrado ou null
 */
function findByPhone(phoneNumber) {
  try {
    const db = getDB();

    const lead = db.prepare(`
      SELECT * FROM leads WHERE phoneNumber = ?
    `).get(phoneNumber);

    return lead || null;

  } catch (error) {
    log.error('Erro em findByPhone:', error);
    throw error;
  }
}

/**
 * Busca um lead com suas mensagens
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @returns {Object|null} - Lead com array de mensagens ou null
 */
function findByPhoneWithMessages(phoneNumber) {
  try {
    const db = getDB();

    // Busca o lead
    const lead = findByPhone(phoneNumber);

    if (!lead) {
      return null;
    }

    // Busca as mensagens do lead
    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE phoneNumber = ?
      ORDER BY timestamp ASC
    `).all(phoneNumber);

    // Retorna lead com array de mensagens
    return {
      ...lead,
      messages: messages || [],
    };

  } catch (error) {
    log.error('Erro em findByPhoneWithMessages:', error);
    throw error;
  }
}

/**
 * Lista todos os leads com filtros opcionais
 * 
 * @param {Object} filters - Filtros (status, priority, intent)
 * @param {Object} options - Opções de paginação
 * @returns {Object} - { leads, total }
 */
function findAll(filters = {}, options = {}) {
  try {
    const db = getDB();

    const {
      page = 1,
      limit = 50,
      sortBy = 'lastInteraction',
      sortOrder = 'DESC',
    } = options;

    // Monta a query base
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    // Adiciona filtros
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters.intent) {
      query += ' AND intent = ?';
      params.push(filters.intent);
    }

    // Adiciona ordenação
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Adiciona paginação
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Executa query
    const leads = db.prepare(query).all(...params);

    // Conta total (sem paginação)
    let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
    const countParams = [];

    if (filters.status) {
      countQuery += ' AND status = ?';
      countParams.push(filters.status);
    }

    if (filters.priority) {
      countQuery += ' AND priority = ?';
      countParams.push(filters.priority);
    }

    if (filters.intent) {
      countQuery += ' AND intent = ?';
      countParams.push(filters.intent);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    return {
      leads,
      total,
    };

  } catch (error) {
    log.error('Erro em findAll:', error);
    throw error;
  }
}

/**
 * Adiciona uma mensagem ao histórico do lead
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @param {String} text - Texto da mensagem
 * @param {String} sender - Quem enviou (lead ou bot)
 * @returns {Object} - Mensagem criada
 */
function addMessage(phoneNumber, text, sender = 'lead') {
  try {
    const db = getDB();

    // Insere a mensagem
    const insert = db.prepare(`
      INSERT INTO messages (phoneNumber, text, sender)
      VALUES (?, ?, ?)
    `);

    const result = insert.run(phoneNumber, text, sender);

    // Atualiza lastInteraction do lead
    db.prepare(`
      UPDATE leads
      SET lastInteraction = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
      WHERE phoneNumber = ?
    `).run(phoneNumber);

    // Busca a mensagem criada
    const message = db.prepare(`
      SELECT * FROM messages WHERE id = ?
    `).get(result.lastInsertRowid);

    return message;

  } catch (error) {
    log.error('Erro em addMessage:', error);
    throw error;
  }
}

/**
 * Atualiza a classificação de IA do lead
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @param {Object} classification - { intent, sentiment, priority }
 * @returns {Object} - Lead atualizado
 */
function updateClassification(phoneNumber, classification) {
  try {
    const db = getDB();

    const { intent, sentiment, priority } = classification;

    db.prepare(`
      UPDATE leads
      SET intent = ?,
          sentiment = ?,
          priority = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE phoneNumber = ?
    `).run(intent, sentiment, priority, phoneNumber);

    return findByPhone(phoneNumber);

  } catch (error) {
    log.error('Erro em updateClassification:', error);
    throw error;
  }
}

/**
 * Atualiza o status do lead
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @param {String} status - Novo status
 * @returns {Object} - Lead atualizado
 */
function updateStatus(phoneNumber, status) {
  try {
    const db = getDB();

    db.prepare(`
      UPDATE leads
      SET status = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE phoneNumber = ?
    `).run(status, phoneNumber);

    return findByPhone(phoneNumber);

  } catch (error) {
    log.error('Erro em updateStatus:', error);
    throw error;
  }
}

/**
 * Obtém estatísticas dos leads
 * 
 * @returns {Object} - Estatísticas agregadas
 */
function getStats() {
  try {
    const db = getDB();

    // Total de leads
    const { total } = db.prepare('SELECT COUNT(*) as total FROM leads').get();

    // Por status
    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
    `).all();

    // Por prioridade
    const byPriority = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM leads
      GROUP BY priority
    `).all();

    // Por intenção
    const byIntent = db.prepare(`
      SELECT intent, COUNT(*) as count
      FROM leads
      GROUP BY intent
    `).all();

    // Formata o resultado
    const stats = {
      total,
      byStatus: {},
      byPriority: {},
      byIntent: {},
    };

    byStatus.forEach(row => {
      stats.byStatus[row.status] = row.count;
    });

    byPriority.forEach(row => {
      stats.byPriority[row.priority] = row.count;
    });

    byIntent.forEach(row => {
      stats.byIntent[row.intent] = row.count;
    });

    return stats;

  } catch (error) {
    log.error('Erro em getStats:', error);
    throw error;
  }
}

/**
 * Conta total de mensagens de um lead
 * 
 * @param {String} phoneNumber - Número do WhatsApp
 * @returns {Number} - Total de mensagens
 */
function countMessages(phoneNumber) {
  try {
    const db = getDB();

    const { total } = db.prepare(`
      SELECT COUNT(*) as total
      FROM messages
      WHERE phoneNumber = ?
    `).get(phoneNumber);

    return total;

  } catch (error) {
    log.error('Erro em countMessages:', error);
    throw error;
  }
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
  findOrCreate,
  findByPhone,
  findByPhoneWithMessages,
  findAll,
  addMessage,
  updateClassification,
  updateStatus,
  getStats,
  countMessages,
};
