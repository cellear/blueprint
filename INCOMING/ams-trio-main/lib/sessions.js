// Session manager: one persistent Claude Agent SDK session per avatar.
//
// Each avatar's conversation is a Claude Agent SDK `query()` session, scoped to
// the shared project root (cwd), driven by the avatar's persona (systemPrompt)
// and model. The SDK persists the real conversation transcript to disk and lets
// us resume it by sessionId. We keep a thin local mirror in `.sessions.json`:
//   - sessionId   — so the next message resumes the right SDK session
//   - transcript  — what to redraw in the UI after a reload/restart
import { query } from '@anthropic-ai/claude-agent-sdk';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STATE_PATH = path.join(ROOT, '.sessions.json');

let config;
let state; // { [avatarId]: { sessionId: string|null, transcript: [{role,text}] } }

export async function init(cfg) {
  config = cfg;
  state = existsSync(STATE_PATH)
    ? JSON.parse(await readFile(STATE_PATH, 'utf8'))
    : {};
  for (const a of config.avatars) {
    if (!state[a.id]) state[a.id] = { sessionId: null, transcript: [] };
  }
  await mkdir(projectRoot(), { recursive: true });
  await persist();
}

function projectRoot() {
  return path.resolve(ROOT, config.projectRoot);
}

function getAvatar(id) {
  const a = config.avatars.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown avatar: ${id}`);
  return a;
}

function loadPersona(id) {
  return readFile(path.join(ROOT, 'AMS-office', id, 'persona.md'), 'utf8');
}

async function persist() {
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

export function listAvatars() {
  return config.avatars.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    model: a.model,
    accent: a.accent,
  }));
}

export function getTranscript(id) {
  return state[id]?.transcript ?? [];
}

// Async generator of UI events: {type:'text'|'tool_use'|'error'|'done', text}
export async function* sendMessage(id, text) {
  const avatar = getAvatar(id);
  const persona = await loadPersona(id);
  const s = state[id];

  s.transcript.push({ role: 'user', text });
  await persist();

  const options = {
    cwd: projectRoot(),
    model: avatar.model,
    systemPrompt: persona,
    permissionMode: config.permissionMode || 'acceptEdits',
    ...(s.sessionId ? { resume: s.sessionId } : {}),
  };

  let assistantText = '';
  try {
    for await (const message of query({ prompt: text, options })) {
      if (message.session_id) s.sessionId = message.session_id;

      if (message.type === 'assistant') {
        for (const block of message.message.content) {
          if (block.type === 'text' && block.text) {
            assistantText += block.text;
            yield { type: 'text', text: block.text };
          } else if (block.type === 'tool_use') {
            yield { type: 'tool_use', text: block.name };
          }
        }
      }
    }
  } catch (err) {
    yield { type: 'error', text: String(err?.message || err) };
  }

  if (assistantText) s.transcript.push({ role: 'assistant', text: assistantText });
  await persist();
  yield { type: 'done', text: '' };
}
