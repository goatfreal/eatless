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
import { UserProfile } from '../types/nutrition';
import { testNvidiaApiKey } from '../services/nvidiaAiService';
import { calculatePersonalTargets } from '../utils/calorieCalculator';

interface SettingsModalProps {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
  onResetOnboarding: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  profile,
  onClose,
  onSave,
  onResetOnboarding,
}) => {
  const [name, setName] = useState(profile.name);
  const [apiKey, setApiKey] = useState(profile.nvidiaApiKey);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [calorieTarget, setCalorieTarget] = useState(profile.targets.calories.toString());
  const [proteinTarget, setProteinTarget] = useState(profile.targets.protein.toString());
  const [carbsTarget, setCarbsTarget] = useState(profile.targets.carbs.toString());
  const [fatTarget, setFatTarget] = useState(profile.targets.fat.toString());
  const [waterTarget, setWaterTarget] = useState(profile.targets.waterMl.toString());

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testNvidiaApiKey(apiKey);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleRecalculateAuto = () => {
    const calc = calculatePersonalTargets(
      profile.gender,
      profile.age,
      profile.heightCm,
      profile.currentWeightKg,
      profile.activityLevel,
      profile.goalType
    );
    setCalorieTarget(calc.calories.toString());
    setProteinTarget(calc.protein.toString());
    setCarbsTarget(calc.carbs.toString());
    setFatTarget(calc.fat.toString());
    setWaterTarget(calc.waterMl.toString());
  };

  const handleSaveAll = () => {
    onSave({
      ...profile,
      name: name.trim() || profile.name,
      nvidiaApiKey: apiKey.trim(),
      targets: {
        ...profile.targets,
        calories: parseInt(calorieTarget, 10) || profile.targets.calories,
        protein: parseInt(proteinTarget, 10) || profile.targets.protein,
        carbs: parseInt(carbsTarget, 10) || profile.targets.carbs,
        fat: parseInt(fatTarget, 10) || profile.targets.fat,
        waterMl: parseInt(waterTarget, 10) || profile.targets.waterMl,
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
              <Text style={styles.title}>Profil & NVIDIA Ayarları</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Personal Info */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Kişisel Profil</Text>
                </View>

                <Text style={styles.fieldLabel}>İsminiz</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="İsminiz"
                  placeholderTextColor={COLORS.textMuted}
                />

                <View style={styles.infoRow}>
                  <Text style={styles.infoChip}>Yaş: {profile.age}</Text>
                  <Text style={styles.infoChip}>Boy: {profile.heightCm} cm</Text>
                  <Text style={styles.infoChip}>Kilo: {profile.currentWeightKg} kg</Text>
                  <Text style={styles.infoChip}>BMR: {profile.targets.bmr} kcal</Text>
                </View>

                <TouchableOpacity style={styles.reOnboardBtn} onPress={onResetOnboarding}>
                  <Ionicons name="refresh-outline" size={16} color={COLORS.primaryLight} />
                  <Text style={styles.reOnboardText}>
                    Kurulum Sihirbazını Baştan Çalıştır (Boy/Yaş/Hedef Değiştir)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* NVIDIA API Key Section */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="hardware-chip-outline" size={18} color={COLORS.nvidia} />
                  <Text style={styles.sectionTitle}>NVIDIA NIM API Bağlantısı</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Llama-3.2 Vision (Fotoğraf) ve Llama-3.1 70B (Metin/Koç) modelleri için nvapi-... anahtarınız:
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
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(!showKey)}>
                    <Ionicons
                      name={showKey ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.testBtn, !apiKey.trim() && { opacity: 0.5 }]}
                  onPress={handleTest}
                  disabled={!apiKey.trim() || isTesting}
                >
                  {isTesting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={15} color="#FFF" />
                      <Text style={styles.testBtnText}>NVIDIA Bağlantısını Test Et</Text>
                    </>
                  )}
                </TouchableOpacity>

                {testResult && (
                  <View
                    style={[
                      styles.testBox,
                      { borderColor: testResult.ok ? COLORS.nvidia : COLORS.danger },
                    ]}
                  >
                    <Text
                      style={{
                        color: testResult.ok ? '#D1E7A3' : '#FCA5A5',
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {testResult.message}
                    </Text>
                  </View>
                )}
              </View>

              {/* Daily Nutrition Targets */}
              <View style={styles.section}>
                <View style={styles.headerBetween}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="flame-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Günlük Hedefler</Text>
                  </View>
                  <TouchableOpacity onPress={handleRecalculateAuto}>
                    <Text style={styles.autoCalcLink}>Otomatik Hesapla</Text>
                  </TouchableOpacity>
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

              {/* 7-Day Sideload Auto-Refresh Guide */}
              <View style={[styles.section, styles.refreshGuideSection]}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="wifi" size={18} color="#38BDF8" />
                  <Text style={[styles.sectionTitle, { color: '#38BDF8' }]}>
                    7 Günlük Sideload Otomatik Yenileme
                  </Text>
                </View>
                <Text style={styles.guideText}>
                  Sideloadly'de telefonunuz bağlıyken sağ alttaki "Wi-Fi" seçeneğini işaretleyin. Bilgisayarınız ve telefonunuz aynı Wi-Fi ağındayken kablo takmadan her hafta arka planda otomatik yenilenir ve uygulama hiç kapanmaz.
                </Text>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAll}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
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
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 19, fontWeight: '800', color: COLORS.text },
  section: {
    marginBottom: 16,
    backgroundColor: COLORS.cardSecondary,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sectionSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 16 },
  autoCalcLink: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '700' },
  textInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  infoChip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  reOnboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  reOnboardText: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '700' },
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
    paddingVertical: 11,
  },
  eyeBtn: { paddingHorizontal: 12 },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.nvidia,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  testBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  testBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
  },
  targetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  targetField: {
    width: '48%',
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  fieldLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', marginBottom: 4 },
  numberInput: { color: COLORS.text, fontSize: 16, fontWeight: '800', padding: 0 },
  refreshGuideSection: { backgroundColor: '#0F1E2E', borderColor: '#1D3B5C' },
  guideText: { color: '#93C5FD', fontSize: 12, lineHeight: 17 },
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
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
