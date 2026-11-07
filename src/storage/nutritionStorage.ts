import AsyncStorage from '@react-native-async-storage/async-storage';
import { FastingTracker, FoodItem, UserSettings } from '../types/nutrition';

const SETTINGS_KEY = '@eatless_user_settings_v1';
const FASTING_KEY = '@eatless_fasting_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  nvidiaApiKey: '',
  preferredModel: 'meta/llama-3.1-70b-instruct',
  targets: {
    calories: 2100,
    protein: 140,
    carbs: 220,
    fat: 65,
    waterMl: 2500,
  },
  currentWeightKg: 78.5,
  targetWeightKg: 74.0,
};

const DEMO_MEALS: FoodItem[] = [
  {
    id: 'demo-meal-1',
    name: 'Yulaflı & Muzlu Protein Kasesi',
    calories: 380,
    protein: 24,
    carbs: 54,
    fat: 8,
    portion: '1 kase (280g)',
    mealType: 'breakfast',
    timestamp: new Date().toISOString(),
    aiTip: 'Güne yüksek lif ve proteinle başlamak kan şekerini dengeler.',
  },
  {
    id: 'demo-meal-2',
    name: 'Izgara Tavuklu Kinoa Salatası',
    calories: 520,
    protein: 44,
    carbs: 38,
    fat: 16,
    portion: '1 büyük tabak (350g)',
    mealType: 'lunch',
    timestamp: new Date().toISOString(),
    aiTip: 'Öğle yemeği için mükemmel bir kas toparlanma makro dengesi.',
  },
];

export async function loadUserSettings(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Save settings error:', error);
  }
}

export async function loadDailyMeals(dateStr: string): Promise<FoodItem[]> {
  const key = `@eatless_meals_${dateStr}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      // Seed initial meals on first launch
      await AsyncStorage.setItem(key, JSON.stringify(DEMO_MEALS));
      return DEMO_MEALS;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveDailyMeals(dateStr: string, meals: FoodItem[]): Promise<void> {
  const key = `@eatless_meals_${dateStr}`;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(meals));
  } catch (error) {
    console.error('Save meals error:', error);
  }
}

export async function loadWaterIntake(dateStr: string): Promise<number> {
  const key = `@eatless_water_${dateStr}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? parseInt(raw, 10) : 1250; // 1250ml demo initial
  } catch {
    return 0;
  }
}

export async function saveWaterIntake(dateStr: string, ml: number): Promise<void> {
  const key = `@eatless_water_${dateStr}`;
  try {
    await AsyncStorage.setItem(key, ml.toString());
  } catch (error) {
    console.error('Save water error:', error);
  }
}

export async function loadFastingState(): Promise<FastingTracker> {
  try {
    const raw = await AsyncStorage.getItem(FASTING_KEY);
    if (!raw) {
      return { isFasting: true, startTime: new Date(Date.now() - 14 * 3600000).toISOString(), targetHours: 16 };
    }
    return JSON.parse(raw);
  } catch {
    return { isFasting: false, startTime: null, targetHours: 16 };
  }
}

export async function saveFastingState(tracker: FastingTracker): Promise<void> {
  try {
    await AsyncStorage.setItem(FASTING_KEY, JSON.stringify(tracker));
  } catch (error) {
    console.error('Save fasting error:', error);
  }
}
