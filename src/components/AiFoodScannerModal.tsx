import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS } from '../theme/colors';
import { FoodItem, MealType } from '../types/nutrition';
import {
  AiAnalysisResult,
  analyzeMealWithNvidiaText,
  analyzeMealWithNvidiaVision,
} from '../services/nvidiaAiService';

interface AiFoodScannerModalProps {
  visible: boolean;
  targetMealType: MealType;
  nvidiaApiKey: string;
  nvidiaTextModel?: string;
  nvidiaVisionModel?: string;
  onClose: () => void;
  onOpenSettings: () => void;
  onSaveFood: (food: Omit<FoodItem, 'id' | 'timestamp'>) => void;
}

const PORTION_MULTIPLIERS = [
  { label: '0.5x', value: 0.5 },
  { label: '1x Standart', value: 1 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
];

export const AiFoodScannerModal: React.FC<AiFoodScannerModalProps> = ({
  visible,
  targetMealType,
  nvidiaApiKey,
  nvidiaTextModel,
  nvidiaVisionModel,
  onClose,
  onOpenSettings,
  onSaveFood,
}) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(targetMealType);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [baseResult, setBaseResult] = useState<AiAnalysisResult | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1);

  useEffect(() => {
    setSelectedMeal(targetMealType);
  }, [targetMealType]);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Kamera İzni Gerekli',
        'Yemek fotoğrafı çekmek için kamera erişimine izin vermelisiniz.'
      );
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!res.canceled && res.assets[0]?.base64) {
      setImageUri(res.assets[0].uri);
      runVisionAnalysis(res.assets[0].base64);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Galeri İzni Gerekli',
        'Fotoğraf seçmek için galeri erişimine izin vermelisiniz.'
      );
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!res.canceled && res.assets[0]?.base64) {
      setImageUri(res.assets[0].uri);
      runVisionAnalysis(res.assets[0].base64);
    }
  };

  const runVisionAnalysis = async (base64: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setBaseResult(null);
    setMultiplier(1);
    try {
      const res = await analyzeMealWithNvidiaVision(
        base64,
        nvidiaApiKey,
        nvidiaVisionModel
      );
      setBaseResult(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Görsel analiz sırasında hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runTextAnalysis = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setBaseResult(null);
    setMultiplier(1);
    try {
      const res = await analyzeMealWithNvidiaText(
        description,
        nvidiaApiKey,
        nvidiaTextModel
      );
      setBaseResult(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Metin analizi sırasında hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!baseResult) return;

    onSaveFood({
      name:
        multiplier === 1
          ? baseResult.name
          : `${baseResult.name} (${multiplier}x)`,
      calories: Math.round(baseResult.calories * multiplier),
      protein: Math.round(baseResult.protein * multiplier),
      carbs: Math.round(baseResult.carbs * multiplier),
      fat: Math.round(baseResult.fat * multiplier),
      portion: `${multiplier}x · ${baseResult.portion}`,
      mealType: selectedMeal,
      imageUrl: imageUri || undefined,
      aiTip: baseResult.aiTip,
    });

    setDescription('');
    setImageUri(null);
    setBaseResult(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Editorial Sheet Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Besin ve Fotoğraf Tarayıcı</Text>
                <Text style={styles.subtitle}>
                  Nemotron Vision & Klinik Besin Veritabanı
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.75}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollBody}
            >
              {/* Segmented Meal Selector */}
              <Text style={styles.fieldLabel}>Öğün Grubu</Text>
              <View style={styles.segmentBar}>
                {[
                  { id: 'breakfast', label: 'Kahvaltı' },
                  { id: 'lunch', label: 'Öğle' },
                  { id: 'dinner', label: 'Akşam' },
                  { id: 'snack', label: 'Ara Öğün' },
                ].map((m) => {
                  const active = selectedMeal === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      activeOpacity={0.75}
                      onPress={() => setSelectedMeal(m.id as MealType)}
                      style={[
                        styles.segmentBtn,
                        active && styles.segmentBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          active && styles.segmentTextActive,
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Camera & Gallery Actions */}
              <Text style={styles.fieldLabel}>Görsel Tarama</Text>
              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  style={styles.photoBtnPrimary}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoBtnPrimaryText}>Fotoğraf Çek</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoBtnSecondary}
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoBtnSecondaryText}>Galeriden Seç</Text>
                </TouchableOpacity>
              </View>

              {imageUri && (
                <View style={styles.previewBox}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                </View>
              )}

              {/* Text Description Input */}
              <Text style={styles.fieldLabel}>Metin İle Besin Analizi</Text>
              <View style={styles.surfaceGroup}>
                <View style={styles.inputPadding}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Örn: 200g ızgara tavuk göğsü, 1 porsiyon bulgur pilavı ve salata"
                    placeholderTextColor={COLORS.inkMuted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>
                <View style={styles.inputActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.calcBtn,
                      (!description.trim() || isAnalyzing) && styles.calcBtnDisabled,
                    ]}
                    onPress={runTextAnalysis}
                    disabled={!description.trim() || isAnalyzing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.calcBtnText}>Besin Değerlerini Hesapla</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    style={styles.errorLinkBtn}
                  >
                    <Text style={styles.errorLinkText}>API Ayarlarını Aç</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isAnalyzing && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={COLORS.ink} />
                  <Text style={styles.loadingText}>
                    Besin kompozisyonu hesaplanıyor...
                  </Text>
                </View>
              )}

              {/* Single-Elevation Result Container (No nested cards) */}
              {baseResult && !isAnalyzing && (
                <View style={styles.resultContainer}>
                  <View style={styles.resultTop}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.resultName}>{baseResult.name}</Text>
                      <Text style={styles.resultInlineMeta}>
                        {baseResult.portion} ·{' '}
                        {Math.round(baseResult.protein * multiplier)}g P /{' '}
                        {Math.round(baseResult.carbs * multiplier)}g K /{' '}
                        {Math.round(baseResult.fat * multiplier)}g Y
                      </Text>
                    </View>
                    <View style={styles.resultCalCol}>
                      <Text style={styles.resultCalNumber}>
                        {Math.round(baseResult.calories * multiplier)}
                      </Text>
                      <Text style={styles.resultCalUnit}>kcal</Text>
                    </View>
                  </View>

                  <View style={styles.hairlineSection}>
                    <Text style={styles.subLabel}>Porsiyon Çarpanı</Text>
                    <View style={styles.segmentBar}>
                      {PORTION_MULTIPLIERS.map((p) => {
                        const active = multiplier === p.value;
                        return (
                          <TouchableOpacity
                            key={p.value}
                            onPress={() => setMultiplier(p.value)}
                            style={[
                              styles.segmentBtn,
                              active && styles.segmentBtnActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.segmentText,
                                active && styles.segmentTextActive,
                              ]}
                            >
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {baseResult.aiTip ? (
                    <View style={styles.hairlineSection}>
                      <Text style={styles.tipText}>{baseResult.aiTip}</Text>
                    </View>
                  ) : null}

                  <View style={styles.hairlineSection}>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSave}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.saveBtnText}>Öğün Kayıtlarına Ekle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: COLORS.ink,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.background,
  },
  closeBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.ink,
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 36,
  },
  fieldLabel: {
    fontFamily: FONTS.display,
    fontSize: 13,
    color: COLORS.ink,
    marginBottom: 8,
    marginTop: 6,
  },
  subLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginBottom: 8,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    padding: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surface,
  },
  segmentText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  segmentTextActive: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.ink,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  photoBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.ink,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  photoBtnPrimaryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.surface,
  },
  photoBtnSecondary: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  photoBtnSecondaryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.ink,
  },
  previewBox: {
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 170,
  },
  surfaceGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  inputPadding: {
    padding: 14,
  },
  textInput: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.ink,
    minHeight: 58,
    textAlignVertical: 'top',
  },
  inputActionRow: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  calcBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 11,
    borderRadius: 6,
    alignItems: 'center',
  },
  calcBtnDisabled: {
    opacity: 0.4,
  },
  calcBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.surface,
  },
  errorBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.danger,
    lineHeight: 18,
  },
  errorLinkBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  errorLinkText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.ink,
    textDecorationLine: 'underline',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loadingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.inkSecondary,
  },
  resultContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
  },
  resultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  resultName: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: COLORS.ink,
    marginBottom: 4,
  },
  resultInlineMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  resultCalCol: {
    alignItems: 'flex-end',
  },
  resultCalNumber: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 26,
    color: COLORS.accent,
    fontVariant: ['tabular-nums'],
  },
  resultCalUnit: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  hairlineSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.inkSecondary,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: COLORS.ink,
    paddingVertical: 13,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.surface,
  },
});
