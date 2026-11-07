import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONTS } from '../theme/colors';
import { ActivityLevel, Gender, GoalType, UserProfile } from '../types/nutrition';
import { calculateBMI, calculatePersonalTargets } from '../utils/calorieCalculator';
import { getDefaultNvidiaKey, testNvidiaApiKey } from '../services/nvidiaAiService';

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  // Step 1: Name & Gender
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');

  // Step 2: Age, Height, Weight
  const [age, setAge] = useState('22');
  const [heightCm, setHeightCm] = useState('178');
  const [currentWeightKg, setCurrentWeightKg] = useState('76');

  // Step 3: Goal & Activity
  const [goalType, setGoalType] = useState<GoalType>('lose');
  const [targetWeightKg, setTargetWeightKg] = useState('70');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  // Step 4: NVIDIA API Key (Pre-populated with user's key for zero-friction setup)
  const [nvidiaApiKey, setNvidiaApiKey] = useState(getDefaultNvidiaKey());
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const calculatedTargets = useMemo(() => {
    return calculatePersonalTargets(
      gender,
      parseInt(age, 10) || 22,
      parseFloat(heightCm) || 178,
      parseFloat(currentWeightKg) || 76,
      activityLevel,
      goalType
    );
  }, [gender, age, heightCm, currentWeightKg, activityLevel, goalType]);

  const bmiInfo = useMemo(() => {
    return calculateBMI(
      parseFloat(currentWeightKg) || 76,
      parseFloat(heightCm) || 178
    );
  }, [heightCm, currentWeightKg]);

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setKeyTestResult(null);
    const res = await testNvidiaApiKey(nvidiaApiKey);
    setKeyTestResult(res);
    setIsTestingKey(false);
  };

  const handleFinish = () => {
    const finalProfile: UserProfile = {
      isOnboarded: true,
      name: name.trim() || 'Kullanıcı',
      gender,
      age: parseInt(age, 10) || 22,
      heightCm: parseFloat(heightCm) || 178,
      currentWeightKg: parseFloat(currentWeightKg) || 76,
      targetWeightKg: parseFloat(targetWeightKg) || 70,
      activityLevel,
      goalType,
      nvidiaApiKey: (nvidiaApiKey || getDefaultNvidiaKey()).trim(),
      nvidiaTextModel: 'nvidia/nemotron-3.5-lightning-30b-a3b',
      nvidiaVisionModel: 'nvidia/nemotron-3.5-super-vl-120b-a12b',
      targets: calculatedTargets,
    };
    onComplete(finalProfile);
  };

  const canGoNext = () => {
    if (step === 1) return name.trim().length >= 2;
    if (step === 2) {
      const a = parseInt(age, 10);
      const h = parseFloat(heightCm);
      const w = parseFloat(currentWeightKg);
      return a > 10 && a < 100 && h > 100 && h < 250 && w > 30 && w < 300;
    }
    if (step === 3) {
      const tw = parseFloat(targetWeightKg);
      return tw > 30 && tw < 300;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Top Editorial Bar */}
        <View style={styles.topHeader}>
          <View style={styles.topBarRow}>
            <Text style={styles.brandWordmark}>Eatless</Text>
            <Text style={styles.stepIndicator}>Adım 0{step} / 05</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(step / 5) * 100}%` },
              ]}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: Name & Gender */}
          {step === 1 && (
            <View style={styles.stepBlock}>
              <Text style={styles.sectionNumber}>01. Kişisel Kimlik</Text>
              <Text style={styles.title}>Metabolik profilinizi oluşturalım.</Text>
              <Text style={styles.subtitle}>
                Klinik Mifflin-St Jeor denklemiyle bazal metabolizma hızınızı ve makro
                ihtiyacınızı hesaplamak için temel bilgilerinizi girin.
              </Text>

              <View style={styles.surfaceGroup}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Adınız</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Mert"
                    placeholderTextColor={COLORS.inkMuted}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                </View>

                <View style={[styles.fieldBlock, styles.hairlineTop]}>
                  <Text style={styles.fieldLabel}>Biyolojik Cinsiyet</Text>
                  <View style={styles.segmentedRow}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setGender('male')}
                      style={[
                        styles.segmentChoice,
                        gender === 'male' && styles.segmentChoiceActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentChoiceText,
                          gender === 'male' && styles.segmentChoiceTextActive,
                        ]}
                      >
                        Erkek
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setGender('female')}
                      style={[
                        styles.segmentChoice,
                        gender === 'female' && styles.segmentChoiceActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentChoiceText,
                          gender === 'female' && styles.segmentChoiceTextActive,
                        ]}
                      >
                        Kadın
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: Age, Height, Current Weight */}
          {step === 2 && (
            <View style={styles.stepBlock}>
              <Text style={styles.sectionNumber}>02. Antropometrik Ölçüler</Text>
              <Text style={styles.title}>Vücut ölçülerinizi girin.</Text>
              <Text style={styles.subtitle}>
                Doğru enerji bütçesi ve günlük su hedefi için güncel boy, yaş ve
                tartım değerlerinizi belirtin.
              </Text>

              <View style={styles.surfaceGroup}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Yaş</Text>
                  <TextInput
                    style={styles.monoInput}
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                    placeholder="22"
                    placeholderTextColor={COLORS.inkMuted}
                  />
                </View>

                <View style={[styles.fieldBlock, styles.hairlineTop]}>
                  <Text style={styles.fieldLabel}>Boy (cm)</Text>
                  <TextInput
                    style={styles.monoInput}
                    keyboardType="numeric"
                    value={heightCm}
                    onChangeText={setHeightCm}
                    placeholder="178"
                    placeholderTextColor={COLORS.inkMuted}
                  />
                </View>

                <View style={[styles.fieldBlock, styles.hairlineTop]}>
                  <Text style={styles.fieldLabel}>Güncel Ağırlık (kg)</Text>
                  <TextInput
                    style={styles.monoInput}
                    keyboardType="decimal-pad"
                    value={currentWeightKg}
                    onChangeText={setCurrentWeightKg}
                    placeholder="76"
                    placeholderTextColor={COLORS.inkMuted}
                  />
                </View>

                <View style={[styles.bmiRow, styles.hairlineTop]}>
                  <View>
                    <Text style={styles.bmiTitle}>Vücut Kitle İndeksi (VKİ)</Text>
                    <Text style={styles.bmiCategory}>{bmiInfo.category}</Text>
                  </View>
                  <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>
                    {bmiInfo.bmi}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: Goal & Activity Level */}
          {step === 3 && (
            <View style={styles.stepBlock}>
              <Text style={styles.sectionNumber}>03. Enerji Hedefi ve Aktivite</Text>
              <Text style={styles.title}>Hedefinizi ve hareket düzeyinizi seçin.</Text>
              <Text style={styles.subtitle}>
                Günlük toplam enerji harcamanıza (TDEE) göre kalori açığı veya fazlası
                otomatik yapılandırılır.
              </Text>

              <Text style={styles.groupHeading}>Birincil Hedef</Text>
              <View style={styles.surfaceGroup}>
                {[
                  {
                    id: 'lose',
                    title: 'Kilo Vermek ve Yağ Yakmak',
                    desc: 'TDEE üzerinden günlük -500 kcal kontrollü açık',
                  },
                  {
                    id: 'maintain',
                    title: 'Mevcut Formu Korumak',
                    desc: 'Harcanan enerjiye eşit izokalorik denge',
                  },
                  {
                    id: 'gain',
                    title: 'Kas ve Hacim Kazanmak',
                    desc: 'TDEE üzerinden günlük +400 kcal temiz büyüme fazlası',
                  },
                ].map((item, idx) => {
                  const selected = goalType === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.75}
                      onPress={() => setGoalType(item.id as GoalType)}
                      style={[styles.optionRow, idx > 0 && styles.hairlineTop]}
                    >
                      <View style={styles.optionTextCol}>
                        <Text
                          style={[
                            styles.optionTitle,
                            selected && styles.optionTitleActive,
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.optionDesc}>{item.desc}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          selected && styles.radioOuterActive,
                        ]}
                      >
                        {selected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.groupHeading}>Hedef Ağırlık (kg)</Text>
              <View style={styles.surfaceGroup}>
                <View style={styles.fieldBlock}>
                  <TextInput
                    style={styles.monoInput}
                    keyboardType="decimal-pad"
                    value={targetWeightKg}
                    onChangeText={setTargetWeightKg}
                    placeholder="70"
                    placeholderTextColor={COLORS.inkMuted}
                  />
                </View>
              </View>

              <Text style={styles.groupHeading}>Fiziksel Aktivite Çarpanı</Text>
              <View style={styles.surfaceGroup}>
                {[
                  {
                    id: 'sedentary',
                    title: 'Hareketsiz (x1.2)',
                    desc: 'Masa başı çalışma, minimum günlük yürüyüş',
                  },
                  {
                    id: 'light',
                    title: 'Hafif Aktif (x1.375)',
                    desc: 'Haftada 1-2 gün egzersiz veya düzenli yürüyüş',
                  },
                  {
                    id: 'moderate',
                    title: 'Orta Aktif (x1.55)',
                    desc: 'Haftada 3-4 gün direnç veya kardiyo antrenmanı',
                  },
                  {
                    id: 'active',
                    title: 'Yüksek Aktif (x1.725)',
                    desc: 'Haftada 5-6 gün yoğun antrenman temposu',
                  },
                ].map((act, idx) => {
                  const selected = activityLevel === act.id;
                  return (
                    <TouchableOpacity
                      key={act.id}
                      activeOpacity={0.75}
                      onPress={() => setActivityLevel(act.id as ActivityLevel)}
                      style={[styles.optionRow, idx > 0 && styles.hairlineTop]}
                    >
                      <View style={styles.optionTextCol}>
                        <Text
                          style={[
                            styles.optionTitle,
                            selected && styles.optionTitleActive,
                          ]}
                        >
                          {act.title}
                        </Text>
                        <Text style={styles.optionDesc}>{act.desc}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          selected && styles.radioOuterActive,
                        ]}
                      >
                        {selected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 4: NVIDIA API Key Connection */}
          {step === 4 && (
            <View style={styles.stepBlock}>
              <Text style={styles.sectionNumber}>04. NVIDIA NIM Yapay Zeka Motoru</Text>
              <Text style={styles.title}>Klinik AI ve Görsel Analiz Bağlantısı.</Text>
              <Text style={styles.subtitle}>
                Nemotron-3.5-Super-VL (Fotoğraf Analizi) ve Nemotron-3.5-Lightning (Besin
                ve Diyetisyen Motoru) için kişisel NVIDIA API anahtarınız hazırlandı.
              </Text>

              <View style={styles.surfaceGroup}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>NVIDIA API Anahtarı (nvapi-...)</Text>
                  <TextInput
                    style={styles.monoInput}
                    placeholder="nvapi-..."
                    placeholderTextColor={COLORS.inkMuted}
                    value={nvidiaApiKey}
                    onChangeText={setNvidiaApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={[styles.fieldBlock, styles.hairlineTop]}>
                  <TouchableOpacity
                    style={[
                      styles.testBtn,
                      isTestingKey && { opacity: 0.7 },
                    ]}
                    onPress={handleTestKey}
                    disabled={isTestingKey}
                    activeOpacity={0.8}
                  >
                    {isTestingKey ? (
                      <ActivityIndicator size="small" color={COLORS.surface} />
                    ) : (
                      <Text style={styles.testBtnText}>Bağlantıyı Test Et</Text>
                    )}
                  </TouchableOpacity>

                  {keyTestResult && (
                    <View style={styles.testResultRow}>
                      <Text
                        style={[
                          styles.testResultText,
                          {
                            color: keyTestResult.ok
                              ? COLORS.accent
                              : COLORS.danger,
                          },
                        ]}
                      >
                        {keyTestResult.message}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.footnote}>
                Anahtarınız yalnızca cihazınızın yerel hafızasında saklanır ve doğrudan
                integrate.api.nvidia.com uç noktası ile haberleşir.
              </Text>
            </View>
          )}

          {/* STEP 5: Final Summary Plan */}
          {step === 5 && (
            <View style={styles.stepBlock}>
              <Text style={styles.sectionNumber}>05. Kişisel Beslenme Protokolü</Text>
              <Text style={styles.title}>Planınız hazır, {name}.</Text>
              <Text style={styles.subtitle}>
                Ölçülerinize göre hesaplanan günlük enerji bütçesi ve makro dağılımınız:
              </Text>

              <View style={styles.surfaceGroup}>
                <View style={styles.summaryHero}>
                  <Text style={styles.summaryHeroLabel}>Günlük Hedef Bütçesi</Text>
                  <View style={styles.summaryHeroValRow}>
                    <Text style={styles.summaryHeroVal}>
                      {calculatedTargets.calories}
                    </Text>
                    <Text style={styles.summaryHeroUnit}>kcal / gün</Text>
                  </View>
                  <Text style={styles.summaryInlineMeta}>
                    BMR {calculatedTargets.bmr} kcal · TDEE {calculatedTargets.tdee}{' '}
                    kcal · Su {calculatedTargets.waterMl} ml
                  </Text>
                </View>

                <View style={[styles.summaryMacroRow, styles.hairlineTop]}>
                  <Text style={styles.summaryMacroName}>Günlük Protein</Text>
                  <Text style={styles.summaryMacroVal}>
                    {calculatedTargets.protein} g
                  </Text>
                </View>

                <View style={[styles.summaryMacroRow, styles.hairlineTop]}>
                  <Text style={styles.summaryMacroName}>Günlük Karbonhidrat</Text>
                  <Text style={styles.summaryMacroVal}>
                    {calculatedTargets.carbs} g
                  </Text>
                </View>

                <View style={[styles.summaryMacroRow, styles.hairlineTop]}>
                  <Text style={styles.summaryMacroName}>Günlük Yağ</Text>
                  <Text style={styles.summaryMacroVal}>
                    {calculatedTargets.fat} g
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation Action Bar */}
        <View style={styles.bottomBar}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep(step - 1)}
              activeOpacity={0.75}
            >
              <Text style={styles.backBtnText}>Geri</Text>
            </TouchableOpacity>
          )}

          {step < 5 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !canGoNext() && styles.nextBtnDisabled]}
              disabled={!canGoNext()}
              onPress={() => setStep(step + 1)}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Devam Et</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Uygulamayı Başlat</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  brandWordmark: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: COLORS.ink,
    letterSpacing: -0.4,
  },
  stepIndicator: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.ink,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  stepBlock: {
    marginTop: 22,
  },
  sectionNumber: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.accent,
    marginBottom: 6,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 26,
    color: COLORS.ink,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.inkSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  groupHeading: {
    fontFamily: FONTS.display,
    fontSize: 13,
    color: COLORS.ink,
    marginTop: 16,
    marginBottom: 8,
  },
  surfaceGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  fieldBlock: {
    padding: 16,
  },
  hairlineTop: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  fieldLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.ink,
  },
  monoInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FONTS.monoMedium,
    fontSize: 14,
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    padding: 4,
    borderRadius: 8,
    gap: 4,
  },
  segmentChoice: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 5,
    alignItems: 'center',
  },
  segmentChoiceActive: {
    backgroundColor: COLORS.surface,
  },
  segmentChoiceText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.inkMuted,
  },
  segmentChoiceTextActive: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.ink,
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  bmiTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  bmiCategory: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.ink,
    marginTop: 2,
  },
  bmiValue: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 26,
    fontVariant: ['tabular-nums'],
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  optionTextCol: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: 2,
  },
  optionTitleActive: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.accent,
  },
  optionDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  testBtn: {
    backgroundColor: COLORS.ink,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  testBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.surface,
  },
  testResultRow: {
    marginTop: 10,
  },
  testResultText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    lineHeight: 18,
  },
  footnote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.inkMuted,
    marginTop: 12,
    lineHeight: 18,
  },
  summaryHero: {
    padding: 20,
  },
  summaryHeroLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginBottom: 4,
  },
  summaryHeroValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  summaryHeroVal: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 40,
    color: COLORS.ink,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  summaryHeroUnit: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.inkMuted,
  },
  summaryInlineMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  summaryMacroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  summaryMacroName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.inkSecondary,
  },
  summaryMacroVal: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 15,
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    paddingHorizontal: 18,
    height: 46,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.ink,
  },
  nextBtn: {
    flex: 1,
    height: 46,
    borderRadius: 6,
    backgroundColor: COLORS.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.35,
  },
  finishBtn: {
    flex: 1,
    height: 46,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.surface,
  },
});
