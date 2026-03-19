import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/theme';
import { useWorkoutStore } from '../../../../src/stores/useWorkoutStore';
import { useVoiceCoach } from '../../../../src/hooks/useVoiceCoach';
import { useRestTimer } from '../../../../src/hooks/useRestTimer';
import { exercises, getExerciseById } from '../../../../src/data/exercises';
import type { WorkoutExercise, WorkoutSet } from '../../../../src/types/workout';
import type { Exercise } from '../../../../src/types/exercise';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatElapsed(startTimeISO: string): string {
  const elapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(startTimeISO).getTime()) / 1000),
  );
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// SetRow component
// ---------------------------------------------------------------------------

interface SetRowProps {
  exerciseId: string;
  set: WorkoutSet;
  setIndex: number;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
  onUpdate: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  onRemove: (exerciseId: string, setId: string) => void;
}

function SetRow({
  exerciseId,
  set,
  setIndex,
  styles,
  theme,
  onUpdate,
  onRemove,
}: SetRowProps) {
  const [weightText, setWeightText] = useState(
    set.weight > 0 ? String(set.weight) : '',
  );
  const [repsText, setRepsText] = useState(
    set.reps > 0 ? String(set.reps) : '',
  );

  const handleWeightBlur = useCallback(() => {
    const parsed = parseFloat(weightText);
    const value = isNaN(parsed) ? 0 : parsed;
    onUpdate(exerciseId, set.id, { weight: value });
  }, [exerciseId, set.id, weightText, onUpdate]);

  const handleRepsBlur = useCallback(() => {
    const parsed = parseInt(repsText, 10);
    const value = isNaN(parsed) ? 0 : parsed;
    onUpdate(exerciseId, set.id, { reps: value });
  }, [exerciseId, set.id, repsText, onUpdate]);

  const handleToggleComplete = useCallback(() => {
    const weight = parseFloat(weightText);
    const reps = parseInt(repsText, 10);
    onUpdate(exerciseId, set.id, {
      completed: !set.completed,
      weight: isNaN(weight) ? set.weight : weight,
      reps: isNaN(reps) ? set.reps : reps,
    });
  }, [exerciseId, set.id, set.completed, set.weight, set.reps, weightText, repsText, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(exerciseId, set.id);
  }, [exerciseId, set.id, onRemove]);

  const rowBg = set.completed
    ? theme.isDark
      ? 'rgba(0,212,170,0.08)'
      : 'rgba(0,184,148,0.07)'
    : 'transparent';

  return (
    <View style={[styles.setRow, { backgroundColor: rowBg }]}>
      {/* Set number / type badge */}
      <View style={styles.setNumberContainer}>
        <Text style={styles.setNumber}>{setIndex + 1}</Text>
      </View>

      {/* Weight input */}
      <View style={styles.setInputGroup}>
        <TextInput
          style={[
            styles.setInput,
            set.completed && styles.setInputCompleted,
          ]}
          value={weightText}
          onChangeText={setWeightText}
          onBlur={handleWeightBlur}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.textTertiary}
          accessibilityLabel={`Set ${setIndex + 1} weight`}
        />
        <Text style={styles.setInputLabel}>kg</Text>
      </View>

      {/* Reps input */}
      <View style={styles.setInputGroup}>
        <TextInput
          style={[
            styles.setInput,
            set.completed && styles.setInputCompleted,
          ]}
          value={repsText}
          onChangeText={setRepsText}
          onBlur={handleRepsBlur}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.textTertiary}
          accessibilityLabel={`Set ${setIndex + 1} reps`}
        />
        <Text style={styles.setInputLabel}>reps</Text>
      </View>

      {/* Complete toggle */}
      <Pressable
        style={[
          styles.setCompleteButton,
          set.completed && styles.setCompleteButtonActive,
        ]}
        onPress={handleToggleComplete}
        accessibilityLabel={set.completed ? 'Mark set incomplete' : 'Mark set complete'}
      >
        <Text
          style={[
            styles.setCompleteIcon,
            set.completed && styles.setCompleteIconActive,
          ]}
        >
          {set.completed ? '✓' : '○'}
        </Text>
      </Pressable>

      {/* Delete set */}
      <Pressable
        style={styles.setDeleteButton}
        onPress={handleRemove}
        accessibilityLabel="Remove set"
      >
        <Text style={styles.setDeleteIcon}>✕</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ExerciseCard component
