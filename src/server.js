/**
 * SERVER.JS - ARQUIVO PRINCIPAL
 * 
 * Este é o ponto de entrada da aplicação.
 * Aqui iniciamos TODOS os serviços:
 * 
 * 1. Carrega variáveis de ambiente (.env)
 * 2. Conecta ao MongoDB
 * 3. Inicia servidor Express (API REST)
 * 4. Conecta ao WhatsApp (Baileys)
 * 5. Configura handlers de shutdown gracioso
 * 
 * COMO RODAR:
 * - Desenvolvimento: npm run dev (com nodemon, reinicia ao salvar)
 * - Produção: npm start (processo único)
 * - PM2: npm run pm2:start (gerenciado pelo PM2)
 */

// ==========================================
// IMPORTAÇÕES
// ==========================================

require('dotenv').config(); // Carrega variáveis do .env

const app = require('./app');
const log = require('./utils/logger');
const { connectDB, disconnectDB } = require('./utils/database');
const { connectToWhatsApp, disconnect: disconnectWhatsApp } = require('./bot/connect');
const { routeMessage } = require('./bot/messageHandler');

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Variável para armazenar o servidor HTTP
let httpServer = null;

// ==========================================
// FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
// ==========================================

/**
 * Inicia todos os serviços da aplicação
 * 
 * Ordem de inicialização:
 * 1. Valida variáveis de ambiente
 * 2. Conecta ao banco de dados
 * 3. Inicia servidor HTTP (API)
 * 4. Conecta ao WhatsApp
 */
async function startServer() {
  try {
    log.info('='.repeat(50));
    log.info('🚀 Iniciando WhatsApp Lead System...');
    log.info('='.repeat(50));

    // ==========================================
    // ETAPA 1: VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
    // ==========================================

    log.info('Validando variáveis de ambiente...');

    const requiredEnvVars = [
      'AI_PROVIDER',
    ];

    // Verifica se tem as variáveis obrigatórias
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Variáveis de ambiente obrigatórias não configuradas: ${missingVars.join(', ')}\n` +
        'Configure-as no arquivo .env (use .env.example como referência)'
      );
    }

    // Verifica se tem a API key da IA escolhida
    const aiProvider = process.env.AI_PROVIDER;
    if (aiProvider === 'openai' && !process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada no .env');
    }
    if (aiProvider === 'gemini' && !process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada no .env');
    }

    log.info('✓ Variáveis de ambiente validadas');

    // ==========================================
    // ETAPA 2: CONEXÃO COM BANCO DE DADOS
    // ==========================================

    log.info('Conectando ao SQLite...');
    await connectDB();
    log.info('✓ SQLite conectado');

    // ==========================================
    // ETAPA 3: INICIAR SERVIDOR HTTP (API)
    // ==========================================

    log.info(`Iniciando servidor HTTP na porta ${PORT}...`);

    httpServer = app.listen(PORT, () => {
      log.info('✓ Servidor HTTP iniciado', {
        port: PORT,
        environment: NODE_ENV,
        url: `http://localhost:${PORT}`,
      });

      log.info('');
      log.info('📡 Endpoints disponíveis:');
      log.info(`   - GET  http://localhost:${PORT}/`);
      log.info(`   - GET  http://localhost:${PORT}/status`);
      log.info(`   - GET  http://localhost:${PORT}/health`);
      log.info(`   - GET  http://localhost:${PORT}/leads`);
      log.info(`   - GET  http://localhost:${PORT}/leads/stats`);
      log.info('');
    });

    // ==========================================
    // ETAPA 4: CONEXÃO COM WHATSAPP
    // ==========================================

    log.info('Conectando ao WhatsApp...');
    log.info('⚠️  Se for a primeira vez, será gerado um QR Code');
    log.info('⚠️  Escaneie o QR Code com seu WhatsApp');
    log.info('');

    await connectToWhatsApp(routeMessage);

    log.info('');
    log.info('='.repeat(50));
    log.info('✅ Sistema inicializado com sucesso!');
    log.info('='.repeat(50));
    log.info('');
    log.info('💡 Dicas:');
    log.info('   - Envie uma mensagem para o WhatsApp conectado');
    log.info('   - Acesse http://localhost:' + PORT + '/status para ver o status');
    log.info('   - Acesse http://localhost:' + PORT + '/leads para ver os leads');
    log.info('   - Pressione Ctrl+C para parar o servidor');
    log.info('');

  } catch (error) {
    log.error('❌ Erro ao iniciar servidor:', error);
    
    // Se houver erro, tenta fazer shutdown gracioso
    await gracefulShutdown('Erro na inicialização');
    process.exit(1);
  }
}

