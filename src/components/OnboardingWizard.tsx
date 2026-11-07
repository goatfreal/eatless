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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ActivityLevel, Gender, GoalType, UserProfile } from '../types/nutrition';
import { calculateBMI, calculatePersonalTargets } from '../utils/calorieCalculator';
import { testNvidiaApiKey } from '../services/nvidiaAiService';

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
  const [currentWeightKg, setCurrentWeightKg] = useState('78');

  // Step 3: Goal & Activity
  const [goalType, setGoalType] = useState<GoalType>('lose');
  const [targetWeightKg, setTargetWeightKg] = useState('72');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  // Step 4: NVIDIA API Key
  const [nvidiaApiKey, setNvidiaApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Calculated personal targets
  const calculatedTargets = useMemo(() => {
    return calculatePersonalTargets(
      gender,
      parseInt(age, 10) || 22,
      parseFloat(heightCm) || 175,
      parseFloat(currentWeightKg) || 75,
      activityLevel,
      goalType
    );
  }, [gender, age, heightCm, currentWeightKg, activityLevel, goalType]);

  const bmiInfo = useMemo(() => {
    return calculateBMI(parseFloat(heightCm) || 175, parseFloat(currentWeightKg) || 75);
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
      heightCm: parseFloat(heightCm) || 175,
      currentWeightKg: parseFloat(currentWeightKg) || 75,
      targetWeightKg: parseFloat(targetWeightKg) || 70,
      activityLevel,
      goalType,
      nvidiaApiKey: nvidiaApiKey.trim(),
      nvidiaTextModel: 'meta/llama-3.1-70b-instruct',
      nvidiaVisionModel: 'meta/llama-3.2-11b-vision-instruct',
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
        {/* Top Progress Header */}
        <View style={styles.topHeader}>
          <View style={styles.progressRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  i <= step && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepIndicator}>Adım {step} / 5</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* STEP 1: Name & Gender */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconBadge}>
                <Ionicons name="person-add" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Eatless'a Hoş Geldin!</Text>
              <Text style={styles.subtitle}>
                Sana özel kalori ve makro hesaplaması yapabilmemiz için önce tanışalım.
              </Text>

              <Text style={styles.label}>Adın nedir?</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Ahmet"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />

              <Text style={styles.label}>Biyolojik Cinsiyetin (Metabolizma hesabı için)</Text>
              <View style={styles.rowGap}>
                <TouchableOpacity
                  style={[styles.choiceCard, gender === 'male' && styles.choiceCardActive]}
                  onPress={() => setGender('male')}
                >
                  <Ionicons
                    name="male"
                    size={26}
                    color={gender === 'male' ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.choiceTitle, gender === 'male' && styles.choiceTitleActive]}>
                    Erkek
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.choiceCard, gender === 'female' && styles.choiceCardActive]}
                  onPress={() => setGender('female')}
                >
                  <Ionicons
                    name="female"
                    size={26}
                    color={gender === 'female' ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.choiceTitle, gender === 'female' && styles.choiceTitleActive]}>
                    Kadın
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: Age, Height, Current Weight */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconBadge}>
                <Ionicons name="body" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Vücut Ölçülerin</Text>
              <Text style={styles.subtitle}>
                Mifflin-St Jeor klinik formülüyle Bazal Metabolizma Hızını (BMR) hesaplıyoruz.
              </Text>

              <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Yaş</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                    placeholder="22"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Boy (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={heightCm}
                    onChangeText={setHeightCm}
                    placeholder="178"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <Text style={styles.label}>Mevcut Kilon (kg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={currentWeightKg}
                onChangeText={setCurrentWeightKg}
                placeholder="78"
                placeholderTextColor={COLORS.textMuted}
              />

              {/* Live BMI Box */}
              <View style={styles.bmiBox}>
                <View>
                  <Text style={styles.bmiLabel}>Vücut Kitle İndeksin (VKİ)</Text>
                  <Text style={[styles.bmiStatus, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
                </View>
                <Text style={[styles.bmiNumber, { color: bmiInfo.color }]}>{bmiInfo.bmi}</Text>
              </View>
            </View>
          )}

          {/* STEP 3: Goal & Activity Level */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconBadge}>
                <Ionicons name="trophy" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Hedefin ve Hareket Seviyen</Text>
              <Text style={styles.subtitle}>
                Günlük kalori açığını veya fazlasını hedefine göre belirleyelim.
              </Text>

              <Text style={styles.label}>Ana Hedefin Nedir?</Text>
              <View style={styles.verticalChoices}>
                {[
                  { id: 'lose', title: '🔥 Kilo Vermek & Yağ Yakmak', desc: 'Günlük -500 kcal sağlıklı kalori açığı' },
                  { id: 'maintain', title: '⚖️ Formu ve Kiloyu Korumak', desc: 'Harcanan enerjiye eşit dengeli kalori' },
                  { id: 'gain', title: '💪 Kas ve Hacim Kazanmak', desc: 'Günlük +400 kcal temiz büyüme fazlası' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.listChoice,
                      goalType === item.id && styles.listChoiceActive,
                    ]}
                    onPress={() => setGoalType(item.id as GoalType)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listChoiceTitle}>{item.title}</Text>
                      <Text style={styles.listChoiceDesc}>{item.desc}</Text>
                    </View>
                    {goalType === item.id && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Hedef Kilon (kg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={targetWeightKg}
                onChangeText={setTargetWeightKg}
                placeholder="72"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.label}>Günlük Hareket Seviyen</Text>
              <View style={styles.verticalChoices}>
                {[
                  { id: 'sedentary', title: '🛋️ Hareketsiz', desc: 'Masa başı iş, az yürüyüş' },
                  { id: 'light', title: '🚶 Hafif Aktif', desc: 'Haftada 1-2 gün egzersiz veya yürüyüş' },
                  { id: 'moderate', title: '🏃 Orta Aktif', desc: 'Haftada 3-4 gün düzenli antrenman' },
                  { id: 'active', title: '⚡ Çok Aktif', desc: 'Haftada 5-6 gün yoğun antrenman' },
                ].map((act) => (
                  <TouchableOpacity
                    key={act.id}
                    style={[
                      styles.listChoice,
                      activityLevel === act.id && styles.listChoiceActive,
                    ]}
                    onPress={() => setActivityLevel(act.id as ActivityLevel)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listChoiceTitle}>{act.title}</Text>
                      <Text style={styles.listChoiceDesc}>{act.desc}</Text>
                    </View>
                    {activityLevel === act.id && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 4: NVIDIA API Key Connection */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <View style={[styles.iconBadge, { backgroundColor: COLORS.nvidiaGlow }]}>
                <Ionicons name="hardware-chip" size={28} color={COLORS.nvidia} />
              </View>
              <Text style={styles.title}>NVIDIA AI Bağlantısı</Text>
              <Text style={styles.subtitle}>
                Yemek fotoğraflarını ve besinleri gerçek yapay zeka (Llama-3.2 Vision & Llama-3.1 70B) ile analiz etmek için NVIDIA API anahtarını gir.
              </Text>

              <Text style={styles.label}>NVIDIA API Key (nvapi-...)</Text>
              <TextInput
                style={styles.input}
                placeholder="nvapi-..."
                placeholderTextColor={COLORS.textMuted}
                value={nvidiaApiKey}
                onChangeText={setNvidiaApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.testBtn, !nvidiaApiKey.trim() && { opacity: 0.5 }]}
                onPress={handleTestKey}
                disabled={!nvidiaApiKey.trim() || isTestingKey}
              >
                {isTestingKey ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color="#FFF" />
                    <Text style={styles.testBtnText}>Anahtarı Şimdi Test Et</Text>
                  </>
                )}
              </TouchableOpacity>

              {keyTestResult && (
                <View
                  style={[
                    styles.testResultBox,
                    { borderColor: keyTestResult.ok ? COLORS.nvidia : COLORS.danger },
                  ]}
                >
                  <Ionicons
                    name={keyTestResult.ok ? 'checkmark-circle' : 'alert-circle'}
                    size={18}
                    color={keyTestResult.ok ? COLORS.nvidia : COLORS.danger}
                  />
                  <Text
                    style={[
                      styles.testResultText,
                      { color: keyTestResult.ok ? '#D1E7A3' : '#FCA5A5' },
                    ]}
                  >
                    {keyTestResult.message}
                  </Text>
                </View>
              )}

              <Text style={styles.helperNote}>
                Not: Anahtarın yalnızca senin telefonunun hafızasında saklanır. Şimdi girmek istemezsen daha sonra Profil sekmesinden de ekleyebilirsin.
              </Text>
            </View>
          )}

          {/* STEP 5: Final Summary Plan */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconBadge}>
                <Ionicons name="sparkles" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Tebrikler, {name}!</Text>
              <Text style={styles.subtitle}>
                Ölçülerine göre hesaplanan bilimsel beslenme planın hazır:
              </Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <Text style={styles.summaryCal}>{calculatedTargets.calories} kcal</Text>
                  <Text style={styles.summaryCalSub}>Günlük Kalori Hedefin</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaItem}>Bazal (BMR): {calculatedTargets.bmr} kcal</Text>
                  <Text style={styles.metaItem}>Harcanan (TDEE): {calculatedTargets.tdee} kcal</Text>
                </View>

                <View style={styles.macroSummaryRow}>
                  <View style={styles.macroPill}>
                    <Text style={[styles.macroPillVal, { color: COLORS.protein }]}>
                      {calculatedTargets.protein}g
                    </Text>
                    <Text style={styles.macroPillLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroPill}>
                    <Text style={[styles.macroPillVal, { color: COLORS.carbs }]}>
                      {calculatedTargets.carbs}g
                    </Text>
                    <Text style={styles.macroPillLabel}>Karbonhidrat</Text>
                  </View>
                  <View style={styles.macroPill}>
                    <Text style={[styles.macroPillVal, { color: COLORS.fat }]}>
                      {calculatedTargets.fat}g
                    </Text>
                    <Text style={styles.macroPillLabel}>Yağ</Text>
                  </View>
                  <View style={styles.macroPill}>
                    <Text style={[styles.macroPillVal, { color: COLORS.water }]}>
                      {calculatedTargets.waterMl}ml
                    </Text>
                    <Text style={styles.macroPillLabel}>Su</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation Buttons */}
        <View style={styles.bottomBar}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep(step - 1)}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
          )}

          {step < 5 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !canGoNext() && styles.nextBtnDisabled]}
              disabled={!canGoNext()}
              onPress={() => setStep(step + 1)}
            >
              <Text style={styles.nextBtnText}>Devam Et</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
              <Ionicons name="rocket" size={18} color="#FFF" />
              <Text style={styles.nextBtnText}>Eatless'ı Başlat!</Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.cardSecondary,
  },
  progressSegmentActive: {
    backgroundColor: COLORS.primary,
  },
  stepIndicator: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stepContainer: {
    marginTop: 12,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  rowGap: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  choiceCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  choiceTitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  choiceTitleActive: {
    color: COLORS.text,
  },
  bmiBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  bmiLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  bmiStatus: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  bmiNumber: {
    fontSize: 28,
    fontWeight: '900',
  },
  verticalChoices: {
    gap: 10,
  },
  listChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  listChoiceActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  listChoiceTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  listChoiceDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.nvidia,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 14,
  },
  testBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  testResultText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  helperNote: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 16,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  summaryTop: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryCal: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  summaryCalSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  metaItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  macroSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroPill: {
    alignItems: 'center',
    flex: 1,
  },
  macroPillVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  macroPillLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  finishBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
