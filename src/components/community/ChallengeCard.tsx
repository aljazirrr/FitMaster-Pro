import React from 'react';
import { View, Text, Image, Pressable, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import ProgressBar from '../ui/ProgressBar';
import type { Challenge } from '../../types/community';

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin: () => void;
}

export default function ChallengeCard({ challenge, onJoin }: ChallengeCardProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();

  const isRo = i18n.language === 'ro';
  const displayName = isRo && challenge.nameRo ? challenge.nameRo : challenge.name;
  const displayDescription =
    isRo && challenge.descriptionRo
      ? challenge.descriptionRo
      : challenge.description;

  // Calculate days left
  const now = new Date();
  const endDate = new Date(challenge.endDate);
  const startDate = new Date(challenge.startDate);
  const daysLeft = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const totalDays = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  const elapsed = totalDays - daysLeft;
  const progress = Math.min(elapsed / totalDays, 1);

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    overflow: 'hidden',
  };

  const imageStyle: ImageStyle = {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.surfaceLight,
  };

  const contentStyle: ViewStyle = {
    padding: theme.spacing.cardPadding,
  };

  const nameStyle: TextStyle = {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  };

  const descriptionStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  };

  const metaRowStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  };

  const metaItemStyle: ViewStyle = {
    alignItems: 'center',
  };

  const metaValueStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: theme.colors.text,
  };

  const metaLabelStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  };

  const joinButtonStyle: ViewStyle = {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  };

  const joinTextStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: theme.colors.background,
  };

  return (
    <View style={containerStyle}>
      {challenge.imageUrl && (
        <Image
          source={{ uri: challenge.imageUrl }}
          style={imageStyle}
          resizeMode="cover"
        />
      )}

      <View style={contentStyle}>
        <Text style={nameStyle}>{displayName}</Text>
        <Text style={descriptionStyle} numberOfLines={2}>
          {displayDescription}
        </Text>

        {/* Meta info */}
        <View style={metaRowStyle}>
          <View style={metaItemStyle}>
            <Text style={metaValueStyle}>{challenge.participants}</Text>
            <Text style={metaLabelStyle}>participants</Text>
          </View>
          <View style={metaItemStyle}>
            <Text style={metaValueStyle}>{daysLeft}</Text>
            <Text style={metaLabelStyle}>days left</Text>
          </View>
          <View style={metaItemStyle}>
            <Text style={metaValueStyle}>{challenge.duration}d</Text>
            <Text style={metaLabelStyle}>duration</Text>
          </View>
        </View>

        {/* Progress */}
        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          height={6}
          showLabel
          label="Progress"
        />

        {/* Join button */}
        <Pressable
          onPress={onJoin}
          style={({ pressed }) => [
            joinButtonStyle,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={joinTextStyle}>Join Challenge</Text>
        </Pressable>
      </View>
    </View>
  );
}
