/**
 * AI Meal Plan Generator Screen
 *
 * 3 phases:
 *  1. form     — configure goal, diet, calories, allergies
 *  2. generating — streaming progress display
 *  3. preview  — day tabs with breakfast/lunch/dinner/snacks, macros, grocery list
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useNutritionStore } from '../../../src/stores/useNutritionStore';
import useSettingsStore from '../../../src/stores/useSettingsStore';
import { generateAIMealPlan } from '../../../src/services/aiMealPlanService';
import type { AIMealPlan, MealPlanDay, MealPlanMeal } from '../../../src/services/aiMealPlanService';
import type { DietType, FitnessGoal } from '../../../src/types/user';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Config options ───────────────────────────────────────────────────────────

const GOALS: { value: FitnessGoal; labelEn: string; labelRo: string; emoji: string }[] = [
  { value: 'lose_weight', labelEn: 'Lose Weight', labelRo: 'Slăbire', emoji: '🔥' },
  { value: 'build_muscle', labelEn: 'Build Muscle', labelRo: 'Masă musculară', emoji: '💪' },
  { value: 'maintain', labelEn: 'Maintain', labelRo: 'Menținere', emoji: '⚖️' },
  { value: 'improve_endurance', labelEn: 'Endurance', labelRo: 'Anduranță', emoji: '🏃' },
];

const DIETS: { value: DietType; labelEn: string; labelRo: string }[] = [
  { value: 'standard', labelEn: 'Standard', labelRo: 'Standard' },
  { value: 'vegan', labelEn: 'Vegan', labelRo: 'Vegan' },
  { value: 'vegetarian', labelEn: 'Vegetarian', labelRo: 'Vegetarian' },
  { value: 'keto', labelEn: 'Keto', labelRo: 'Keto' },
  { value: 'mediterranean', labelEn: 'Mediterranean', labelRo: 'Mediteranean' },
  { value: 'paleo', labelEn: 'Paleo', labelRo: 'Paleo' },
];

const CALORIE_PRESETS = [1600, 1800, 2000, 2200, 2500, 3000];

// ─── Main screen ──────────────────────────────────────────────────────────────

type Phase = 'form' | 'generating' | 'preview';

export default function GenerateMealPlanScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = useStyles(theme);
  const { language } = useSettingsStore();
  const { user } = useAuthStore();
  const { saveMealPlan } = useNutritionStore();
  const isRo = language === 'ro';

  // Form state — pre-fill from user profile
  const [goal, setGoal] = useState<FitnessGoal>(user?.goals?.[0] ?? 'build_muscle');
  const [dietType, setDietType] = useState<DietType>(user?.dietPreference ?? 'standard');
  const [calories, setCalories] = useState(2000);
  const [caloriesInput, setCaloriesInput] = useState('2000');
  const [allergies, setAllergies] = useState('');

  // Generation state
  const [phase, setPhase] = useState<Phase>('form');
  const [tokenCount, setTokenCount] = useState(0);
  const [plan, setPlan] = useState<AIMealPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeTab, setActiveTab] = useState<'meals' | 'grocery' | 'tips'>('meals');
  const tokenRef = useRef(0);

  const handleGenerate = useCallback(async () => {
    setPhase('generating');
    tokenRef.current = 0;
    setTokenCount(0);

    try {
      const result = await generateAIMealPlan(
        {
          goal,
          dietType,
          targetCalories: calories,
          weightKg: user?.measurements?.weight ?? 75,
          allergies: allergies.trim() ? allergies.split(',').map((s) => s.trim()) : [],
          language: language as 'en' | 'ro',
        },
        (chunk) => {
          tokenRef.current += chunk.length;
          setTokenCount(tokenRef.current);
        },
      );
      setPlan(result);
      setPhase('preview');
    } catch (err) {
      setPhase('form');
      Alert.alert(
        isRo ? 'Eroare' : 'Error',
        isRo
          ? 'Nu s-a putut genera planul. Verifică conexiunea și cheia API.'
          : 'Could not generate plan. Check your connection and API key.',
      );
    }
  }, [goal, dietType, calories, language, allergies, user]);

  const handleSave = useCallback(() => {
    if (!plan) return;
    saveMealPlan(plan);
    Alert.alert(
      isRo ? 'Salvat!' : 'Saved!',
      isRo ? 'Planul alimentar a fost salvat.' : 'Meal plan has been saved.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }, [plan, saveMealPlan, isRo, router]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === 'form') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isRo ? 'Plan Alimentar AI' : 'AI Meal Plan'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Goal */}
          <Text style={styles.sectionLabel}>
            {isRo ? 'Obiectiv' : 'Goal'}
          </Text>
          <View style={styles.chipRow}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.chip, goal === g.value && styles.chipActive]}
                onPress={() => setGoal(g.value)}
              >
                <Text style={styles.chipEmoji}>{g.emoji}</Text>
                <Text style={[styles.chipText, goal === g.value && styles.chipTextActive]}>
                  {isRo ? g.labelRo : g.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Diet */}
          <Text style={styles.sectionLabel}>
            {isRo ? 'Tip de dietă' : 'Diet Type'}
          </Text>
          <View style={styles.chipRow}>
            {DIETS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.chip, dietType === d.value && styles.chipActive]}
                onPress={() => setDietType(d.value)}
              >
                <Text style={[styles.chipText, dietType === d.value && styles.chipTextActive]}>
                  {isRo ? d.labelRo : d.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Calories */}
          <Text style={styles.sectionLabel}>
            {isRo ? 'Calorii zilnice (kcal)' : 'Daily Calories (kcal)'}
          </Text>
          <View style={styles.caloriePresetsRow}>
            {CALORIE_PRESETS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.calorieChip, calories === c && styles.chipActive]}
                onPress={() => { setCalories(c); setCaloriesInput(String(c)); }}
              >
                <Text style={[styles.calorieChipText, calories === c && styles.chipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.calorieInput}
            value={caloriesInput}
            onChangeText={(v) => {
              setCaloriesInput(v);
              const n = parseInt(v, 10);
              if (!isNaN(n) && n > 0) setCalories(n);
            }}
            keyboardType="numeric"
            placeholder={isRo ? 'Sau introdu manual...' : 'Or type manually...'}
            placeholderTextColor={theme.colors.textSecondary}
          />

          {/* Allergies */}
          <Text style={styles.sectionLabel}>
            {isRo ? 'Alergii / excluderi (opțional)' : 'Allergies / Exclusions (optional)'}
          </Text>
          <TextInput
            style={styles.calorieInput}
            value={allergies}
            onChangeText={setAllergies}
            placeholder={isRo ? 'ex: gluten, lactoza, nuci' : 'e.g. gluten, dairy, nuts'}
            placeholderTextColor={theme.colors.textSecondary}
          />

          <TouchableOpacity style={[styles.generateBtn, { backgroundColor: theme.colors.primary }]} onPress={handleGenerate}>
            <Text style={styles.generateBtnText}>
              {isRo ? '✨ Generează planul' : '✨ Generate Plan'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === 'generating') {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.generatingTitle}>
          {isRo ? '🧠 Se creează planul...' : '🧠 Creating your plan...'}
        </Text>
        <Text style={styles.generatingSubtitle}>
          {isRo ? 'Claude analizează nevoile tale nutriționale' : 'Claude is analyzing your nutritional needs'}
        </Text>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenText}>{tokenCount.toLocaleString()} chars</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Preview phase
  if (!plan) return null;
  const day = plan.days[selectedDay];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setPhase('form')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isRo ? plan.nameRo : plan.name}
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{isRo ? 'Salvează' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Macro summary bar */}
      <View style={styles.macroBar}>
        {([
          { label: isRo ? 'Cal' : 'Cal', value: plan.targetCalories, unit: 'kcal', color: theme.colors.primary },
          { label: isRo ? 'Prot' : 'Prot', value: plan.targetProtein, unit: 'g', color: '#4CAF50' },
          { label: isRo ? 'Carb' : 'Carb', value: plan.targetCarbs, unit: 'g', color: '#FF9800' },
          { label: isRo ? 'Grăs' : 'Fat', value: plan.targetFat, unit: 'g', color: '#F44336' },
        ] as const).map((m) => (
          <View key={m.label} style={styles.macroBarItem}>
            <Text style={[styles.macroBarValue, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.macroBarUnit}>{m.unit}</Text>
            <Text style={styles.macroBarLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Tab bar: meals / grocery / tips */}
      <View style={styles.tabBar}>
        {(['meals', 'grocery', 'tips'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && { color: theme.colors.primary, fontWeight: '700' }]}>
              {tab === 'meals'
                ? (isRo ? 'Mese' : 'Meals')
                : tab === 'grocery'
                ? (isRo ? 'Cumpărături' : 'Grocery')
                : (isRo ? 'Sfaturi' : 'Tips')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'meals' && (
          <>
            {/* Day selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {plan.days.map((d, i) => (
                <TouchableOpacity
                  key={d.dayNumber}
                  style={[styles.dayChip, selectedDay === i && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={[styles.dayChipText, selectedDay === i && { color: '#fff' }]}>
                    {isRo ? d.dayNameRo.slice(0, 3) : d.dayName.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Day totals */}
            <View style={[styles.dayTotalsRow, { backgroundColor: theme.colors.card, marginHorizontal: 16, borderRadius: 12 }]}>
              <Text style={[styles.dayTotalsText, { color: theme.colors.textSecondary }]}>
                {isRo ? 'Total zi:' : 'Day total:'}
              </Text>
              <Text style={[styles.dayTotalsText, { color: theme.colors.primary, fontWeight: '700' }]}>
                {day.totalCalories} kcal
              </Text>
              <Text style={styles.dayTotalsText}>P:{day.totalProtein}g</Text>
              <Text style={styles.dayTotalsText}>C:{day.totalCarbs}g</Text>
              <Text style={styles.dayTotalsText}>F:{day.totalFat}g</Text>
            </View>

            {/* Meals */}
            {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((mt) => (
              <MealCard
                key={mt}
                meal={day[mt]}
                mealType={mt}
                isRo={isRo}
                theme={theme}
                styles={styles}
              />
            ))}
          </>
        )}

        {activeTab === 'grocery' && (
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>
              🛒 {isRo ? 'Listă de cumpărături (7 zile)' : 'Grocery List (7 days)'}
            </Text>
            {plan.groceryList.map((item, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'tips' && (
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>
              💡 {isRo ? 'Sfaturi de preparare' : 'Prep Tips'}
            </Text>
            {plan.prepTips.map((tip, i) => (
              <View key={i} style={[styles.listRow, { alignItems: 'flex-start' }]}>
                <Text style={styles.listBullet}>{i + 1}.</Text>
                <Text style={[styles.listText, { flex: 1 }]}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── MealCard ─────────────────────────────────────────────────────────────────

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎',
};

const MEAL_LABELS_EN: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snack',
};

const MEAL_LABELS_RO: Record<string, string> = {
  breakfast: 'Mic dejun',
  lunch: 'Prânz',
  dinner: 'Cină',
  snacks: 'Gustare',
};

interface MealCardProps {
  meal: MealPlanMeal;
  mealType: string;
  isRo: boolean;
  theme: any;
  styles: ReturnType<typeof useStyles>;
}

function MealCard({ meal, mealType, isRo, theme, styles }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.mealCard}
      onPress={() => setExpanded((e) => !e)}
      activeOpacity={0.85}
    >
      <View style={styles.mealCardHeader}>
        <Text style={styles.mealIcon}>{MEAL_ICONS[mealType]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.mealTypeLabel}>
            {isRo ? MEAL_LABELS_RO[mealType] : MEAL_LABELS_EN[mealType]}
          </Text>
          <Text style={styles.mealName} numberOfLines={expanded ? 0 : 1}>
            {isRo ? meal.nameRo : meal.name}
          </Text>
        </View>
        <View style={styles.mealCalBadge}>
          <Text style={[styles.mealCalText, { color: theme.colors.primary }]}>{meal.calories}</Text>
          <Text style={styles.mealCalUnit}>kcal</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Macro strip */}
      <View style={styles.mealMacroRow}>
        <Text style={styles.mealMacro}>P <Text style={{ color: '#4CAF50' }}>{meal.protein}g</Text></Text>
        <Text style={styles.mealMacro}>C <Text style={{ color: '#FF9800' }}>{meal.carbs}g</Text></Text>
        <Text style={styles.mealMacro}>F <Text style={{ color: '#F44336' }}>{meal.fat}g</Text></Text>
        <Text style={styles.mealMacro}>⏱ {meal.prepTime}min</Text>
      </View>

      {expanded && (
        <>
          {meal.ingredients.length > 0 && (
            <View style={styles.ingredientsBox}>
              {meal.ingredients.map((ing, i) => (
                <Text key={i} style={styles.ingredientText}>• {ing}</Text>
              ))}
            </View>
          )}
          {meal.notes ? (
            <Text style={[styles.mealNotes, { color: theme.colors.textSecondary }]}>
              💡 {meal.notes}
            </Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function useStyles(theme: any) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    centered: { justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
    },
    backBtn: { width: 40, alignItems: 'center' },
    backBtnText: { fontSize: 28, color: theme.colors.text, lineHeight: 32 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: theme.colors.text },
    saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 },
    saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    sectionLabel: {
      fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 4, marginTop: 8,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    chipEmoji: { fontSize: 14 },
    chipText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
    chipTextActive: { color: '#fff' },

    caloriePresetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    calorieChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
      backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border,
    },
    calorieChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
    calorieInput: {
      backgroundColor: theme.colors.card, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 10,
      color: theme.colors.text, fontSize: 15,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    generateBtn: {
      marginTop: 8, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    },
    generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    generatingTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
    generatingSubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },
    tokenBadge: {
      backgroundColor: `${theme.colors.primary}22`, borderRadius: 20,
      paddingHorizontal: 16, paddingVertical: 6,
    },
    tokenText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },

    macroBar: {
      flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
    },
    macroBarItem: { flex: 1, alignItems: 'center' },
    macroBarValue: { fontSize: 18, fontWeight: '800' },
    macroBarUnit: { fontSize: 10, color: theme.colors.textSecondary },
    macroBarLabel: { fontSize: 11, color: theme.colors.textSecondary },

    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },

    dayScroll: { marginVertical: 12 },
    dayChip: {
      width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border,
    },
    dayChipText: { fontSize: 12, fontWeight: '700', color: theme.colors.text },

    dayTotalsRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
    },
    dayTotalsText: { fontSize: 13, color: theme.colors.text },

    mealCard: {
      backgroundColor: theme.colors.card, borderRadius: 16,
      marginHorizontal: 16, marginBottom: 10, padding: 14,
    },
    mealCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mealIcon: { fontSize: 24 },
    mealTypeLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
    mealName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    mealCalBadge: { alignItems: 'flex-end' },
    mealCalText: { fontSize: 18, fontWeight: '800' },
    mealCalUnit: { fontSize: 10, color: theme.colors.textSecondary },
    chevron: { fontSize: 12, color: theme.colors.textSecondary, marginLeft: 4 },
    mealMacroRow: {
      flexDirection: 'row', gap: 16, marginTop: 8, paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border,
    },
    mealMacro: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
    ingredientsBox: {
      marginTop: 10, padding: 10, backgroundColor: theme.colors.background,
      borderRadius: 10, gap: 4,
    },
    ingredientText: { fontSize: 13, color: theme.colors.text },
    mealNotes: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },

    listCard: {
      backgroundColor: theme.colors.card, borderRadius: 16, margin: 16, padding: 16, gap: 8,
    },
    listCardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
    listRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    listBullet: { fontSize: 14, color: theme.colors.primary, width: 16 },
    listText: { fontSize: 14, color: theme.colors.text, flexShrink: 1 },
  });
}
