import React, { useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Header } from './src/components/Header';
import { DailyCalorieCard } from './src/components/DailyCalorieCard';
import { MealSection } from './src/components/MealSection';
import { WaterCard } from './src/components/WaterCard';
import { FastingCard } from './src/components/FastingCard';
import { AiFoodScannerModal } from './src/components/AiFoodScannerModal';
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

  // Save Settings
  const handleSaveSettings = (updated: UserSettings) => {
    setSettings(updated);
    saveUserSettings(updated);
  };

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
    paddingBottom: 40,
  },
});
