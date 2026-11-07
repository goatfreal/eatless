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

interface AiCoachModalProps {
  visible: boolean;
  nvidiaApiKey: string;
  totalCaloriesToday: number;
  remainingCalories: number;
  proteinConsumed: number;
  proteinTarget: number;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
}

const QUICK_QUESTIONS = [
  'Kalan kalorimle ne yiyebilirim?',
  'Proteinimi nasıl tamamlarım?',
  'Oruçluyken ne içebilirim?',
  'Gece acıkırsam ne tüketmeliyim?',
];

export const AiCoachModal: React.FC<AiCoachModalProps> = ({
  visible,
  nvidiaApiKey,
  totalCaloriesToday,
  remainingCalories,
  proteinConsumed,
  proteinTarget,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Merhaba! Ben Eatless yapay zeka beslenme koçun. Bugün ${totalCaloriesToday} kcal aldın ve hedefine ${remainingCalories} kcal kaldı (Protein: ${proteinConsumed}/${proteinTarget}g). Sana nasıl yardımcı olabilirim?`,
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
      let reply = '';
      if (nvidiaApiKey && nvidiaApiKey.startsWith('nvapi-')) {
        const prompt = `Sen profesyonel, motive edici bir sporcu ve beslenme diyetisyenisin.
Kullanıcının bugünkü durumu:
- Alınan kalori: ${totalCaloriesToday} kcal
- Kalan kalori bütçesi: ${remainingCalories} kcal
- Tüketilen protein: ${proteinConsumed}g / Hedef: ${proteinTarget}g

Kullanıcının sorusu: "${q}"
Kısa, samimi, pratik ve doğrudan uygulanabilir bir Türkçe tavsiye ver (en fazla 2-3 cümle).`;

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${nvidiaApiKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'meta/llama-3.1-70b-instruct',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 250,
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          reply = data.choices?.[0]?.message?.content || '';
        }
      }

      if (!reply) {
        // Fallback intelligent advice
        if (q.includes('protein')) {
          reply = `Kalan proteinini tamamlamak için lor peyniri (100g = 17g protein), yağsız süzme yoğurt veya haşlanmış yumurta akı harika ve hafif seçeneklerdir!`;
        } else if (q.includes('oruç')) {
          reply = `Aralıklı oruç penceresinde sade maden suyu, şekersiz filtre kahve, yeşil çay ve bol su serbesttir; bunlar insülin salgılatmaz.`;
        } else if (q.includes('gece') || q.includes('acık')) {
          reply = `Gece acıkırsan 1 bardak ılık tarçınlı süt, 5-6 adet badem veya salatalık atıştırabilirsin; kan şekerini dengeleyip uykunu bölmez.`;
        } else {
          reply = `Bugün hedefinize sadık kalmak için kalan ${remainingCalories} kaloriyi sebze ağırlıklı ve kaliteli proteinli bir öğünle değerlendirmenizi öneririm!`;
        }
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'coach', text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'coach', text: 'Tavsiyem: Günlük su ve protein dengesini korumayı unutma!' },
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
                  <Text style={styles.title}>Yapay Zeka Beslenme Koçu</Text>
                  <Text style={styles.subtitle}>NVIDIA NIM Beslenme Danışmanı</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Messages Chat */}
            <ScrollView style={styles.chatScroll} showsVerticalScrollIndicator={false}>
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.msgBubble,
                    m.sender === 'user' ? styles.userBubble : styles.coachBubble,
                  ]}
                >
                  <Text style={styles.msgText}>{m.text}</Text>
                </View>
              ))}

              {isLoading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color={COLORS.nvidia} />
                  <Text style={styles.loadingText}>Koç düşünüyor...</Text>
                </View>
              )}
            </ScrollView>

            {/* Quick Questions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {QUICK_QUESTIONS.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => handleSend(q)}
                >
                  <Text style={styles.chipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Input Row */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Beslenmenle ilgili bir soru sor..."
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
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    height: '85%',
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder + '60',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.nvidia,
    fontWeight: '600',
  },
  chatScroll: {
    flex: 1,
    marginBottom: 10,
  },
  msgBubble: {
    maxWidth: '82%',
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
  msgText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardSecondary,
    padding: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    maxHeight: 38,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chipText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
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
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 8,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.3,
  },
});
