/**
 * Barcode Food Scanner Screen
 *
 * Uses expo-camera to scan barcodes. On detection:
 *  1. Vibrates and pauses scanning
 *  2. Looks up the food item (local → Open Food Facts → Claude AI)
 *  3. Shows a bottom sheet with nutrition info
 *  4. Lets the user pick a meal type and add the food to the daily log
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Vibration,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { useNutritionStore } from '../../../src/stores/useNutritionStore';
import useSettingsStore from '../../../src/stores/useSettingsStore';
import { isValidBarcode } from '../../../src/services/barcodeScannerService';
import type { MealType } from '../../../src/types/nutrition';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SCAN_FRAME = Math.min(SCREEN_W * 0.7, 280);

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BarcodeScannerScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const styles = useStyles(theme);

  const { language } = useSettingsStore();
  const { scannedFood, isScanningBarcode, scanBarcodeAsync, clearScannedFood, addMealEntry } =
    useNutritionStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [servings, setServings] = useState(1);
  const cooldownRef = useRef(false);

  // Clear stale results on mount
  useEffect(() => {
    clearScannedFood();
    return () => { clearScannedFood(); };
  }, []);

  const handleBarcodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      if (!isScanning || cooldownRef.current) return;
      if (!isValidBarcode(data)) return;
      if (data === lastBarcode && scannedFood) return; // same barcode, result already shown

      cooldownRef.current = true;
      setIsScanning(false);
      setLastBarcode(data);
      setServings(1);
      Vibration.vibrate(Platform.OS === 'android' ? 100 : [0, 100]);

      scanBarcodeAsync(data, language as 'en' | 'ro').finally(() => {
        cooldownRef.current = false;
      });
    },
    [isScanning, lastBarcode, scannedFood, language, scanBarcodeAsync],
  );

  const handleRescan = () => {
    clearScannedFood();
    setLastBarcode(null);
    setServings(1);
    setIsScanning(true);
  };

  const handleAddToMeal = () => {
    if (!scannedFood) return;
    const today = new Date().toISOString().split('T')[0];
    addMealEntry(today, selectedMeal, scannedFood.foodItem.id, servings);
    Alert.alert(
      language === 'ro' ? 'Adăugat!' : 'Added!',
      language === 'ro'
        ? `${scannedFood.foodItem.nameRo} adăugat la ${mealLabel(selectedMeal, language)}.`
        : `${scannedFood.foodItem.name} added to ${mealLabel(selectedMeal, language)}.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  // ── Permission states ──────────────────────────────────────────────────────

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.permText}>
          {language === 'ro'
            ? 'Avem nevoie de acces la cameră pentru a scana coduri de bare.'
            : 'We need camera access to scan barcodes.'}
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>
            {language === 'ro' ? 'Permite accesul la cameră' : 'Allow Camera Access'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>
            {language === 'ro' ? 'Înapoi' : 'Go Back'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128', 'code39'] }}
      />

      {/* Dark overlay with scan frame cutout */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanFrame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Header */}
      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'ro' ? 'Scanează aliment' : 'Scan Food'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerHint}>
          {language === 'ro'
            ? 'Poziționează codul de bare în cadru'
            : 'Position the barcode within the frame'}
        </Text>
      </SafeAreaView>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        {isScanningBarcode ? (
          /* Loading state */
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              {language === 'ro' ? 'Se caută produsul…' : 'Looking up product…'}
            </Text>
            <Text style={styles.loadingSubtext}>
              {language === 'ro'
                ? 'Barcode: ' + lastBarcode
                : 'Barcode: ' + lastBarcode}
            </Text>
          </View>
        ) : scannedFood ? (
          /* Result card */
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View style={styles.resultCard}>
              {/* Source badge */}
              <View style={[styles.sourceBadge, sourceBadgeColor(scannedFood.source, theme)]}>
                <Text style={styles.sourceBadgeText}>
                  {sourceLabel(scannedFood.source, language)}
                </Text>
              </View>

              {/* Food name */}
              <Text style={styles.foodName}>
                {language === 'ro' ? scannedFood.foodItem.nameRo : scannedFood.foodItem.name}
              </Text>
              {scannedFood.foodItem.brand ? (
                <Text style={styles.foodBrand}>{scannedFood.foodItem.brand}</Text>
              ) : null}
              <Text style={styles.servingInfo}>
                {language === 'ro' ? 'Per porție' : 'Per serving'}: {scannedFood.foodItem.serving.size}
                {scannedFood.foodItem.serving.unit}
              </Text>

              {/* Macros row */}
              <View style={styles.macrosRow}>
                <MacroChip label={language === 'ro' ? 'Cal' : 'Cal'} value={scannedFood.foodItem.calories} unit="kcal" color={theme.colors.primary} theme={theme} />
                <MacroChip label={language === 'ro' ? 'Prot' : 'Prot'} value={scannedFood.foodItem.protein} unit="g" color="#4CAF50" theme={theme} />
                <MacroChip label={language === 'ro' ? 'Carb' : 'Carb'} value={scannedFood.foodItem.carbs} unit="g" color="#FF9800" theme={theme} />
                <MacroChip label={language === 'ro' ? 'Grăs' : 'Fat'} value={scannedFood.foodItem.fat} unit="g" color="#F44336" theme={theme} />
              </View>

              {/* Extra nutrients */}
              {(scannedFood.foodItem.fiber != null || scannedFood.foodItem.sugar != null || scannedFood.foodItem.sodium != null) && (
                <View style={styles.extraRow}>
                  {scannedFood.foodItem.fiber != null && (
                    <Text style={styles.extraText}>{language === 'ro' ? 'Fibre' : 'Fiber'}: {scannedFood.foodItem.fiber}g</Text>
                  )}
                  {scannedFood.foodItem.sugar != null && (
                    <Text style={styles.extraText}>{language === 'ro' ? 'Zahăr' : 'Sugar'}: {scannedFood.foodItem.sugar}g</Text>
                  )}
                  {scannedFood.foodItem.sodium != null && (
                    <Text style={styles.extraText}>{language === 'ro' ? 'Sodiu' : 'Sodium'}: {scannedFood.foodItem.sodium}mg</Text>
                  )}
                </View>
              )}

              {/* Servings stepper */}
              <View style={styles.servingsRow}>
                <Text style={styles.servingsLabel}>
                  {language === 'ro' ? 'Porții:' : 'Servings:'}
                </Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setServings((s) => Math.max(0.5, s - 0.5))}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepValue}>{servings}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setServings((s) => Math.min(10, s + 0.5))}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Meal type selector */}
              <View style={styles.mealRow}>
                {MEAL_TYPES.map((mt) => (
                  <TouchableOpacity
                    key={mt}
                    style={[styles.mealBtn, selectedMeal === mt && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setSelectedMeal(mt)}
                  >
                    <Text style={[styles.mealBtnText, selectedMeal === mt && { color: '#fff' }]}>
                      {mealLabel(mt, language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.rescanBtn} onPress={handleRescan}>
                  <Text style={styles.rescanText}>
                    {language === 'ro' ? '↩ Scanează din nou' : '↩ Scan Again'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]} onPress={handleAddToMeal}>
                  <Text style={styles.addBtnText}>
                    {language === 'ro' ? 'Adaugă' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Idle hint */
          <View style={styles.idleCard}>
            <Text style={styles.idleIcon}>📷</Text>
            <Text style={styles.idleText}>
              {language === 'ro'
                ? 'Scanează codul de bare de pe ambalaj'
                : 'Scan the barcode on the package'}
            </Text>
            <Text style={styles.idleSubtext}>
              {language === 'ro'
                ? 'Suportat: EAN-8, EAN-13, UPC'
                : 'Supports: EAN-8, EAN-13, UPC'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mealLabel(mt: MealType, lang: string): string {
  const labels: Record<MealType, { en: string; ro: string }> = {
    breakfast: { en: 'Breakfast', ro: 'Mic dejun' },
    lunch: { en: 'Lunch', ro: 'Prânz' },
    dinner: { en: 'Dinner', ro: 'Cină' },
    snacks: { en: 'Snack', ro: 'Gustare' },
  };
  return lang === 'ro' ? labels[mt].ro : labels[mt].en;
}

function sourceLabel(source: 'local' | 'openfoodfacts' | 'ai', lang: string): string {
  if (source === 'local') return lang === 'ro' ? '📦 Bază locală' : '📦 Local DB';
  if (source === 'openfoodfacts') return '🌍 Open Food Facts';
  return lang === 'ro' ? '🤖 Estimat de AI' : '🤖 AI Estimate';
}

function sourceBadgeColor(source: 'local' | 'openfoodfacts' | 'ai', theme: any) {
  if (source === 'local') return { backgroundColor: '#4CAF50' };
  if (source === 'openfoodfacts') return { backgroundColor: '#2196F3' };
  return { backgroundColor: theme.colors.primary };
}

// ─── MacroChip ────────────────────────────────────────────────────────────────

interface MacroChipProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  theme: any;
}

function MacroChip({ label, value, unit, color }: MacroChipProps) {
  return (
    <View style={[chipStyles.chip, { borderColor: color }]}>
      <Text style={[chipStyles.value, { color }]}>{Math.round(value)}</Text>
      <Text style={chipStyles.unit}>{unit}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    marginHorizontal: 3,
  },
  value: { fontSize: 18, fontWeight: '700' },
  unit: { fontSize: 10, color: '#888', marginTop: -2 },
  label: { fontSize: 10, color: '#666', marginTop: 2 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

function useStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centered: { justifyContent: 'center', alignItems: 'center', padding: 24 },

    // Overlay
    overlay: { ...StyleSheet.absoluteFillObject },
    overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    overlayMiddle: { flexDirection: 'row', height: SCAN_FRAME },
    overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    scanFrame: {
      width: SCAN_FRAME,
      height: SCAN_FRAME,
      position: 'relative',
    },

    // Corner markers
    corner: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderColor: '#fff',
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },

    // Header
    headerArea: { position: 'absolute', top: 0, left: 0, right: 0 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    headerHint: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 4,
    },

    // Bottom panel
    bottomPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: SCREEN_H * 0.55,
    },

    // Loading card
    loadingCard: {
      backgroundColor: theme.colors.card,
      margin: 16,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    loadingSubtext: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },

    // Result card
    resultCard: {
      backgroundColor: theme.colors.card,
      margin: 16,
      borderRadius: 20,
      padding: 20,
      gap: 12,
    },
    sourceBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    sourceBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    foodName: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    foodBrand: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      marginTop: -6,
    },
    servingInfo: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },
    macrosRow: { flexDirection: 'row', gap: 4 },
    extraRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    extraText: { color: theme.colors.textSecondary, fontSize: 12 },

    // Servings
    servingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    servingsLabel: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnText: { fontSize: 20, color: theme.colors.text, fontWeight: '300' },
    stepValue: { fontSize: 18, fontWeight: '700', color: theme.colors.text, minWidth: 28, textAlign: 'center' },

    // Meal selector
    mealRow: { flexDirection: 'row', gap: 6 },
    mealBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
    mealBtnText: { color: theme.colors.text, fontSize: 11, fontWeight: '600' },

    // Actions
    actionsRow: { flexDirection: 'row', gap: 10 },
    rescanBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
    rescanText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
    addBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // Idle
    idleCard: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      margin: 16,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      gap: 8,
    },
    idleIcon: { fontSize: 36 },
    idleText: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
    idleSubtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' },

    // Permission
    permText: {
      color: theme.colors.text,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    permBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 14,
      marginBottom: 12,
    },
    permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    cancelBtn: { padding: 12 },
    cancelText: { color: theme.colors.textSecondary, fontSize: 14 },
  });
}
