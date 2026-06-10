import React, { useState, useRef, useCallback } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { deepseekService } from '@/services/deepseek';
import { useAuth } from '@/hooks/useAuth';
import { useCarbon } from '@/hooks/useCarbon';
import type { ChatMessage } from '@/types';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatRelativeTime } from '@/utils/date';

const INITIAL_MESSAGE: ChatMessage = {
  id: '0',
  role: 'assistant',
  content: "Hi! I'm your EcoPulse AI sustainability coach. I can help you understand your carbon footprint, create reduction plans, and answer any questions about living more sustainably. What would you like to know?",
  timestamp: new Date().toISOString(),
};

const QUICK_PROMPTS = [
  'How can I reduce my transport emissions?',
  'Give me a weekly plan to reduce my footprint',
  'What\'s the biggest impact I can make?',
  'How does my diet affect my carbon?',
];

export default function CoachScreen() {
  const { profile } = useAuth();
  const { currentMonthBreakdown } = useCarbon();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await deepseekService.sendChatMessage(
        messages,
        text.trim(),
        profile ?? {},
        currentMonthBreakdown
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your connection and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isTyping, messages, profile, currentMonthBreakdown]);

  function renderMessage({ item }: { item: ChatMessage }) {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <View style={styles.assistantIcon}>
            <MaterialCommunityIcons name="robot" size={16} color={Colors.emerald[500]} />
          </View>
        )}
        <View style={[styles.bubbleContent, isUser ? styles.userContent : styles.assistantContent]}>
          <Text
            variant="body"
            style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}
          >
            {item.content}
          </Text>
          <Text variant="caption" color="dim" style={styles.timestamp}>
            {formatRelativeTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.robotAvatar}>
            <MaterialCommunityIcons name="robot" size={24} color={Colors.emerald[400]} />
          </View>
          <View>
            <Text variant="title">AI Coach</Text>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text variant="caption" color="muted">
                EcoPulse AI
              </Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingIndicator}>
                <View style={styles.assistantIcon}>
                  <MaterialCommunityIcons name="robot" size={16} color={Colors.emerald[500]} />
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={Colors.emerald[500]} />
                  <Text variant="caption" color="muted">
                    Thinking...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {messages.length <= 2 && (
          <View style={styles.quickPrompts}>
            <ScrollHorizontal>
              {QUICK_PROMPTS.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickPrompt}
                  onPress={() => sendMessage(prompt)}
                >
                  <Text variant="caption" color="secondary">
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollHorizontal>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your carbon footprint..."
            placeholderTextColor={Colors.text.dim}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            editable={!isTyping}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isTyping) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={input.trim() && !isTyping ? Colors.background.primary : Colors.text.dim}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ScrollHorizontal({ children }: { children: React.ReactNode }) {
  const { ScrollView: RNScrollView } = require('react-native');
  return (
    <RNScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing['2xl'] }}
    >
      {children}
    </RNScrollView>
  );
}

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
    backgroundColor: `${Colors.emerald[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}40`,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  messageList: {
    padding: Spacing['2xl'],
    gap: Spacing.md,
    paddingBottom: Spacing.base,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.emerald[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubbleContent: {
    maxWidth: '80%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
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
  timestamp: {
    alignSelf: 'flex-end',
    opacity: 0.6,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  quickPrompts: {
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  quickPrompt: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.divider,
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
