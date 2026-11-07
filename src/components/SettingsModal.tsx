import React, { useEffect, useState } from 'react';
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
import { UserProfile } from '../types/nutrition';
import { getDefaultNvidiaKey, testNvidiaApiKey } from '../services/nvidiaAiService';
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
  const [apiKey, setApiKey] = useState(profile.nvidiaApiKey || getDefaultNvidiaKey());
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [calorieTarget, setCalorieTarget] = useState(
    profile.targets.calories.toString()
  );
  const [proteinTarget, setProteinTarget] = useState(
    profile.targets.protein.toString()
  );
  const [carbsTarget, setCarbsTarget] = useState(
    profile.targets.carbs.toString()
  );
  const [fatTarget, setFatTarget] = useState(profile.targets.fat.toString());
  const [waterTarget, setWaterTarget] = useState(
    profile.targets.waterMl.toString()
  );

  useEffect(() => {
    setName(profile.name);
    setApiKey(profile.nvidiaApiKey || getDefaultNvidiaKey());
    setCalorieTarget(profile.targets.calories.toString());
    setProteinTarget(profile.targets.protein.toString());
    setCarbsTarget(profile.targets.carbs.toString());
    setFatTarget(profile.targets.fat.toString());
    setWaterTarget(profile.targets.waterMl.toString());
  }, [profile, visible]);

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
      nvidiaApiKey: (apiKey || getDefaultNvidiaKey()).trim(),
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
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Profil ve Sistem Ayarları</Text>
                <Text style={styles.subtitle}>
                  Yaş {profile.age} · {profile.heightCm} cm · {profile.currentWeightKg} kg
                  · BMR {profile.targets.bmr} kcal
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollBody}
            >
              {/* Section 01: Personal Identity */}
              <Text style={styles.sectionHeading}>01. Kişisel Bilgiler</Text>
              <View style={styles.surfaceGroup}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Kullanıcı Adı</Text>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Adınız"
                    placeholderTextColor={COLORS.inkMuted}
                  />
                </View>

                <View style={[styles.fieldRow, styles.hairlineTop]}>
                  <TouchableOpacity
                    onPress={onResetOnboarding}
                    activeOpacity={0.75}
                    style={styles.secondaryActionBtn}
                  >
                    <Text style={styles.secondaryActionText}>
                      Kurulum Sihirbazını Yeniden Çalıştır
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section 02: NVIDIA API Configuration */}
              <Text style={styles.sectionHeading}>02. NVIDIA NIM API Yapılandırması</Text>
              <View style={styles.surfaceGroup}>
                <View style={styles.fieldRow}>
                  <View style={styles.labelBetween}>
                    <Text style={styles.fieldLabel}>API Anahtarı (nvapi-...)</Text>
                    <TouchableOpacity onPress={() => setShowKey(!showKey)}>
                      <Text style={styles.toggleLink}>
                        {showKey ? 'Gizle' : 'Göster'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.monoInput}
                    placeholder="nvapi-..."
                    placeholderTextColor={COLORS.inkMuted}
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry={!showKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={[styles.fieldRow, styles.hairlineTop]}>
                  <TouchableOpacity
                    style={[styles.testBtn, isTesting && { opacity: 0.7 }]}
                    onPress={handleTest}
                    disabled={isTesting}
                    activeOpacity={0.8}
                  >
                    {isTesting ? (
                      <ActivityIndicator size="small" color={COLORS.surface} />
                    ) : (
                      <Text style={styles.testBtnText}>Test Et</Text>
                    )}
                  </TouchableOpacity>

                  {testResult && (
                    <Text
                      style={[
                        styles.testResultText,
                        {
                          color: testResult.ok ? COLORS.accent : COLORS.danger,
                        },
                      ]}
                    >
                      {testResult.message}
                    </Text>
                  )}
                </View>
              </View>

              {/* Section 03: Daily Targets */}
              <View style={styles.headingBetween}>
                <Text style={styles.sectionHeading}>03. Günlük Enerji ve Makro Bütçesi</Text>
                <TouchableOpacity onPress={handleRecalculateAuto}>
                  <Text style={styles.toggleLink}>Mifflin-St Jeor İle Sıfırla</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.surfaceGroup}>
                <View style={styles.inlineInputRow}>
                  <Text style={styles.inlineInputLabel}>Günlük Kalori (kcal)</Text>
                  <TextInput
                    style={styles.inlineMonoInput}
                    keyboardType="numeric"
                    value={calorieTarget}
                    onChangeText={setCalorieTarget}
                  />
                </View>

                <View style={[styles.inlineInputRow, styles.hairlineTop]}>
                  <Text style={styles.inlineInputLabel}>Protein Hedefi (g)</Text>
                  <TextInput
                    style={styles.inlineMonoInput}
                    keyboardType="numeric"
                    value={proteinTarget}
                    onChangeText={setProteinTarget}
                  />
                </View>

                <View style={[styles.inlineInputRow, styles.hairlineTop]}>
                  <Text style={styles.inlineInputLabel}>Karbonhidrat Hedefi (g)</Text>
                  <TextInput
                    style={styles.inlineMonoInput}
                    keyboardType="numeric"
                    value={carbsTarget}
                    onChangeText={setCarbsTarget}
                  />
                </View>

                <View style={[styles.inlineInputRow, styles.hairlineTop]}>
                  <Text style={styles.inlineInputLabel}>Yağ Hedefi (g)</Text>
                  <TextInput
                    style={styles.inlineMonoInput}
                    keyboardType="numeric"
                    value={fatTarget}
                    onChangeText={setFatTarget}
                  />
                </View>

                <View style={[styles.inlineInputRow, styles.hairlineTop]}>
                  <Text style={styles.inlineInputLabel}>Su Hedefi (ml)</Text>
                  <TextInput
                    style={styles.inlineMonoInput}
                    keyboardType="numeric"
                    value={waterTarget}
                    onChangeText={setWaterTarget}
                  />
                </View>
              </View>

              {/* Section 04: Sideloadly Auto-Refresh */}
              <Text style={styles.sectionHeading}>04. iOS 7 Günlük İmza Yenileme</Text>
              <View style={styles.surfaceGroup}>
                <View style={styles.fieldRow}>
                  <Text style={styles.guideBody}>
                    Sideloadly üzerinden kurulum yaparken Wi-Fi Auto-Refresh seçeneğini
                    aktif bıraktığınızda, bilgisayarınız ve telefonunuz aynı yerel ağda
                    olduğu sürece 7 günlük sertifika süresi dolmadan arka planda otomatik
                    yenilenir ve verileriniz korunur.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveAllBtn}
                onPress={handleSaveAll}
                activeOpacity={0.85}
              >
                <Text style={styles.saveAllBtnText}>Ayarları Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
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
    maxHeight: '92%',
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
  scrollBody: {
    padding: 20,
    paddingBottom: 38,
  },
  sectionHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: COLORS.ink,
    marginTop: 14,
    marginBottom: 8,
  },
  headingBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  surfaceGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fieldRow: {
    padding: 15,
  },
  hairlineTop: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  labelBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginBottom: 6,
  },
  toggleLink: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.accent,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.ink,
  },
  monoInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.ink,
  },
  secondaryActionBtn: {
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.ink,
  },
  testBtn: {
    backgroundColor: COLORS.ink,
    paddingVertical: 11,
    borderRadius: 6,
    alignItems: 'center',
  },
  testBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.surface,
  },
  testResultText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    marginTop: 10,
    lineHeight: 17,
  },
  inlineInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  inlineInputLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.ink,
  },
  inlineMonoInput: {
    width: 96,
    height: 36,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 10,
    textAlign: 'right',
    fontFamily: FONTS.monoSemiBold,
    fontSize: 14,
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  guideBody: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.inkSecondary,
    lineHeight: 19,
  },
  saveAllBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 14,
  },
  saveAllBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.surface,
  },
});
