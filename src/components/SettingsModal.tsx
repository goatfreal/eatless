import React, { useState } from 'react';
import {
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
import { UserSettings } from '../types/nutrition';

interface SettingsModalProps {
  visible: boolean;
  settings: UserSettings;
  onClose: () => void;
  onSave: (updated: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  settings,
  onClose,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState(settings.nvidiaApiKey);
  const [showKey, setShowKey] = useState(false);

  const [calorieTarget, setCalorieTarget] = useState(settings.targets.calories.toString());
  const [proteinTarget, setProteinTarget] = useState(settings.targets.protein.toString());
  const [carbsTarget, setCarbsTarget] = useState(settings.targets.carbs.toString());
  const [fatTarget, setFatTarget] = useState(settings.targets.fat.toString());
  const [waterTarget, setWaterTarget] = useState(settings.targets.waterMl.toString());

  const handleSaveAll = () => {
    onSave({
      ...settings,
      nvidiaApiKey: apiKey.trim(),
      targets: {
        calories: parseInt(calorieTarget, 10) || 2000,
        protein: parseInt(proteinTarget, 10) || 120,
        carbs: parseInt(carbsTarget, 10) || 200,
        fat: parseInt(fatTarget, 10) || 60,
        waterMl: parseInt(waterTarget, 10) || 2500,
      },
    });
    onClose();
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
              <Text style={styles.title}>Ayarlar & Yapay Zeka</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* NVIDIA API Key Section */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="hardware-chip-outline" size={18} color={COLORS.nvidia} />
                  <Text style={styles.sectionTitle}>NVIDIA API Anahtarı</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Fotoğraflı ve metinli öğün analizi için NVIDIA NIM (Llama-3.2 Vision) motorunu bağlar.
                </Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.keyInput}
                    placeholder="nvapi-..."
                    placeholderTextColor={COLORS.textMuted}
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry={!showKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowKey(!showKey)}
                  >
                    <Ionicons
                      name={showKey ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {apiKey.startsWith('nvapi-') && (
                  <View style={styles.connectedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.nvidia} />
                    <Text style={styles.connectedText}>NVIDIA API Bağlı ve Aktif</Text>
                  </View>
                )}
              </View>

              {/* 7-Day Sideload Expiration Guide */}
              <View style={[styles.section, styles.refreshGuideSection]}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#38BDF8" />
                  <Text style={[styles.sectionTitle, { color: '#38BDF8' }]}>
                    7 Günlük Süre Bitme Çözümü
                  </Text>
                </View>
                <Text style={styles.guideText}>
                  Apple'ın ücretsiz geliştirici kuralları gereği kabloyla yüklenen uygulamaların süresi 7 gün sonra biter. Bunu aşmanın 2 kalıcı yolu:
                </Text>

                <View style={styles.stepBox}>
                  <Text style={styles.stepTitle}>1. Yol: Sideloadly Otomatik Wi-Fi Yenileme (Önerilen)</Text>
                  <Text style={styles.stepDesc}>
                    Bilgisayarında Sideloadly'yi açtığında telefonun bağlıyken sağ altta <Text style={{ fontWeight: '700', color: '#FFF' }}>"Wi-Fi Sideloading"</Text> seçeneğini açık bırak. Bilgisayarın açık olduğu sürece her hafta kablo bağlamadan arka planda otomatik yenilenir!
                  </Text>
                </View>

                <View style={styles.stepBox}>
                  <Text style={styles.stepTitle}>2. Yol: Expo Go (Sonsuz Süre)</Text>
                  <Text style={styles.stepDesc}>
                    Telefonuna App Store'dan ücretsiz <Text style={{ fontWeight: '700', color: '#FFF' }}>Expo Go</Text> indirip terminalden `npx expo start` ile açarsan 7 günlük süre sınırı tamamen 0 olur ve ömür boyu kapanmaz.
                  </Text>
                </View>
              </View>

              {/* Daily Target Goals */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="fitness-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Günlük Beslenme Hedefleri</Text>
                </View>

                <View style={styles.targetGrid}>
                  <View style={styles.targetField}>
                    <Text style={styles.fieldLabel}>Kalori (kcal)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={calorieTarget}
                      onChangeText={setCalorieTarget}
                    />
                  </View>

                  <View style={styles.targetField}>
                    <Text style={[styles.fieldLabel, { color: COLORS.protein }]}>Protein (g)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={proteinTarget}
                      onChangeText={setProteinTarget}
                    />
                  </View>

                  <View style={styles.targetField}>
                    <Text style={[styles.fieldLabel, { color: COLORS.carbs }]}>Karb (g)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={carbsTarget}
                      onChangeText={setCarbsTarget}
                    />
                  </View>

                  <View style={styles.targetField}>
                    <Text style={[styles.fieldLabel, { color: COLORS.fat }]}>Yağ (g)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={fatTarget}
                      onChangeText={setFatTarget}
                    />
                  </View>

                  <View style={[styles.targetField, { width: '100%' }]}>
                    <Text style={[styles.fieldLabel, { color: COLORS.water }]}>Günlük Su (ml)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={waterTarget}
                      onChangeText={setWaterTarget}
                    />
                  </View>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveAll}
                activeOpacity={0.8}
              >
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Ayarları Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
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
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  section: {
    marginBottom: 20,
    backgroundColor: COLORS.cardSecondary,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  keyInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eyeBtn: {
    paddingHorizontal: 12,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  connectedText: {
    color: COLORS.nvidia,
    fontSize: 12,
    fontWeight: '700',
  },
  refreshGuideSection: {
    backgroundColor: '#0F1E2E',
    borderColor: '#1D3B5C',
  },
  guideText: {
    color: '#93C5FD',
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  stepBox: {
    backgroundColor: '#162C44',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  stepTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  stepDesc: {
    color: '#BFDBFE',
    fontSize: 11,
    lineHeight: 15,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  targetField: {
    width: '48%',
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  fieldLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  numberInput: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    padding: 0,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
