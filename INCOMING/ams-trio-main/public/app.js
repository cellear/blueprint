// AMS Trio frontend: render one chat panel per avatar, stream replies over SSE.

const panelsEl = document.getElementById('panels');
const template = document.getElementById('panel-template');

const avatars = await (await fetch('/api/avatars')).json();

for (const avatar of avatars) {
  await buildPanel(avatar);
}

async function buildPanel(avatar) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.style.setProperty('--accent', avatar.accent);

  const scrollback = node.querySelector('.scrollback');
  const img = node.querySelector('.avatar img');
  img.src = avatar.image;
  img.alt = avatar.name;
  node.querySelector('.nameplate-name').textContent = avatar.name;
  node.querySelector('.nameplate-role').textContent = avatar.role;

  const form = node.querySelector('.composer');
  const input = node.querySelector('.composer-input');
  const send = node.querySelector('.composer-send');
  input.placeholder = `Message ${avatar.name}…`;

  panelsEl.appendChild(node);

  // Restore prior conversation.
  const history = await (await fetch(`/api/${avatar.id}/history`)).json();
  for (const m of history) addMessage(scrollback, m.role, m.text);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.disabled = true;
    send.disabled = true;

    addMessage(scrollback, 'user', text);
    let bubble = null; // assistant bubble, created on first text chunk

    try {
      const res = await fetch(`/api/${avatar.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      for await (const ev of readSSE(res.body)) {
        if (ev.type === 'text') {
          if (!bubble) bubble = addMessage(scrollback, 'assistant', '');
          bubble.textContent += ev.text;
          scrollToBottom(scrollback);
        } else if (ev.type === 'tool_use') {
          addMessage(scrollback, 'tool', `· using ${ev.text}…`);
        } else if (ev.type === 'error') {
          addMessage(scrollback, 'error', ev.text);
        }
      }
    } catch (err) {
      addMessage(scrollback, 'error', String(err));
    } finally {
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }
  });
}

function addMessage(scrollback, role, text) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  el.textContent = text;
  scrollback.appendChild(el);
  scrollToBottom(scrollback);
  return el;
}

function scrollToBottom(scrollback) {
  scrollback.scrollTop = scrollback.scrollHeight;
}

// Parse a fetch response body as a stream of SSE `data:` JSON events.
async function* readSSE(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const line = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (line) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {
          /* ignore malformed frame */
        }
      }
    }
  }
}
