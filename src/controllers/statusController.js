/**
 * CONTROLLER: STATUS
 * 
 * Este controller fornece informações sobre o status do sistema.
 * 
 * Útil para:
 * - Verificar se a aplicação está funcionando (health check)
 * - Monitorar se o WhatsApp está conectado
 * - Verificar conexão com banco de dados
 * - Obter informações da versão
 */

const { isConnected } = require('../bot/connect');
const { isConnected: isDatabaseConnected } = require('../utils/database');
const log = require('../utils/logger');

/**
 * Health check da aplicação
 * 
 * GET /status
 * 
 * Retorna informações sobre o status de todos os serviços
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 */
async function getStatus(req, res) {
  try {
    log.api('GET', '/status', 'pending');

    // Verifica status do WhatsApp
    const whatsappConnected = isConnected();

    // Verifica status do banco de dados
    const databaseConnected = isDatabaseConnected();

    // Status geral da aplicação
    const status = {
      application: {
        name: 'WhatsApp Lead System',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(), // Tempo que a aplicação está rodando (segundos)
        timestamp: new Date().toISOString(),
      },
      services: {
        whatsapp: {
          connected: whatsappConnected,
          status: whatsappConnected ? 'online' : 'offline',
        },
        database: {
          connected: databaseConnected,
          status: databaseConnected ? 'online' : 'offline',
        },
        api: {
          status: 'online',
        },
      },
      health: 'ok', // Se chegou aqui, a API está funcionando
    };

    // Se algum serviço crítico está offline, marca como degraded
    if (!whatsappConnected || !databaseConnected) {
      status.health = 'degraded';
    }

    log.api('GET', '/status', 200, status);

    res.status(200).json({
      success: true,
      data: status,
    });

  } catch (error) {
    log.error('Erro no controller getStatus:', error);
    log.api('GET', '/status', 500);

    res.status(500).json({
      success: false,
      error: 'Erro ao obter status',
      message: error.message,
    });
  }
}

/**
 * Health check simples (usado por load balancers)
 * 
 * GET /health
 * 
 * Retorna apenas um status simples sem detalhes
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 */
function getHealthCheck(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

// Exporta as funções para serem usadas nas rotas
module.exports = {
  getStatus,
  getHealthCheck,
};
