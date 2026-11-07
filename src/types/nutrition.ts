export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Gender = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type GoalType = 'lose' | 'maintain' | 'gain';

export type FastingProtocol = '14:10' | '16:8' | '18:6' | '20:4';

export interface UserProfile {
  isOnboarded: boolean;
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  nvidiaApiKey: string;
  nvidiaTextModel: string;
  nvidiaVisionModel: string;
  targets: DailyTargets;
}

export interface DailyTargets {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  mealType: MealType;
  timestamp: string;
  imageUrl?: string;
  aiTip?: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
}

export interface FastingTracker {
  isFasting: boolean;
  protocol: FastingProtocol;
  startTime: string | null;
  targetHours: number;
  completedFastsCount: number;
}

export type ActiveTab = 'home' | 'scanner' | 'fasting' | 'coach' | 'profile';
