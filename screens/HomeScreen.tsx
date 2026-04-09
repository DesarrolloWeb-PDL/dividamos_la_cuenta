import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Linking, Share } from 'react-native';
import { getExpensesByGroup } from '../services/expenseService';
import { getUsersByGroup } from '../services/userService';
import { calculateExpenseBreakdown, calculateSettlement, formatSettlementMessage, SettlementTransfer, UserBalance } from '../services/settlementService';
import CustomButton from '../components/CustomButton';

type ExpenseView = {
  _id: { toString(): string } | string;
  groupId: string;
  description: string;
  amount: number;
  participants: string[];
  participantAmounts: number[];
  payments: Array<{ userId: string; amount: number }>;
};

type UserView = {
  _id: { toString(): string } | string;
  name: string;
  alias?: string;
};

export default function HomeScreen({ navigation, route }: any) {
  const [expenses, setExpenses] = useState<ExpenseView[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [transfers, setTransfers] = useState<SettlementTransfer[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<UserView[]>([]);
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName ?? 'Grupo';

  const totalAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const topBalances = useMemo(
    () => balances.slice(0, 4),
    [balances],
  );

  const handleShareSettlement = async () => {
    if (expenses.length === 0) {
      Alert.alert('Sin datos', 'Agregá al menos un gasto antes de compartir la liquidación.');
      return;
    }

    const message = `${groupName}\n\n${formatSettlementMessage({ balances, transfers })}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      const canOpenWhatsapp = await Linking.canOpenURL(whatsappUrl);

      if (canOpenWhatsapp) {
        await Linking.openURL(whatsappUrl);
        return;
      }

      await Share.share({ message, title: 'Liquidación sugerida' });
    } catch {
      Alert.alert('Error', 'No se pudo compartir la liquidación.');
    }
  };

  useEffect(() => {
    const loadExpenses = async () => {
      if (!groupId) {
        setExpenses([]);
        setUsers([]);
        setUserNames({});
        setBalances([]);
        setTransfers([]);
        return;
      }

      const [expenseData, userData] = await Promise.all([getExpensesByGroup(groupId), getUsersByGroup(groupId)]);
      const nextUserNames = userData.reduce<Record<string, string>>((accumulator, user) => {
        accumulator[user._id.toString()] = user.alias?.trim() || user.name;
        return accumulator;
      }, {});
      const settlement = calculateSettlement(expenseData, userData);

      setExpenses(expenseData);
      setUsers(userData);
      setUserNames(nextUserNames);
      setBalances(settlement.balances);
      setTransfers(settlement.transfers);
    };

    loadExpenses();
    const unsubscribe = navigation.addListener('focus', loadExpenses);

    return unsubscribe;
  }, [groupId, navigation]);

  const renderExpenseItem = ({ item }: { item: ExpenseView }) => {
    const breakdown = calculateExpenseBreakdown(item, users);
    const paymentLabel = breakdown.paymentSummary.length === 0
      ? 'Sin pagos cargados'
      : breakdown.paymentSummary.map(payment => `${payment.userName} $${payment.amount.toFixed(2)}`).join(' · ');

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseTitleBlock}>
            <Text style={styles.expenseTitle}>{item.description}</Text>
            <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.payerBadge}>
            <Text style={styles.payerBadgeText}>Pagaron {paymentLabel}</Text>
          </View>
        </View>
        <Text style={styles.expenseMeta}>
          Participan: {item.participants.map(participantId => userNames[participantId] ?? 'Desconocido').join(', ')}
        </Text>
        <View style={styles.breakdownBox}>
          <Text style={styles.breakdownTitle}>
            Desglose {breakdown.isCustom ? 'personalizado' : 'igualitario'}
          </Text>
          {breakdown.shares.map(share => (
            <View key={`${item._id.toString()}-${share.userId}`} style={styles.breakdownRow}>
              <Text style={styles.breakdownName}>{share.userName}</Text>
              <Text style={styles.breakdownValue}>${share.share.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={expenses}
      keyExtractor={item => item._id.toString()}
      renderItem={renderExpenseItem}
      ItemSeparatorComponent={() => <View style={styles.expenseSeparator} />}
      ListHeaderComponent={(
        <View style={styles.headerStack}>
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Resumen actual</Text>
            <Text style={styles.title}>{groupName}</Text>
            <Text style={styles.subtitle}>
              Registrá gastos, mirá saldos y compartí la liquidación de este grupo.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Gastos</Text>
              <Text style={styles.statValue}>{expenses.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Integrantes</Text>
              <Text style={styles.statValue}>{users.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.actionsCard}>
            <Text style={styles.sectionHeading}>Acciones</Text>
            <CustomButton title="Agregar Gasto" onPress={() => navigation.navigate('AddExpense', { groupId, groupName })} />
            <CustomButton title="Ver Integrantes" onPress={() => navigation.navigate('Users', { groupId, groupName })} color="#0f766e" />
            <CustomButton title="Compartir liquidación" onPress={handleShareSettlement} color="#198754" />
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sectionHeading}>Saldos</Text>
            {topBalances.length === 0 ? (
              <Text style={styles.summaryEmpty}>Todavía no hay saldos pendientes.</Text>
            ) : (
              topBalances.map(balance => (
                <View key={balance.userId} style={styles.summaryRow}>
                  <Text style={styles.summaryName}>{balance.userName}</Text>
                  <Text style={[styles.summaryAmount, balance.balance > 0 ? styles.amountPositive : styles.amountNegative]}>
                    {balance.balance > 0 ? '+' : '-'}${Math.abs(balance.balance).toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sectionHeading}>Liquidación sugerida</Text>
            {transfers.length === 0 ? (
              <Text style={styles.summaryEmpty}>No hay transferencias para simplificar.</Text>
            ) : (
              transfers.map((transfer, index) => (
                <View key={`${transfer.fromUserId}-${transfer.toUserId}-${index}`} style={styles.transferCard}>
                  <Text style={styles.transferText}>{transfer.fromUserName}</Text>
                  <Text style={styles.transferArrow}>paga a</Text>
                  <Text style={styles.transferText}>{transfer.toUserName}</Text>
                  <Text style={styles.transferAmount}>${transfer.amount.toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>

          <Text style={styles.listHeading}>Gastos registrados</Text>
        </View>
      )}
      ListEmptyComponent={(
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>Todavía no hay gastos</Text>
          <Text style={styles.emptyStateText}>
            Cargá un gasto en este grupo para empezar a calcular saldos y liquidación entre integrantes.
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f5f8' },
  content: { padding: 16, paddingBottom: 32 },
  headerStack: { gap: 12, marginBottom: 16 },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
  },
  eyebrow: {
    color: '#93c5fd',
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#cbd5e1' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
  },
  statLabel: { color: '#64748b', fontSize: 13, marginBottom: 8 },
  statValue: { color: '#111827', fontSize: 20, fontWeight: '700' },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
  },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  breakdownBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  breakdownTitle: { fontWeight: '600', marginBottom: 6, color: '#222' },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownName: { color: '#475569' },
  breakdownValue: { color: '#111827', fontWeight: '600' },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
  },
  summaryEmpty: { color: '#666' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  summaryName: { color: '#1f2937', fontWeight: '500' },
  summaryAmount: { fontWeight: '700' },
  amountPositive: { color: '#15803d' },
  amountNegative: { color: '#b91c1c' },
  transferCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  transferText: { color: '#0f172a', fontWeight: '600' },
  transferArrow: { color: '#64748b', marginVertical: 2 },
  transferAmount: { color: '#166534', fontWeight: '700', marginTop: 4 },
  listHeading: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  expenseSeparator: { height: 12 },
  expenseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
  },
  expenseHeader: { marginBottom: 8 },
  expenseTitleBlock: { marginBottom: 8 },
  expenseTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  expenseAmount: { fontSize: 15, color: '#0f766e', fontWeight: '700', marginTop: 3 },
  payerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  payerBadgeText: { color: '#0369a1', fontWeight: '600', fontSize: 12 },
  expenseMeta: { color: '#475569', lineHeight: 20 },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyStateText: { color: '#64748b', lineHeight: 21 },
});
