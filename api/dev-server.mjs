/**
 * Local stand-in for the Vercel serverless function, so the proxy path used in
 * production can be exercised with `npm run dev:ai` (build first: `npm run build`).
 *
 * Serves the built app from ./dist and mounts the same handler at /api/chat.
 */
import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import handler from './chat.js';

const app = express();
const dist = path.resolve('dist');
const port = Number(process.env.PORT || 3001);

app.all('/api/chat', (req, res) => {
  const started = Date.now();
  res.on('finish', () => console.log(`[dev:ai] ${req.method} /api/chat -> ${res.statusCode} (${Date.now() - started}ms)`));
  handler(req, res);
});

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.warn('[dev:ai] dist/index.html not found — run `npm run build` first.');
}

app.use(express.static(dist));
app.get('*', (req, res) => {
  const indexFile = path.join(dist, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(404).send('Build output missing. Run `npm run build`.');
});

app.listen(port, () => {
  console.log(`[dev:ai] http://localhost:${port}  (proxy /api/chat, key: ${process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY ? 'found' : 'MISSING'})`);
});
