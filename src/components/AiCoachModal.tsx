import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONTS } from '../theme/colors';
import { FoodItem, UserProfile } from '../types/nutrition';
import { askNvidiaDietitianCoach } from '../services/nvidiaAiService';

interface AiCoachModalProps {
  visible: boolean;
  profile: UserProfile;
  mealsToday: FoodItem[];
  onClose: () => void;
  onOpenSettings: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  isError?: boolean;
}

const QUICK_PROMPTS = [
  'Kalan kalorimle akşam ne yemeliyim?',
  'Günlük protein hedefimi nasıl tamamlarım?',
  'Bugünkü beslenmemi değerlendir',
  'Yağ yakımını hızlandırmak için öneri ver',
];

export const AiCoachModal: React.FC<AiCoachModalProps> = ({
  visible,
  profile,
  mealsToday,
  onClose,
}) => {
  const consumed = mealsToday.reduce(
    (acc, m) => {
      acc.cal += m.calories;
      acc.p += m.protein;
      acc.c += m.carbs;
      acc.f += m.fat;
      return acc;
    },
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Merhaba ${
        profile.name || 'Dostum'
      }. Günlük bütçen ${profile.targets.calories} kcal ve bugün şu ana kadar ${
        consumed.cal
      } kcal (${consumed.p}g protein · ${consumed.c}g karbonhidrat · ${
        consumed.f
      }g yağ) aldın. Beslenme planın veya öğün tercihlerin hakkında ne sormak istersin?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputText).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const mealNames = mealsToday.map((m) => `${m.name} (${m.calories} kcal)`);
      const reply = await askNvidiaDietitianCoach(
        q,
        profile,
        consumed.cal,
        consumed.p,
        consumed.c,
        consumed.f,
        mealNames
      );

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'coach', text: reply },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'coach',
          text: err?.message || 'Sunucuya ulaşılamadı.',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Klinik Beslenme Koçu</Text>
                <Text style={styles.subtitle}>
                  Hedef {profile.targets.calories} kcal · Alınan {consumed.cal} kcal ·{' '}
                  {consumed.p}g P
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.75}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.msgBox,
                    m.sender === 'user' ? styles.userBox : styles.coachBox,
                    m.isError && styles.errorBox,
                  ]}
                >
                  <Text style={styles.msgRole}>
                    {m.sender === 'user' ? profile.name || 'Siz' : 'Klinik Diyetisyen'}
                  </Text>
                  <Text
                    style={[
                      styles.msgText,
                      m.sender === 'user' && styles.userMsgText,
                      m.isError && styles.errorMsgText,
                    ]}
                  >
                    {m.text}
                  </Text>
                </View>
              ))}

              {isLoading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.ink} />
                  <Text style={styles.loadingText}>Analiz yanıtı hazırlanıyor...</Text>
                </View>
              )}
            </ScrollView>

            {/* Quick Prompt Buttons (rounded-md = 6px, NOT rounded-full pills) */}
            <View style={styles.promptsBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {QUICK_PROMPTS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.promptBtn}
                    onPress={() => handleSend(q)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.promptBtnText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input Footer */}
            <View style={styles.inputFooter}>
              <TextInput
                style={styles.input}
                placeholder="Beslenme veya makro sorunuzu yazın..."
                placeholderTextColor={COLORS.inkMuted}
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
                ]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.sendBtnText}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    height: '88%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: COLORS.ink,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkMuted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.background,
  },
  closeBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.ink,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  msgBox: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  coachBox: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    alignSelf: 'stretch',
  },
  userBox: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.borderStrong,
    alignSelf: 'stretch',
  },
  errorBox: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.danger,
  },
  msgRole: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.inkMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  msgText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 21,
  },
  userMsgText: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.ink,
  },
  errorMsgText: {
    color: COLORS.danger,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  promptsBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  promptBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    marginRight: 8,
  },
  promptBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.ink,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.ink,
  },
  sendBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: COLORS.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
  sendBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.surface,
  },
});
