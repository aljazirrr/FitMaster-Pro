/**
 * aiServerClient — thin wrapper over fetch for the FitMaster AI proxy server.
 *
 * The server URL and shared secret come from env vars:
 *   EXPO_PUBLIC_AI_SERVER_URL   e.g. https://fitmaster-ai.onrender.com
 *   EXPO_PUBLIC_AI_SERVER_SECRET  shared secret between app and server
 */

const SERVER_URL = process.env.EXPO_PUBLIC_AI_SERVER_URL ?? '';
const APP_SECRET = process.env.EXPO_PUBLIC_AI_SERVER_SECRET ?? '';

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-app-secret': APP_SECRET,
  };
}

/**
 * Simple POST → JSON response.
 * Returns the `text` field from the server response.
 */
export async function callAI(
  endpoint: string,
  body: Record<string, unknown>,
  timeoutMs = 30_000,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`AI server error: ${res.status}`);
    const data = await res.json() as { text?: string; error?: string };
    if (data.error) throw new Error(data.error);
    return data.text ?? '';
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Streaming POST via SSE (Server-Sent Events).
 * Calls `onChunk` for each text delta; returns the full assembled text.
 */
export async function streamAI(
  endpoint: string,
  body: Record<string, unknown>,
  onChunk?: (delta: string) => void,
  timeoutMs = 120_000,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`AI server error: ${res.status}`);
    if (!res.body) throw new Error('No response body for streaming');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const event = JSON.parse(line.slice(6)) as {
          type: 'text' | 'done' | 'error';
          delta?: string;
          message?: string;
        };
        if (event.type === 'text' && event.delta) {
          fullText += event.delta;
          onChunk?.(event.delta);
        } else if (event.type === 'error') {
          throw new Error(event.message ?? 'Stream error');
        }
      }
    }

    return fullText;
  } finally {
    clearTimeout(timer);
  }
}
