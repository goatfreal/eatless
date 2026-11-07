import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
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
  { label: '0.5x Yarım', value: 0.5 },
  { label: '1x Standart', value: 1 },
  { label: '1.5x Büyük', value: 1.5 },
  { label: '2x Çift', value: 2 },
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

  const hasValidKey = !!nvidiaApiKey && nvidiaApiKey.trim().startsWith('nvapi-');

  const handleTakePhoto = async () => {
    if (!hasValidKey) {
      setErrorMsg('Fotoğraf analizi için önce NVIDIA API anahtarınızı bağlamalısınız.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Yemek fotoğrafı çekmek için kamera izni gerekiyor.');
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
    if (!hasValidKey) {
      setErrorMsg('Fotoğraf analizi için önce NVIDIA API anahtarınızı bağlamalısınız.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeriden fotoğraf seçmek için izin gerekiyor.');
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
      const res = await analyzeMealWithNvidiaVision(base64, nvidiaApiKey, nvidiaVisionModel);
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
      const res = await analyzeMealWithNvidiaText(description, nvidiaApiKey, nvidiaTextModel);
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
      portion: `${multiplier}x (${baseResult.portion})`,
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
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>NVIDIA AI Besin Tarayıcı</Text>
                <Text style={styles.subtitle}>
                  Gerçek zamanlı Llama Vision & Besin Hesaplama
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Missing Key Warning */}
              {!hasValidKey && (
                <TouchableOpacity style={styles.missingKeyBox} onPress={() => { onClose(); onOpenSettings(); }}>
                  <Ionicons name="key-outline" size={20} color="#FCA5A5" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.missingKeyTitle}>NVIDIA API Anahtarı Girilmemiş!</Text>
                    <Text style={styles.missingKeySub}>
                      Yapay zeka analizini kullanmak için buraya dokunup nvapi-... anahtarınızı girin.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
                </TouchableOpacity>
              )}

              {/* Meal Type Selector */}
              <View style={styles.mealTypeRow}>
                {[
                  { id: 'breakfast', label: 'Kahvaltı' },
                  { id: 'lunch', label: 'Öğle' },
                  { id: 'dinner', label: 'Akşam' },
                  { id: 'snack', label: 'Ara Öğün' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.mealTypeChip,
                      selectedMeal === m.id && styles.mealTypeChipActive,
                    ]}
                    onPress={() => setSelectedMeal(m.id as MealType)}
                  >
                    <Text
                      style={[
                        styles.mealTypeText,
                        selectedMeal === m.id && styles.mealTypeTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Camera & Gallery Buttons */}
              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  style={[styles.photoActionBtn, styles.photoActionPrimary]}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                  <Text style={styles.photoBtnText}>Fotoğraf Çek</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoActionBtn}
                  onPress={handlePickPhoto}
                >
                  <Ionicons name="images-outline" size={20} color={COLORS.text} />
                  <Text style={styles.photoBtnTextSecondary}>Galeriden Seç</Text>
                </TouchableOpacity>
              </View>

              {imageUri && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                </View>
              )}

              {/* Text Input */}
              <Text style={styles.inputLabel}>Yediğin Yemeği ve Miktarını Yaz:</Text>
              <View style={styles.textInputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Örn: 200 gram ızgara tavuk göğsü, 1 porsiyon pirinç pilavı ve 1 kase cacık"
                  placeholderTextColor={COLORS.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.analyzeBtn, !description.trim() && styles.analyzeBtnDisabled]}
                  onPress={runTextAnalysis}
                  disabled={!description.trim() || isAnalyzing}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.analyzeBtnText}>NVIDIA AI ile Hesapla</Text>
                </TouchableOpacity>
              </View>

              {/* Error Message Display */}
              {errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Loading */}
              {isAnalyzing && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={COLORS.nvidia} />
                  <Text style={styles.loadingText}>
                    NVIDIA NIM sunucusundan besin değerleri hesaplanıyor...
                  </Text>
                </View>
              )}

              {/* Real Result Card */}
              {baseResult && !isAnalyzing && (
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.resultName}>{baseResult.name}</Text>
                      <Text style={styles.resultPortion}>{baseResult.portion}</Text>
                    </View>
                    <View style={styles.calBadge}>
                      <Text style={styles.calBadgeNumber}>
                        {Math.round(baseResult.calories * multiplier)}
                      </Text>
                      <Text style={styles.calBadgeUnit}>kcal</Text>
                    </View>
                  </View>

                  {/* Portion Multiplier Selector */}
                  <Text style={styles.portionLabel}>Porsiyon Çarpanı:</Text>
                  <View style={styles.multiplierRow}>
                    {PORTION_MULTIPLIERS.map((p) => (
                      <TouchableOpacity
                        key={p.value}
                        style={[
                          styles.multBtn,
                          multiplier === p.value && styles.multBtnActive,
                        ]}
                        onPress={() => setMultiplier(p.value)}
                      >
                        <Text
                          style={[
                            styles.multText,
                            multiplier === p.value && styles.multTextActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Macros */}
                  <View style={styles.macrosRow}>
                    <View style={[styles.macroItem, { borderColor: COLORS.protein + '40' }]}>
                      <Text style={[styles.macroItemTitle, { color: COLORS.protein }]}>Protein</Text>
                      <Text style={styles.macroItemVal}>
                        {Math.round(baseResult.protein * multiplier)}g
                      </Text>
                    </View>
                    <View style={[styles.macroItem, { borderColor: COLORS.carbs + '40' }]}>
                      <Text style={[styles.macroItemTitle, { color: COLORS.carbs }]}>Karb</Text>
                      <Text style={styles.macroItemVal}>
                        {Math.round(baseResult.carbs * multiplier)}g
                      </Text>
                    </View>
                    <View style={[styles.macroItem, { borderColor: COLORS.fat + '40' }]}>
                      <Text style={[styles.macroItemTitle, { color: COLORS.fat }]}>Yağ</Text>
                      <Text style={styles.macroItemVal}>
                        {Math.round(baseResult.fat * multiplier)}g
                      </Text>
                    </View>
                  </View>

                  {baseResult.aiTip ? (
                    <View style={styles.aiTipBox}>
                      <Ionicons name="sparkles" size={14} color={COLORS.nvidia} />
                      <Text style={styles.aiTipContent}>{baseResult.aiTip}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity style={styles.saveToMealBtn} onPress={handleSave}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.saveToMealBtnText}>Öğüne Ekle</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  missingKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#351316',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  missingKeyTitle: { color: '#FCA5A5', fontSize: 13, fontWeight: '800' },
  missingKeySub: { color: '#FECACA', fontSize: 11, marginTop: 2 },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  mealTypeChipActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  mealTypeText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  mealTypeTextActive: { color: COLORS.primaryLight, fontWeight: '800' },
  photoActionsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cardSecondary,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  photoActionPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  photoBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  photoBtnTextSecondary: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  previewContainer: { marginBottom: 14, borderRadius: 16, overflow: 'hidden' },
  previewImage: { width: '100%', height: 170, borderRadius: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  textInputBox: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  textInput: {
    color: COLORS.text,
    fontSize: 14,
    minHeight: 54,
    textAlignVertical: 'top',
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.nvidia,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 8,
  },
  analyzeBtnDisabled: { opacity: 0.4 },
  analyzeBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2D1215',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 12,
  },
  errorText: { color: '#FCA5A5', fontSize: 12, flex: 1, fontWeight: '600' },
  loadingBox: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  loadingText: { color: COLORS.nvidia, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  resultCard: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultName: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  resultPortion: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  calBadge: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  calBadgeNumber: { fontSize: 20, fontWeight: '900', color: COLORS.primaryLight },
  calBadgeUnit: { fontSize: 10, fontWeight: '700', color: COLORS.primaryLight },
  portionLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  multiplierRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  multBtn: {
    flex: 1,
    paddingVertical: 7,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  multBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  multText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  multTextActive: { color: '#FFF', fontWeight: '800' },
  macrosRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  macroItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroItemTitle: { fontSize: 11, fontWeight: '700' },
  macroItemVal: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  aiTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.nvidiaGlow,
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.nvidia + '40',
  },
  aiTipContent: { color: '#D1E7A3', fontSize: 12, fontWeight: '500', flex: 1 },
  saveToMealBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveToMealBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
