import AsyncStorage from '@react-native-async-storage/async-storage';
import { FastingTracker, FoodItem, UserProfile, WeightEntry } from '../types/nutrition';
import { calculatePersonalTargets } from '../utils/calorieCalculator';

const PROFILE_KEY = '@eatless_user_profile_v2';
const FASTING_KEY = '@eatless_fasting_v2';
const WEIGHT_HISTORY_KEY = '@eatless_weight_history_v2';

export const INITIAL_PROFILE: UserProfile = {
  isOnboarded: false,
  name: '',
  gender: 'male',
  age: 24,
  heightCm: 178,
  currentWeightKg: 75,
  targetWeightKg: 70,
  activityLevel: 'moderate',
  goalType: 'lose',
  nvidiaApiKey: '',
  nvidiaTextModel: 'meta/llama-3.1-70b-instruct',
  nvidiaVisionModel: 'meta/llama-3.2-11b-vision-instruct',
  targets: calculatePersonalTargets('male', 24, 178, 75, 'moderate', 'lose'),
};

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return INITIAL_PROFILE;
    return { ...INITIAL_PROFILE, ...JSON.parse(raw) };
  } catch {
    return INITIAL_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Save profile error:', error);
  }
}

export async function loadDailyMeals(dateStr: string): Promise<FoodItem[]> {
  const key = `@eatless_meals_v2_${dateStr}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveDailyMeals(dateStr: string, meals: FoodItem[]): Promise<void> {
  const key = `@eatless_meals_v2_${dateStr}`;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(meals));
  } catch (error) {
    console.error('Save meals error:', error);
  }
}

export async function loadWaterIntake(dateStr: string): Promise<number> {
  const key = `@eatless_water_v2_${dateStr}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export async function saveWaterIntake(dateStr: string, ml: number): Promise<void> {
  const key = `@eatless_water_v2_${dateStr}`;
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
      return {
        isFasting: false,
        protocol: '16:8',
        startTime: null,
        targetHours: 16,
        completedFastsCount: 0,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      isFasting: false,
      protocol: '16:8',
      startTime: null,
      targetHours: 16,
      completedFastsCount: 0,
    };
  }
}

export async function saveFastingState(tracker: FastingTracker): Promise<void> {
  try {
    await AsyncStorage.setItem(FASTING_KEY, JSON.stringify(tracker));
  } catch (error) {
    console.error('Save fasting error:', error);
  }
}

export async function loadWeightHistory(): Promise<WeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(WEIGHT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveWeightHistory(entries: WeightEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Save weight history error:', error);
  }
}
