/**
 * AI assistant (Module 14).
 *
 * The conversation runs over the `/chat` websocket namespace via `useEkChat`;
 * past conversations are read over plain REST (`api.chat`). The streaming reply
 * is rendered as a synthetic trailing row so it flows with the transcript
 * instead of jumping into place when the turn completes.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  ScreenContainer,
  AppText,
  BackButton,
  Button,
  EmptyState,
  FormBanner,
  GradientView,
  Icon,
  LoadingState,
} from '@components';
import type { IconName } from '@components';
import { api, errorMessage, type ChatMessage, type ChatSession } from '@services';
import { useAuth } from '@store';
import { useEkChat } from '@hooks';
import { colors, radius, shadows, spacing, typography, weight } from '@theme';
import { formatDate } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

const HERO_GRADIENT = ['#8A2142', '#4A0A1C'] as const;

/** Human labels for the tool names the server reports over `chat:tool_call`. */
const TOOL_LABELS: Record<string, string> = {
  get_budget_summary: 'Checking your budget…',
  get_guest_summary: 'Checking your guest list…',
  list_vendors: 'Looking up your vendors…',
  get_vendor_detail: 'Opening vendor details…',
  list_upcoming_events: 'Checking your timeline…',
  list_pending_tasks: 'Checking your to-dos…',
  get_dashboard_overview: 'Reviewing your wedding…',
  create_task: 'Preparing a new task…',
  add_budget_expense: 'Preparing an expense…',
};

interface Starter {
  icon: IconName;
  title: string;
  prompt: string;
}

const STARTERS: Starter[] = [
  {
    icon: 'budget',
    title: 'Where is my money going?',
    prompt: 'Break my budget down by category and flag what is trending over.',
  },
  {
    icon: 'vendors',
    title: 'Which vendors still owe me a decision?',
    prompt: 'Which vendors are unconfirmed or still have an outstanding balance?',
  },
  {
    icon: 'guests',
    title: 'Who has not replied yet?',
    prompt: 'Which guests have not replied yet? Group them by function.',
  },
  {
    icon: 'timeline',
    title: 'Is the timeline realistic?',
    prompt: 'Check my function dates against the tasks that have to land first.',
  },
];

const STREAMING_ROW_ID = '__streaming__';

