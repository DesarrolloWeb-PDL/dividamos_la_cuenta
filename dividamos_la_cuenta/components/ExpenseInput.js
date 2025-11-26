// Componente para ingreso de gastos con múltiples pagadores y división flexible
import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity } from 'react-native';

export default function ExpenseInput({ participants, onAdd }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payers, setPayers] = useState([]);
  const [shares, setShares] = useState(participants.map(p => ({ participantId: p.id, amount: '' })));

  function togglePayer(id) {
    setPayers(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  }

  function setShareAmount(id, value) {
    setShares(prev => prev.map(s => s.participantId === id ? { ...s, amount: value } : s));
  }

  function handleAdd() {
    if (!description || !amount || payers.length === 0) return;
    const total = parseFloat(amount);
    // Divide el monto entre los pagadores seleccionados
    const payerAmount = total / payers.length;
    const payerObjs = payers.map(id => ({ participantId: id, amount: payerAmount }));
    // Divide el gasto según los shares ingresados
    const shareObjs = shares.map(s => ({ participantId: s.participantId, amount: parseFloat(s.amount) || 0 }));
    onAdd({ description, amount: total, payers: payerObjs, shares: shareObjs });
    setDescription('');
    setAmount('');
    setPayers([]);
    setShares(participants.map(p => ({ participantId: p.id, amount: '' })));
  }

  // UI mejorada para MVP
  return (
    <View style={{ marginVertical: 8 }}>
      <Text>Descripción</Text>
      <TextInput value={description} onChangeText={setDescription} placeholder="Ej: Carne" style={{ borderWidth: 1, marginBottom: 4 }} />
      <Text>Monto Total</Text>
      <TextInput value={amount} onChangeText={setAmount} placeholder="$" keyboardType="numeric" style={{ borderWidth: 1, marginBottom: 4 }} />
      <Text>¿Quiénes pagaron?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
        {participants.map(p => (
          <TouchableOpacity
            key={p.id}
            style={{
              padding: 6,
              margin: 2,
              backgroundColor: payers.includes(p.id) ? '#4caf50' : '#eee',
              borderRadius: 8,
            }}
            onPress={() => togglePayer(p.id)}
          >
            <Text>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text>¿Cómo se divide el gasto?</Text>
      {shares.map((s, idx) => (
        <View key={s.participantId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={{ width: 80 }}>{participants.find(p => p.id === s.participantId)?.name}</Text>
          <TextInput
            value={s.amount.toString()}
            onChangeText={v => setShareAmount(s.participantId, v)}
            placeholder="$"
            keyboardType="numeric"
            style={{ borderWidth: 1, width: 60, marginLeft: 4 }}
          />
        </View>
      ))}
      <Button title="Agregar Gasto" onPress={handleAdd} />
    </View>
  );
}
