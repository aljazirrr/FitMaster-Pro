require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const APP_SECRET = process.env.APP_SECRET;

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireSecret(req, res, next) {
  if (APP_SECRET && req.headers['x-app-secret'] !== APP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use('/ai', requireSecret);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true }));

// ─── POST /ai/workout-plan (streaming SSE) ────────────────────────────────────

app.post('/ai/workout-plan', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      thinking: { type: 'enabled', budget_tokens: 5000 },
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('text', (delta) => send({ type: 'text', delta }));
    await stream.finalMessage();
    send({ type: 'done' });
    res.end();
  } catch (err) {
    send({ type: 'error', message: err.message });
    res.end();
  }
});

// ─── POST /ai/food-macros ─────────────────────────────────────────────────────

app.post('/ai/food-macros', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/voice-coach ─────────────────────────────────────────────────────

app.post('/ai/voice-coach', async (req, res) => {
  const { prompt, maxTokens = 256 } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response.content.find((b) => b.type === 'text');
    res.json({ text: block?.type === 'text' ? block.text : '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/progress-insights ───────────────────────────────────────────────

app.post('/ai/progress-insights', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    res.json({ text: textBlock?.type === 'text' ? textBlock.text : '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FitMaster AI server running on port ${PORT}`));