export function AiAssistantScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { activeWeddingId } = useAuth();

  const [draft, setDraft] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  // Set when the user picks a past conversation; re-keys the socket connection
  // so it re-joins that session instead of starting a new one.
  const [resumedSessionId, setResumedSessionId] = useState<string | undefined>();

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const {
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
  } = useEkChat({ weddingId: activeWeddingId ?? '', sessionId: resumedSessionId });

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy || !connected) return;
      send(trimmed);
      setDraft('');
    },
    [connected, isBusy, send],
  );

  const rows = useMemo<ChatMessage[]>(
    () =>
      streamingText
        ? [
            ...messages,
            {
              id: STREAMING_ROW_ID,
              role: 'ASSISTANT',
              content: streamingText,
              createdAt: new Date().toISOString(),
            },
          ]
        : messages,
    [messages, streamingText],
  );

  const openSession = useCallback((id: string) => {
    setResumedSessionId(id);
    setHistoryOpen(false);
  }, []);

  const onNewChat = useCallback(() => {
    // While resuming a past conversation, clearing the id is enough: the hook
    // rebuilds the connection and joins a fresh session. Calling
    // `startNewSession` as well would emit a second join on the socket that is
    // about to be torn down.
    if (resumedSessionId) {
      setResumedSessionId(undefined);
      return;
    }
    startNewSession();
  }, [resumedSessionId, startNewSession]);

  // A wedding is always selected inside the app stack; this is a guard rather
  // than a state the user can reach.
  if (!activeWeddingId) {
    return (
      <ScreenContainer>
        <BackButton onPress={() => nav.goBack()} />
        <EmptyState
          icon="sparkles"
          title="No wedding selected"
          message="Choose a wedding first, then ask the assistant about it."
        />
      </ScreenContainer>
    );
  }

  const showEmptyState = rows.length === 0 && !loadingHistory;

  return (
    <ScreenContainer padded={false} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <BackButton onPress={() => nav.goBack()} />
          <View style={styles.headerActions}>
            <View
              style={[styles.dot, connected ? styles.dotOn : styles.dotOff]}
              accessibilityLabel={connected ? 'Connected' : 'Reconnecting'}
            />
            <Pressable onPress={() => setHistoryOpen(true)} hitSlop={8}>
              <AppText variant="callout" color={colors.primary}>
                History
              </AppText>
            </Pressable>
            <Pressable onPress={onNewChat} hitSlop={8} disabled={isBusy}>
              <AppText
                variant="callout"
                color={isBusy ? colors.textMuted : colors.primary}
                style={weight('semiBold')}>
                New
              </AppText>
            </Pressable>
          </View>
        </View>

        {loadingHistory && rows.length === 0 ? (
          <LoadingState message="Loading conversation…" />
        ) : showEmptyState ? (
          <EmptyConversation onPick={submit} disabled={!connected || isBusy} />
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <Bubble message={item} />}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.statusArea}>
          {activeTool && activeTool.status === 'calling' ? (
            <StatusLine text={TOOL_LABELS[activeTool.toolName] ?? 'Looking that up…'} />
          ) : null}

          {isTyping && !streamingText && activeTool?.status !== 'calling' ? (
            <StatusLine text="Thinking…" />
          ) : null}

          {!connected && !error ? <StatusLine text="Reconnecting…" /> : null}

          {error ? (
            <View style={styles.errorRow}>
              <FormBanner message={error.message} />
              <Button
                label="Retry"
                variant="outline"
                size="sm"
                fullWidth={false}
                onPress={retry}
                style={styles.retryButton}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask about your budget, guests, vendors…"
            placeholderTextColor={colors.textMuted}
            editable={connected && !isBusy}
            onSubmitEditing={() => submit(draft)}
            returnKeyType="send"
            multiline
          />
          <Pressable
            style={[
              styles.sendButton,
              (!draft.trim() || isBusy || !connected) && styles.sendDisabled,
            ]}
            onPress={() => submit(draft)}
            disabled={!draft.trim() || isBusy || !connected}>
            {isBusy ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Icon name="send" size={16} color={colors.textOnPrimary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <HistorySheet
        visible={historyOpen}
        weddingId={activeWeddingId}
        currentSessionId={sessionId}
        onClose={() => setHistoryOpen(false)}
        onOpenSession={openSession}
      />
    </ScreenContainer>
  );
}

// --- Pieces ----------------------------------------------------------------

function StatusLine({ text }: { text: string }): React.JSX.Element {
  return (
    <View style={styles.status}>
      <ActivityIndicator size="small" color={colors.primary} />
      <AppText variant="caption" color={colors.textSecondary}>
        {text}
      </AppText>
    </View>
  );
}

const Bubble = React.memo(({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'USER';
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
      <AppText variant="callout" color={isUser ? colors.textOnPrimary : colors.text}>
        {message.content}
      </AppText>
      {/* Surfaced honestly: the server could not fully verify this reply
          against the data it fetched. */}
      {message.grounded === false ? (
        <AppText variant="caption" color={colors.warning} style={styles.ungrounded}>
          ⚠ Could not verify this from your data
        </AppText>
      ) : null}
    </View>
  );
});

function EmptyConversation({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void;
  disabled: boolean;
}): React.JSX.Element {
  return (
    <FlatList
      data={STARTERS}
      keyExtractor={item => item.title}
      contentContainerStyle={styles.emptyContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <GradientView colors={HERO_GRADIENT} style={styles.hero}>
            <View style={styles.heroBadge}>
              <Icon name="sparkles" size={22} color={colors.accentBright} strokeWidth={2} />
            </View>
            <AppText
              style={[typography.serifValue, styles.heroTitle]}
              color={colors.textOnPrimary}>
              AI Assistant
            </AppText>
            <AppText variant="callout" color={colors.goldSoft} style={styles.heroSubtitle}>
              Ask anything about your wedding — budget, guests, vendors or what needs
              doing next.
            </AppText>
          </GradientView>
          <AppText style={[typography.serifHeading, styles.sectionTitle]}>
            Try asking
          </AppText>
        </>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.starter, pressed && styles.starterPressed]}
          onPress={() => onPick(item.prompt)}
          disabled={disabled}>
          <View style={styles.starterIcon}>
            <Icon name={item.icon} size={18} color={colors.primary} />
          </View>
          <View style={styles.starterBody}>
            <AppText variant="title" style={styles.starterTitle}>
              {item.title}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {item.prompt}
            </AppText>
          </View>
        </Pressable>
      )}
    />
  );
}

