/**
 * FLUXO: BOAS-VINDAS
 * 
 * Este arquivo define o fluxo de atendimento inicial automático.
 * 
 * Quando um lead envia a primeira mensagem, este fluxo:
 * 1. Dá boas-vindas
 * 2. Apresenta a empresa
 * 3. Informa que irá analisar a mensagem
 * 4. Define expectativas de tempo de resposta
 * 
 * COMO PERSONALIZAR:
 * - Edite as mensagens abaixo para refletir sua empresa
 * - Adicione mais etapas ao array 'steps' se necessário
 * - Ajuste os delays entre mensagens
 */

const log = require('../../utils/logger')
const whatsappService = require('../../services/whatsappService')

/**
 * Mensagens do fluxo de boas-vindas
 * 
 * DICA: Personalize estas mensagens com os dados da sua empresa
 */
const WELCOME_MESSAGES = {
  greeting: (name) => `Olá ${name}! 👋

Seja bem-vindo(a) ao atendimento da *${process.env.COMPANY_NAME || 'nossa empresa'}*!`,

  presentation: `Estou aqui para ajudar você! 😊

Nossa equipe foi notificada e irá analisar sua mensagem.`,

  expectations: `⏱️ *Tempo de resposta:*
• Horário comercial: até 2 horas
• Fora do horário: próximo dia útil

Fique tranquilo(a), você está na nossa lista de prioridades!`,
};

/**
 * Delay entre mensagens (em milissegundos)
 * 
 * Isso torna a conversa mais natural, como se fosse humano digitando.
 * 
 * DICA: Ajuste estes valores conforme preferir:
 * - Valores menores = respostas mais rápidas
 * - Valores maiores = parece mais "humano"
 */
const DELAYS = {
  beforeGreeting: 1000,      // 1 segundo
  beforePresentation: 2000,  // 2 segundos
  beforeExpectations: 2000,  // 2 segundos
};

/**
 * Executa o fluxo de boas-vindas
 * 
 * Esta é a função principal que orquestra todo o fluxo.
 * 
 * @param {Object} sock - Socket do WhatsApp (Baileys)
 * @param {String} jid - JID do destinatário
 * @param {String} name - Nome do lead
 * @returns {Promise<void>}
 */
async function runWelcomeFlow(sock, jid, name) {
  try {
    log.info('Iniciando fluxo de boas-vindas', { jid, name });

    // Aguarda um pouco antes de começar (mais natural)
    await sleep(DELAYS.beforeGreeting);

    // ETAPA 1: Saudação
    await whatsappService.simulateTyping(sock, jid);
    await whatsappService.sendMessage(sock, jid, WELCOME_MESSAGES.greeting(name));

    // ETAPA 2: Apresentação
    await sleep(DELAYS.beforePresentation);
    await whatsappService.simulateTyping(sock, jid);
    await whatsappService.sendMessage(sock, jid, WELCOME_MESSAGES.presentation);

    // ETAPA 3: Expectativas
    await sleep(DELAYS.beforeExpectations);
    await whatsappService.simulateTyping(sock, jid);
    await whatsappService.sendMessage(sock, jid, WELCOME_MESSAGES.expectations);

    log.info('Fluxo de boas-vindas concluído', { jid });

  } catch (error) {
    log.error('Erro ao executar fluxo de boas-vindas:', error);
    
    // Em caso de erro, tenta enviar ao menos uma mensagem simples
    try {
      await whatsappService.sendMessage(
        sock, 
        jid, 
        'Olá! Obrigado por entrar em contato. Retornaremos em breve!'
      );
    } catch (fallbackError) {
      log.error('Erro ao enviar mensagem de fallback:', fallbackError);
    }
  }
}

/**
 * Função auxiliar para criar delays
 * 
 * @param {Number} ms - Milissegundos para aguardar
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Envia resposta automática baseada na classificação da IA
 * 
 * Esta função é chamada APÓS a IA classificar a mensagem.
 * Ela envia uma resposta personalizada baseada na intenção detectada.
 * 
 * @param {Object} sock - Socket do WhatsApp
 * @param {String} jid - JID do destinatário
 * @param {Object} classification - Classificação da IA
 * @returns {Promise<void>}
 */
async function sendClassificationResponse(sock, jid, classification) {
  try {
    log.info('Enviando resposta baseada na classificação', { jid, classification });

    // Mensagens específicas para cada tipo de intenção
    const responses = {
      orçamento: `📋 *Solicitação de Orçamento*

Identificamos que você está interessado(a) em receber um orçamento.

Nossa equipe comercial está preparando uma proposta personalizada para você.

${classification.priority === 'alta' ? '🔥 Sua solicitação foi marcada como PRIORITÁRIA!' : ''}`,

      dúvida: `❓ *Dúvida Recebida*

Sua dúvida foi registrada e encaminhada para nossa equipe especializada.

Em breve você receberá uma resposta completa!`,

      suporte: `🛠️ *Suporte Técnico*

${classification.priority === 'alta' ? '🚨 URGENTE: ' : ''}Sua solicitação de suporte foi registrada.

Nossa equipe técnica está analisando e retornará o mais breve possível.`,

      outro: `✅ *Mensagem Recebida*

Obrigado pelo contato! Recebemos sua mensagem e vamos retornar em breve.`,
    };

    const message = responses[classification.intent] || responses.outro;

    await whatsappService.simulateTyping(sock, jid);
    await whatsappService.sendMessage(sock, jid, message);

    log.info('Resposta de classificação enviada', { jid });

  } catch (error) {
    log.error('Erro ao enviar resposta de classificação:', error);
  }
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
  runWelcomeFlow,
  sendClassificationResponse,
};
