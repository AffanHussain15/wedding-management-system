/** Safe-area screen shell with the app background and optional scroll. */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';
import {
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, layout } from '@theme';

/** Gap left between a focused field and the top of the keyboard. */
const FOCUS_MARGIN = 24;

/** Anything measurable — a TextInput ref, or `currentlyFocusedInput()`. */
interface Measurable {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

interface ScrollAssist {
  /** Scrolls `node` clear of the keyboard, if the keyboard is up and covers it. */
  ensureVisible: (node: Measurable | null) => void;
}

const ScrollAssistContext = createContext<ScrollAssist | null>(null);

/**
 * Lets a field ask its scroll container to bring it above the keyboard. `Input`
 * uses this on focus, which covers moving between fields while the keyboard is
 * already open — no keyboard event fires for that.
 */
export function useScrollAssist(): ScrollAssist | null {
  return useContext(ScrollAssistContext);
}

export interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Enables pull-to-refresh on the scroll view. Requires `scroll`. */
  onRefresh?: () => void;
  /** Whether the refresh spinner is showing. */
  refreshing?: boolean;
}

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'bottom'],
  backgroundColor = colors.background,
  style,
  contentContainerStyle,
  onRefresh,
  refreshing = false,
}: ScreenContainerProps): React.JSX.Element {
  const paddingStyle = padded ? styles.padded : undefined;
  const scroller = useRef<ScrollView>(null);
  /** Latest scroll offset, so a scroll-into-view can be relative to it. */
  const offset = useRef(0);

  /** Top edge of the keyboard in window coords; null while it's closed. */
  const keyboardTop = useRef<number | null>(null);

  /*
   * Scrolls a focused field above the keyboard.
   *
   * React Native does not do this on its own: keyboard insets (iOS) and window
   * resizing (Android, adjustResize) only make the space *reachable* — a field
   * in the lower half of a form still ends up behind the keyboard, and typing
   * into something you can't see is the result.
   */
  const ensureVisible = useCallback((node: Measurable | null) => {
    const bottom = keyboardTop.current;
    if (!node || bottom === null || !scroller.current) return;

    node.measureInWindow((_x, y, _width, height) => {
      const overlap = y + height + FOCUS_MARGIN - bottom;
      // Negative means the field already clears the keyboard; leave the scroll
      // position alone rather than nudging it for no reason.
      if (overlap > 0) {
        scroller.current?.scrollTo({ y: offset.current + overlap, animated: true });
      }
    });
  }, []);

  useEffect(() => {
    if (!scroll) return;

    const shown = Keyboard.addListener('keyboardDidShow', event => {
      keyboardTop.current = event.endCoordinates.screenY;
      ensureVisible(TextInput.State.currentlyFocusedInput());
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
    });

    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [scroll, ensureVisible]);

  const assist = useMemo<ScrollAssist>(() => ({ ensureVisible }), [ensureVisible]);

  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = nativeEvent.contentOffset.y;
  };

  return (
    <ScrollAssistContext.Provider value={scroll ? assist : null}>
      <SafeAreaView style={[styles.safe, { backgroundColor }, style]} edges={edges}>
        {scroll ? (
          <ScrollView
            ref={scroller}
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, paddingStyle, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            // Insets the content by the keyboard's height on iOS, so a form's
            // lower fields and its submit button stay reachable instead of sitting
            // behind the keyboard. Android already resizes the window
            // (windowSoftInputMode=adjustResize), where this is a no-op.
            automaticallyAdjustKeyboardInsets
            // Swiping the list away should dismiss the keyboard with it.
            keyboardDismissMode="on-drag"
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              ) : undefined
            }>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, paddingStyle, contentContainerStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </ScrollAssistContext.Provider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: layout.screenPadding,
  },
});
