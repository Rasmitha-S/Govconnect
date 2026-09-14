import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { ConnectorRegistry } from './connectors/connector.registry.js';
import { BootstrapService } from './services/bootstrap.service.js';

const app = createApp();

const startServer = async () => {
  try {
    // 1. Verify and activate initial authorized administrator accounts
    await BootstrapService.bootstrap();

    // 2. Initialize & sync all Government Connectors with DB
    const registry = ConnectorRegistry.getInstance();
    await registry.syncAndHealthCheckAll();
    logger.info('All Government Connectors initialized and synchronized.');

    app.listen(config.port, () => {
      logger.info(`GovConnect Backend Engine running on http://localhost:${config.port}`);
      logger.info(`API Health endpoint: http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start GovConnect server');
    process.exit(1);
  }
};

startServer();
