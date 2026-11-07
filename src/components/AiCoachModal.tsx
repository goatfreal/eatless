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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
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

const QUICK_QUESTIONS = [
  'Kalan kalorimle akşam ne yemeliyim?',
  'Günlük proteinimi nasıl tamamlarım?',
  'Bugünkü beslenmemi değerlendirir misin?',
  'Yağ yakımını hızlandırmak için ne yapmalıyım?',
];

export const AiCoachModal: React.FC<AiCoachModalProps> = ({
  visible,
  profile,
  mealsToday,
  onClose,
  onOpenSettings,
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
      text: `Merhaba ${profile.name}! Ben kişisel NVIDIA AI Diyetisyeninim. Günlük hedefin ${profile.targets.calories} kcal ve bugün şu ana kadar ${consumed.cal} kcal (${consumed.p}g protein) aldın. Beslenmen veya antrenmanların hakkında ne sormak istersin?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputText).trim();
    if (!q) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: q };
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
          text: err?.message || 'NVIDIA sunucusuna bağlanılamadı.',
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
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.coachAvatar}>
                  <Ionicons name="chatbubbles" size={20} color={COLORS.nvidia} />
                </View>
                <View>
                  <Text style={styles.title}>NVIDIA AI Diyetisyen ({profile.name})</Text>
                  <Text style={styles.subtitle}>
                    {profile.nvidiaTextModel || 'meta/llama-3.1-70b-instruct'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {!profile.nvidiaApiKey?.startsWith('nvapi-') && (
              <TouchableOpacity
                style={styles.warningBanner}
                onPress={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                <Ionicons name="key-outline" size={16} color="#FCA5A5" />
                <Text style={styles.warningText}>
                  NVIDIA API Anahtarınız eksik! Buraya dokunarak Ayarlar'dan ekleyin.
                </Text>
              </TouchableOpacity>
            )}

            {/* Chat Messages */}
            <ScrollView style={styles.chatScroll} showsVerticalScrollIndicator={false}>
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.msgBubble,
                    m.sender === 'user' ? styles.userBubble : styles.coachBubble,
                    m.isError && styles.errorBubble,
                  ]}
                >
                  <Text style={styles.msgText}>{m.text}</Text>
                </View>
              ))}

              {isLoading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color={COLORS.nvidia} />
                  <Text style={styles.loadingText}>NVIDIA Llama-3.1 yanıt üretiyor...</Text>
                </View>
              )}
            </ScrollView>

            {/* Quick Suggestions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {QUICK_QUESTIONS.map((q, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => handleSend(q)}>
                  <Text style={styles.chipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Diyetisyenine sor..."
                placeholderTextColor={COLORS.textMuted}
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="arrow-up" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    height: '86%',
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder + '60',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.nvidiaGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.nvidia,
  },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 11, color: COLORS.nvidia, fontWeight: '600' },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#351316',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  warningText: { color: '#FCA5A5', fontSize: 12, fontWeight: '600', flex: 1 },
  chatScroll: { flex: 1, marginBottom: 10 },
  msgBubble: {
    maxWidth: '84%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  coachBubble: {
    backgroundColor: COLORS.cardSecondary,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  errorBubble: {
    backgroundColor: '#351316',
    borderColor: '#EF4444',
  },
  msgText: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardSecondary,
    padding: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 12 },
  chipsRow: { flexDirection: 'row', maxHeight: 38, marginBottom: 10 },
  chip: {
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chipText: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  input: { flex: 1, color: COLORS.text, fontSize: 14, paddingVertical: 8 },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.3 },
});
