/**
 * @fileoverview Server entry point.
 *
 * Boots the Express app, binds the port, and wires graceful shutdown
 * so the database pool is drained cleanly on SIGTERM / SIGINT (Ctrl+C).
 *
 * If the port is already in use, a clear human-readable message is printed
 * instead of a raw Node crash — handy when you forget to stop a previous run.
 */

import { env }            from './config/env.js';
import { buildContainer } from './container.js';
import { createApp }      from './app.js';

const container = buildContainer();
const app       = createApp(container);

const server = app.listen(env.PORT, () => {
  container.logger.info(
    { port: env.PORT, environment: env.NODE_ENV },
    `Dayflow HRMS Backend is running → http://localhost:${env.PORT}`
  );
});

// ── Port-already-in-use guard ─────────────────────────────────────────────────
// Instead of crashing with the raw EADDRINUSE stack, we print a friendly tip.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`
╔════════════════════════════════════════════════════════╗
║  ❌  Port ${env.PORT} is already in use!                      
║                                                        
║  Another process (maybe a previous run) is still       
║  listening on that port.  Free it with:                
║                                                        
║  Windows PowerShell:                                   
║    Stop-Process -Id (Get-NetTCPConnection -LocalPort ${env.PORT} -State Listen).OwningProcess -Force
║                                                        
║  Then restart the server.                              
╚════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  } else {
    // Re-throw anything that isn't a port conflict.
    throw err;
  }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// On SIGTERM (Docker / cloud platform stop) or SIGINT (Ctrl+C), we:
//  1. Stop accepting new requests
//  2. Wait for in-flight requests to finish
//  3. Drain the PostgreSQL connection pool
//  4. Exit with code 0

async function gracefulShutdown(signal) {
  container.logger.info(`Received ${signal} — starting graceful shutdown…`);

  server.close(async () => {
    container.logger.info('HTTP server closed.  Draining PostgreSQL pool…');
    try {
      await container.db.close();
      container.logger.info('Database pool drained.  Goodbye! 👋');
      process.exit(0);
    } catch (closeErr) {
      container.logger.error({ err: closeErr }, 'Error while closing database pool.');
      process.exit(1);
    }
  });

  // Safety net — if requests are still pending after 10 s, force-exit.
  setTimeout(() => {
    container.logger.error('Graceful shutdown timed out after 10 s — forcing exit.');
    process.exit(1);
  }, 10_000).unref();  // .unref() so the timeout doesn't keep the event loop alive on its own
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
