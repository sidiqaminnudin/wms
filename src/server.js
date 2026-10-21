import app from './app.js';
import { getConfig } from './config.js';

const { port } = getConfig();
app.listen(port, () => console.log(`WMS listening on http://localhost:${port}`));
