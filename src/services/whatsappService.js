/**
 * SERVICE: WHATSAPP
 * 
 * Este serviço fornece funções auxiliares para o WhatsApp.
 * 
 * Responsabilidades:
 * - Formatar números de telefone
 * - Extrair informações de contatos
 * - Enviar mensagens
 * - Validar números
 * 
 * Este serviço funciona como uma camada de abstração sobre o Baileys,
 * facilitando o uso em outros módulos.
 */

const log = require('../utils/logger');

/**
 * Formata um número de telefone para o padrão do WhatsApp
 * 
 * O WhatsApp usa o formato: CODIGOPAIS + DDD + NUMERO@s.whatsapp.net
 * Exemplo: 5511999999999@s.whatsapp.net
 * 
 * @param {String} number - Número a ser formatado
 * @returns {String} - Número formatado
 */
function formatPhoneNumber(number) {
  // Remove caracteres não numéricos
  let cleaned = number.replace(/\D/g, '');

  // Se não tiver o código do país (55 para Brasil), adiciona
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }

  return cleaned;
}

/**
 * Converte número para o JID do WhatsApp
 * 
 * JID (Jabber ID) é o identificador único usado pelo WhatsApp
 * 
 * @param {String} phoneNumber - Número de telefone
 * @returns {String} - JID formatado
 */
function toJID(phoneNumber) {
  const formatted = formatPhoneNumber(phoneNumber);
  return `${formatted}@s.whatsapp.net`;
}

/**
 * Extrai o número de telefone de um JID
 * 
 * @param {String} jid - JID do WhatsApp (ex: 5511999999999@s.whatsapp.net)
 * @returns {String} - Número de telefone limpo (ex: 5511999999999)
 */
function extractPhoneFromJID(jid) {
  return jid.split('@')[0];
}

/**
 * Extrai informações do remetente de uma mensagem
 * 
 * @param {Object} message - Objeto de mensagem do Baileys
 * @returns {Object} - Objeto com phoneNumber e name
 */
function extractSenderInfo(message) {
  try {
    // O JID do remetente
    const jid = message.key.remoteJid;
    
    // Extrai o número
    const phoneNumber = extractPhoneFromJID(jid);
    
    // Tenta pegar o nome do contato
    // Se não houver, usa "Desconhecido"
    const name = message.pushName || 'Não informado';

    return {
      phoneNumber,
      name,
      jid,
    };

  } catch (error) {
    log.error('Erro ao extrair informações do remetente:', error);
    return {
      phoneNumber: 'unknown',
      name: 'Não informado',
      jid: 'unknown@s.whatsapp.net',
    };
  }
}

/**
 * Extrai o texto de uma mensagem
 * 
 * O Baileys pode receber diferentes tipos de mensagem.
 * Esta função tenta extrair o texto de forma segura.
 * 
 * @param {Object} message - Objeto de mensagem do Baileys
 * @returns {String|null} - Texto da mensagem ou null
 */
function extractMessageText(message) {
  try {
    // Mensagens de texto normal
    if (message.message?.conversation) {
      return message.message.conversation;
    }

    // Mensagens de texto estendido
    if (message.message?.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }

    // Mensagens com imagem e legenda
    if (message.message?.imageMessage?.caption) {
      return message.message.imageMessage.caption;
    }

    // Mensagens com vídeo e legenda
    if (message.message?.videoMessage?.caption) {
      return message.message.videoMessage.caption;
    }

    // Se não conseguiu extrair, retorna null
    return null;

  } catch (error) {
    log.error('Erro ao extrair texto da mensagem:', error);
    return null;
  }
}

/**
 * Envia uma mensagem de texto
 * 
 * @param {Object} sock - Instância do socket do Baileys
 * @param {String} to - JID ou número de telefone do destinatário
 * @param {String} text - Texto a ser enviado
 * @returns {Promise<void>}
 */
async function sendMessage(sock, to, text) {
  try {
    // Garante que o destinatário está no formato JID
    const jid = to.includes('@') ? to : toJID(to);

    log.whatsapp('Enviando mensagem', { to: jid });

    await sock.sendMessage(jid, { text });

    log.whatsapp('Mensagem enviada com sucesso', { to: jid });

  } catch (error) {
    log.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

/**
 * Verifica se uma mensagem é de um número específico
 * 
 * Útil para filtrar mensagens de números admin ou bloqueados
 * 
 * @param {Object} message - Objeto de mensagem do Baileys
 * @param {String} phoneNumber - Número para verificar
 * @returns {Boolean} - true se for do número, false se não
 */
function isMessageFrom(message, phoneNumber) {
  const senderPhone = extractPhoneFromJID(message.key.remoteJid);
  const formattedPhone = formatPhoneNumber(phoneNumber);
  return senderPhone === formattedPhone;
}

/**
 * Verifica se a mensagem é do próprio bot
 * 
 * Importante para evitar loops infinitos de respostas
 * 
 * @param {Object} message - Objeto de mensagem do Baileys
 * @returns {Boolean} - true se for do bot, false se não
 */
function isMessageFromMe(message) {
  return message.key.fromMe === true;
}

/**
 * Valida se um número de WhatsApp existe
 * 
 * @param {Object} sock - Instância do socket do Baileys
 * @param {String} phoneNumber - Número a ser validado
 * @returns {Promise<Boolean>} - true se existe, false se não
 */
async function isValidWhatsAppNumber(sock, phoneNumber) {
  try {
    const jid = toJID(phoneNumber);
    
    // onWhatsApp verifica se o número está registrado no WhatsApp
    const [result] = await sock.onWhatsApp(jid);
    
    return result?.exists || false;

  } catch (error) {
    log.error('Erro ao validar número do WhatsApp:', error);
    return false;
  }
}

/**
 * Marca mensagem como lida
 * 
 * @param {Object} sock - Instância do socket do Baileys
 * @param {Object} message - Mensagem a ser marcada como lida
 * @returns {Promise<void>}
 */
async function markAsRead(sock, message) {
  try {
    await sock.readMessages([message.key]);
    log.whatsapp('Mensagem marcada como lida');
  } catch (error) {
    log.error('Erro ao marcar mensagem como lida:', error);
  }
}

/**
 * Simula "digitando..." no chat
 * 
 * Deixa a conversa mais natural, mostrando que o bot está processando
 * 
 * @param {Object} sock - Instância do socket do Baileys
 * @param {String} jid - JID do destinatário
 * @returns {Promise<void>}
 */
async function simulateTyping(sock, jid) {
  try {
    await sock.sendPresenceUpdate('composing', jid);
    
    // Aguarda um pouco para parecer mais natural
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Para de "digitar"
    await sock.sendPresenceUpdate('paused', jid);

  } catch (error) {
    log.error('Erro ao simular digitação:', error);
  }
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
  formatPhoneNumber,
  toJID,
  extractPhoneFromJID,
  extractSenderInfo,
  extractMessageText,
  sendMessage,
  isMessageFrom,
  isMessageFromMe,
  isValidWhatsAppNumber,
  markAsRead,
  simulateTyping,
};
