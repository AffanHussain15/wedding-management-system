/**
 * React binding for `ChatSocketClient`.
 *
 * Ported from the backend team's `frontend-integration/use-ek-chat.ts`, with
 * history reads going through `api.chat` (the app's HTTP client) rather than a
 * hand-rolled fetch, so chat inherits the same auth, 401-refresh, timeout and
 * error handling as every other screen.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ChatSocketClient,
  api,
  errorMessage,
  type ChatMessage,
  type ChatSocketError,
  type ChatToolActivity,
} from '@services';

export interface UseEkChatOptions {
  weddingId: string;
  /** Resume a past conversation instead of starting a new one. */
  sessionId?: string;
}

export interface UseEkChatResult {
  messages: ChatMessage[];
  /** The in-flight assistant reply. Render below `messages` as a live bubble. */
  streamingText: string;
  /** Server is working but has not emitted a first token yet. */
  isTyping: boolean;
  /** True while a reply is in flight — disable the send button. */
  isBusy: boolean;
  connected: boolean;
  sessionId: string | null;
  /** Most recent tool, for a "checking your budget…" hint. */
  activeTool: ChatToolActivity | null;
  error: ChatSocketError | null;
  /** True while the transcript for a resumed session is loading. */
  loadingHistory: boolean;
  send(content: string): void;
  startNewSession(): void;
  /** Clears the last error and retries the connection. */
  retry(): void;
}

export function useEkChat({ weddingId, sessionId: initialSessionId }: UseEkChatOptions): UseEkChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [activeTool, setActiveTool] = useState<ChatToolActivity | null>(null);
  const [error, setError] = useState<ChatSocketError | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Bumping this tears down the client and builds a new one — the retry path.
  const [attempt, setAttempt] = useState(0);

  const clientRef = useRef<ChatSocketClient | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Switching conversation (or wedding) must not leave the previous
  // transcript on screen. The join that follows reloads history, but only
  // replaces the list when the server actually has messages — a brand-new
  // session returns none, which would otherwise strand the old conversation's
  // bubbles under a new session id. Deliberately keyed off the conversation
  // identity only, so a reconnect/retry keeps what is already rendered.
  useEffect(() => {
    setMessages([]);
    setStreamingText('');
    setActiveTool(null);
    setIsTyping(false);
    setIsBusy(false);
    setError(null);
  }, [weddingId, initialSessionId]);

  useEffect(() => {
    const client = new ChatSocketClient(
      { weddingId, sessionId: initialSessionId },
      {
        onJoined: async ({ sessionId: joinedId }) => {
          if (!mounted.current) return;
          setSessionId(joinedId);

          // Reload the transcript on join so a resumed conversation shows its
          // history, and a reconnect mid-chat doesn't lose what came before.
          setLoadingHistory(true);
          try {
            const { items } = await api.chat.listMessages(weddingId, joinedId);
            // Only adopt the server copy when it has something to say: a fresh
            // session returns nothing, and blanking the list would wipe the
            // optimistic echo of a message sent moments earlier.
            if (mounted.current && items.length) setMessages(items);
          } catch {
            // History is a nicety; failing to load it must not block chatting.
          } finally {
            if (mounted.current) setLoadingHistory(false);
          }
        },
        onStreamingText: text => {
          if (mounted.current) setStreamingText(text);
        },
        onTyping: typing => {
          if (mounted.current) setIsTyping(typing);
        },
        onToolCall: tool => {
          if (mounted.current) setActiveTool(tool);
        },
        onComplete: message => {
          if (!mounted.current) return;
          setMessages(previous => [...previous, message]);
          setStreamingText('');
          setActiveTool(null);
          setIsTyping(false);
          setIsBusy(false);
        },
        onError: chatError => {
          if (!mounted.current) return;
          setError(chatError);
          setActiveTool(null);
          setIsTyping(false);
          setIsBusy(false);
        },
        onConnectionChange: isConnected => {
          if (mounted.current) setConnected(isConnected);
        },
      },
    );

    clientRef.current = client;
    // `connect` awaits a token refresh, so it can reject before the socket
    // exists — surface that through the same error/retry path as a dropped
    // connection rather than leaving it an unhandled rejection.
    client.connect().catch(caught => {
      if (!mounted.current) return;
      setError({ code: 'CONNECTION_ERROR', message: errorMessage(caught) });
    });

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
    // `weddingId`/`sessionId` identify the connection; `attempt` forces a
    // rebuild on retry. Anything else here would reconnect the socket in a loop.
  }, [weddingId, initialSessionId, attempt]);

  const send = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const client = clientRef.current;
    if (!client?.send(trimmed)) return;

    setError(null);
    setIsBusy(true);
    // Optimistic echo so the user's own message appears instantly. The id is
    // local-only; the server's copy arrives with the history on the next join.
    setMessages(previous => [
      ...previous,
      {
        id: `local-${Date.now()}`,
        role: 'USER',
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const startNewSession = useCallback(() => {
    setMessages([]);
    setStreamingText('');
    setActiveTool(null);
    setIsTyping(false);
    setIsBusy(false);
    setError(null);
    clientRef.current?.startNewSession();
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setAttempt(n => n + 1);
  }, []);

  return {
    messages,
    streamingText,
    isTyping,
    isBusy,
    connected,
    sessionId,
    activeTool,
    error,
    loadingHistory,
    send,
    startNewSession,
    retry,
  };
}
