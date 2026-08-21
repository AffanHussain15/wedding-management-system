/**
 * Socket transport for the AI assistant (Module 14).
 *
 * Ported from the backend team's reference client
 * (`frontend-integration/ek-chat-client.ts`) and kept deliberately close to it:
 * four behaviours below are load-bearing and were got wrong by the naive
 * implementation it replaced, so they are preserved verbatim in spirit even
 * where the surrounding code was adapted to this app's service layer.
 *
 * Framework-agnostic on purpose — React bindings live in `useEkChat`, and REST
 * history lives in `chatApi`. Nothing here imports from the UI.
 */

import { io, type Socket } from 'socket.io-client';

import { getValidAccessToken } from './client';
import { API_HOST } from './config';
import type { ChatMessage } from './apiTypes';

const NAMESPACE = '/chat';

export type ChatResetReason = 'tool_preamble' | 'grounding';

export interface ChatSocketError {
  code: string;
  message: string;
}

export interface ChatToolActivity {
  toolName: string;
  status: 'calling' | 'done';
  /** Present only when `status` is 'done'; false means the lookup failed. */
  ok?: boolean;
}

export interface ChatSocketEvents {
  /** Session established — on first join, and again after every reconnect. */
  onJoined?(info: { sessionId: string; role: string }): void;
  /** The in-flight reply changed. Render as a live bubble below the messages. */
  onStreamingText?(text: string): void;
  onToolCall?(info: ChatToolActivity): void;
  /** Server is working but has not produced a first token yet. */
  onTyping?(isTyping: boolean): void;
  /** A turn finished. The message is the persisted, authoritative version. */
  onComplete?(message: ChatMessage): void;
  onError?(error: ChatSocketError): void;
  onConnectionChange?(connected: boolean): void;
}

export interface ChatSocketConfig {
  weddingId: string;
  /** Resume an existing conversation instead of starting a new one. */
  sessionId?: string;
  /**
   * Returns a token valid *at call time*. Defaults to the session store's
   * refreshing accessor; injectable for tests. Never capture the result — see
   * the `reconnect_attempt` handler.
   */
  getToken?: () => Promise<string | null>;
}

export class ChatSocketClient {
  private socket: Socket | null = null;
  private streamingText = '';
  private sessionId: string | null;
  private busy = false;

  private readonly getToken: () => Promise<string | null>;

  constructor(
    private readonly config: ChatSocketConfig,
    private readonly events: ChatSocketEvents = {},
  ) {
    this.sessionId = config.sessionId ?? null;
    this.getToken = config.getToken ?? getValidAccessToken;
  }

  get currentSessionId(): string | null {
    return this.sessionId;
  }

  /** True while a reply is in flight — use it to disable the send button. */
  get isBusy(): boolean {
    return this.busy;
  }

  async connect(): Promise<void> {
    const token = await this.getToken();

    // `API_HOST` is scheme + host with no `/v1`: the namespace hangs off the
    // origin, not the REST prefix. socket.io upgrades https → wss itself.
    this.socket = io(`${API_HOST}${NAMESPACE}`, {
      auth: { token },
      // React Native has no reliable XHR polling fallback; go straight to ws.
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.events.onConnectionChange?.(true);
      // (4) The gateway keeps session state in memory keyed by socket id, so a
      // reconnect arrives as an unknown socket and a `chat:message` sent before
      // re-joining comes back as VALIDATION_ERROR. Re-join on every connect,
      // passing the known sessionId so the same conversation continues instead
      // of silently forking a new one.
      this.socket?.emit('chat:join', {
        weddingId: this.config.weddingId,
        sessionId: this.sessionId ?? undefined,
      });
    });

    this.socket.on('disconnect', () => {
      this.busy = false;
      this.events.onConnectionChange?.(false);
    });

    // (3) socket.io replays the *original* handshake auth on reconnect. Access
    // tokens are short-lived and the handshake is only validated at connect, so
    // a token that expired while the socket was open would fail every retry.
    // Re-read it here — this is why `getToken` is a function, not a string.
    this.socket.io.on('reconnect_attempt', async () => {
      const fresh = await this.getToken();
      if (this.socket) this.socket.auth = { token: fresh };
    });

    this.socket.on('chat:joined', (payload: { sessionId: string; role: string }) => {
      this.sessionId = payload.sessionId;
      this.events.onJoined?.(payload);
    });

    this.socket.on('chat:typing', (p: { isTyping: boolean }) => {
      this.events.onTyping?.(p.isTyping);
    });

    this.socket.on('chat:tool_call', (p: ChatToolActivity) => {
      this.events.onToolCall?.(p);
    });

    this.socket.on('chat:token', (p: { token: string }) => {
      this.streamingText += p.token;
      this.events.onStreamingText?.(this.streamingText);
    });

    // (1) Everything streamed so far must be thrown away: it was either chatter
    // the model emitted before deciding to call a tool, or a reply that failed
    // the server's grounding check and is being regenerated. Ignoring this
    // leaves the user reading a figure the server has already retracted.
    this.socket.on('chat:reset', (_p: { reason: ChatResetReason }) => {
      this.streamingText = '';
      this.events.onStreamingText?.('');
    });

    this.socket.on(
      'chat:complete',
      (p: { messageId: string; fullContent: string; grounded: boolean }) => {
        this.busy = false;
        this.streamingText = '';
        this.events.onStreamingText?.('');
        // (2) Commit `fullContent`, not the accumulated tokens: it is what the
        // server actually persisted, so the bubble matches what the history
        // endpoint will return on the next load.
        this.events.onComplete?.({
          id: p.messageId,
          role: 'ASSISTANT',
          content: p.fullContent,
          createdAt: new Date().toISOString(),
          grounded: p.grounded,
        });
      },
    );

    this.socket.on('chat:error', (p: ChatSocketError) => {
      this.busy = false;
      this.streamingText = '';
      this.events.onStreamingText?.('');
      this.events.onError?.(p);
    });

    this.socket.on('connect_error', (error: Error) => {
      this.events.onError?.({ code: 'CONNECTION_ERROR', message: error.message });
    });
  }

  /** Sends a message. Returns false when it could not be sent right now. */
  send(content: string): boolean {
    const trimmed = content.trim();
    if (!trimmed || !this.socket?.connected || !this.sessionId || this.busy) {
      return false;
    }
    this.busy = true;
    this.streamingText = '';
    this.socket.emit('chat:message', { sessionId: this.sessionId, content: trimmed });
    return true;
  }

  /** Starts a fresh conversation on the next join. */
  startNewSession(): void {
    this.sessionId = null;
    this.streamingText = '';
    this.busy = false;
    this.socket?.emit('chat:join', { weddingId: this.config.weddingId });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.busy = false;
    this.streamingText = '';
  }
}
