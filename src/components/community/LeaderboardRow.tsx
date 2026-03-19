import React from 'react';
import { View, Text, Image, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../theme';
import type { LeaderboardEntry } from '../../types/community';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

const rankMedals: Record<number, string> = {
  1: '\u{1F947}',
  2: '\u{1F948}',
  3: '\u{1F949}',
};

export default function LeaderboardRow({
  entry,
  isCurrentUser = false,
}: LeaderboardRowProps) {
  const { theme } = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.cardPadding,
    backgroundColor: isCurrentUser
      ? theme.isDark
        ? 'rgba(0,212,170,0.1)'
        : 'rgba(0,184,148,0.1)'
      : 'transparent',
    borderRadius: isCurrentUser ? theme.spacing.borderRadius.md : 0,
    borderBottomWidth: isCurrentUser ? 0 : 1,
    borderBottomColor: theme.colors.border,
  };

  const rankContainerStyle: ViewStyle = {
    width: 36,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  };

  const rankTextStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color:
      entry.rank <= 3
        ? theme.colors.primary
        : theme.colors.textSecondary,
  };

  const medalStyle: TextStyle = {
    fontSize: 20,
  };

  const avatarStyle: ImageStyle = {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceLight,
    marginRight: theme.spacing.md,
  };

  const avatarPlaceholderStyle: ViewStyle = {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isCurrentUser
      ? theme.colors.primary
      : theme.colors.secondary,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const avatarInitialStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: '#FFFFFF',
  };

  const nameStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: isCurrentUser ? theme.colors.primary : theme.colors.text,
    flex: 1,
  };

  const scoreContainerStyle: ViewStyle = {
    alignItems: 'flex-end',
  };

  const scoreStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  };

  const labelStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  };

  const currentUserIndicatorStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  };

  const initial = entry.userName?.charAt(0)?.toUpperCase() ?? '?';
  const medal = rankMedals[entry.rank];

  return (
    <View style={containerStyle}>
      {/* Rank */}
      <View style={rankContainerStyle}>
        {medal ? (
          <Text style={medalStyle}>{medal}</Text>
        ) : (
          <Text style={rankTextStyle}>{entry.rank}</Text>
        )}
      </View>

      {/* Avatar */}
      {entry.userAvatar ? (
        <Image source={{ uri: entry.userAvatar }} style={avatarStyle} />
      ) : (
        <View style={avatarPlaceholderStyle}>
          <Text style={avatarInitialStyle}>{initial}</Text>
        </View>
      )}

      {/* Name */}
      <View style={{ flex: 1 }}>
        <Text style={nameStyle} numberOfLines={1}>
          {entry.userName}
        </Text>
        {isCurrentUser && (
          <Text style={currentUserIndicatorStyle}>You</Text>
        )}
      </View>

      {/* Score */}
      <View style={scoreContainerStyle}>
        <Text style={scoreStyle}>{entry.score.toLocaleString()}</Text>
        <Text style={labelStyle}>{entry.label}</Text>
      </View>
    </View>
  );
}
