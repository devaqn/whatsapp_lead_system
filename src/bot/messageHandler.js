/**
 * BOT: HANDLER DE MENSAGENS
 * 
 * Este é o CÉREBRO do sistema de atendimento.
 * Toda mensagem recebida passa por aqui.
 * 
 * FLUXO COMPLETO:
 * 1. Recebe mensagem do WhatsApp
 * 2. Valida se deve processar (ignora do próprio bot, status, etc)
 * 3. Extrai informações (número, nome, texto)
 * 4. Busca ou cria o lead no banco
 * 5. Adiciona mensagem ao histórico
 * 6. Se for primeira mensagem: executa fluxo de boas-vindas
 * 7. Classifica mensagem com IA
 * 8. Atualiza classificação no banco
 * 9. Envia resposta automática baseada na classificação
 * 10. Marca mensagem como lida
 * 
 * ONDE MODIFICAR:
 * - Para mudar o fluxo de atendimento, edite welcomeFlow.js
 * - Para mudar a classificação de IA, edite aiService.js
 * - Para adicionar novos tipos de mensagem, adicione no switch abaixo
 */

const log = require('../utils/logger');
const whatsappService = require('../services/whatsappService');
const leadService = require('../services/leadService');
const aiService = require('../services/aiService');
const { runWelcomeFlow, sendClassificationResponse } = require('./flows/welcomeFlow');

/**
 * Handler principal de mensagens
 * 
 * Esta função é chamada automaticamente sempre que uma mensagem chega.
 * 
 * @param {Object} sock - Socket do WhatsApp (Baileys)
 * @param {Object} message - Objeto da mensagem recebida
 * @returns {Promise<void>}
 */
async function handleMessage(sock, message) {
  try {
    // ==========================================
    // ETAPA 1: VALIDAÇÕES INICIAIS
    // ==========================================

    // Ignora mensagens enviadas pelo próprio bot
    // Isso evita loops infinitos de respostas
    if (whatsappService.isMessageFromMe(message)) {
      log.debug('Mensagem do próprio bot, ignorando');
      return;
    }

    // Ignora mensagens de status do WhatsApp
    // Status são as atualizações que aparecem no círculo do app
    if (message.key.remoteJid === 'status@broadcast') {
      log.debug('Mensagem de status, ignorando');
      return;
    }

    // ==========================================
    // ETAPA 2: EXTRAÇÃO DE INFORMAÇÕES
    // ==========================================

    // Extrai informações do remetente
    const { phoneNumber, name, jid } = whatsappService.extractSenderInfo(message);
    
    log.whatsapp('Nova mensagem recebida', { phoneNumber, name });

    // Extrai o texto da mensagem
    const messageText = whatsappService.extractMessageText(message);

    // Se não conseguiu extrair texto, pode ser uma imagem, áudio, etc
    if (!messageText) {
      log.info('Mensagem não textual recebida', { 
        phoneNumber,
        type: Object.keys(message.message || {})[0] 
      });

      // Você pode adicionar lógica aqui para lidar com outros tipos
      // Por exemplo: processar imagens, áudios, documentos, etc
      
      await whatsappService.sendMessage(
        sock,
        jid,
        'Desculpe, no momento só consigo processar mensagens de texto. Por favor, envie sua mensagem em texto! 📝'
      );
      
      return;
    }

    log.info('Texto extraído da mensagem', { phoneNumber, messageText });

    // ==========================================
    // ETAPA 3: GERENCIAMENTO DO LEAD
    // ==========================================

    // Busca ou cria o lead no banco de dados
    const lead = leadService.createOrGetLead(phoneNumber, name);

    // Verifica se é a primeira mensagem deste lead
    const isFirstMessage = lead.messages?.length === 0 || leadService.getStats().total === 1;

    log.info('Lead identificado', { 
      phoneNumber, 
      isFirstMessage
    });

    // Adiciona a mensagem ao histórico do lead
    leadService.addMessage(phoneNumber, messageText, 'lead');

    // ==========================================
    // ETAPA 4: MARCA MENSAGEM COMO LIDA
    // ==========================================

    // Marca a mensagem como lida (✓✓ azul)
    await whatsappService.markAsRead(sock, message);

    // ==========================================
    // ETAPA 5: FLUXO DE BOAS-VINDAS (SE PRIMEIRA MENSAGEM)
    // ==========================================

    if (isFirstMessage) {
      log.info('Primeira mensagem do lead, executando fluxo de boas-vindas', { phoneNumber });
      
      // Executa o fluxo de boas-vindas
      // Este fluxo está definido em flows/welcomeFlow.js
      await runWelcomeFlow(sock, jid, name);
      
      // Atualiza o status do lead
      leadService.updateStatus(phoneNumber, 'novo');
    } else {
      log.info('Lead já conhecido, pulando boas-vindas', { phoneNumber });
    }

    // ==========================================
    // ETAPA 6: CLASSIFICAÇÃO COM IA
    // ==========================================

    log.info('Iniciando classificação da mensagem com IA', { phoneNumber });

    // Classifica a mensagem usando IA
    // A IA retorna: intent, sentiment e priority
    const classification = await aiService.classifyMessage(messageText);

    log.info('Mensagem classificada', { phoneNumber, classification });

    // Atualiza a classificação no banco de dados
    leadService.updateClassification(phoneNumber, classification);

    // ==========================================
    // ETAPA 7: RESPOSTA AUTOMÁTICA
    // ==========================================

    // Envia resposta automática baseada na classificação
    // Esta função está em flows/welcomeFlow.js
    await sendClassificationResponse(sock, jid, classification);

    // Adiciona a resposta ao histórico do lead
    const autoResponse = aiService.generateAutoResponse(classification);
    leadService.addMessage(phoneNumber, autoResponse, 'bot');

    // ==========================================
    // ETAPA 8: LOG FINAL
    // ==========================================

    log.info('Mensagem processada com sucesso', {
      phoneNumber,
      intent: classification.intent,
      sentiment: classification.sentiment,
      priority: classification.priority,
    });

  } catch (error) {
    log.error('Erro ao processar mensagem:', error);

    // Em caso de erro, tenta enviar uma mensagem de erro amigável
    try {
      const { jid } = whatsappService.extractSenderInfo(message);
      
      await whatsappService.sendMessage(
        sock,
        jid,
        'Desculpe, ocorreu um erro ao processar sua mensagem. Nossa equipe foi notificada e retornará em breve! 🙏'
      );
    } catch (fallbackError) {
      log.error('Erro ao enviar mensagem de erro:', fallbackError);
    }
  }
}

