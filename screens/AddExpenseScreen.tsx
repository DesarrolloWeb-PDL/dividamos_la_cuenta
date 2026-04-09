import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable, ScrollView } from 'react-native';
import { getUsersByGroup } from '../services/userService';
import { addExpense } from '../services/expenseService';

type SelectableUser = {
  id: string;
  name: string;
  phone: string;
  alias: string;
};

export default function AddExpenseScreen({ navigation, route }: any) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [payments, setPayments] = useState<Record<string, string>>({});
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [participantAmounts, setParticipantAmounts] = useState<Record<string, string>>({});
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName ?? 'este grupo';
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

  const handleAdd = async () => {
    if (!groupId) {
      Alert.alert('Error', 'No se encontró el grupo para registrar el gasto.');
      return;
    }

    const parsedAmount = Number(amount.replace(',', '.'));

    if (!description.trim() || !amount.trim()) {
      Alert.alert('Error', 'Completá descripcion y monto');
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresá un monto válido');
      return;
    }

    if (participants.length === 0) {
      Alert.alert('Error', 'Seleccioná al menos un participante');
      return;
    }

    const selectedPayers = Object.entries(payments)
      .map(([userId, value]) => ({
        userId,
        amount: Number(value.replace(',', '.')),
      }));

    if (selectedPayers.length === 0) {
      Alert.alert('Error', 'Seleccioná al menos una persona que haya pagado');
      return;
    }

    if (selectedPayers.some(payment => Number.isNaN(payment.amount) || payment.amount <= 0)) {
      Alert.alert('Error', 'Completá montos válidos para quienes pagaron');
      return;
    }

    const totalPaid = selectedPayers.reduce((sum, payment) => sum + payment.amount, 0);

    if (Math.round(totalPaid * 100) !== Math.round(parsedAmount * 100)) {
      Alert.alert('Error', 'La suma de los pagos tiene que coincidir con el total del gasto');
      return;
    }

    const normalizedParticipantAmounts = splitMode === 'custom'
      ? participants.map(participantId => Number((participantAmounts[participantId] ?? '').replace(',', '.')))
      : [];

    if (splitMode === 'custom') {
      const hasInvalidCustomAmount = normalizedParticipantAmounts.some(customAmount => Number.isNaN(customAmount) || customAmount <= 0);

      if (hasInvalidCustomAmount) {
        Alert.alert('Error', 'Completá montos válidos para cada participante');
        return;
      }

      const customTotal = normalizedParticipantAmounts.reduce((sum, customAmount) => sum + customAmount, 0);

      if (Math.round(customTotal * 100) !== Math.round(parsedAmount * 100)) {
        Alert.alert('Error', 'La suma de montos personalizados tiene que coincidir con el total');
        return;
      }
    }

    await addExpense({
      groupId,
      description: description.trim(),
      amount: parsedAmount,
      date: new Date(),
      participants,
      participantAmounts: normalizedParticipantAmounts,
      payments: selectedPayers,
    });
    Alert.alert('Éxito', 'Gasto agregado');
    setDescription('');
    setAmount('');
    setParticipants([]);
    setPayments({});
    setSplitMode('equal');
    setParticipantAmounts({});
    navigation?.goBack && navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agregar Gasto</Text>
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
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Monto"
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
      <Text style={styles.sectionTitle}>Integrantes y pagos</Text>
      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Primero necesitás cargar integrantes en este grupo para registrar un gasto.</Text>
          <Button title="Ir a integrantes" onPress={() => navigation.navigate('Users', { groupId, groupName })} />
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
                <Text style={styles.userPhone}>{user.name} · {user.phone}</Text>
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
                  value={payments[user.id] ?? ''}
                  onChangeText={value => handlePaymentAmountChange(user.id, value)}
                  keyboardType="numeric"
                />
              ) : null}
              {splitMode === 'custom' && isParticipant ? (
                <TextInput
                  style={styles.amountInput}
                  placeholder="Monto que consume esta persona"
                  value={participantAmounts[user.id] ?? ''}
                  onChangeText={value => handleParticipantAmountChange(user.id, value)}
                  keyboardType="numeric"
                />
              ) : null}
            </View>
          );
        })
      )}
      <Button title="Agregar" onPress={handleAdd} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#475569', marginBottom: 16 },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  infoText: { color: '#475569', lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  statusLabel: { color: '#475569', fontWeight: '600' },
  statusValue: { color: '#0f766e', fontWeight: '700' },
  emptyState: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  emptyText: { color: '#555', lineHeight: 20 },
  userCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  userInfo: { marginBottom: 10 },
  userName: { fontSize: 16, fontWeight: '600' },
  userPhone: { color: '#666', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  amountInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: '#0d6efd',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectorButtonActive: {
    backgroundColor: '#0d6efd',
  },
  payerButtonActive: {
    backgroundColor: '#198754',
    borderColor: '#198754',
  },
  selectorText: { color: '#0d6efd', fontWeight: '600' },
  selectorTextActive: { color: '#fff' },
});
