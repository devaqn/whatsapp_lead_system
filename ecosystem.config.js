/**
 * CONFIGURAÇÃO DO PM2
 * 
 * Este arquivo configura como o PM2 irá gerenciar nossa aplicação.
 * PM2 é um gerenciador de processos para Node.js que mantém a aplicação rodando
 * mesmo após reiniciar o servidor ou em caso de crashes.
 * 
 * Para usar:
 * - Instalar PM2 globalmente: npm install -g pm2
 * - Iniciar: npm run pm2:start
 * - Ver logs: npm run pm2:logs
 * - Parar: npm run pm2:stop
 * - Reiniciar: npm run pm2:restart
 */

module.exports = {
  apps: [
    {
      // Nome da aplicação no PM2
      name: 'whatsapp-lead-system',
      
      // Arquivo principal a ser executado
      script: 'src/server.js',
      
      // Número de instâncias (cluster mode)
      // 1 = uma única instância
      // 'max' = uma instância por CPU disponível
      instances: 1,
      
      // Modo de execução
      // 'fork' = processo único
      // 'cluster' = múltiplos processos balanceados
      exec_mode: 'fork',
      
      // Reiniciar automaticamente se a aplicação crashar
      autorestart: true,
      
      // Observar mudanças nos arquivos e reiniciar (útil em dev)
      // Em produção, deixe false
      watch: false,
      
      // Limite de memória (se ultrapassar, reinicia)
      max_memory_restart: '500M',
      
      // Variáveis de ambiente
      env: {
        NODE_ENV: 'development',
      },
      
      env_production: {
        NODE_ENV: 'production',
      },
      
      // Configuração de logs
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Combinar logs em um único arquivo
      combine_logs: true,
      
      // Manter logs mesmo após parar a aplicação
      merge_logs: true,
    },
  ],
};
