/**
 * The four things the reference client warns are easy to get wrong
 * (`frontend-integration/README.md` §4). Each one is silent when broken — the
 * mockSocket still connects and messages still flow — so they are pinned here
 * rather than left to a manual pass through the app.
 */

// Ships untranspiled TS and is pulled in transitively via `@services`; nothing
// in this test touches contacts.
jest.mock('react-native-contacts', () => ({}));

type Handler = (...args: unknown[]) => void;

/** Minimal stand-in for a mockSocket.io mockSocket: records emits, replays handlers. */
class FakeSocket {
  handlers = new Map<string, Handler[]>();
  managerHandlers = new Map<string, Handler[]>();
  emitted: Array<{ event: string; payload: unknown }> = [];
  connected = true;
  auth: unknown;
  closed = false;

  io = {
    on: (event: string, handler: Handler) => {
      const list = this.managerHandlers.get(event) ?? [];
      list.push(handler);
      this.managerHandlers.set(event, list);
    },
  };

  on(event: string, handler: Handler) {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  emit(event: string, payload: unknown) {
    this.emitted.push({ event, payload });
  }

  close() {
    this.closed = true;
  }

  /** Drives a server-sent event. */
  fire(event: string, ...args: unknown[]) {
    for (const handler of this.handlers.get(event) ?? []) handler(...args);
  }

  fireManager(event: string, ...args: unknown[]) {
    for (const handler of this.managerHandlers.get(event) ?? []) handler(...args);
  }
}

// `mock`-prefixed so jest's hoisted module factory below may reference it.
let mockSocket: FakeSocket;

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

import { ChatSocketClient } from '../src/services/chatSocket';
import type { ChatMessage } from '../src/services/apiTypes';

const WEDDING_ID = 'w1';
const flush = () => new Promise<void>(resolve => setImmediate(() => resolve()));

beforeEach(() => {
  mockSocket = new FakeSocket();
});

const joins = () => mockSocket.emitted.filter(e => e.event === 'chat:join');

describe('ChatSocketClient', () => {
  it('re-joins on every connect, carrying the session it already has', async () => {
    const client = new ChatSocketClient(
      { weddingId: WEDDING_ID, getToken: async () => 'token-1' },
      {},
    );
    await client.connect();

    // First connect: no session yet, so the server is asked to start one.
    mockSocket.fire('connect');
    expect(joins()).toHaveLength(1);
    expect(joins()[0].payload).toEqual({ weddingId: WEDDING_ID, sessionId: undefined });

    mockSocket.fire('chat:joined', { sessionId: 's1', role: 'OWNER' });

    // A reconnect arrives as an unknown mockSocket server-side. Without re-joining,
    // the next chat:message comes back as VALIDATION_ERROR; without passing the
    // known sessionId, the conversation silently forks into a new one.
    mockSocket.fire('connect');
    expect(joins()).toHaveLength(2);
    expect(joins()[1].payload).toEqual({ weddingId: WEDDING_ID, sessionId: 's1' });
  });

  it('re-reads the token on reconnect_attempt rather than replaying a stale one', async () => {
    const tokens = ['token-1', 'token-2'];
    let call = 0;
    const client = new ChatSocketClient(
      { weddingId: WEDDING_ID, getToken: async () => tokens[call++] },
      {},
    );
    await client.connect();

    const { io } = jest.requireMock('socket.io-client') as { io: jest.Mock };
    expect(io.mock.calls[0][1]).toMatchObject({ auth: { token: 'token-1' } });

    mockSocket.fireManager('reconnect_attempt');
    await flush();

    // The handshake is only validated at connect, so a mockSocket that outlives its
    // 15-minute token must present a fresh one or every retry fails silently.
    expect(mockSocket.auth).toEqual({ token: 'token-2' });
  });

  it('discards streamed text on chat:reset', async () => {
    const streamed: string[] = [];
    const client = new ChatSocketClient(
      { weddingId: WEDDING_ID, getToken: async () => 't' },
      { onStreamingText: text => streamed.push(text) },
    );
    await client.connect();
    mockSocket.fire('connect');
    mockSocket.fire('chat:joined', { sessionId: 's1', role: 'OWNER' });

    mockSocket.fire('chat:token', { token: 'Aapka budget ' });
    mockSocket.fire('chat:token', { token: '5 lakh hai' });
    expect(streamed[streamed.length - 1]).toBe('Aapka budget 5 lakh hai');

    // The server retracted that text — it was pre-tool chatter, or it failed
    // the grounding check. Keeping it would leave a withdrawn figure on screen.
    mockSocket.fire('chat:reset', { reason: 'grounding' });
    expect(streamed[streamed.length - 1]).toBe('');

    mockSocket.fire('chat:token', { token: 'Actually 3 lakh' });
    expect(streamed[streamed.length - 1]).toBe('Actually 3 lakh');
  });

  it('commits fullContent from chat:complete, not the accumulated tokens', async () => {
    const completed: ChatMessage[] = [];
    const client = new ChatSocketClient(
      { weddingId: WEDDING_ID, getToken: async () => 't' },
      { onComplete: message => completed.push(message) },
    );
    await client.connect();
    mockSocket.fire('connect');
    mockSocket.fire('chat:joined', { sessionId: 's1', role: 'OWNER' });

    mockSocket.fire('chat:token', { token: 'partial ' });
    mockSocket.fire('chat:token', { token: 'draft' });
    mockSocket.fire('chat:complete', {
      messageId: 'm1',
      fullContent: 'the persisted answer',
      grounded: true,
    });

    // fullContent is what the server stored, so the bubble matches what
    // GET /messages returns on the next load.
    expect(completed).toHaveLength(1);
    expect(completed[0].content).toBe('the persisted answer');
    expect(completed[0].id).toBe('m1');
    expect(completed[0].grounded).toBe(true);
  });

  it('refuses to send before a session exists, and clears busy on error', async () => {
    const errors: unknown[] = [];
    const client = new ChatSocketClient(
      { weddingId: WEDDING_ID, getToken: async () => 't' },
      { onError: e => errors.push(e) },
    );
    await client.connect();
    mockSocket.fire('connect');

    // No chat:joined yet — sending now would be a VALIDATION_ERROR server-side.
    expect(client.send('hello')).toBe(false);

    mockSocket.fire('chat:joined', { sessionId: 's1', role: 'OWNER' });
    expect(client.send('hello')).toBe(true);
    expect(client.isBusy).toBe(true);

    // A second send while busy would interleave two turns on one session.
    expect(client.send('again')).toBe(false);

    mockSocket.fire('chat:error', { code: 'RATE_LIMITED', message: 'slow down' });
    expect(errors).toHaveLength(1);
    expect(client.isBusy).toBe(false);
  });
});
