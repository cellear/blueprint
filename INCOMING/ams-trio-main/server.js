// AMS Trio server: static frontend + per-avatar SSE chat endpoint.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import * as sessions from './lib/sessions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(
  await readFile(path.join(__dirname, 'config.json'), 'utf8'),
);
await sessions.init(config);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve avatar images straight from each office.
app.use('/avatars', express.static(path.join(__dirname, 'AMS-office')));

app.get('/api/avatars', (req, res) => {
  res.json(
    sessions.listAvatars().map((a) => ({
      ...a,
      image: `/avatars/${a.id}/avatar.png`,
    })),
  );
});

app.get('/api/:avatar/history', (req, res) => {
  res.json(sessions.getTranscript(req.params.avatar));
});

app.post('/api/:avatar/message', async (req, res) => {
  const text = (req.body?.text ?? '').toString();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  try {
    for await (const ev of sessions.sendMessage(req.params.avatar, text)) {
      res.write(`data: ${JSON.stringify(ev)}\n\n`);
    }
  } catch (err) {
    res.write(
      `data: ${JSON.stringify({ type: 'error', text: String(err?.message || err) })}\n\n`,
    );
  }
  res.end();
});

app.listen(config.port, () => {
  console.log(`AMS Trio running at http://localhost:${config.port}`);
  console.log(`Shared project root (cwd): ${path.resolve(__dirname, config.projectRoot)}`);
  console.log(`Permission mode: ${config.permissionMode}`);
});
