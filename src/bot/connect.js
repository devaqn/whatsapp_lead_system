/**
 * BOT: CONEXÃO COM WHATSAPP
 * 
 * Este arquivo gerencia a conexão com o WhatsApp usando Baileys.
 * 
 * O que acontece aqui:
 * 1. Cria uma instância do socket do WhatsApp
 * 2. Gerencia autenticação (QR Code)
 * 3. Salva sessão para não precisar escanear QR toda vez
 * 4. Reconecta automaticamente se cair
 * 5. Emite eventos que são capturados pelo messageHandler
 * 
 * IMPORTANTE: Este arquivo apenas gerencia a CONEXÃO.
 * O tratamento de mensagens fica no messageHandler.js
 */

const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const log = require('../utils/logger');

// Variável global para armazenar o socket
let sock = null;

/**
 * Inicia a conexão com o WhatsApp
 * 
 * @param {Function} messageHandler - Função que será chamada quando receber mensagem
 * @returns {Promise<Object>} - Retorna o socket conectado
 */
async function connectToWhatsApp(messageHandler) {
  try {
    log.info('Iniciando conexão com WhatsApp...');

    // Carrega a versão mais recente do Baileys
    // Isso garante compatibilidade com o WhatsApp
    const { version, isLatest } = await fetchLatestBaileysVersion();
    log.info('Versão do Baileys', { version, isLatest });

    // Gerencia a autenticação usando arquivos
    // Salva as credenciais na pasta 'auth_info'
    // Na primeira vez, vai gerar QR Code
    // Nas próximas, vai reutilizar as credenciais salvas
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    // Cria o socket (conexão) com o WhatsApp
    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false, // Vamos tratar o QR manualmente
      
      // Configurações do logger do Baileys
      logger: {
        level: 'silent', // Desativa logs internos do Baileys
        child: () => ({
          level: 'silent',
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          fatal: () => {},
        }),
        trace: () => {},
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        fatal: () => {},
      },

      // Configurações adicionais
      browser: ['WhatsApp Lead System', 'Chrome', '1.0.0'],
      markOnlineOnConnect: true, // Marca como online ao conectar
    });

    // ==========================================
    // EVENTOS DA CONEXÃO
    // ==========================================

    /**
     * Evento: connection.update
     * 
     * Disparado quando há mudança no status da conexão
     * (conectando, conectado, desconectado, QR code, etc)
     */
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Se recebeu QR Code, exibe no terminal
      if (qr) {
        log.info('QR Code gerado! Escaneie com seu WhatsApp:');
        qrcode.generate(qr, { small: true });
      }

      // Se conectou com sucesso
      if (connection === 'open') {
        log.info('✅ WhatsApp conectado com sucesso!');
      }

      // Se desconectou
      if (connection === 'close') {
        const shouldReconnect = 
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

        log.warn('Conexão fechada', {
          statusCode: lastDisconnect?.error?.output?.statusCode,
          shouldReconnect,
        });

        // Se não foi logout manual, reconecta
        if (shouldReconnect) {
          log.info('Reconectando em 5 segundos...');
          setTimeout(() => {
            connectToWhatsApp(messageHandler);
          }, 5000);
        } else {
          log.error('Deslogado do WhatsApp. Escaneie o QR novamente.');
        }
      }
    });

    /**
     * Evento: creds.update
     * 
     * Disparado quando as credenciais são atualizadas
     * Salva as credenciais para não precisar escanear QR novamente
     */
    sock.ev.on('creds.update', saveCreds);

    /**
     * Evento: messages.upsert
     * 
     * Disparado quando recebe novas mensagens
     * Aqui passamos a mensagem para o handler que vai processar
     */
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      // type pode ser 'notify' (nova mensagem) ou 'append' (histórico)
      // Só processamos mensagens novas
      if (type === 'notify') {
        for (const message of messages) {
          // Chama o handler que foi passado como parâmetro
          // O handler está definido em messageHandler.js
          if (messageHandler) {
            await messageHandler(sock, message);
          }
        }
      }
    });

    log.info('Listeners de eventos configurados');

    return sock;

  } catch (error) {
    log.error('Erro ao conectar no WhatsApp:', error);
    throw error;
  }
}

/**
 * Retorna o socket atual
 * 
 * Útil para outros módulos acessarem o socket sem precisar
 * passar por parâmetro toda vez
 * 
 * @returns {Object|null} - Socket do WhatsApp ou null se não conectado
 */
function getSocket() {
  return sock;
}

/**
 * Verifica se está conectado
 * 
 * @returns {Boolean} - true se conectado, false se não
 */
function isConnected() {
  return sock !== null;
}

/**
 * Desconecta do WhatsApp
 * 
 * Deve ser chamado quando a aplicação for encerrada
 * 
 * @returns {Promise<void>}
 */
async function disconnect() {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
      log.info('Desconectado do WhatsApp');
    }
  } catch (error) {
    log.error('Erro ao desconectar do WhatsApp:', error);
  }
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
  connectToWhatsApp,
  getSocket,
  isConnected,
  disconnect,
};
