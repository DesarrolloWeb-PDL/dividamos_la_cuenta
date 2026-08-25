import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable, ScrollView } from 'react-native';
import { getUsersByGroup } from '../services/userService';
import { addExpense, updateExpense } from '../services/expenseService';
import CustomButton from '../components/CustomButton';
import { calculateExpenseBreakdown } from '../services/settlementService';
import { AppPalette, useAppTheme } from '../theme/appTheme';

type SelectableUser = {
  id: string;
  name: string;
  phone: string;
  alias: string;
};

type ExpensePreview = {
  paymentSummary: Array<{ userId: string; userName: string; amount: number }>;
  shares: Array<{ userId: string; userName: string; share: number }>;
  isCustom: boolean;
};

export default function AddExpenseScreen({ navigation, route }: any) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [payments, setPayments] = useState<Record<string, string>>({});
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [participantAmounts, setParticipantAmounts] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ExpensePreview | null>(null);
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName ?? 'este grupo';
  const existingExpense = route?.params?.expense;
  const isEditing = Boolean(existingExpense?._id);
  const totalPaid = Object.values(payments).reduce((sum, value) => {
    const parsedValue = Number(value.replace(',', '.'));
    return sum + (Number.isNaN(parsedValue) ? 0 : parsedValue);
  }, 0);
  const totalAssigned = participants.reduce((sum, participantId) => {
    const parsedValue = Number((participantAmounts[participantId] ?? '').replace(',', '.'));
    return sum + (Number.isNaN(parsedValue) ? 0 : parsedValue);
  }, 0);

  useEffect(() => {
    const loadUsers = async () => {
      if (!groupId) {
        setUsers([]);
        return;
      }

      const data = await getUsersByGroup(groupId);
      const normalizedUsers = data.map(user => ({
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        alias: user.alias,
      }));
      setUsers(normalizedUsers);
    };

    loadUsers();
    const unsubscribe = navigation.addListener('focus', loadUsers);

    return unsubscribe;
  }, [groupId, navigation]);

  useEffect(() => {
    if (!existingExpense) {
      setDescription('');
      setAmount('');
      setParticipants([]);
      setPayments({});
      setSplitMode('equal');
      setParticipantAmounts({});
      setPreview(null);
      return;
    }

    setDescription(existingExpense.description ?? '');
    setAmount(String(existingExpense.amount ?? ''));
    setParticipants(existingExpense.participants ?? []);
    setPayments(
      (existingExpense.payments ?? []).reduce((accumulator: Record<string, string>, payment: { userId: string; amount: number }) => {
        accumulator[payment.userId] = String(payment.amount);
        return accumulator;
      }, {}),
    );

    const hasCustomSplit = Array.isArray(existingExpense.participantAmounts)
      && existingExpense.participantAmounts.length === existingExpense.participants.length
      && existingExpense.participantAmounts.length > 0;

    setSplitMode(hasCustomSplit ? 'custom' : 'equal');
    setParticipantAmounts(
      hasCustomSplit
        ? existingExpense.participants.reduce((accumulator: Record<string, string>, participantId: string, index: number) => {
          accumulator[participantId] = String(existingExpense.participantAmounts[index]);
          return accumulator;
        }, {})
        : {},
    );
    setPreview(null);
  }, [existingExpense]);

  useEffect(() => {
    setPreview(null);
  }, [description, amount, participants, payments, splitMode, participantAmounts]);

  const buildExpenseDraft = () => {
    if (!groupId) {
      Alert.alert('Error', 'No se encontró el grupo para registrar el gasto.');
      return null;
    }

    const parsedAmount = Number(amount.replace(',', '.'));

    if (!description.trim() || !amount.trim()) {
      Alert.alert('Error', 'Completá descripcion y monto');
      return null;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresá un monto válido');
      return null;
    }

    if (participants.length === 0) {
      Alert.alert('Error', 'Seleccioná al menos un participante');
      return null;
    }

    const selectedPayers = Object.entries(payments)
      .map(([userId, value]) => ({
        userId,
        amount: Number(value.replace(',', '.')),
      }));

    if (selectedPayers.length === 0) {
      Alert.alert('Error', 'Seleccioná al menos una persona que haya pagado');
      return null;
    }

    if (selectedPayers.some(payment => Number.isNaN(payment.amount) || payment.amount <= 0)) {
      Alert.alert('Error', 'Completá montos válidos para quienes pagaron');
      return null;
    }

    const paidTotal = selectedPayers.reduce((sum, payment) => sum + payment.amount, 0);

    if (Math.round(paidTotal * 100) !== Math.round(parsedAmount * 100)) {
      Alert.alert('Error', 'La suma de los pagos tiene que coincidir con el total del gasto');
      return null;
    }

    const normalizedParticipantAmounts = splitMode === 'custom'
      ? participants.map(participantId => Number((participantAmounts[participantId] ?? '').replace(',', '.')))
      : [];

    if (splitMode === 'custom') {
      const hasInvalidCustomAmount = normalizedParticipantAmounts.some(customAmount => Number.isNaN(customAmount) || customAmount <= 0);

      if (hasInvalidCustomAmount) {
        Alert.alert('Error', 'Completá montos válidos para cada participante');
        return null;
      }

      const customTotal = normalizedParticipantAmounts.reduce((sum, customAmount) => sum + customAmount, 0);

      if (Math.round(customTotal * 100) !== Math.round(parsedAmount * 100)) {
        Alert.alert('Error', 'La suma de montos personalizados tiene que coincidir con el total');
        return null;
      }
    }

    return {
      groupId,
      description: description.trim(),
      amount: parsedAmount,
      participants,
      participantAmounts: normalizedParticipantAmounts,
      payments: selectedPayers,
    };
  };

  const toggleParticipant = (userId: string) => {
    setParticipants(currentParticipants => {
      const isSelected = currentParticipants.includes(userId);
      const nextParticipants = isSelected
        ? currentParticipants.filter(participantId => participantId !== userId)
        : [...currentParticipants, userId];

      if (isSelected) {
        setParticipantAmounts(currentAmounts => {
          const nextAmounts = { ...currentAmounts };
          delete nextAmounts[userId];
          return nextAmounts;
        });
      }

      return nextParticipants;
    });
  };

  const togglePayer = (userId: string) => {
    setPayments(currentPayments => {
      const nextPayments = { ...currentPayments };

      if (Object.prototype.hasOwnProperty.call(nextPayments, userId)) {
        delete nextPayments[userId];
        return nextPayments;
      }

      nextPayments[userId] = '';
      return nextPayments;
    });

    setParticipants(currentParticipants => (
      currentParticipants.includes(userId)
        ? currentParticipants
        : [...currentParticipants, userId]
    ));
  };

  const handlePaymentAmountChange = (userId: string, value: string) => {
    setPayments(currentPayments => ({
      ...currentPayments,
      [userId]: value,
    }));
  };

  const handleParticipantAmountChange = (userId: string, value: string) => {
    setParticipantAmounts(currentAmounts => ({
      ...currentAmounts,
      [userId]: value,
    }));
  };

  const handleCalculateSplit = () => {
    const draftExpense = buildExpenseDraft();

    if (!draftExpense) {
      return;
    }

    const previewUsers = users.map(user => ({
      _id: user.id,
      name: user.name,
      alias: user.alias,
    }));

    const calculatedPreview = calculateExpenseBreakdown(draftExpense, previewUsers);

    setPreview({
      ...calculatedPreview,
      isCustom: Boolean(calculatedPreview.isCustom),
    });
  };

  const handleAdd = async () => {
    const draftExpense = buildExpenseDraft();

    if (!draftExpense) {
      return;
    }

    if (isEditing) {
      const updatedExpense = await updateExpense(existingExpense._id.toString(), {
        ...draftExpense,
        date: existingExpense.date ?? new Date(),
      });

      if (!updatedExpense) {
        Alert.alert('Error', 'No se pudo actualizar el gasto.');
        return;
      }

      Alert.alert('Éxito', 'Gasto actualizado');
      navigation?.goBack && navigation.goBack();
      return;
    }

    await addExpense({
      ...draftExpense,
      date: new Date(),
    });
    Alert.alert('Éxito', 'Gasto agregado');
    setDescription('');
    setAmount('');
    setParticipants([]);
    setPayments({});
    setSplitMode('equal');
    setParticipantAmounts({});
    setPreview(null);
    navigation?.goBack && navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Editar gasto' : 'Agregar gasto'}</Text>
      <Text style={styles.subtitle}>Grupo: {groupName}</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Cómo cargar este gasto</Text>
        <Text style={styles.infoText}>1. Marcá quiénes participaron.</Text>
        <Text style={styles.infoText}>2. Marcá quiénes pagaron y cuánto puso cada uno.</Text>
        <Text style={styles.infoText}>3. Si la división no es igual, cargá cuánto consume cada integrante.</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Monto"
        placeholderTextColor={colors.textMuted}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <Text style={styles.sectionTitle}>Tipo de división</Text>
      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => setSplitMode('equal')}
          style={[styles.selectorButton, splitMode === 'equal' && styles.selectorButtonActive]}
        >
          <Text style={[styles.selectorText, splitMode === 'equal' && styles.selectorTextActive]}>
            Igual para todos
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSplitMode('custom')}
          style={[styles.selectorButton, splitMode === 'custom' && styles.selectorButtonActive]}
        >
          <Text style={[styles.selectorText, splitMode === 'custom' && styles.selectorTextActive]}>
            Montos personalizados
          </Text>
        </Pressable>
      </View>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Pagos cargados</Text>
        <Text style={styles.statusValue}>${totalPaid.toFixed(2)}</Text>
      </View>
      {splitMode === 'custom' ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Consumo asignado</Text>
          <Text style={styles.statusValue}>${totalAssigned.toFixed(2)}</Text>
        </View>
      ) : null}
      <View style={styles.calculationCard}>
        <Text style={styles.calculationTitle}>División del gasto</Text>
        <Text style={styles.calculationText}>Primero calculá para revisar el reparto y después recién guardá el gasto.</Text>
        <CustomButton title="Calcular división" onPress={handleCalculateSplit} color="#7c3aed" />
      </View>
      <Text style={styles.sectionTitle}>Integrantes y pagos</Text>
      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Primero necesitás cargar integrantes en este grupo para registrar un gasto.</Text>
          <CustomButton title="Ir a integrantes" onPress={() => navigation.navigate('Users', { groupId, groupName })} color={colors.primary} />
        </View>
      ) : (
        users.map(user => {
          const isParticipant = participants.includes(user.id);
          const isPayer = Object.prototype.hasOwnProperty.call(payments, user.id);
          const displayName = user.alias.trim() || user.name;

          return (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.userPhone}>{user.phone?.trim() ? `${user.name} · ${user.phone}` : 'Integrante rápido sin teléfono'}</Text>
              </View>
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => toggleParticipant(user.id)}
                  style={[styles.selectorButton, isParticipant && styles.selectorButtonActive]}
                >
                  <Text style={[styles.selectorText, isParticipant && styles.selectorTextActive]}>
                    {isParticipant ? 'Participa' : 'Sumar'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => togglePayer(user.id)}
                  style={[styles.selectorButton, isPayer && styles.payerButtonActive]}
                >
                  <Text style={[styles.selectorText, isPayer && styles.selectorTextActive]}>
                    {isPayer ? 'Está pagando' : 'Marcar pago'}
                  </Text>
                </Pressable>
              </View>
              {isPayer ? (
                <TextInput
                  style={styles.amountInput}
                  placeholder="Monto que pagó esta persona"
                  placeholderTextColor={colors.textMuted}
                  value={payments[user.id] ?? ''}
                  onChangeText={value => handlePaymentAmountChange(user.id, value)}
                  keyboardType="numeric"
                />
              ) : null}
              {splitMode === 'custom' && isParticipant ? (
                <TextInput
                  style={styles.amountInput}
                  placeholder="Monto que consume esta persona"
                  placeholderTextColor={colors.textMuted}
                  value={participantAmounts[user.id] ?? ''}
                  onChangeText={value => handleParticipantAmountChange(user.id, value)}
                  keyboardType="numeric"
                />
              ) : null}
            </View>
          );
        })
      )}
      {preview ? (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Vista previa</Text>
          <Text style={styles.previewSubtitle}>
            {preview.isCustom ? 'División personalizada' : 'División igualitaria'}
          </Text>
          <Text style={styles.previewSectionTitle}>Pagos</Text>
          {preview.paymentSummary.map(payment => (
            <View key={payment.userId} style={styles.previewRow}>
              <Text style={styles.previewName}>{payment.userName}</Text>
              <Text style={styles.previewValue}>${payment.amount.toFixed(2)}</Text>
            </View>
          ))}
          <Text style={styles.previewSectionTitle}>Consumo</Text>
          {preview.shares.map(share => (
            <View key={share.userId} style={styles.previewRow}>
              <Text style={styles.previewName}>{share.userName}</Text>
              <Text style={styles.previewValue}>${share.share.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <CustomButton title={isEditing ? 'Guardar gasto' : 'Agregar gasto'} onPress={handleAdd} color={colors.success} />
    </ScrollView>
  );
}

const createStyles = (colors: AppPalette) => StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.background, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: colors.text },
  subtitle: { color: colors.textMuted, marginBottom: 16 },
  infoCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
  infoText: { color: colors.textMuted, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 10, marginBottom: 12, color: colors.text, backgroundColor: colors.surface },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, marginTop: 8, color: colors.text },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  statusLabel: { color: colors.textMuted, fontWeight: '600' },
  statusValue: { color: colors.success, fontWeight: '700' },
  calculationCard: {
    backgroundColor: colors.surfaceAccent,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  calculationTitle: { fontSize: 16, fontWeight: '700', color: colors.warning, marginBottom: 4 },
  calculationText: { color: colors.textMuted, lineHeight: 20 },
  emptyState: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 12,
    backgroundColor: colors.surface,
  },
  emptyText: { color: colors.textMuted, lineHeight: 20 },
  userCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  userInfo: { marginBottom: 10 },
  userName: { fontSize: 16, fontWeight: '600', color: colors.text },
  userPhone: { color: colors.textMuted, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  amountInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  selectorButtonActive: {
    backgroundColor: colors.primary,
  },
  payerButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  previewCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  previewTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  previewSubtitle: { color: colors.textMuted, marginBottom: 10 },
  previewSectionTitle: { color: colors.text, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  previewName: { color: colors.textMuted },
  previewValue: { color: colors.text, fontWeight: '700' },
  selectorText: { color: colors.primary, fontWeight: '600' },
  selectorTextActive: { color: '#fff' },
});