// ==========================================
// SHUTDOWN GRACIOSO
// ==========================================

/**
 * Desliga a aplicação de forma organizada
 * 
 * Ordem de desligamento:
 * 1. Para de aceitar novas requisições HTTP
 * 2. Aguarda requisições em andamento terminarem
 * 3. Desconecta do WhatsApp
 * 4. Desconecta do banco de dados
 * 5. Finaliza o processo
 * 
 * @param {String} signal - Nome do sinal recebido (SIGTERM, SIGINT, etc)
 */
async function gracefulShutdown(signal) {
  log.info('');
  log.info('='.repeat(50));
  log.info(`🛑 Recebido sinal de shutdown: ${signal}`);
  log.info('Encerrando aplicação de forma organizada...');
  log.info('='.repeat(50));

  try {
    // 1. Para o servidor HTTP
    if (httpServer) {
      log.info('Parando servidor HTTP...');
      
      await new Promise((resolve, reject) => {
        httpServer.close((err) => {
          if (err) {
            reject(err);
          } else {
            log.info('✓ Servidor HTTP parado');
            resolve();
          }
        });
      });
    }

    // 2. Desconecta do WhatsApp
    log.info('Desconectando do WhatsApp...');
    await disconnectWhatsApp();
    log.info('✓ WhatsApp desconectado');

    // 3. Desconecta do banco de dados
    log.info('Desconectando do SQLite...');
    await disconnectDB();
    log.info('✓ SQLite desconectado');

    log.info('');
    log.info('✅ Aplicação encerrada com sucesso');
    log.info('');

  } catch (error) {
    log.error('❌ Erro durante shutdown:', error);
  } finally {
    process.exit(0);
  }
}

// ==========================================
// LISTENERS DE SINAIS DO SISTEMA
// ==========================================

/**
 * SIGTERM: Sinal enviado por gerenciadores de processo (PM2, Docker, Kubernetes)
 * quando querem desligar a aplicação de forma organizada
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

/**
 * SIGINT: Sinal enviado quando pressiona Ctrl+C no terminal
 */
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * uncaughtException: Captura erros não tratados
 * 
 * IMPORTANTE: Esta é uma rede de segurança, mas não deve ser usada
 * como tratamento principal de erros. Sempre trate erros adequadamente.
 */
process.on('uncaughtException', (error) => {
  log.error('❌ Erro não capturado (uncaughtException):', error);
  gracefulShutdown('uncaughtException');
});

/**
 * unhandledRejection: Captura promises rejeitadas sem catch
 * 
 * IMPORTANTE: Sempre use try/catch em código async ou .catch() em promises
 */
process.on('unhandledRejection', (reason, promise) => {
  log.error('❌ Promise rejeitada não tratada (unhandledRejection):', {
    reason,
    promise,
  });
  gracefulShutdown('unhandledRejection');
});

// ==========================================
// INICIA A APLICAÇÃO
// ==========================================

// Só inicia se este arquivo for executado diretamente
// (não quando importado em testes)
if (require.main === module) {
  startServer();
}

// Exporta para permitir testes
module.exports = { startServer, gracefulShutdown };
