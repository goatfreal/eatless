import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { OnboardingWizard } from './src/components/OnboardingWizard';
import { Header } from './src/components/Header';
import { DailyCalorieCard } from './src/components/DailyCalorieCard';
import { MealSection } from './src/components/MealSection';
import { WaterCard } from './src/components/WaterCard';
import { FastingCard } from './src/components/FastingCard';
import { WeightCard } from './src/components/WeightCard';
import { AiFoodScannerModal } from './src/components/AiFoodScannerModal';
import { AiCoachModal } from './src/components/AiCoachModal';
import { SettingsModal } from './src/components/SettingsModal';
import { COLORS, FONTS } from './src/theme/colors';
import {
  ActiveTab,
  FastingTracker,
  FoodItem,
  MealType,
  UserProfile,
  WeightEntry,
} from './src/types/nutrition';
import {
  INITIAL_PROFILE,
  loadDailyMeals,
  loadFastingState,
  loadUserProfile,
  loadWaterIntake,
  loadWeightHistory,
  saveDailyMeals,
  saveFastingState,
  saveUserProfile,
  saveWaterIntake,
  saveWeightHistory,
} from './src/storage/nutritionStorage';
import { calculatePersonalTargets } from './src/utils/calorieCalculator';

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [meals, setMeals] = useState<FoodItem[]>([]);
  const [waterMl, setWaterMl] = useState<number>(0);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [fasting, setFasting] = useState<FastingTracker>({
    isFasting: false,
    protocol: '16:8',
    startTime: null,
    targetHours: 16,
    completedFastsCount: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scannerMealType, setScannerMealType] = useState<MealType | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  useEffect(() => {
    async function init() {
      const savedProfile = await loadUserProfile();
      setProfile(savedProfile);

      const savedFasting = await loadFastingState();
      setFasting(savedFasting);

      const savedWeights = await loadWeightHistory();
      setWeightHistory(savedWeights);

      setIsLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    async function loadDayData() {
      const savedMeals = await loadDailyMeals(selectedDate);
      setMeals(savedMeals);

      const savedWater = await loadWaterIntake(selectedDate);
      setWaterMl(savedWater);
    }
    loadDayData();
  }, [selectedDate]);

  const handleChangeDate = (offsetDays: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offsetDays);
    const nextStr = current.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    if (nextStr <= todayStr) {
      setSelectedDate(nextStr);
    }
  };

  const handleCompleteOnboarding = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveUserProfile(newProfile);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    const m = await loadDailyMeals(selectedDate);
    setMeals(m);
    const w = await loadWaterIntake(selectedDate);
    setWaterMl(w);
    setIsRefreshing(false);
  };

  const handleSaveFood = (newFood: Omit<FoodItem, 'id' | 'timestamp'>) => {
    const item: FoodItem = {
      ...newFood,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    const updated = [item, ...meals];
    setMeals(updated);
    saveDailyMeals(selectedDate, updated);
  };

  const handleDeleteFood = (foodId: string) => {
    const updated = meals.filter((m) => m.id !== foodId);
    setMeals(updated);
    saveDailyMeals(selectedDate, updated);
  };

  const handleUpdateWater = (deltaMl: number) => {
    const nextMl = Math.max(0, waterMl + deltaMl);
    setWaterMl(nextMl);
    saveWaterIntake(selectedDate, nextMl);
  };

  const handleUpdateFasting = (nextFasting: FastingTracker) => {
    setFasting(nextFasting);
    saveFastingState(nextFasting);
  };

  const handleLogWeight = (newWeightKg: number) => {
    const recalculated = calculatePersonalTargets(
      profile.gender,
      profile.age,
      profile.heightCm,
      newWeightKg,
      profile.activityLevel,
      profile.goalType
    );
    const updatedProfile: UserProfile = {
      ...profile,
      currentWeightKg: newWeightKg,
      targets: recalculated,
    };
    setProfile(updatedProfile);
    saveUserProfile(updatedProfile);

    const newEntry: WeightEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      weightKg: newWeightKg,
    };
    const updatedHistory = [newEntry, ...weightHistory].slice(0, 30);
    setWeightHistory(updatedHistory);
    saveWeightHistory(updatedHistory);
  };

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveUserProfile(updated);
  };

  const handleResetOnboarding = () => {
    setIsSettingsOpen(false);
    const reset: UserProfile = { ...profile, isOnboarded: false };
    setProfile(reset);
    saveUserProfile(reset);
  };

  const handleSelectNavTab = (tab: ActiveTab) => {
    if (tab === 'scanner') {
      setScannerMealType('lunch');
      return;
    }
    if (tab === 'coach') {
      setIsCoachOpen(true);
      return;
    }
    if (tab === 'profile') {
      setIsSettingsOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="small" color={COLORS.ink} />
      </View>
    );
  }

  if (!profile.isOnboarded) {
    return (
      <>
        <StatusBar style="dark" />
        <OnboardingWizard onComplete={handleCompleteOnboarding} />
      </>
    );
  }

  const totals = meals.reduce(
    (acc, item) => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        {/* 3-Zone Top Bar Contract */}
        <Header
          activeTab={activeTab}
          onSelectTab={handleSelectNavTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Editorial Subbar: User Greeting & Date Switcher */}
        <View style={styles.subBar}>
          <Text style={styles.greetingText}>
            {profile.name} ·{' '}
            {profile.goalType === 'lose'
              ? 'Kalori Açığı'
              : profile.goalType === 'gain'
              ? 'Kas Kazanımı'
              : 'Denge'}
          </Text>

          <View style={styles.dateSwitcher}>
            <TouchableOpacity
              onPress={() => handleChangeDate(-1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.dateStepBtn}
            >
              <Text style={styles.dateStepText}>‹ Önceki</Text>
            </TouchableOpacity>

            <Text style={styles.dateLabel}>
              {isToday ? 'Bugün' : selectedDate}
            </Text>

            <TouchableOpacity
              onPress={() => handleChangeDate(1)}
              disabled={isToday}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.dateStepBtn, isToday && { opacity: 0.3 }]}
            >
              <Text style={styles.dateStepText}>Sonraki ›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.ink}
            />
          }
        >
          {activeTab === 'fasting' ? (
            <>
              <FastingCard
                tracker={fasting}
                onUpdateTracker={handleUpdateFasting}
                expanded
              />
              <WaterCard
                waterMl={waterMl}
                targetMl={profile.targets.waterMl}
                onUpdateWater={handleUpdateWater}
              />
            </>
          ) : (
            <>
              <DailyCalorieCard
                consumedCalories={totals.calories}
                consumedProtein={totals.protein}
                consumedCarbs={totals.carbs}
                consumedFat={totals.fat}
                targets={profile.targets}
              />

              <MealSection
                meals={meals}
                onAddMeal={(type) => setScannerMealType(type)}
                onDeleteMeal={handleDeleteFood}
              />

              <WaterCard
                waterMl={waterMl}
                targetMl={profile.targets.waterMl}
                onUpdateWater={handleUpdateWater}
              />

              <FastingCard
                tracker={fasting}
                onUpdateTracker={handleUpdateFasting}
              />

              <WeightCard
                currentWeightKg={profile.currentWeightKg}
                targetWeightKg={profile.targetWeightKg}
                heightCm={profile.heightCm}
                history={weightHistory}
                onLogWeight={handleLogWeight}
              />
            </>
          )}
        </ScrollView>

        {/* AI Scanner Modal */}
        <AiFoodScannerModal
          visible={!!scannerMealType}
          targetMealType={scannerMealType || 'lunch'}
          nvidiaApiKey={profile.nvidiaApiKey}
          nvidiaTextModel={profile.nvidiaTextModel}
          nvidiaVisionModel={profile.nvidiaVisionModel}
          onClose={() => setScannerMealType(null)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSaveFood={handleSaveFood}
        />

        {/* AI Dietitian Coach Modal */}
        <AiCoachModal
          visible={isCoachOpen}
          profile={profile}
          mealsToday={meals}
          onClose={() => setIsCoachOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Profile & NVIDIA Settings Modal */}
        <SettingsModal
          visible={isSettingsOpen}
          profile={profile}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveProfile}
          onResetOnboarding={handleResetOnboarding}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  subBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  greetingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  dateSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateStepBtn: {
    paddingVertical: 2,
  },
  dateStepText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  dateLabel: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 12,
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  scrollContent: {
    paddingBottom: 36,
  },
});
