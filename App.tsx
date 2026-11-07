import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { FastingTracker, FoodItem, MealType, UserSettings } from './src/types/nutrition';
import {
  DEFAULT_SETTINGS,
  loadDailyMeals,
  loadFastingState,
  loadUserSettings,
  loadWaterIntake,
  saveDailyMeals,
  saveFastingState,
  saveUserSettings,
  saveWaterIntake,
} from './src/storage/nutritionStorage';

export default function App() {
  const [selectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [meals, setMeals] = useState<FoodItem[]>([]);
  const [waterMl, setWaterMl] = useState<number>(1250);
  const [fasting, setFasting] = useState<FastingTracker>({
    isFasting: true,
    startTime: new Date(Date.now() - 14 * 3600000).toISOString(),
    targetHours: 16,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scannerMealType, setScannerMealType] = useState<MealType | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    async function init() {
      const savedSettings = await loadUserSettings();
      setSettings(savedSettings);

      const savedMeals = await loadDailyMeals(selectedDate);
      setMeals(savedMeals);

      const savedWater = await loadWaterIntake(selectedDate);
      setWaterMl(savedWater);

      const savedFasting = await loadFastingState();
      setFasting(savedFasting);
    }
    init();
  }, [selectedDate]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    const m = await loadDailyMeals(selectedDate);
    setMeals(m);
    const w = await loadWaterIntake(selectedDate);
    setWaterMl(w);
    setIsRefreshing(false);
  };

  // Add new food from AI scanner
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

  // Water intake
  const handleUpdateWater = (newMl: number) => {
    setWaterMl(newMl);
    saveWaterIntake(selectedDate, newMl);
  };

  // Fasting tracker toggle
  const handleToggleFasting = () => {
    const nextState: FastingTracker = {
      ...fasting,
      isFasting: !fasting.isFasting,
      startTime: !fasting.isFasting ? new Date().toISOString() : null,
    };
    setFasting(nextState);
    saveFastingState(nextState);
  };

  // Weight update
  const handleUpdateWeight = (newWeight: number, newTarget: number) => {
    const updated: UserSettings = {
      ...settings,
      currentWeightKg: newWeight,
      targetWeightKg: newTarget,
    };
    setSettings(updated);
    saveUserSettings(updated);
  };

  // Save Settings
  const handleSaveSettings = (updated: UserSettings) => {
    setSettings(updated);
    saveUserSettings(updated);
  };

  // Calculate daily totals for AI Coach
  const { totalCal, totalProtein } = useMemo(() => {
    return meals.reduce(
      (acc, m) => {
        acc.totalCal += m.calories;
        acc.totalProtein += m.protein;
        return acc;
      },
      { totalCal: 0, totalProtein: 0 }
    );
  }, [meals]);

  const remainingCal = Math.max(0, settings.targets.calories - totalCal);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <Header
          selectedDate={selectedDate}
          hasNvidiaKey={!!settings.nvidiaApiKey && settings.nvidiaApiKey.startsWith('nvapi-')}
          onOpenSettings={() => setIsSettingsOpen(true)}
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
          <DailyCalorieCard targets={settings.targets} meals={meals} />

          {/* Weight & Target Goal Card */}
          <WeightCard
            currentWeight={settings.currentWeightKg}
            targetWeight={settings.targetWeightKg}
            onUpdateWeight={handleUpdateWeight}
          />

          {/* Meals Section with AI add button */}
          <MealSection
            meals={meals}
            onAddMeal={(type) => setScannerMealType(type)}
            onDeleteFood={handleDeleteFood}
          />

          {/* Water Intake Tracker */}
          <WaterCard
            currentMl={waterMl}
            targetMl={settings.targets.waterMl}
            onUpdateWater={handleUpdateWater}
          />

          {/* Intermittent Fasting (16:8) Tracker */}
          <FastingCard
            fasting={fasting}
            onToggleFasting={handleToggleFasting}
          />
        </ScrollView>

        {/* Floating AI Nutrition Coach Button */}
        <TouchableOpacity
          style={styles.coachFab}
          onPress={() => setIsCoachOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          <Text style={styles.coachFabText}>AI Koç</Text>
        </TouchableOpacity>

        {/* AI Scanner Modal (Camera / Text analysis via NVIDIA NIM) */}
        {scannerMealType && (
          <AiFoodScannerModal
            visible={!!scannerMealType}
            targetMealType={scannerMealType}
            nvidiaApiKey={settings.nvidiaApiKey}
            onClose={() => setScannerMealType(null)}
            onSaveFood={handleSaveFood}
          />
        )}

        {/* AI Dietitian Coach Chat Modal */}
        <AiCoachModal
          visible={isCoachOpen}
          nvidiaApiKey={settings.nvidiaApiKey}
          totalCaloriesToday={totalCal}
          remainingCalories={remainingCal}
          proteinConsumed={totalProtein}
          proteinTarget={settings.targets.protein}
          onClose={() => setIsCoachOpen(false)}
        />

        {/* Settings Modal (NVIDIA API Key & 7-Day Sideload Guide) */}
        <SettingsModal
          visible={isSettingsOpen}
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 70,
  },
  coachFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.nvidia,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: COLORS.nvidia,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  coachFabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
