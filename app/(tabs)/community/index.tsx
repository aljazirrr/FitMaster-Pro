import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { useCommunityStore } from '../../../src/stores/useCommunityStore';
import type { Post, Challenge, LeaderboardEntry } from '../../../src/types/community';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

function formatTimeAgo(isoString: string, _t: unknown): string {
  const now = Date.now();
  const diff = now - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Mock leaderboard fallback ────────────────────────────────────────────────

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'mock1', userName: 'Alex Power', score: 52000, label: 'kg volume' },
  { rank: 2, userId: 'mock2', userName: 'Maria Fit', score: 47500, label: 'kg volume' },
  { rank: 3, userId: 'mock3', userName: 'Dan Strong', score: 41200, label: 'kg volume' },
  { rank: 4, userId: 'mock4', userName: 'Elena Run', score: 36800, label: 'kg volume' },
  { rank: 5, userId: 'mock5', userName: 'Mihai Lift', score: 31100, label: 'kg volume' },
];

// ─── Medal / Rank Badge ───────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const { theme } = useTheme();
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  if (medals[rank]) {
    return <Text style={{ fontSize: 24 }}>{medals[rank]}</Text>;
  }
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: theme.colors.textSecondary,
        }}
      >
        {rank}
      </Text>
    </View>
  );
}

// ─── Avatar Circle ────────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { theme } = useTheme();
  // Deterministic color from name
  const colors = [
    theme.colors.primary,
    theme.colors.protein,
    theme.colors.carbs,
    theme.colors.fat,
    theme.colors.water,
    theme.colors.success,
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bg = colors[colorIndex];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg + 'CC',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.38,
          fontWeight: '700',
          color: '#FFFFFF',
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

// ─── New Post Modal ───────────────────────────────────────────────────────────

interface NewPostModalProps {
  visible: boolean;
  onClose: () => void;
}

function NewPostModal({ visible, onClose }: NewPostModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useModalStyles(theme);
  const { addPost } = useCommunityStore();

  const [content, setContent] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      Alert.alert(t('community.emptyPost'), t('community.emptyPostMsg'));
      return;
    }
    addPost({
      userId: 'current-user',
      userName: t('community.you'),
      content: trimmed,
    });
    setContent('');
    onClose();
  }, [content, addPost, onClose, t]);

  const handleClose = useCallback(() => {
    setContent('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('community.newPost')}</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.postButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.postButtonText}>{t('community.post')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputArea}>
          <Avatar name={t('community.you')} size={44} />
          <TextInput
            style={[styles.textInput, { color: theme.colors.text }]}
            placeholder={t('community.whatsOnYourMind')}
            placeholderTextColor={theme.colors.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
            autoFocus
          />
        </View>
        <Text style={styles.charCount}>{content.length}/500</Text>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function useModalStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.screenPadding,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    cancelButton: {
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    cancelText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
    },
    title: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.text,
    },
    postButton: {
      paddingVertical: 8,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.spacing.borderRadius.full,
    },
    postButtonText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    inputArea: {
      flexDirection: 'row',
      padding: theme.spacing.screenPadding,
      gap: theme.spacing.md,
      flex: 1,
    },
    textInput: {
      flex: 1,
      fontSize: theme.typography.sizes.md,
      lineHeight: 22,
      textAlignVertical: 'top',
    },
    charCount: {
      textAlign: 'right',
      paddingHorizontal: theme.spacing.screenPadding,
      paddingBottom: theme.spacing.md,
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textTertiary,
    },
  });
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────

interface FeedTabProps {
  styles: ReturnType<typeof useMainStyles>;
}

function FeedTab({ styles }: FeedTabProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { posts, likePost } = useCommunityStore();
  const [refreshing, setRefreshing] = useState(false);
  const [newPostVisible, setNewPostVisible] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <View style={styles.postCard}>
        {/* Post header */}
        <View style={styles.postHeader}>
          <Avatar name={item.userName} size={40} />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postUserName}>{item.userName}</Text>
            <Text style={styles.postTimestamp}>{formatTimeAgo(item.createdAt, null)}</Text>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.postContent}>{item.content}</Text>

        {/* Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.postActionButton}
            onPress={() => likePost(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.postActionIcon}>❤️</Text>
            <Text style={styles.postActionCount}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postActionButton} activeOpacity={0.7}>
            <Text style={styles.postActionIcon}>💬</Text>
            <Text style={styles.postActionCount}>{item.comments.length}</Text>
          </TouchableOpacity>
        </View>

        {/* Comment preview (first comment only) */}
        {item.comments.length > 0 && (
          <View style={styles.commentPreview}>
            <Text style={styles.commentPreviewUser}>{item.comments[0].userName}</Text>
            <Text style={styles.commentPreviewContent} numberOfLines={1}>
              {item.comments[0].content}
            </Text>
            {item.comments.length > 1 && (
              <Text style={styles.commentMore}>
                {t('community.moreComments', { count: item.comments.length - 1 })}
              </Text>
            )}
          </View>
        )}
      </View>
    ),
    [likePost, styles, t],
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📣</Text>
            <Text style={styles.emptyTitle}>{t('community.noPosts')}</Text>
            <Text style={styles.emptySubtitle}>{t('community.beFirst')}</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setNewPostVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>✏️</Text>
      </TouchableOpacity>

      <NewPostModal visible={newPostVisible} onClose={() => setNewPostVisible(false)} />
    </View>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────

