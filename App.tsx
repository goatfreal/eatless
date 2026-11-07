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
import { Ionicons } from '@expo/vector-icons';
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
import { COLORS } from './src/theme/colors';
import {
  FastingProtocol,
  FastingTracker,
  FoodItem,
  MealType,
  UserProfile,
} from './src/types/nutrition';
import {
  INITIAL_PROFILE,
  loadDailyMeals,
  loadFastingState,
  loadUserProfile,
  loadWaterIntake,
  saveDailyMeals,
  saveFastingState,
  saveUserProfile,
  saveWaterIntake,
} from './src/storage/nutritionStorage';
import { calculatePersonalTargets } from './src/utils/calorieCalculator';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [meals, setMeals] = useState<FoodItem[]>([]);
  const [waterMl, setWaterMl] = useState<number>(0);
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

  // Load user profile and fasting on app start
  useEffect(() => {
    async function init() {
      const savedProfile = await loadUserProfile();
      setProfile(savedProfile);

      const savedFasting = await loadFastingState();
      setFasting(savedFasting);

      setIsLoading(false);
    }
    init();
  }, []);

  // Load meals and water whenever selectedDate changes
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

  // Add food from AI scanner
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

  // Delete food item
  const handleDeleteFood = (foodId: string) => {
    const updated = meals.filter((m) => m.id !== foodId);
    setMeals(updated);
    saveDailyMeals(selectedDate, updated);
  };

  // Water update
  const handleUpdateWater = (newMl: number) => {
    setWaterMl(newMl);
    saveWaterIntake(selectedDate, newMl);
  };

  // Fasting toggle
  const handleToggleFasting = () => {
    const nextFasting: FastingTracker = {
      ...fasting,
      isFasting: !fasting.isFasting,
      startTime: !fasting.isFasting ? new Date().toISOString() : null,
      completedFastsCount: fasting.isFasting
        ? (fasting.completedFastsCount || 0) + 1
        : fasting.completedFastsCount || 0,
    };
    setFasting(nextFasting);
    saveFastingState(nextFasting);
  };

  const handleChangeFastingProtocol = (protocol: FastingProtocol, targetHours: number) => {
    const nextFasting: FastingTracker = {
      ...fasting,
      protocol,
      targetHours,
    };
    setFasting(nextFasting);
    saveFastingState(nextFasting);
  };

  // Weight update -> also recalculates BMR/TDEE targets
  const handleUpdateWeight = (newWeight: number, newTarget: number) => {
    const recalculated = calculatePersonalTargets(
      profile.gender,
      profile.age,
      profile.heightCm,
      newWeight,
      profile.activityLevel,
      profile.goalType
    );
    const updated: UserProfile = {
      ...profile,
      currentWeightKg: newWeight,
      targetWeightKg: newTarget,
      targets: recalculated,
    };
    setProfile(updated);
    saveUserProfile(updated);
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

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If user has not completed Onboarding Wizard, show Onboarding first!
  if (!profile.isOnboarded) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingWizard onComplete={handleCompleteOnboarding} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <Header
          userName={profile.name}
          selectedDate={selectedDate}
          onChangeDate={handleChangeDate}
          hasNvidiaKey={!!profile.nvidiaApiKey && profile.nvidiaApiKey.startsWith('nvapi-')}
          onOpenProfile={() => setIsSettingsOpen(true)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Daily Calorie & Macro Target Card */}
          <DailyCalorieCard targets={profile.targets} meals={meals} />

          {/* Meals Section */}
          <MealSection
            meals={meals}
            onAddMeal={(type) => setScannerMealType(type)}
            onDeleteFood={handleDeleteFood}
          />

          {/* Water Intake Tracker */}
          <WaterCard
            currentMl={waterMl}
            targetMl={profile.targets.waterMl}
            onUpdateWater={handleUpdateWater}
          />

          {/* Weight & Target Goal Card */}
          <WeightCard
            currentWeight={profile.currentWeightKg}
            targetWeight={profile.targetWeightKg}
            onUpdateWeight={handleUpdateWeight}
          />

          {/* Intermittent Fasting Tracker */}
          <FastingCard
            fasting={fasting}
            onToggleFasting={handleToggleFasting}
            onChangeProtocol={handleChangeFastingProtocol}
          />
        </ScrollView>

        {/* Bottom Action Tab Bar */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setScannerMealType('lunch')}
          >
            <View style={styles.scanCircle}>
              <Ionicons name="camera" size={22} color="#FFF" />
            </View>
            <Text style={styles.tabTextActive}>AI Yemek Tara</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setIsCoachOpen(true)}
          >
            <Ionicons name="chatbubbles-outline" size={22} color={COLORS.nvidia} />
            <Text style={[styles.tabText, { color: COLORS.nvidia }]}>AI Diyetisyen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setIsSettingsOpen(true)}
          >
            <Ionicons name="person-circle-outline" size={23} color={COLORS.textSecondary} />
            <Text style={styles.tabText}>Profil & API</Text>
          </TouchableOpacity>
        </View>

        {/* AI Scanner Modal */}
        {scannerMealType && (
          <AiFoodScannerModal
            visible={!!scannerMealType}
            targetMealType={scannerMealType}
            nvidiaApiKey={profile.nvidiaApiKey}
            nvidiaTextModel={profile.nvidiaTextModel}
            nvidiaVisionModel={profile.nvidiaVisionModel}
            onClose={() => setScannerMealType(null)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSaveFood={handleSaveFood}
          />
        )}

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
  scrollContent: {
    paddingBottom: 95,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#12131A',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  scanCircle: {
    backgroundColor: COLORS.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
});
