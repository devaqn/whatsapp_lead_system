/**
 * UTILITÁRIO: LOGGER
 */

const pino = require('pino')
const fs = require('fs')
const path = require('path')

const logsDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

/**
 * Transportes do Pino (FORMA CORRETA)
 */
const transport = pino.transport({
  targets: [
    {
      target: require.resolve('pino-pretty'),
      level: 'info',
      options: {
        colorize: true,
        translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
    {
      target: require.resolve('pino/file'),
      level: 'info',
      options: {
        destination: path.join(logsDir, 'app.log'),
        mkdir: true,
      },
    },
    {
      target: require.resolve('pino/file'),
      level: 'error',
      options: {
        destination: path.join(logsDir, 'error.log'),
        mkdir: true,
      },
    },
  ],
})

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  transport
)

/**
 * Wrapper de logs
 */
const log = {
  info: (message, data = {}) => {
    logger.info({ ...data }, message)
  },

  error: (message, error = null) => {
    const errorData = error
      ? { errorMessage: error.message, errorStack: error.stack }
      : {}

    logger.error(errorData, message)
  },

  warn: (message, data = {}) => {
    logger.warn(data, message)
  },

  debug: (message, data = {}) => {
    logger.debug(data, message)
  },

  whatsapp: (event, data = {}) => {
    logger.info(
      { module: 'whatsapp', event, ...data },
      `WhatsApp: ${event}`
    )
  },

  api: (method, routePath, statusCode, data = {}) => {
    logger.info(
      {
        module: 'api',
        method,
        path: routePath,
        statusCode,
        ...data,
      },
      `API: ${method} ${routePath} - ${statusCode}`
    )
  },

  ai: (action, data = {}) => {
    logger.info(
      { module: 'ai', action, ...data },
      `IA: ${action}`
    )
  },
}

module.exports = log
