import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { Participant } from '../models/Participant';
import { Transaction, Payer, Share } from '../models/Transaction';
import { BSON } from 'realm';

interface ExpenseInputProps {
    participants: Realm.List<Participant> | Participant[];
    onAdd: (transaction: any) => void;
}

export default function ExpenseInput({ participants, onAdd }: ExpenseInputProps) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [payerId, setPayerId] = useState<string>('');

    function handleAdd() {
        if (!description || !amount || !payerId) return;

        const val = parseFloat(amount);
        if (isNaN(val)) return;

        // Simple split: one payer, equal shares for everyone
        const payer = { participantId: new BSON.ObjectId(payerId), amount: val };

        // Calculate share per person
        const shareAmount = val / participants.length;
        const shares = participants.map(p => ({
            participantId: p.id,
            amount: shareAmount,
        }));

        onAdd({
            description,
            amount: val,
            payers: [payer],
            shares,
        });

        setDescription('');
        setAmount('');
    }

    return (
        <View style={{ marginBottom: 16, padding: 8, borderWidth: 1, borderColor: '#ccc' }}>
            <Text>Nuevo Gasto</Text>
            <TextInput
                placeholder="Descripción"
                value={description}
                onChangeText={setDescription}
                style={{ borderWidth: 1, marginBottom: 4 }}
            />
            <TextInput
                placeholder="Monto"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={{ borderWidth: 1, marginBottom: 4 }}
            />
            <Text>Pagó:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {participants.map(p => (
                    <Button
                        key={p.id.toString()}
                        title={p.name}
                        color={payerId === p.id.toString() ? 'blue' : 'gray'}
                        onPress={() => setPayerId(p.id.toString())}
                    />
                ))}
            </View>
            <Button title="Agregar Gasto" onPress={handleAdd} />
        </View>
    );
}
