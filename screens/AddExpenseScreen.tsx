import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable, ScrollView } from 'react-native';
import { getAllUsers } from '../services/userService';
import { addExpense } from '../services/expenseService';

type SelectableUser = {
  id: string;
  name: string;
  phone: string;
};

export default function AddExpenseScreen({ navigation }: any) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [paidBy, setPaidBy] = useState('');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [participantAmounts, setParticipantAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUsers = async () => {
      const data = await getAllUsers();
      const normalizedUsers = data.map(user => ({
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
      }));
      setUsers(normalizedUsers);
    };

    loadUsers();
    const unsubscribe = navigation.addListener('focus', loadUsers);

    return unsubscribe;
  }, [navigation]);

  const toggleParticipant = (userId: string) => {
    setParticipants(currentParticipants => {
      const isSelected = currentParticipants.includes(userId);
      const nextParticipants = isSelected
        ? currentParticipants.filter(participantId => participantId !== userId)
        : [...currentParticipants, userId];

      if (paidBy === userId && isSelected) {
        setPaidBy('');
      }

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

  const handleSelectPaidBy = (userId: string) => {
    setPaidBy(userId);
    setParticipants(currentParticipants => (
      currentParticipants.includes(userId)
        ? currentParticipants
        : [...currentParticipants, userId]
    ));
  };

  const handleParticipantAmountChange = (userId: string, value: string) => {
    setParticipantAmounts(currentAmounts => ({
      ...currentAmounts,
      [userId]: value,
    }));
  };

  const handleAdd = async () => {
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

    if (!paidBy) {
      Alert.alert('Error', 'Seleccioná quién pagó');
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
      description: description.trim(),
      amount: parsedAmount,
      date: new Date(),
      participants,
      participantAmounts: normalizedParticipantAmounts,
      paidBy,
    });
    Alert.alert('Éxito', 'Gasto agregado');
    setDescription('');
    setAmount('');
    setParticipants([]);
    setPaidBy('');
    setSplitMode('equal');
    setParticipantAmounts({});
    navigation?.goBack && navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agregar Gasto</Text>
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
      <Text style={styles.sectionTitle}>Participantes</Text>
      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Primero necesitás cargar usuarios para registrar un gasto.</Text>
          <Button title="Ir a usuarios" onPress={() => navigation.navigate('Users')} />
        </View>
      ) : (
        users.map(user => {
          const isParticipant = participants.includes(user.id);
          const isPayer = paidBy === user.id;

          return (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>
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
                  onPress={() => handleSelectPaidBy(user.id)}
                  style={[styles.selectorButton, isPayer && styles.payerButtonActive]}
                >
                  <Text style={[styles.selectorText, isPayer && styles.selectorTextActive]}>
                    {isPayer ? 'Pagó' : 'Marcar pagador'}
                  </Text>
                </Pressable>
              </View>
              {splitMode === 'custom' && isParticipant ? (
                <TextInput
                  style={styles.amountInput}
                  placeholder="Monto para esta persona"
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, marginTop: 8 },
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
