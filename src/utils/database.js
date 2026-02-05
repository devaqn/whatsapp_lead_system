/**
 * UTILITÁRIO: CONEXÃO COM BANCO DE DADOS
 * 
 * Este arquivo gerencia a conexão com o SQLite.
 * SQLite é um banco de dados local em arquivo, perfeito para começar.
 * 
 * Vantagens do SQLite:
 * - ✅ Zero configuração (não precisa instalar servidor)
 * - ✅ Tudo em um arquivo .db
 * - ✅ Rápido e confiável
 * - ✅ Perfeito para desenvolvimento e pequenos projetos
 * - ✅ Fácil migrar depois para PostgreSQL/MySQL
 * 
 * Funcionalidades:
 * - Conectar ao banco (cria arquivo se não existir)
 * - Criar tabelas automaticamente
 * - Executar queries de forma segura
 * - Fechar conexão quando necessário
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const log = require('./logger');

// Variável global para armazenar a conexão
let db = null;

/**
 * Conectar ao SQLite
 * 
 * Esta função:
 * 1. Cria o diretório do banco se não existir
 * 2. Abre/cria o arquivo .db
 * 3. Cria as tabelas necessárias
 * 4. Configura otimizações
 * 
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    log.info('Conectando ao SQLite...');

    // Pega o caminho do banco das variáveis de ambiente
    const dbPath = process.env.DATABASE_PATH || './database/leads.db';
    
    // Garante que o diretório existe
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      log.info('Diretório do banco criado:', { path: dbDir });
    }

    // Conecta ao banco (cria o arquivo se não existir)
    db = new Database(dbPath, {
      // verbose: console.log // Descomente para ver todas as queries
    });

    log.info('SQLite conectado com sucesso!', { path: dbPath });

    // Configurações de performance
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging (mais rápido)
    db.pragma('synchronous = NORMAL'); // Balanço entre segurança e velocidade
    db.pragma('cache_size = 10000'); // Cache de 10MB

    // Cria as tabelas se não existirem
    createTables();

    log.info('Tabelas verificadas/criadas com sucesso');

  } catch (error) {
    log.error('Falha ao conectar no SQLite:', error);
    throw error;
  }
}

/**
 * Cria as tabelas do banco de dados
 * 
 * Tabela LEADS:
 * - Armazena informações dos leads
 * - Cada lead é único por phoneNumber
 * - Índices para buscas rápidas
 * 
 * Tabela MESSAGES:
 * - Armazena histórico de mensagens
 * - Relacionada com LEADS via phoneNumber
 * - Ordenada por timestamp
 */
function createTables() {
  try {
    // Tabela de Leads
    db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber TEXT NOT NULL UNIQUE,
        name TEXT DEFAULT 'Não informado',
        intent TEXT DEFAULT 'outro',
        sentiment TEXT DEFAULT 'neutro',
        priority TEXT DEFAULT 'média',
        status TEXT DEFAULT 'novo',
        lastInteraction TEXT DEFAULT CURRENT_TIMESTAMP,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices para buscas rápidas
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leads_phoneNumber ON leads(phoneNumber);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
      CREATE INDEX IF NOT EXISTS idx_leads_intent ON leads(intent);
      CREATE INDEX IF NOT EXISTS idx_leads_lastInteraction ON leads(lastInteraction DESC);
    `);

    // Tabela de Mensagens
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber TEXT NOT NULL,
        text TEXT NOT NULL,
        sender TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (phoneNumber) REFERENCES leads(phoneNumber) ON DELETE CASCADE
      )
    `);

    // Índice para buscar mensagens de um lead rapidamente
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_phoneNumber ON messages(phoneNumber);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
    `);

    log.info('Tabelas criadas/verificadas');

  } catch (error) {
    log.error('Erro ao criar tabelas:', error);
    throw error;
  }
}

/**
 * Desconectar do SQLite
 * 
 * Deve ser chamada quando a aplicação for encerrada
 * 
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  try {
    if (db) {
      db.close();
      db = null;
      log.info('SQLite desconectado');
    }
  } catch (error) {
    log.error('Erro ao desconectar do SQLite:', error);
  }
}

/**
 * Verifica se está conectado ao SQLite
 * 
 * @returns {Boolean} - true se conectado, false se não
 */
function isConnected() {
  return db !== null && db.open;
}

/**
 * Retorna a instância do banco
 * 
 * Use esta função quando precisar executar queries diretamente
 * 
 * @returns {Database} - Instância do SQLite
 */
function getDB() {
  if (!db) {
    throw new Error('Banco de dados não conectado. Chame connectDB() primeiro.');
  }
  return db;
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
  connectDB,
  disconnectDB,
  isConnected,
  getDB,
};
