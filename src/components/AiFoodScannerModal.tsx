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
  onClose: () => void;
  onSaveFood: (food: Omit<FoodItem, 'id' | 'timestamp'>) => void;
}

const QUICK_PRESETS = [
  '1 porsiyon Izgara Tavuk ve Salata',
  '2 dilim Kepekli Ekmek & Peynirli Menemen',
  '1 kase Mercimek Çorbası',
  '1 tabak Kuru Fasulye ve Pilav',
  'Muzlu ve Fıstık Ezmeli Yulaf Kasesi',
  '1 adet Lahmacun ve Ayran',
];

export const AiFoodScannerModal: React.FC<AiFoodScannerModalProps> = ({
  visible,
  targetMealType,
  nvidiaApiKey,
  onClose,
  onSaveFood,
}) => {
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AiAnalysisResult | null>(null);

  // Take photo with camera
  const handleTakePhoto = async () => {
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

    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 || null);
      analyzePhoto(res.assets[0].base64 || '');
    }
  };

  // Pick photo from gallery
  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Yemek fotoğrafı seçmek için galeri izni gerekiyor.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 || null);
      analyzePhoto(res.assets[0].base64 || '');
    }
  };

  const analyzePhoto = async (base64: string) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await analyzeMealWithNvidiaVision(base64, nvidiaApiKey);
      setResult(res);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeText = async (textToAnalyze?: string) => {
    const text = textToAnalyze || description;
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await analyzeMealWithNvidiaText(text, nvidiaApiKey);
      setResult(res);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!result) return;

    onSaveFood({
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      portion: result.portion,
      mealType: targetMealType,
      imageUrl: imageUri || undefined,
      aiTip: result.aiTip,
    });

    // Reset and close
    setDescription('');
    setImageUri(null);
    setImageBase64(null);
    setResult(null);
    onClose();
  };

  const getMealTitle = (type: MealType) => {
    switch (type) {
      case 'breakfast': return 'Kahvaltıya Ekle';
      case 'lunch': return 'Öğle Yemeğine Ekle';
      case 'dinner': return 'Akşam Yemeğine Ekle';
      case 'snack': return 'Atıştırmalığa Ekle';
    }
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
                <Text style={styles.title}>{getMealTitle(targetMealType)}</Text>
                <Text style={styles.subtitle}>
                  NVIDIA AI Fotoğraf & Metin Besin Analizi
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo Capture Buttons */}
              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  style={[styles.photoActionBtn, styles.photoActionPrimary]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                  <Text style={styles.photoBtnText}>Tabağın Fotoğrafını Çek</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoActionBtn}
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image-outline" size={20} color={COLORS.text} />
                  <Text style={styles.photoBtnTextSecondary}>Galeriden Seç</Text>
                </TouchableOpacity>
              </View>

              {/* Image Preview if chosen */}
              {imageUri && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => {
                      setImageUri(null);
                      setImageBase64(null);
                    }}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Text Input for Food Description */}
              <Text style={styles.inputLabel}>veya Ne Yediğinizi Yazın:</Text>
              <View style={styles.textInputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Örn: 1 kase mercimek çorbası ve 1 dilim tam buğday ekmeği"
                  placeholderTextColor={COLORS.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.analyzeBtn, !description.trim() && styles.analyzeBtnDisabled]}
                  onPress={() => analyzeText()}
                  disabled={!description.trim() || isAnalyzing}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.analyzeBtnText}>Analiz Et</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Presets */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
                {QUICK_PRESETS.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetChip}
                    onPress={() => {
                      setDescription(preset);
                      analyzeText(preset);
                    }}
                  >
                    <Text style={styles.presetText}>{preset}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Analysis Loading Indicator */}
              {isAnalyzing && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={COLORS.nvidia} />
                  <Text style={styles.loadingText}>
                    NVIDIA Yapay Zekası kalori ve makroları hesaplıyor...
                  </Text>
                </View>
              )}

              {/* Analysis Result Card */}
              {result && !isAnalyzing && (
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{result.name}</Text>
                      <Text style={styles.resultPortion}>{result.portion}</Text>
                    </View>
                    <View style={styles.calBadge}>
                      <Text style={styles.calBadgeNumber}>{result.calories}</Text>
                      <Text style={styles.calBadgeUnit}>kcal</Text>
                    </View>
                  </View>

                  {/* Macros breakdown */}
                  <View style={styles.macrosRow}>
                    <View style={[styles.macroItem, { borderColor: COLORS.protein + '40' }]}>
                      <Text style={[styles.macroItemTitle, { color: COLORS.protein }]}>Protein</Text>
                      <Text style={styles.macroItemVal}>{result.protein}g</Text>
                    </View>
                    <View style={[styles.macroItem, { borderColor: COLORS.carbs + '40' }]}>
                      <Text style={[styles.macroItemTitle, { color: COLORS.carbs }]}>Karb</Text>
                      <Text style={styles.macroItemVal}>{result.carbs}g</Text>
                    </View>
                    <View style={[styles.macroItem, { borderColor: COLORS.fat + '40' }]}>
                      <Text style={[styles.macroItemTitle, { color: COLORS.fat }]}>Yağ</Text>
                      <Text style={styles.macroItemVal}>{result.fat}g</Text>
                    </View>
                  </View>

                  {/* AI Coach Tip */}
                  {result.aiTip ? (
                    <View style={styles.aiTipBox}>
                      <Ionicons name="sparkles" size={14} color={COLORS.nvidia} />
                      <Text style={styles.aiTipContent}>{result.aiTip}</Text>
                    </View>
                  ) : null}

                  {/* Save Button */}
                  <TouchableOpacity
                    style={styles.saveToMealBtn}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.saveToMealBtnText}>Bu Öğünü Kaydet</Text>
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
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
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
  photoBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  photoBtnTextSecondary: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  textInputBox: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
  },
  textInput: {
    color: COLORS.text,
    fontSize: 14,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.nvidia,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  analyzeBtnDisabled: {
    opacity: 0.4,
  },
  analyzeBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  presetText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: COLORS.nvidia,
    fontSize: 13,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '50',
    marginTop: 10,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  resultPortion: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  calBadge: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  calBadgeNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  calBadgeUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  macroItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroItemTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroItemVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
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
  aiTipContent: {
    color: '#D1E7A3',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  saveToMealBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveToMealBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