// ---------------------------------------------------------------------------

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  exerciseIndex: number;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
  onAddSet: (exerciseId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onRemoveExercise: (index: number) => void;
}

function ExerciseCard({
  workoutExercise,
  exerciseIndex,
  styles,
  theme,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onRemoveExercise,
}: ExerciseCardProps) {
  const exercise = getExerciseById(workoutExercise.exerciseId);
  const exerciseName = exercise?.name ?? workoutExercise.exerciseId;
  const muscleGroup = exercise?.muscleGroup
    ? capitalize(exercise.muscleGroup)
    : '';

  const handleAddSet = useCallback(() => {
    onAddSet(workoutExercise.id);
  }, [workoutExercise.id, onAddSet]);

  const handleRemoveExercise = useCallback(() => {
    Alert.alert(
      'Remove Exercise',
      `Remove "${exerciseName}" from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveExercise(exerciseIndex),
        },
      ],
    );
  }, [exerciseName, exerciseIndex, onRemoveExercise]);

  return (
    <View style={styles.exerciseCard}>
      {/* Exercise header */}
      <View style={styles.exerciseCardHeader}>
        <View style={styles.exerciseCardTitleGroup}>
          <Text style={styles.exerciseCardName} numberOfLines={1}>
            {exerciseName}
          </Text>
          {muscleGroup.length > 0 && (
            <Text style={styles.exerciseCardMuscle}>{muscleGroup}</Text>
          )}
        </View>
        <Pressable
          style={styles.removeExerciseButton}
          onPress={handleRemoveExercise}
          accessibilityLabel={`Remove ${exerciseName}`}
        >
          <Text style={styles.removeExerciseText}>Remove</Text>
        </Pressable>
      </View>

      {/* Set column headers */}
      <View style={styles.setColumnHeaders}>
        <View style={styles.setNumberContainer}>
          <Text style={styles.setColumnHeaderText}>Set</Text>
        </View>
        <View style={styles.setInputGroup}>
          <Text style={styles.setColumnHeaderText}>Weight</Text>
        </View>
        <View style={styles.setInputGroup}>
          <Text style={styles.setColumnHeaderText}>Reps</Text>
        </View>
        <View style={styles.setCompleteButton}>
          <Text style={styles.setColumnHeaderText}>Done</Text>
        </View>
        <View style={styles.setDeleteButton} />
      </View>

      {/* Sets */}
      {workoutExercise.sets.map((set, idx) => (
        <SetRow
          key={set.id}
          exerciseId={workoutExercise.id}
          set={set}
          setIndex={idx}
          styles={styles}
          theme={theme}
          onUpdate={onUpdateSet}
          onRemove={onRemoveSet}
        />
      ))}

      {/* Add Set */}
      <Pressable style={styles.addSetButton} onPress={handleAddSet}>
        <Text style={styles.addSetButtonText}>+ Add Set</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rest Timer modal
// ---------------------------------------------------------------------------

type RestTimerHook = ReturnType<typeof useRestTimer>;

interface RestTimerModalProps {
  visible: boolean;
  timer: RestTimerHook;
  theme: ReturnType<typeof useTheme>['theme'];
  onSkip: () => void;
  onAddTime: (seconds: number) => void;
  onClose: () => void;
}

function RestTimerModal({ visible, timer, theme, onSkip, onAddTime, onClose }: RestTimerModalProps) {
  const { colors } = theme;

  const mm = String(Math.floor(timer.secondsLeft / 60)).padStart(2, '0');
  const ss = String(timer.secondsLeft % 60).padStart(2, '0');
  const timeStr = `${mm}:${ss}`;

  // Colour transitions: green → orange → red as time runs out
  const ratio = timer.totalSeconds > 0 ? timer.secondsLeft / timer.totalSeconds : 1;
  const ringColor = ratio > 0.5 ? '#4CAF50' : ratio > 0.25 ? '#FF9800' : '#F44336';

  // Close modal when timer finishes
  useEffect(() => {
    if (visible && !timer.isRunning && timer.secondsLeft === 0 && timer.totalSeconds > 0) {
      onClose();
    }
  }, [visible, timer.isRunning, timer.secondsLeft, timer.totalSeconds, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onSkip}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          justifyContent: 'flex-end',
        }}
        onPress={onSkip}
      >
        <Pressable
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 32,
            paddingTop: 20,
            paddingBottom: 40,
            alignItems: 'center',
            gap: 20,
          }}
          onPress={() => {}} // prevent tap-through
        >
          {/* Drag handle */}
          <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />

          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1 }}>
            REST TIMER
          </Text>

          {/* Circular progress ring */}
          <View style={{ alignItems: 'center', justifyContent: 'center', width: 160, height: 160 }}>
            {/* Background ring */}
            <View style={{
              position: 'absolute', width: 160, height: 160, borderRadius: 80,
              borderWidth: 10, borderColor: colors.border,
            }} />
            {/* Progress ring (simplified arc using border trick) */}
            <View style={{
              position: 'absolute', width: 160, height: 160, borderRadius: 80,
              borderWidth: 10,
              borderColor: ringColor,
              opacity: timer.isRunning ? 1 : 0.4,
              transform: [{ rotate: `${-90 + (1 - (timer.secondsLeft / Math.max(timer.totalSeconds, 1))) * 360}deg` }],
              borderRightColor: 'transparent',
              borderBottomColor: (1 - timer.secondsLeft / Math.max(timer.totalSeconds, 1)) > 0.25 ? ringColor : 'transparent',
              borderLeftColor: (1 - timer.secondsLeft / Math.max(timer.totalSeconds, 1)) > 0.5 ? ringColor : 'transparent',
              borderTopColor: (1 - timer.secondsLeft / Math.max(timer.totalSeconds, 1)) > 0.75 ? ringColor : 'transparent',
            }} />
            {/* Time display */}
            <Text style={{ fontSize: 48, fontWeight: '800', color: timer.isRunning ? ringColor : colors.textSecondary, letterSpacing: -2 }}>
              {timeStr}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: -4 }}>
              {timer.isRunning ? 'remaining' : 'done!'}
            </Text>
          </View>

          {/* Add time buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[15, 30].map((sec) => (
              <Pressable
                key={sec}
                onPress={() => onAddTime(sec)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.border : colors.background,
                  borderRadius: 14,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                })}
              >
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                  +{sec}s
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Skip button */}
          <Pressable
            onPress={onSkip}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.border : colors.primary,
              borderRadius: 16,
              paddingHorizontal: 48,
              paddingVertical: 14,
              width: '100%',
              alignItems: 'center',
            })}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              Skip Rest
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Exercise picker modal
// ---------------------------------------------------------------------------

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
}

function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  styles,
  theme,
}: ExercisePickerModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filteredExercises = useMemo<Exercise[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.toLowerCase().includes(q),
    );
  }, [query]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const handleSelect = useCallback(
    (exercise: Exercise) => {
      setQuery('');
      onSelect(exercise);
    },
    [onSelect],
  );

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <Pressable
        style={({ pressed }) => [
          styles.pickerItem,
          pressed && styles.pickerItemPressed,
        ]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.pickerItemContent}>
          <Text style={styles.pickerItemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.pickerItemMeta}>
            {capitalize(item.muscleGroup)} · {capitalize(item.equipment)}
          </Text>
        </View>
        <Text style={styles.pickerItemChevron}>›</Text>
      </Pressable>
    ),
    [styles, handleSelect],
  );

  const keyExtractor = useCallback((item: Exercise) => item.id, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        style={[styles.modalSafeArea, { backgroundColor: theme.colors.background }]}
        edges={['top', 'bottom']}
      >
        {/* Modal header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {t('workout.addExercise', 'Add Exercise')}
          </Text>
          <Pressable
            style={styles.modalCloseButton}
            onPress={handleClose}
            accessibilityLabel="Close exercise picker"
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </Pressable>
        </View>

        {/* Search input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('workout.searchExercises', 'Search exercises...')}
            placeholderTextColor={theme.colors.textTertiary}
            autoFocus={false}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Exercise list */}
        <FlatList
          data={filteredExercises}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.pickerListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={styles.pickerSeparator} />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ActiveWorkoutScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    activeWorkout,
    addExercise,
    addSet,
    updateSet,
    removeSet,
    removeExercise,
    finishWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const coach = useVoiceCoach();
  const [coachTipVisible, setCoachTipVisible] = useState(false);

  // Rest timer — starts automatically when a set is completed
  const [restTimerVisible, setRestTimerVisible] = useState(false);
  const restTimer = useRestTimer(() => {
    // On finish: hide modal (already hidden if user skipped)
    setRestTimerVisible(false);
  });

  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [workoutName, setWorkoutName] = useState(
    activeWorkout?.name ?? 'Workout',
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const nameInputRef = useRef<TextInput>(null);

  // Sync name when activeWorkout changes + greet on first load
  useEffect(() => {
    if (activeWorkout) {
      setWorkoutName(activeWorkout.name);
    }
  }, [activeWorkout?.id]);

  // Greet user when workout starts
  useEffect(() => {
    if (activeWorkout) {
      const timer = setTimeout(() => coach.speakWorkoutStart(), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (!activeWorkout) {
      setElapsedTime('00:00');
      return;
    }

    setElapsedTime(formatElapsed(activeWorkout.startTime));
    const interval = setInterval(() => {
      setElapsedTime(formatElapsed(activeWorkout.startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout?.startTime]);

  // If no active workout, prompt to go back
  useEffect(() => {
    if (!activeWorkout) {
      router.replace('/(tabs)/track');
    }
  }, [activeWorkout]);

  const handleNamePress = useCallback(() => {
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, []);

  const handleNameBlur = useCallback(() => {
    setIsEditingName(false);
  }, []);

  const handleAddExercise = useCallback(
    (exercise: Exercise) => {
      addExercise(exercise.id);
      setPickerVisible(false);
    },
    [addExercise],
  );

  const handleFinishWorkout = useCallback(() => {
    if (!activeWorkout) return;

    Alert.alert(
      t('workout.finishTitle', 'Finish Workout'),
      t('workout.finishMessage', 'Are you done with this workout?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('workout.finish', 'Finish'),
          onPress: async () => {
            const completedSets = activeWorkout.exercises.reduce(
              (n, ex) => n + ex.sets.filter((s) => s.completed).length, 0,
            );
            const totalSets = activeWorkout.exercises.reduce(
              (n, ex) => n + ex.sets.length, 0,
            );
            const durationSeconds = Math.floor(
              (Date.now() - new Date(activeWorkout.startTime).getTime()) / 1000,
            );
            const topEx = activeWorkout.exercises[0]
              ? getExerciseById(activeWorkout.exercises[0].exerciseId)?.name
              : undefined;

            finishWorkout();
            router.replace('/(tabs)/track/workout/summary' as any);

            // Fire-and-forget summary (speaks while navigating away)
            coach.requestSummary({
              workoutName: activeWorkout.name,
              completedSets,
              totalSets,
              durationSeconds,
              topExercise: topEx,
            }).catch(() => {});
          },
        },
      ],
    );
  }, [activeWorkout, finishWorkout, coach, t]);

  const handleRequestCoachTip = useCallback(() => {
    if (!activeWorkout || coach.isLoadingTip) return;
    const firstEx = activeWorkout.exercises[0];
    if (!firstEx) return;
    const exerciseData = getExerciseById(firstEx.exerciseId);
    const completed = firstEx.sets.filter((s) => s.completed).length;
    const lastCompletedSet = firstEx.sets.filter((s) => s.completed).slice(-1)[0];
    const duration = Math.floor(
      (Date.now() - new Date(activeWorkout.startTime).getTime()) / 1000,
    );
    setCoachTipVisible(true);
    coach.requestCoachTip({
      exerciseName: exerciseData?.name ?? firstEx.exerciseId,
      setsCompleted: completed,
      totalSets: firstEx.sets.length,
      weight: lastCompletedSet?.weight ?? 0,
      reps: lastCompletedSet?.reps ?? 0,
      workoutDurationSeconds: duration,
    }).catch(() => {});
  }, [activeWorkout, coach]);

  const handleCancelWorkout = useCallback(() => {
    Alert.alert(
      t('workout.cancelTitle', 'Cancel Workout'),
      t('workout.cancelMessage', 'Discard this workout? All progress will be lost.'),
      [
        { text: t('common.keepGoing', 'Keep Going'), style: 'cancel' },
        {
          text: t('workout.discard', 'Discard'),
          style: 'destructive',
          onPress: () => {
            cancelWorkout();
            router.replace('/(tabs)/track');
          },
        },
      ],
    );
  }, [cancelWorkout, t]);

  const handleAddSet = useCallback(
    (exerciseId: string) => {
      addSet(exerciseId);
    },
    [addSet],
  );

  const handleUpdateSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
      updateSet(exerciseId, setId, updates);

      if (updates.completed === true) {
        const ex = activeWorkout?.exercises.find(
          (e) => e.id === exerciseId || e.exerciseId === exerciseId,
        );
        const exerciseData = ex ? getExerciseById(ex.exerciseId) : null;
        const completedSetIndex = ex
          ? ex.sets.filter((s) => s.completed).length
          : 0;

        // Voice coach feedback
        if (coach.isEnabled) {
          coach.speakSetComplete({
            exerciseName: exerciseData?.name ?? exerciseId,
            setIndex: completedSetIndex,
            weight: updates.weight ?? 0,
            reps: updates.reps ?? 0,
          });
        }

        // Start rest timer using the set's restSeconds (default 60s)
        const completedSet = ex?.sets.find((s) => s.id === setId);
        const restSecs = completedSet?.restSeconds ?? 60;
        restTimer.start(restSecs);
        setRestTimerVisible(true);
      }
    },
    [updateSet, activeWorkout, coach, restTimer],
  );

  const handleRemoveSet = useCallback(
    (exerciseId: string, setId: string) => {
      removeSet(exerciseId, setId);
    },
    [removeSet],
  );

  const handleRemoveExercise = useCallback(
    (index: number) => {
      removeExercise(index);
    },
    [removeExercise],
  );

  if (!activeWorkout) {
    return null;
  }

  const completedSets = activeWorkout.exercises.reduce(
    (total, ex) => total + ex.sets.filter((s) => s.completed).length,
    0,
  );
  const totalSets = activeWorkout.exercises.reduce(
    (total, ex) => total + ex.sets.length,
    0,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {isEditingName ? (
              <TextInput
                ref={nameInputRef}
                style={styles.workoutNameInput}
                value={workoutName}
                onChangeText={setWorkoutName}
                onBlur={handleNameBlur}
                returnKeyType="done"
                onSubmitEditing={handleNameBlur}
                accessibilityLabel="Workout name"
              />
            ) : (
              <Pressable onPress={handleNamePress} accessibilityLabel="Edit workout name">
                <Text style={styles.workoutName} numberOfLines={1}>
                  {workoutName}
                </Text>
              </Pressable>
            )}
            <View style={styles.headerMetaRow}>
              <View style={styles.timerContainer}>
                <View style={styles.timerDot} />
                <Text style={styles.timerText}>{elapsedTime}</Text>
              </View>
              {totalSets > 0 && (
                <Text style={styles.progressText}>
                  {completedSets}/{totalSets} sets
                </Text>
              )}
            </View>
          </View>

          {/* Voice Coach controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* On-demand coach tip button */}
            <Pressable
              style={[
                styles.finishButton,
                {
                  backgroundColor: coach.isLoadingTip
                    ? theme.colors.border
                    : `${theme.colors.primary}22`,
                  paddingHorizontal: 10,
                },
              ]}
              onPress={handleRequestCoachTip}
              accessibilityLabel="Get coaching tip"
              disabled={coach.isLoadingTip}
            >
              <Text style={{ fontSize: 18 }}>
                {coach.isLoadingTip ? '⏳' : '🎙️'}
              </Text>
            </Pressable>

            {/* Coach toggle */}
            <Pressable
              style={[
                styles.finishButton,
                {
                  backgroundColor: coach.isEnabled
                    ? `${theme.colors.success}22`
                    : theme.colors.surface,
                  paddingHorizontal: 10,
                },
              ]}
              onPress={coach.toggleEnabled}
              accessibilityLabel={coach.isEnabled ? 'Disable voice coach' : 'Enable voice coach'}
            >
              <Text style={{ fontSize: 18 }}>
                {coach.isEnabled ? '🔊' : '🔇'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.finishButton}
              onPress={handleFinishWorkout}
              accessibilityLabel="Finish workout"
            >
              <Text style={styles.finishButtonText}>
                {t('workout.finish', 'Finish')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Coach tip bubble */}
        {coachTipVisible && coach.lastTip && (
          <Pressable
            onPress={() => setCoachTipVisible(false)}
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              backgroundColor: `${theme.colors.primary}18`,
              borderRadius: 12,
              padding: 12,
              borderLeftWidth: 3,
              borderLeftColor: theme.colors.primary,
            }}
          >
            <Text style={{ ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700', marginBottom: 2 }}>
              🎙️ COACH TIP
            </Text>
            <Text style={{ ...theme.typography.small, color: theme.colors.text }}>
              {coach.lastTip}
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 }}>
              tap to dismiss
            </Text>
          </Pressable>
        )}

        {/* Progress bar */}
        {totalSets > 0 && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round((completedSets / totalSets) * 100)}%` as `${number}%`,
                },
              ]}
            />
          </View>
        )}

        {/* Exercise list */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeWorkout.exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {t('workout.noExercises', 'No exercises yet')}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {t('workout.addExercisePrompt', 'Tap "Add Exercise" to get started')}
              </Text>
            </View>
          ) : (
            activeWorkout.exercises.map((ex, idx) => (
              <ExerciseCard
                key={ex.id}
                workoutExercise={ex}
                exerciseIndex={idx}
                styles={styles}
                theme={theme}
                onAddSet={handleAddSet}
                onUpdateSet={handleUpdateSet}
                onRemoveSet={handleRemoveSet}
                onRemoveExercise={handleRemoveExercise}
              />
            ))
          )}

          {/* Add Exercise button */}
          <Pressable
            style={({ pressed }) => [
              styles.addExerciseButton,
              pressed && styles.addExerciseButtonPressed,
            ]}
            onPress={() => setPickerVisible(true)}
            accessibilityLabel="Add exercise"
          >
            <Text style={styles.addExerciseButtonText}>
              + {t('workout.addExercise', 'Add Exercise')}
            </Text>
          </Pressable>

          {/* Cancel Workout */}
          <Pressable
            style={styles.cancelButton}
            onPress={handleCancelWorkout}
            accessibilityLabel="Cancel workout"
          >
            <Text style={styles.cancelButtonText}>
              {t('workout.cancelWorkout', 'Cancel Workout')}
            </Text>
          </Pressable>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise picker modal */}
      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
        styles={styles}
        theme={theme}
      />

      {/* Rest Timer modal */}
      <RestTimerModal
        visible={restTimerVisible}
        timer={restTimer}
        theme={theme}
        onSkip={() => {
          restTimer.skip();
          setRestTimerVisible(false);
        }}
        onAddTime={(s) => restTimer.addTime(s)}
        onClose={() => setRestTimerVisible(false)}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const { colors, spacing, typography } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoid: {
      flex: 1,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.screenPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flex: 1,
      marginRight: spacing.md,
    },
    workoutName: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold as '700',
      color: colors.text,
      marginBottom: 2,
    },
    workoutNameInput: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold as '700',
      color: colors.text,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary,
      paddingVertical: 2,
      marginBottom: 2,
    },
    headerMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    timerDot: {
      width: 7,
      height: 7,
      borderRadius: spacing.borderRadius.full,
      backgroundColor: colors.success,
    },
    timerText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold as '600',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    progressText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    finishButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.lg,
    },
    finishButtonText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold as '700',
      color: colors.background,
    },

    // Progress bar
    progressBarContainer: {
      height: 3,
      backgroundColor: colors.border,
    },
    progressBarFill: {
      height: 3,
      backgroundColor: colors.primary,
    },

    // Scroll
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.screenPadding,
    },

    // Empty state
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyStateTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.semibold as '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    emptyStateSubtitle: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Exercise card
    exerciseCard: {
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    exerciseCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    exerciseCardTitleGroup: {
      flex: 1,
      marginRight: spacing.md,
    },
    exerciseCardName: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold as '700',
      color: colors.text,
    },
    exerciseCardMuscle: {
      fontSize: typography.sizes.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    removeExerciseButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    removeExerciseText: {
      fontSize: typography.sizes.sm,
      color: colors.error,
    },

    // Set column headers
    setColumnHeaders: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    setColumnHeaderText: {
      fontSize: typography.sizes.xs,
      color: colors.textTertiary,
      textAlign: 'center',
      fontWeight: typography.weights.semibold as '600',
    },

    // Set row
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderRadius: spacing.borderRadius.sm,
      marginBottom: spacing.xs,
    },
    setNumberContainer: {
      width: 30,
      alignItems: 'center',
    },
    setNumber: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold as '700',
      color: colors.textSecondary,
    },
    setInputGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    setInput: {
      width: 52,
      height: 36,
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: 'center',
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold as '600',
      color: colors.text,
      paddingHorizontal: spacing.xs,
    },
    setInputCompleted: {
      borderColor: colors.primary,
      backgroundColor: theme.isDark ? 'rgba(0,212,170,0.08)' : 'rgba(0,184,148,0.07)',
    },
    setInputLabel: {
      fontSize: 10,
      color: colors.textTertiary,
      width: 26,
    },
    setCompleteButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: spacing.borderRadius.full,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    setCompleteButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    setCompleteIcon: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    setCompleteIconActive: {
      color: colors.background,
      fontWeight: '700',
    },
    setDeleteButton: {
      width: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    setDeleteIcon: {
      fontSize: 12,
      color: colors.textTertiary,
    },

    // Add set button
    addSetButton: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
      borderRadius: spacing.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    addSetButtonText: {
      fontSize: typography.sizes.sm,
      color: colors.primary,
      fontWeight: typography.weights.semibold as '600',
    },

    // Add Exercise
    addExerciseButton: {
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    addExerciseButtonPressed: {
      opacity: 0.8,
    },
    addExerciseButtonText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold as '700',
      color: colors.primary,
    },

    // Cancel Workout
    cancelButton: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    cancelButtonText: {
      fontSize: typography.sizes.sm,
      color: colors.error,
      fontWeight: typography.weights.semibold as '600',
    },

    bottomSpacer: {
      height: spacing.xxl,
    },

    // Modal
    modalSafeArea: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.screenPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold as '700',
      color: colors.text,
    },
    modalCloseButton: {
      width: 34,
      height: 34,
      borderRadius: spacing.borderRadius.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    searchContainer: {
      padding: spacing.screenPadding,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      height: 42,
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    pickerListContent: {
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
    },
    pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    pickerItemPressed: {
      opacity: 0.7,
    },
    pickerItemContent: {
      flex: 1,
    },
    pickerItemName: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold as '600',
      color: colors.text,
    },
    pickerItemMeta: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    pickerItemChevron: {
      fontSize: 20,
      color: colors.textTertiary,
      marginLeft: spacing.sm,
    },
    pickerSeparator: {
      height: 1,
      backgroundColor: colors.border,
    },
  });
}
