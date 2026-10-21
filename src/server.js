import app from './app.js';
import { getConfig } from './config.js';

const { port } = getConfig();
const server = app.listen(port, () => console.log(`WMS listening on http://localhost:${port}`));
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  if (closing) return;
  closing = true;
  server.close(async () => {
    try { await app.locals.close?.(); }
    catch { process.exitCode = 1; }
  });
});