/**
 * Handler para eventos de presença (online/offline/digitando)
 * 
 * Isso é OPCIONAL, mas pode ser útil para analytics
 * 
 * @param {Object} presence - Dados de presença
 */
function handlePresenceUpdate(presence) {
  try {
    const { id, presences } = presence;
    
    log.debug('Atualização de presença', { id, presences });

    // Você pode adicionar lógica aqui para:
    // - Saber quando o lead está online
    // - Detectar quando está digitando
    // - Enviar mensagens no momento certo
    
  } catch (error) {
    log.error('Erro ao processar presença:', error);
  }
}

/**
 * Handler para eventos de grupo
 * 
 * Este handler é chamado quando o bot está em grupos
 * 
 * IMPORTANTE: Por padrão, ignoramos mensagens de grupo
 * Se quiser processar mensagens de grupo, modifique esta função
 * 
 * @param {Object} sock - Socket do WhatsApp
 * @param {Object} message - Mensagem do grupo
 */
async function handleGroupMessage(sock, message) {
  try {
    log.info('Mensagem de grupo recebida', {
      groupId: message.key.remoteJid,
    });

    // Por padrão, não respondemos em grupos
    // Isso evita spam e comportamentos indesejados
    
    // Se quiser processar mensagens de grupo, descomente:
    // await handleMessage(sock, message);

  } catch (error) {
    log.error('Erro ao processar mensagem de grupo:', error);
  }
}

/**
 * Função para determinar qual handler usar
 * 
 * Esta é a função que deve ser passada para connect.js
 * 
 * @param {Object} sock - Socket do WhatsApp
 * @param {Object} message - Mensagem recebida
 */
async function routeMessage(sock, message) {
  try {
    const jid = message.key.remoteJid;

    // Se for mensagem de grupo (termina com @g.us)
    if (jid.endsWith('@g.us')) {
      await handleGroupMessage(sock, message);
    } 
    // Se for mensagem individual (termina com @s.whatsapp.net)
    else if (jid.endsWith('@s.whatsapp.net')) {
      await handleMessage(sock, message);
    }
    // Outros tipos (broadcast, etc)
    else {
      log.debug('Tipo de mensagem não suportado', { jid });
    }

  } catch (error) {
    log.error('Erro ao rotear mensagem:', error);
  }
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
  handleMessage,
  handlePresenceUpdate,
  handleGroupMessage,
  routeMessage,
};
