import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';

interface RestTimerProps {
  defaultSeconds?: number;
  onComplete?: () => void;
}

export default function RestTimer({
  defaultSeconds = 90,
  onComplete,
}: RestTimerProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, seconds > 0]);

  const handleStart = useCallback(() => {
    if (seconds === 0) {
      setSeconds(totalSeconds);
    }
    setIsRunning(true);
  }, [seconds, totalSeconds]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setSeconds(totalSeconds);
  }, [totalSeconds]);

  const progress = totalSeconds > 0 ? seconds / totalSeconds : 0;
  const size = 140;
  const center = size / 2;
  const radius = center - 8;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${circumference * progress} ${circumference * (1 - progress)}`;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    padding: theme.spacing.lg,
  };

  const timerContainerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  };

  const timeTextStyle: TextStyle = {
    ...theme.typography.numberLarge,
    color: seconds <= 10 && seconds > 0 ? theme.colors.error : theme.colors.text,
    position: 'absolute',
  };

  const buttonRowStyle: ViewStyle = {
    flexDirection: 'row',
    gap: theme.spacing.md,
  };

  const buttonStyle = (bgColor: string): ViewStyle => ({
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    backgroundColor: bgColor,
  });

  const buttonTextStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: theme.colors.background,
  };

  const adjustRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  };

  const adjustButtonStyle: ViewStyle = {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const adjustTextStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  };

  const adjustLabelStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  };

  return (
    <View style={containerStyle}>
      {/* Circular countdown */}
      <View style={timerContainerStyle}>
        <Svg width={size} height={size}>
          {/* Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.colors.surfaceLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={seconds <= 10 && seconds > 0 ? theme.colors.error : theme.colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={dashArray}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        </Svg>
        <Text style={timeTextStyle}>{timeDisplay}</Text>
      </View>

      {/* Control buttons */}
      <View style={buttonRowStyle}>
        {!isRunning ? (
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              buttonStyle(theme.colors.primary),
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={buttonTextStyle}>
              {seconds === 0 ? 'Restart' : 'Start'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleStop}
            style={({ pressed }) => [
              buttonStyle(theme.colors.warning),
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={buttonTextStyle}>Stop</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            buttonStyle(theme.colors.surfaceLight),
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[buttonTextStyle, { color: theme.colors.text }]}>
            Reset
          </Text>
        </Pressable>
      </View>

      {/* Adjust time */}
      <View style={adjustRowStyle}>
        <Pressable
          style={adjustButtonStyle}
          onPress={() => {
            const newTotal = Math.max(15, totalSeconds - 15);
            setTotalSeconds(newTotal);
            if (!isRunning) setSeconds(newTotal);
          }}
        >
          <Text style={adjustTextStyle}>-</Text>
        </Pressable>
        <Text style={adjustLabelStyle}>{totalSeconds}s</Text>
        <Pressable
          style={adjustButtonStyle}
          onPress={() => {
            const newTotal = totalSeconds + 15;
            setTotalSeconds(newTotal);
            if (!isRunning) setSeconds(newTotal);
          }}
        >
          <Text style={adjustTextStyle}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
