import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { geminiService } from '@/services/gemini';
import { useAuth } from '@/hooks/useAuth';
import { useCarbon } from '@/hooks/useCarbon';
import { useRecommendations } from '@/hooks/useRecommendations';
import type { ChatMessage } from '@/types';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatRelativeTime } from '@/utils/date';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_MESSAGE: ChatMessage = {
  id: '0',
  role: 'assistant',
  content:
    "Hi! I'm your EcoPulse AI sustainability coach, powered by Gemini. I have access to your live carbon data and can help you understand your footprint, build a reduction plan, or answer any sustainability question. What's on your mind?",
  timestamp: new Date().toISOString(),
};

const QUICK_PROMPTS = [
  { label: 'Biggest impact', text: "What's the single biggest change I can make right now?" },
  { label: 'Weekly plan', text: 'Give me a practical week-by-week plan to reduce my footprint by 20%' },
  { label: 'Transport tips', text: 'How can I reduce my transport emissions specifically?' },
  { label: 'Food impact', text: 'How much does my diet contribute and what should I change?' },
  { label: 'Weekly report', text: 'Generate my weekly sustainability report' },
  { label: 'Reduction plan', text: 'Create a 30% carbon reduction plan tailored to my data' },
];

const TYPEWRITER_SPEED_MS = 14;

// ---------------------------------------------------------------------------
// TypingDots component
// ---------------------------------------------------------------------------

function TypingDots() {
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (sv: Animated.SharedValue<number>, delay: number) => {
      sv.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    };
    // Stagger the dots
    opacity1.value = withRepeat(
      withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
      -1
    );
    setTimeout(() => {
      opacity2.value = withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
        -1
      );
    }, 133);
    setTimeout(() => {
      opacity3.value = withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
        -1
      );
    }, 266);
    return () => {
      opacity1.value = 0.3;
      opacity2.value = 0.3;
      opacity3.value = 0.3;
    };
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ opacity: opacity1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: opacity2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: opacity3.value }));

  return (
    <View style={dotStyles.row}>
      <Animated.View style={[dotStyles.dot, dot1Style]} />
      <Animated.View style={[dotStyles.dot, dot2Style]} />
      <Animated.View style={[dotStyles.dot, dot3Style]} />
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.emerald[500],
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CoachScreen() {
  const { profile } = useAuth();
  const { currentMonthBreakdown } = useCarbon();
  const { requestWeeklyReport, requestReductionPlan } = useRecommendations();
  const params = useLocalSearchParams<{ prefill?: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-fill from simulator or other screens
  useEffect(() => {
    if (params.prefill && !input) {
      setInput(decodeURIComponent(params.prefill));
    }
  }, [params.prefill]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isFetching) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setShowQuickPrompts(false);
      setIsFetching(true);
      scrollToBottom();

      try {
        const fullResponse = await geminiService.sendChatMessage(
          messages,
          text.trim(),
          profile ?? {},
          currentMonthBreakdown
        );

        const assistantId = (Date.now() + 1).toString();
        const timestamp = new Date().toISOString();

        // Add empty message, then typewrite into it
        setMessages(prev => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '', timestamp },
        ]);
        setStreamingId(assistantId);
        setIsFetching(false);
        scrollToBottom();

        // Typewriter effect
        let idx = 0;
        const charsPerTick = Math.max(1, Math.ceil(fullResponse.length / 220)); // finish in ~220 ticks
        typewriterRef.current = setInterval(() => {
          idx = Math.min(idx + charsPerTick, fullResponse.length);
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, content: fullResponse.slice(0, idx) } : m
            )
          );
          if (idx >= fullResponse.length) {
            clearInterval(typewriterRef.current!);
            typewriterRef.current = null;
            setStreamingId(null);
          }
        }, TYPEWRITER_SPEED_MS);
      } catch {
        setIsFetching(false);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. Please check that your Gemini API key is configured and try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }

      scrollToBottom();
    },
    [isFetching, messages, profile, currentMonthBreakdown, scrollToBottom]
  );

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

  function renderMessage({ item }: { item: ChatMessage }) {
    const isUser = item.role === 'user';
    const isStreaming = item.id === streamingId;

    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <View style={styles.assistantIcon}>
            <MaterialCommunityIcons name="robot" size={15} color={Colors.emerald[500]} />
          </View>
        )}
        <View style={[styles.bubbleContent, isUser ? styles.userContent : styles.assistantContent]}>
          <Text
            variant="body"
            style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}
          >
            {item.content}
            {isStreaming && (
              <Text style={styles.cursor}>▌</Text>
            )}
          </Text>
          {!isStreaming && (
            <Text variant="caption" color="dim" style={styles.timestamp}>
              {formatRelativeTime(item.timestamp)}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.robotAvatar}>
            <MaterialCommunityIcons name="robot" size={22} color={Colors.emerald[400]} />
          </View>
          <View>
            <Text variant="title">AI Coach</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text variant="caption" color="muted">Gemini · Live carbon data</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowQuickPrompts(v => !v)}
          style={styles.promptToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name={showQuickPrompts ? 'chevron-down' : 'lightning-bolt'}
            size={20}
            color={Colors.emerald[500]}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Message list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={
            isFetching ? (
              <View style={styles.thinkingRow}>
                <View style={styles.assistantIcon}>
                  <MaterialCommunityIcons name="robot" size={15} color={Colors.emerald[500]} />
                </View>
                <View style={styles.thinkingBubble}>
                  <TypingDots />
                  <Text variant="caption" color="muted" style={{ marginLeft: Spacing.xs }}>
                    Thinking...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick prompts */}
        {showQuickPrompts && (
          <View style={styles.quickPromptsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPromptsScroll}
            >
              {QUICK_PROMPTS.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickPrompt}
                  onPress={() => sendMessage(p.text)}
                  disabled={isFetching}
                >
                  <Text variant="caption" color="secondary" style={styles.quickPromptText}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your carbon footprint..."
            placeholderTextColor={Colors.text.dim}
            multiline
            maxLength={600}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => sendMessage(input)}
            editable={!isFetching}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || isFetching) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isFetching}
          >
            {isFetching ? (
              <ActivityIndicator size="small" color={Colors.emerald[400]} />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={input.trim() ? Colors.background.primary : Colors.text.dim}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  robotAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.emerald[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}40`,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  promptToggle: {
    padding: Spacing.xs,
  },
  messageList: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  messageBubble: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  assistantIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: `${Colors.emerald[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  bubbleContent: {
    maxWidth: '82%',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: 4,
  },
  userContent: {
    backgroundColor: Colors.emerald[600],
    borderBottomRightRadius: 4,
  },
  assistantContent: {
    backgroundColor: Colors.background.elevated,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    lineHeight: 22,
  },
  userText: {
    color: Colors.white,
  },
  assistantText: {
    color: Colors.text.primary,
  },
  cursor: {
    color: Colors.emerald[400],
    fontWeight: '100',
  },
  timestamp: {
    alignSelf: 'flex-end',
    opacity: 0.5,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  quickPromptsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingVertical: Spacing.sm,
  },
  quickPromptsScroll: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
  },
  quickPrompt: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: `${Colors.emerald[700]}80`,
  },
  quickPromptText: {
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background.primary,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    color: Colors.text.primary,
    fontSize: FontSize.base,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.emerald[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.background.elevated,
  },
});
