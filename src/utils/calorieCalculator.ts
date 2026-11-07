import { ActivityLevel, DailyTargets, Gender, GoalType } from '../types/nutrition';

export function calculatePersonalTargets(
  gender: Gender,
  age: number,
  heightCm: number,
  weightKg: number,
  activityLevel: ActivityLevel,
  goalType: GoalType
): DailyTargets {
  // 1. Mifflin-St Jeor BMR
  const baseBmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = Math.round(gender === 'male' ? baseBmr + 5 : baseBmr - 161);

  // 2. Activity Multiplier (TDEE)
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.2));

  // 3. Target Calories
  let calories = tdee;
  if (goalType === 'lose') {
    calories = Math.max(gender === 'male' ? 1400 : 1200, tdee - 500);
  } else if (goalType === 'gain') {
    calories = tdee + 400;
  }

  // 4. Macros
  // Protein: 1.8g - 2.0g per kg of body weight
  const proteinRatio = goalType === 'lose' || goalType === 'gain' ? 2.0 : 1.6;
  const protein = Math.round(weightKg * proteinRatio);

  // Fat: 25% of total calories (1g fat = 9 kcal)
  const fat = Math.round((calories * 0.25) / 9);

  // Carbs: Remaining calories (1g carb = 4 kcal, 1g protein = 4 kcal)
  const remainingCalForCarbs = Math.max(200, calories - protein * 4 - fat * 9);
  const carbs = Math.round(remainingCalForCarbs / 4);

  // 5. Water: 35ml per kg of body weight
  const waterMl = Math.round((weightKg * 35) / 100) * 100;

  return {
    bmr,
    tdee,
    calories,
    protein,
    carbs,
    fat,
    waterMl,
  };
}

export function calculateBMI(heightCm: number, weightKg: number): { bmi: number; label: string; color: string } {
  if (!heightCm || !weightKg) return { bmi: 0, label: '-', color: '#9496A1' };
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  if (bmi < 18.5) return { bmi, label: 'Zayıf', color: '#38BDF8' };
  if (bmi < 25) return { bmi, label: 'Normal (İdeal)', color: '#10B981' };
  if (bmi < 30) return { bmi, label: 'Fazla Kilolu', color: '#F59E0B' };
  return { bmi, label: 'Obezite Sınırı', color: '#EF4444' };
}
