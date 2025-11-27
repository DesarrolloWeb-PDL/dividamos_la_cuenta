import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
import ExpenseInput from '../components/ExpenseInput';
import { calculateNetPositions, minimizeTransactions } from '../services/settlement';
import { generateWhatsAppLink, fetchAlias, openWhatsApp } from '../services/whatsappLink';
import { RealmContext } from '../models';
import { Group } from '../models/Group';
import { BSON } from 'realm';
import { RouteProp } from '@react-navigation/native';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { colors, spacing, typography } from '../theme';

const { useObject, useRealm } = RealmContext;

type RootStackParamList = {
    GroupDetail: { groupId: string };
};

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;

interface Props {
    route: GroupDetailRouteProp;
}

export default function GroupDetail({ route }: Props) {
    const groupId = route?.params?.groupId;
    const group = useObject(Group, new BSON.ObjectId(groupId));
    const realm = useRealm();
    const [payments, setPayments] = useState<any[]>([]);

    useEffect(() => {
        if (group) {
            const net = calculateNetPositions(group.participants, group.transactions);
            setPayments(minimizeTransactions(net));
        }
    }, [group]);

    function handleAddExpense(expense: any) {
        if (!group) return;
        realm.write(() => {
            group.transactions.push(expense);
        });
    }

    function handleRequestPayment(payment: any) {
        if (!group) return;
        const debtor = group.participants.find(p => p.id.toString() === payment.from.toString());
        if (!debtor) return;

        fetchAlias(payment.to).then(alias => {
            const url = generateWhatsAppLink(debtor.phone || '', payment.amount, alias);
            openWhatsApp(url);
        });
    }

    if (!group) {
        return (
            <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text>Cargando grupo...</Text>
            </Screen>
        );
    }

    return (
        <Screen>
            <Text style={styles.title}>{group.name}</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
                <Card style={{ marginBottom: spacing.lg }}>
                    <ExpenseInput participants={group.participants} onAdd={handleAddExpense} />
                </Card>

                <Text style={styles.sectionTitle}>Liquidación</Text>

                {payments.length === 0 ? (
                    <Text style={styles.emptyText}>No hay deudas pendientes.</Text>
                ) : (
                    payments.map((item, idx) => {
                        const fromName = group.participants.find(p => p.id.toString() === item.from.toString())?.name;
                        const toName = group.participants.find(p => p.id.toString() === item.to.toString())?.name;

                        return (
                            <Card key={idx} style={styles.paymentCard}>
                                <Text style={styles.paymentText}>
                                    <Text style={{ fontWeight: 'bold' }}>{fromName}</Text> debe pagar <Text style={{ color: colors.error, fontWeight: 'bold' }}>${item.amount.toFixed(2)}</Text> a <Text style={{ fontWeight: 'bold' }}>{toName}</Text>
                                </Text>
                                <Button
                                    title="Cobrar por WhatsApp"
                                    variant="secondary"
                                    onPress={() => handleRequestPayment(item)}
                                    style={{ marginTop: spacing.sm }}
                                />
                            </Card>
                        );
                    })
                )}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    title: {
        ...typography.h1,
        color: colors.primary,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h2,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    paymentCard: {
        borderLeftWidth: 4,
        borderLeftColor: colors.secondary,
    },
    paymentText: {
        ...typography.body,
        marginBottom: spacing.xs,
    },
    emptyText: {
        ...typography.body,
        color: colors.textLight,
        fontStyle: 'italic',
    },
});
