/**
 * Progress Photo Gallery Screen
 *
 * Displays all saved progress photos in a grid.
 * Each photo taps open in a full-screen viewer.
 * Header has a camera button to add a new photo (via ImagePicker).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../src/theme';
import { useProgressStore } from '../../../src/stores/useProgressStore';
import useSettingsStore from '../../../src/stores/useSettingsStore';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = 3;
const CELL_SIZE = (SCREEN_W - 32 - (COLS - 1) * 4) / COLS;

interface PhotoEntry {
  date: string;
  uri: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PhotoGalleryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = useStyles(theme);
  const { language } = useSettingsStore();
  const isRo = language === 'ro';

  const { photos, addPhoto, removePhoto } = useProgressStore();
  const [viewingPhoto, setViewingPhoto] = useState<PhotoEntry | null>(null);

  const handleAddPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        isRo ? 'Permisiune necesară' : 'Permission required',
        isRo
          ? 'Acordă acces la galerie pentru a adăuga poze.'
          : 'Please allow access to your photo library.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets.length > 0) {
      addPhoto(result.assets[0].uri);
    }
  }, [addPhoto, isRo]);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        isRo ? 'Permisiune necesară' : 'Permission required',
        isRo
          ? 'Acordă acces la cameră pentru a face poze.'
          : 'Please allow access to your camera.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets.length > 0) {
      addPhoto(result.assets[0].uri);
    }
  }, [addPhoto, isRo]);

  const handleAddPress = useCallback(() => {
    Alert.alert(
      isRo ? 'Adaugă poză' : 'Add Photo',
      '',
      [
        { text: isRo ? '📷 Fă o poză' : '📷 Take Photo', onPress: handleTakePhoto },
        { text: isRo ? '🖼 Din galerie' : '🖼 From Library', onPress: handleAddPhoto },
        { text: isRo ? 'Anulează' : 'Cancel', style: 'cancel' },
      ],
    );
  }, [isRo, handleTakePhoto, handleAddPhoto]);

  const handleDeletePhoto = useCallback(
    (photo: PhotoEntry) => {
      Alert.alert(
        isRo ? 'Șterge poza' : 'Delete Photo',
        isRo ? 'Ești sigur că vrei să ștergi această poză?' : 'Are you sure you want to delete this photo?',
        [
          {
            text: isRo ? 'Șterge' : 'Delete',
            style: 'destructive',
            onPress: () => {
              removePhoto(photo.uri);
              setViewingPhoto(null);
            },
          },
          { text: isRo ? 'Anulează' : 'Cancel', style: 'cancel' },
        ],
      );
    },
    [isRo, removePhoto],
  );

  const renderItem = ({ item, index }: { item: PhotoEntry; index: number }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => setViewingPhoto(item)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.uri }} style={styles.gridImage} resizeMode="cover" />
      <View style={styles.gridDateOverlay}>
        <Text style={styles.gridDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRo ? 'Poze Progres' : 'Progress Photos'}
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddPress}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>
            {isRo ? 'Nicio poză salvată' : 'No photos yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isRo
              ? 'Documentează-ți progresul adăugând prima poză'
              : 'Track your transformation by adding your first photo'}
          </Text>
          <TouchableOpacity
            style={[styles.emptyAddBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddPress}
          >
            <Text style={styles.emptyAddBtnText}>
              {isRo ? '+ Adaugă prima poză' : '+ Add First Photo'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item, index) => `${item.uri}-${index}`}
          renderItem={renderItem}
          numColumns={COLS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 4 }}
          ListHeaderComponent={
            <Text style={styles.photoCount}>
              {photos.length} {isRo ? (photos.length === 1 ? 'poză' : 'poze') : (photos.length === 1 ? 'photo' : 'photos')}
            </Text>
          }
        />
      )}

      {/* Full-screen photo viewer */}
      <Modal
        visible={!!viewingPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingPhoto(null)}
      >
        {viewingPhoto && (
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setViewingPhoto(null)}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalDate}>{formatDate(viewingPhoto.date)}</Text>
                <TouchableOpacity
                  onPress={() => handleDeletePhoto(viewingPhoto)}
                  style={styles.modalDeleteBtn}
                >
                  <Text style={styles.modalDeleteBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>

              {/* Full image */}
              <Image
                source={{ uri: viewingPhoto.uri }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </SafeAreaView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function useStyles(theme: any) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
    },
    backBtn: { width: 40, alignItems: 'center' },
    backBtnText: { fontSize: 28, color: theme.colors.text, lineHeight: 32 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: '600' },

    photoCount: {
      fontSize: 13, color: theme.colors.textSecondary,
      paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    },
    grid: { paddingHorizontal: 16, paddingBottom: 40 },
    gridItem: {
      width: CELL_SIZE, height: CELL_SIZE * 1.25,
      borderRadius: 10, overflow: 'hidden', marginBottom: 4,
    },
    gridImage: { width: '100%', height: '100%' },
    gridDateOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 3, paddingHorizontal: 4,
    },
    gridDate: { fontSize: 9, color: '#fff', fontWeight: '600' },

    emptyState: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: 40, gap: 12,
    },
    emptyIcon: { fontSize: 56 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    emptyAddBtn: { marginTop: 8, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 14 },
    emptyAddBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: '#000' },
    modalSafeArea: { flex: 1 },
    modalHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
    },
    modalCloseBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    modalCloseBtnText: { color: '#fff', fontSize: 20 },
    modalDate: { color: '#fff', fontSize: 15, fontWeight: '600' },
    modalDeleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    modalDeleteBtnText: { fontSize: 22 },
    fullImage: { flex: 1, width: '100%' },
  });
}
