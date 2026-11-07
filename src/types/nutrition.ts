export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  portion: string; // e.g. "1 porsiyon (250g)"
  mealType: MealType;
  timestamp: string;
  imageUrl?: string;
  aiTip?: string;
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}

export interface FastingTracker {
  isFasting: boolean;
  startTime: string | null;
  targetHours: number; // e.g. 16
}

export interface UserSettings {
  nvidiaApiKey: string;
  preferredModel: string;
  targets: DailyTargets;
  currentWeightKg: number;
  targetWeightKg: number;
}