/** Past conversations, read over REST — the socket is not involved here. */
function HistorySheet({
  visible,
  weddingId,
  currentSessionId,
  onClose,
  onOpenSession,
}: {
  visible: boolean;
  weddingId: string;
  currentSessionId: string | null;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
}): React.JSX.Element {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { items } = await api.chat.listSessions(weddingId, { status: 'ACTIVE' });
      setSessions(items);
    } catch (caught) {
      setLoadError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => {
    // `load` captures its own failures into `loadError`, so there is nothing
    // here that can reject.
    if (visible) load();
  }, [visible, load]);

  const archive = useCallback(
    async (sessionId: string) => {
      // Optimistic: the row goes immediately, and a failure restores it.
      const previous = sessions;
      setSessions(current => current.filter(s => s.id !== sessionId));
      try {
        await api.chat.archiveSession(weddingId, sessionId);
      } catch (caught) {
        setSessions(previous);
        setLoadError(errorMessage(caught));
      }
    },
    [sessions, weddingId],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <AppText variant="title">Past conversations</AppText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <FormBanner message={loadError} />

          {loading ? (
            <LoadingState message="Loading conversations…" />
          ) : sessions.length === 0 ? (
            <EmptyState
              icon="message"
              title="No past conversations"
              message="Chats you start with the assistant will show up here."
            />
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.sheetList}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.sessionRow, pressed && styles.starterPressed]}
                  onPress={() => onOpenSession(item.id)}>
                  <View style={styles.starterBody}>
                    <AppText variant="label" numberOfLines={1}>
                      {item.title || 'Untitled conversation'}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {formatDate(item.lastMessageAt, 'long')}
                      {item.id === currentSessionId ? ' · current' : ''}
                    </AppText>
                  </View>
                  <Pressable onPress={() => archive(item.id)} hitSlop={8}>
                    <Icon name="trash" size={16} color={colors.textMuted} />
                  </Pressable>
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { backgroundColor: colors.successText },
  dotOff: { backgroundColor: colors.danger },

  list: {
    paddingHorizontal: 20,
    paddingBottom: spacing.base,
    gap: spacing.sm,
  },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.lg,
    maxWidth: '88%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderBottomLeftRadius: radius.sm,
  },
  ungrounded: { marginTop: spacing.xs },

  statusArea: { paddingHorizontal: 20, gap: spacing.xs },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  errorRow: { gap: spacing.xs, paddingBottom: spacing.xs },
  retryButton: { alignSelf: 'flex-start' },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    color: colors.text,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },

  emptyContent: {
    paddingHorizontal: 20,
    paddingBottom: spacing.xl,
  },
  hero: {
    borderRadius: radius.card,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.5)',
    backgroundColor: 'rgba(253,246,233,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  heroTitle: { marginBottom: spacing.xs },
  heroSubtitle: { maxWidth: 300 },
  sectionTitle: { marginBottom: spacing.md },
  starter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  starterPressed: { opacity: 0.7 },
  starterIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterBody: { flex: 1, gap: spacing.xxs, minWidth: 0 },
  starterTitle: { ...weight('semiBold') },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    paddingHorizontal: 20,
    gap: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sheetList: { paddingBottom: spacing.base },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
});
