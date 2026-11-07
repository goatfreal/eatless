import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface WeightCardProps {
  currentWeight: number;
  targetWeight: number;
  onUpdateWeight: (newWeight: number, newTarget: number) => void;
}

export const WeightCard: React.FC<WeightCardProps> = ({
  currentWeight,
  targetWeight,
  onUpdateWeight,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputCurrent, setInputCurrent] = useState(currentWeight.toString());
  const [inputTarget, setInputTarget] = useState(targetWeight.toString());

  const diff = (currentWeight - targetWeight).toFixed(1);
  const isLoss = currentWeight > targetWeight;

  const handleSave = () => {
    const c = parseFloat(inputCurrent) || currentWeight;
    const t = parseFloat(inputTarget) || targetWeight;
    onUpdateWeight(c, t);
    setIsModalOpen(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Ionicons name="scale-outline" size={18} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.title}>Kilo & Hedef Takibi</Text>
            <Text style={styles.subtitle}>
              Mevcut: {currentWeight} kg • Hedef: {targetWeight} kg
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setIsModalOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={13} color={COLORS.textSecondary} />
          <Text style={styles.editBtnText}>Güncelle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Ionicons
            name={isLoss ? 'trending-down-outline' : 'trending-up-outline'}
            size={14}
            color={COLORS.primaryLight}
          />
          <Text style={styles.badgeText}>
            Hedefe Kalan: {Math.abs(parseFloat(diff))} kg {isLoss ? '(Vermek için)' : '(Almak için)'}
          </Text>
        </View>
      </View>

      {/* Weight Edit Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsModalOpen(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Kilo Bilgilerini Güncelle</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mevcut Kilonuz (kg):</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={inputCurrent}
                onChangeText={setInputCurrent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hedef Kilonuz (kg):</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={inputTarget}
                onChangeText={setInputTarget}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F59E0B18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  editBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 12,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