interface LeaderboardTabProps {
  styles: ReturnType<typeof useMainStyles>;
}

function LeaderboardTab({ styles }: LeaderboardTabProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { leaderboard } = useCommunityStore();

  const entries = leaderboard.length > 0 ? leaderboard : MOCK_LEADERBOARD;
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.rank - b.rank),
    [entries],
  );

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.userId}
      contentContainerStyle={styles.leaderboardList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Text style={styles.leaderboardTitle}>{t('community.weeklyLeaderboard')}</Text>
      }
      renderItem={({ item, index }) => {
        const isTop3 = item.rank <= 3;
        return (
          <View
            style={[
              styles.leaderboardRow,
              isTop3 && { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' },
            ]}
          >
            <RankBadge rank={item.rank} />
            <Avatar name={item.userName} size={36} />
            <Text style={[styles.leaderboardName, isTop3 && { fontWeight: '800' }]}>
              {item.userName}
            </Text>
            <View style={styles.leaderboardScoreContainer}>
              <Text style={[styles.leaderboardScore, { color: isTop3 ? theme.colors.primary : theme.colors.text }]}>
                {item.score.toLocaleString()}
              </Text>
              <Text style={styles.leaderboardLabel}>{item.label}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

// ─── Challenges Tab ───────────────────────────────────────────────────────────

interface ChallengesTabProps {
  styles: ReturnType<typeof useMainStyles>;
}

function ChallengesTab({ styles }: ChallengesTabProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { challenges, joinChallenge } = useCommunityStore();
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const isRo = i18n.language?.startsWith('ro');

  const handleJoin = useCallback(
    (challengeId: string) => {
      if (joinedIds.has(challengeId)) return;
      joinChallenge(challengeId);
      setJoinedIds((prev) => new Set(prev).add(challengeId));
      Alert.alert(t('community.joined'), t('community.joinedMsg'));
    },
    [joinedIds, joinChallenge, t],
  );

  const renderChallenge = useCallback(
    ({ item }: { item: Challenge }) => {
      const name = isRo ? item.nameRo : item.name;
      const description = isRo ? item.descriptionRo : item.description;
      const joined = joinedIds.has(item.id);

      return (
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeTitleRow}>
              <Text style={styles.challengeName}>{name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.typeBadgeText, { color: theme.colors.primary }]}>
                  {item.type}
                </Text>
              </View>
            </View>
            <Text style={styles.challengeDescription}>{description}</Text>
          </View>

          <View style={styles.challengeStats}>
            <View style={styles.challengeStat}>
              <Text style={styles.challengeStatValue}>{item.duration}</Text>
              <Text style={styles.challengeStatLabel}>{t('community.days')}</Text>
            </View>
            <View style={styles.challengeStatDivider} />
            <View style={styles.challengeStat}>
              <Text style={styles.challengeStatValue}>{item.participants}</Text>
              <Text style={styles.challengeStatLabel}>{t('community.participants')}</Text>
            </View>
            <View style={styles.challengeStatDivider} />
            <View style={styles.challengeStat}>
              <Text style={styles.challengeStatValue}>{item.target}</Text>
              <Text style={styles.challengeStatLabel}>{t('community.target')}</Text>
            </View>
          </View>

          <View style={styles.challengeDateRow}>
            <Text style={styles.challengeDateText}>
              {formatDate(item.startDate)} → {formatDate(item.endDate)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.joinButton,
              {
                backgroundColor: joined ? theme.colors.success + '20' : theme.colors.primary,
                borderColor: joined ? theme.colors.success : theme.colors.primary,
              },
            ]}
            onPress={() => handleJoin(item.id)}
            disabled={joined}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.joinButtonText,
                { color: joined ? theme.colors.success : '#FFFFFF' },
              ]}
            >
              {joined ? `✓ ${t('community.joined')}` : t('community.joinChallenge')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [isRo, joinedIds, handleJoin, styles, theme, t],
  );

  return (
    <FlatList
      data={challenges}
      keyExtractor={(item) => item.id}
      renderItem={renderChallenge}
      contentContainerStyle={styles.challengeList}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyTitle}>{t('community.noChallenges')}</Text>
          <Text style={styles.emptySubtitle}>{t('community.checkBackSoon')}</Text>
        </View>
      }
    />
  );
}

