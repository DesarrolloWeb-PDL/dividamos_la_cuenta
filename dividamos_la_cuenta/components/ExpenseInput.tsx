import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Participant } from '../models/Participant';
import { BSON } from 'realm';
import Input from './ui/Input';
import Button from './ui/Button';
import { colors, spacing, typography } from '../theme';

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

        const payer = { participantId: new BSON.ObjectId(payerId), amount: val };
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
        setPayerId('');
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Nuevo Gasto</Text>
            
            <Input
                label="Descripción"
                placeholder="Ej: Cena, Super, Nafta"
                value={description}
                onChangeText={setDescription}
            />
            
            <Input
                label="Monto"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
            />

            <Text style={styles.label}>¿Quién pagó?</Text>
            <View style={styles.payerContainer}>
                {participants.map(p => (
                    <Button
                        key={p.id.toString()}
                        title={p.name}
                        variant={payerId === p.id.toString() ? 'primary' : 'outline'}
                        onPress={() => setPayerId(p.id.toString())}
                        style={styles.payerButton}
                    />
                ))}
            </View>

            <Button
                title="Agregar Gasto"
                onPress={handleAdd}
                disabled={!description || !amount || !payerId}
                style={styles.addButton}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.h2,
        marginBottom: spacing.md,
    },
    label: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.sm,
        color: colors.text,
    },
    payerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    payerButton: {
        minWidth: 80,
    },
    addButton: {
        marginTop: spacing.sm,
    },
});