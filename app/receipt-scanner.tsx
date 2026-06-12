import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { googleVisionService } from '@/services/googleVision';
import { useCarbon } from '@/hooks/useCarbon';
import { formatCarbonKg } from '@/utils/carbon';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import type { ParsedReceipt } from '@/services/googleVision';

type ScanState = 'camera' | 'processing' | 'results' | 'saving';

export default function ReceiptScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const { log } = useCarbon();

  async function capturePhoto() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        await processImage(photo.uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo');
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  }

  async function processImage(uri: string) {
    setScanState('processing');
    setCapturedImage(uri);

    try {
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!compressed.base64) throw new Error('Failed to encode image');

      const rawText = await googleVisionService.extractTextFromImage(compressed.base64);
      const receipt = await googleVisionService.parseReceiptText(rawText);

      setParsedReceipt(receipt);
      setScanState('results');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process receipt';
      Alert.alert('Scan Failed', message, [
        { text: 'Try Again', onPress: () => { setScanState('camera'); setCapturedImage(null); } },
      ]);
    }
  }

  async function saveReceipt() {
    if (!parsedReceipt) return;
    setScanState('saving');

    try {
      const totalCarbon = parsedReceipt.items.reduce((sum, item) => sum + item.estimatedCarbonKg, 0);
      const description = `Receipt: ${parsedReceipt.merchant ?? 'Store'} · ${parsedReceipt.items.length} items`;

      await log('purchases', 'Receipt Scan', description, totalCarbon, {
        merchant: parsedReceipt.merchant,
        items_count: parsedReceipt.items.length,
        total_spend: parsedReceipt.total,
        items: parsedReceipt.items.map(i => ({ name: i.name, category: i.category })),
      });

      Alert.alert(
        'Saved!',
        `Added ${formatCarbonKg(totalCarbon)} CO₂e from your receipt.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      Alert.alert('Error', message);
      setScanState('results');
    }
  }

  if (!permission) return <LoadingSpinner fullScreen />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionView}>
          <MaterialCommunityIcons name="camera-off" size={64} color={Colors.text.dim} />
          <Text variant="title" style={styles.permissionTitle}>
            Camera Access Required
          </Text>
          <Text variant="body" color="muted" style={styles.permissionDesc}>
            EcoPulse needs camera access to scan receipts and calculate carbon footprints.
          </Text>
          <Button onPress={requestPermission} size="lg">
            Grant Camera Access
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            Cancel
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text variant="title" style={styles.headerTitle}>
          Scan Receipt
        </Text>
        <TouchableOpacity onPress={pickFromGallery} style={styles.galleryButton}>
          <MaterialCommunityIcons name="image-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {scanState === 'camera' && (
        <View style={styles.cameraWrapper}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame} />
              <Text variant="caption" style={styles.scanHint}>
                Point at a receipt
              </Text>
            </View>
          </CameraView>
          <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      )}

      {scanState === 'processing' && (
        <LoadingSpinner fullScreen label="Scanning receipt with AI..." />
      )}

      {scanState === 'saving' && (
        <LoadingSpinner fullScreen label="Saving carbon data..." />
      )}

      {scanState === 'results' && parsedReceipt && (
        <ScrollView contentContainerStyle={styles.results} showsVerticalScrollIndicator={false}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.preview} resizeMode="cover" />
          )}

          <View style={styles.receiptInfo}>
            {parsedReceipt.merchant && (
              <Text variant="title">{parsedReceipt.merchant}</Text>
            )}
            {parsedReceipt.date && (
              <Text variant="caption" color="muted">
                {parsedReceipt.date}
              </Text>
            )}
          </View>

          <Card variant="glow">
            <Text variant="label" color="muted" style={styles.sectionLabel}>
              Total Carbon Impact
            </Text>
            <Text style={styles.totalCarbon}>
              {formatCarbonKg(
                parsedReceipt.items.reduce((sum, item) => sum + item.estimatedCarbonKg, 0)
              )}{' '}
              CO₂e
            </Text>
          </Card>

          <View style={styles.itemsSection}>
            <Text variant="title">Items</Text>
            {parsedReceipt.items.length === 0 ? (
              <Text variant="body" color="muted">
                No items were extracted. The receipt may be unclear.
              </Text>
            ) : (
              parsedReceipt.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text variant="body" weight="medium">
                      {item.name}
                    </Text>
                    <Text variant="caption" color="muted" style={styles.itemCategory}>
                      {item.category} · ${item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.itemCarbon}>
                    {formatCarbonKg(item.estimatedCarbonKg)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.actionButtons}>
            <Button
              variant="outline"
              onPress={() => { setScanState('camera'); setCapturedImage(null); setParsedReceipt(null); }}
              style={styles.retryButton}
            >
              Scan Again
            </Button>
            <Button onPress={saveReceipt} style={styles.saveButton} size="lg">
              Save Carbon Data
            </Button>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    color: Colors.white,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  galleryButton: {
    padding: Spacing.xs,
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginTop: 80,
  },
  scanFrame: {
    width: 280,
    height: 200,
    borderWidth: 2,
    borderColor: Colors.emerald[400],
    borderRadius: BorderRadius.xl,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: Colors.white,
    textAlign: 'center',
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
  },
  permissionView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
    gap: Spacing.base,
  },
  permissionTitle: {
    textAlign: 'center',
  },
  permissionDesc: {
    textAlign: 'center',
    maxWidth: 280,
  },
  results: {
    padding: Spacing['2xl'],
    gap: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    paddingTop: 80,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.xl,
  },
  receiptInfo: {
    gap: Spacing.xs,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  totalCarbon: {
    fontSize: FontSize['3xl'],
    fontWeight: '800',
    color: Colors.emerald[400],
  },
  itemsSection: {
    gap: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemCategory: {
    textTransform: 'capitalize',
  },
  itemCarbon: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.emerald[400],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  retryButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
