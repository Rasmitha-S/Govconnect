import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../backend/src/app.js';
import { BootstrapService } from '../backend/src/services/bootstrap.service.js';
import { ConnectorRegistry } from '../backend/src/connectors/connector.registry.js';

const app = createApp();

let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureInitialized(): Promise<void> {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await BootstrapService.bootstrap();
        const registry = ConnectorRegistry.getInstance();
        await registry.syncAndHealthCheckAll();
        isInitialized = true;
      } catch (err) {
        // Non-blocking log so API requests continue even if background connector ping fails
        console.warn('[Vercel Serverless] Initialization notice:', err);
      }
    })();
  }
  await initPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureInitialized();
  return (app as any)(req, res);
}
