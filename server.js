/**
 * Local development entrypoint.
 *
 * On Vercel this file is not used — api/index.js exports the same app as a
 * serverless function. Keep all app wiring in app.js so both agree.
 */
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n  Nolundi.dev running at http://localhost:${PORT}\n`);
});
