import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
                <Text style={styles.loadingText}>Cargando grupo...</Text>
            </Screen>
        );
    }

    return (
        <Screen>
            <Text style={styles.title}>{group.name}</Text>
            <Text style={styles.subtitle}>{group.participants.length} participantes</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
                <Card style={{ marginBottom: spacing.lg }}>
                    <ExpenseInput participants={group.participants} onAdd={handleAddExpense} />
                </Card>

                <Text style={styles.sectionTitle}>Liquidación</Text>

                {payments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>✨</Text>
                        <Text style={styles.emptyText}>No hay deudas pendientes</Text>
                    </View>
                ) : (
                    payments.map((item, idx) => {
                        const fromName = group.participants.find(p => p.id.toString() === item.from.toString())?.name;
                        const toName = group.participants.find(p => p.id.toString() === item.to.toString())?.name;

                        return (
                            <Card key={idx} style={styles.paymentCard}>
                                <View style={styles.paymentHeader}>
                                    <Text style={styles.paymentFrom}>{fromName}</Text>
                                    <Text style={styles.paymentArrow}>→</Text>
                                    <Text style={styles.paymentTo}>{toName}</Text>
                                </View>
                                <Text style={styles.paymentAmount}>${item.amount.toFixed(2)}</Text>
                                <Button
                                    title="Cobrar por WhatsApp"
                                    variant="primary"
                                    onPress={() => handleRequestPayment(item)}
                                    style={styles.whatsappButton}
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
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.caption,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.h2,
        marginBottom: spacing.md,
    },
    loadingText: {
        ...typography.body,
        color: colors.textLight,
    },
    paymentCard: {
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    paymentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    paymentFrom: {
        ...typography.body,
        fontWeight: '600',
    },
    paymentArrow: {
        ...typography.body,
        color: colors.textLight,
        marginHorizontal: spacing.sm,
    },
    paymentTo: {
        ...typography.body,
        fontWeight: '600',
    },
    paymentAmount: {
        ...typography.h2,
        color: colors.primary,
        marginBottom: spacing.md,
    },
    whatsappButton: {
        backgroundColor: colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: spacing.xl * 2,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        ...typography.body,
        color: colors.textLight,
        fontStyle: 'italic',
    },
});