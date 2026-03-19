import React from 'react';
import { View, Text, Image, Pressable, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { Post } from '../../types/community';

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
}

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const timeSince = (dateStr: string): string => {
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000,
    );
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.cardPadding,
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  };

  const avatarStyle: ImageStyle = {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceLight,
    marginRight: theme.spacing.md,
  };

  const avatarPlaceholderStyle: ViewStyle = {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const avatarInitialStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: '#FFFFFF',
  };

  const userNameStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  };

  const timeStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  };

  const contentStyle: TextStyle = {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  };

  const imageStyle: ImageStyle = {
    width: '100%',
    height: 200,
    borderRadius: theme.spacing.borderRadius.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLight,
  };

  const actionsStyle: ViewStyle = {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  };

  const actionButtonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  };

  const actionIconStyle: TextStyle = {
    fontSize: 18,
  };

  const actionTextStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  };

  const initial = post.userName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={containerStyle}>
      {/* Header */}
      <View style={headerStyle}>
        {post.userAvatar ? (
          <Image source={{ uri: post.userAvatar }} style={avatarStyle} />
        ) : (
          <View style={avatarPlaceholderStyle}>
            <Text style={avatarInitialStyle}>{initial}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={userNameStyle}>{post.userName}</Text>
          <Text style={timeStyle}>{timeSince(post.createdAt)}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={contentStyle}>{post.content}</Text>

      {/* Image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={imageStyle}
          resizeMode="cover"
        />
      )}

      {/* Actions */}
      <View style={actionsStyle}>
        <Pressable
          onPress={onLike}
          style={({ pressed }) => [actionButtonStyle, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={actionIconStyle}>{'\u2764'}</Text>
          <Text style={actionTextStyle}>{post.likes}</Text>
        </Pressable>

        <Pressable
          onPress={onComment}
          style={({ pressed }) => [actionButtonStyle, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={actionIconStyle}>{'\u{1F4AC}'}</Text>
          <Text style={actionTextStyle}>{post.comments.length}</Text>
        </Pressable>
      </View>
    </View>
  );
}
