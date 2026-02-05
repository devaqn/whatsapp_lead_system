/**
 * SERVICE: INTELIGÊNCIA ARTIFICIAL
 * 
 * Este serviço é responsável por classificar mensagens usando IA.
 * Suporta OpenAI (GPT) e Google Gemini.
 * 
 * A IA analisa a mensagem e retorna:
 * - intent: intenção (orçamento, dúvida, suporte, outro)
 * - sentiment: sentimento (positivo, neutro, negativo)
 * - priority: prioridade (baixa, média, alta)
 * 
 * Como funciona:
 * 1. Recebe a mensagem do usuário
 * 2. Monta um prompt estruturado para a IA
 * 3. Envia para a API escolhida (OpenAI ou Gemini)
 * 4. Parseia a resposta em JSON
 * 5. Retorna os dados classificados
 * 
 * IMPORTANTE: Se a IA falhar, retorna valores padrão (fallback)
 */

const axios = require('axios');
const log = require('../utils/logger');

/**
 * Prompt base que será enviado para a IA
 * Este prompt instrui a IA sobre como classificar a mensagem
 */
const CLASSIFICATION_PROMPT = `Você é um assistente que classifica mensagens de clientes no WhatsApp.

Analise a mensagem abaixo e retorne APENAS um JSON válido com esta estrutura:
{
  "intent": "orçamento" | "dúvida" | "suporte" | "outro",
  "sentiment": "positivo" | "neutro" | "negativo",
  "priority": "baixa" | "média" | "alta"
}

Regras de classificação:

INTENT (intenção):
- "orçamento": cliente quer preço, valor, quanto custa, fazer pedido
- "dúvida": cliente tem dúvidas sobre produto/serviço
- "suporte": cliente precisa de ajuda técnica ou tem reclamação
- "outro": não se encaixa nas anteriores

SENTIMENT (sentimento):
- "positivo": mensagem amigável, animada, educada
- "neutro": mensagem objetiva, sem emoção clara
- "negativo": mensagem frustrada, irritada, com reclamação

PRIORITY (prioridade):
- "alta": cliente irritado, urgente, reclamação séria
- "média": pedido de orçamento, dúvida importante
- "baixa": curiosidade, informação geral

Mensagem do cliente:
"{{MESSAGE}}"

Retorne APENAS o JSON, sem explicações.`;

/**
 * Classifica uma mensagem usando OpenAI (ChatGPT)
 * 
 * @param {String} message - Mensagem a ser classificada
 * @returns {Promise<Object>} - Objeto com intent, sentiment e priority
 */
async function classifyWithOpenAI(message) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada no .env');
    }

    // Monta o prompt substituindo {{MESSAGE}} pela mensagem real
    const prompt = CLASSIFICATION_PROMPT.replace('{{MESSAGE}}', message);

    log.ai('Classificando mensagem com OpenAI', { model });

    // Faz a requisição para a API da OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Baixa temperatura = respostas mais consistentes
        max_tokens: 150,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 10000, // Timeout de 10 segundos
      }
    );

    // Extrai o texto da resposta
    const content = response.data.choices[0].message.content.trim();
    
    // Remove possíveis markdown (```json) da resposta
    const jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Parseia o JSON
    const classification = JSON.parse(jsonString);

    log.ai('Mensagem classificada com sucesso', classification);

    return classification;

  } catch (error) {
    log.error('Erro ao classificar com OpenAI:', error);
    throw error;
  }
}

/**
 * Classifica uma mensagem usando Google Gemini
 * 
 * @param {String} message - Mensagem a ser classificada
 * @returns {Promise<Object>} - Objeto com intent, sentiment e priority
 */
async function classifyWithGemini(message) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-pro';

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no .env');
    }

    // Monta o prompt substituindo {{MESSAGE}} pela mensagem real
    const prompt = CLASSIFICATION_PROMPT.replace('{{MESSAGE}}', message);

    log.ai('Classificando mensagem com Gemini', { model });

    // Faz a requisição para a API do Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 150,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    // Extrai o texto da resposta
    const content = response.data.candidates[0].content.parts[0].text.trim();
    
    // Remove possíveis markdown da resposta
    const jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Parseia o JSON
    const classification = JSON.parse(jsonString);

    log.ai('Mensagem classificada com sucesso', classification);

    return classification;

  } catch (error) {
    log.error('Erro ao classificar com Gemini:', error);
    throw error;
  }
}

/**
 * Função principal de classificação
 * 
 * Esta é a função que deve ser chamada por outros módulos.
 * Ela decide qual IA usar baseado na variável AI_PROVIDER do .env
 * e fornece fallback caso a IA falhe.
 * 
 * @param {String} message - Mensagem a ser classificada
 * @returns {Promise<Object>} - Objeto com intent, sentiment e priority
 */
async function classifyMessage(message) {
  try {
    // Validação básica
    if (!message || typeof message !== 'string') {
      throw new Error('Mensagem inválida');
    }

    // Decide qual provedor de IA usar
    const provider = process.env.AI_PROVIDER || 'openai';

    let classification;

    if (provider === 'gemini') {
      classification = await classifyWithGemini(message);
    } else {
      // Padrão é OpenAI
      classification = await classifyWithOpenAI(message);
    }

    // Valida se a resposta tem os campos necessários
    if (!classification.intent || !classification.sentiment || !classification.priority) {
      throw new Error('Resposta da IA incompleta');
    }

    return classification;

  } catch (error) {
    log.error('Erro ao classificar mensagem, usando fallback:', error);

    // FALLBACK: Se a IA falhar, retorna valores padrão
    // Isso garante que a aplicação continue funcionando
    return {
      intent: 'outro',
      sentiment: 'neutro',
      priority: 'média',
    };
  }
}

/**
 * Gera uma resposta automática baseada na classificação
 * 
 * Esta função é opcional, mas útil para responder automaticamente
 * ao cliente enquanto a IA classifica a mensagem.
 * 
 * @param {Object} classification - Classificação da mensagem
 * @returns {String} - Mensagem de resposta
 */
function generateAutoResponse(classification) {
  const companyName = process.env.COMPANY_NAME || 'Nossa Empresa';
  const { intent, priority } = classification;

  // Respostas baseadas na intenção
  const responses = {
    orçamento: `Olá! Obrigado por entrar em contato com ${companyName}. 
Vi que você tem interesse em nossos produtos/serviços. 
Nossa equipe irá te enviar um orçamento personalizado em breve! 📋`,

    dúvida: `Olá! Obrigado por entrar em contato com ${companyName}. 
Recebi sua dúvida e vou encaminhá-la para nosso time que retornará em breve! 🤝`,

    suporte: `Olá! Identificamos que você precisa de suporte. 
${priority === 'alta' ? 'Sua solicitação foi marcada como URGENTE e será priorizada!' : 'Nossa equipe técnica irá te ajudar em breve!'}
Aguarde nosso retorno. 🛠️`,

    outro: `Olá! Obrigado por entrar em contato com ${companyName}. 
Recebemos sua mensagem e retornaremos em breve! 😊`,
  };

  return responses[intent] || responses.outro;
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
  classifyMessage,
  generateAutoResponse,
};