// ─── Main Community Screen ────────────────────────────────────────────────────

const TABS = ['Feed', 'Leaderboard', 'Challenges'] as const;
type TabName = (typeof TABS)[number];

export default function CommunityScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMainStyles(theme);

  const [activeTab, setActiveTab] = useState<number>(0);

  const tabLabels: TabName[] = useMemo(
    () => [
      t('community.feed') as TabName,
      t('community.leaderboard') as TabName,
      t('community.challenges') as TabName,
    ],
    [t],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{t('community.title')}</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabBar}>
        {tabLabels.map((label, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tabButton, activeTab === index && styles.tabButtonActive]}
            onPress={() => setActiveTab(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === index && styles.tabButtonTextActive,
              ]}
            >
              {label}
            </Text>
            {activeTab === index && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 0 && <FeedTab styles={styles} />}
        {activeTab === 1 && <LeaderboardTab styles={styles} />}
        {activeTab === 2 && <ChallengesTab styles={styles} />}
      </View>
    </SafeAreaView>
  );
}

function useMainStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screenHeader: {
      paddingHorizontal: theme.spacing.screenPadding,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    screenTitle: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: '800',
      color: theme.colors.text,
    },

    // ─── Tab Bar ────────────────────────────────────
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.screenPadding,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    tabButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      position: 'relative',
    },
    tabButtonActive: {},
    tabButtonText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    tabButtonTextActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: '15%',
      right: '15%',
      height: 2,
      backgroundColor: theme.colors.primary,
      borderRadius: 1,
    },
    tabContent: {
      flex: 1,
    },

    // ─── Feed ────────────────────────────────────────
    feedList: {
      paddingHorizontal: theme.spacing.screenPadding,
      paddingTop: theme.spacing.lg,
      paddingBottom: 100,
    },
    postCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      padding: theme.spacing.cardPadding,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    postHeaderInfo: {
      flex: 1,
    },
    postUserName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.text,
    },
    postTimestamp: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    postContent: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      lineHeight: 22,
      marginBottom: theme.spacing.md,
    },
    postActions: {
      flexDirection: 'row',
      gap: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    postActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    postActionIcon: {
      fontSize: 16,
    },
    postActionCount: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    commentPreview: {
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.borderRadius.sm,
      padding: theme.spacing.sm,
    },
    commentPreviewUser: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    commentPreviewContent: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    commentMore: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.primary,
      marginTop: 4,
    },

    // ─── Leaderboard ─────────────────────────────────
    leaderboardList: {
      paddingHorizontal: theme.spacing.screenPadding,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    leaderboardTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    leaderboardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    leaderboardName: {
      flex: 1,
      fontSize: theme.typography.sizes.md,
      fontWeight: '600',
      color: theme.colors.text,
    },
    leaderboardScoreContainer: {
      alignItems: 'flex-end',
    },
    leaderboardScore: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '800',
    },
    leaderboardLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textTertiary,
      marginTop: 1,
    },

    // ─── Challenges ───────────────────────────────────
    challengeList: {
      paddingHorizontal: theme.spacing.screenPadding,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    challengeCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      padding: theme.spacing.cardPadding,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    challengeHeader: {
      marginBottom: theme.spacing.md,
    },
    challengeTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    challengeName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    typeBadge: {
      borderRadius: theme.spacing.borderRadius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 3,
    },
    typeBadgeText: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    challengeDescription: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    challengeStats: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.borderRadius.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    challengeStat: {
      flex: 1,
      alignItems: 'center',
    },
    challengeStatValue: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: '800',
      color: theme.colors.text,
    },
    challengeStatLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    challengeStatDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 4,
    },
    challengeDateRow: {
      marginBottom: theme.spacing.md,
    },
    challengeDateText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textTertiary,
    },
    joinButton: {
      borderRadius: theme.spacing.borderRadius.lg,
      paddingVertical: theme.spacing.sm + 4,
      alignItems: 'center',
      borderWidth: 1.5,
    },
    joinButtonText: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
    },

    // ─── Shared ────────────────────────────────────────
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
    },
    emptyEmoji: {
      fontSize: 56,
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: theme.spacing.xl,
      right: theme.spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    fabText: {
      fontSize: 22,
    },
  });
}
