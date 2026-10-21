import app from './app.js';
const port = parseInt(process.env.PORT ?? '3000', 10);
app.listen(port, () => console.log(`WMS listening on http://localhost:${port}`));
