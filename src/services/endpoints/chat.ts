/**
 * Module 14 — AI assistant chat history. 3 endpoints.
 *
 * History and session management are plain REST; the conversation itself runs
 * over the `/chat` websocket namespace (see `chatSocket.ts`). Sessions are
 * private per user — another member of the same wedding gets a 404, not your
 * conversation.
 */

import { requestList, requestVoid, type RequestOptions } from '../client';
import type {
  ChatMessage,
  ChatMessageListQuery,
  ChatSession,
  ChatSessionListQuery,
  Paginated,
} from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

const base = (weddingId: string) => `/weddings/${weddingId}/chat/sessions`;

export const chatApi = {
  /** 14.1 `GET .../chat/sessions` — your own sessions for this wedding. */
  listSessions(
    weddingId: string,
    query: ChatSessionListQuery = {},
    opts: Opts = {},
  ): Promise<Paginated<ChatSession>> {
    return requestList<ChatSession>(base(weddingId), { query, ...opts });
  },

  /**
   * 14.2 `GET .../chat/sessions/:sessionId/messages`. Oldest-first by default,
   * which is the order a transcript renders in.
   */
  listMessages(
    weddingId: string,
    sessionId: string,
    query: ChatMessageListQuery = {},
    opts: Opts = {},
  ): Promise<Paginated<ChatMessage>> {
    return requestList<ChatMessage>(`${base(weddingId)}/${sessionId}/messages`, {
      query: { sortOrder: 'asc', limit: 100, ...query },
      ...opts,
    });
  },

  /** 14.3 `DELETE .../chat/sessions/:sessionId` — soft delete (archive). */
  archiveSession(weddingId: string, sessionId: string, opts: Opts = {}) {
    return requestVoid('DELETE', `${base(weddingId)}/${sessionId}`, opts);
  },
};
