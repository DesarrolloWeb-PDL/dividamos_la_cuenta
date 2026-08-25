import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Linking, Pressable, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { confirmAction } from '../services/dialogService';
import { deleteExpense, deleteExpensesByGroup, getExpensesByGroup } from '../services/expenseService';
import { getUsersByGroup } from '../services/userService';
import { getGroupById } from '../services/groupService';
import { APP_DISPLAY_NAME, APP_PUBLIC_URL } from '../services/appConfig';
import { calculateDetailedSettlement, calculateExpenseBreakdown, calculateSettlement, SettlementTransfer, UserBalance } from '../services/settlementService';
import { detectPaymentHandleKind, getPaymentHandleLabel } from '../services/paymentHandle';
import CustomButton from '../components/CustomButton';
import { AppPalette, useAppTheme } from '../theme/appTheme';

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
  phone?: string;
  paymentHandle?: string;
};

type GroupDetails = {
  _id: { toString(): string } | string;
  name: string;
  description: string;
  whatsappGroupLink?: string;
};

function normalizeWhatsappPhone(phone?: string) {
  if (!phone) {
    return '';
  }

  return phone.replace(/\D/g, '');
}

function formatTotalAmount(amount: number) {
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPayeeDisplayName(user?: UserView, fallbackName?: string) {
  return user?.alias?.trim() || user?.name || fallbackName || 'Sin asignar';
}

function getRawPaymentHandle(paymentHandle?: string) {
  const normalizedPaymentHandle = paymentHandle?.trim();

  return normalizedPaymentHandle || null;
}

function formatPaymentHandleForShare(paymentHandle?: string) {
  const normalizedPaymentHandle = getRawPaymentHandle(paymentHandle);

  if (!normalizedPaymentHandle) {
    return null;
  }

  if (detectPaymentHandleKind(normalizedPaymentHandle) === 'link') {
    return normalizedPaymentHandle;
  }

  return `${getPaymentHandleLabel(normalizedPaymentHandle)}: ${normalizedPaymentHandle}`;
}

const APP_SHARE_LINK = APP_PUBLIC_URL;

function buildGroupAmountsMessage(groupName: string, expenses: ExpenseView[], users: UserView[]) {
  const summary = calculateDetailedSettlement(expenses, users);
  const footerLines = [
    '**',
    `Este mensaje fue creado por ${APP_DISPLAY_NAME}.`,
    APP_SHARE_LINK,
    'Muchas gracias por usar la aplicación.',
  ];

  if (summary.members.length === 0) {
    return [
      groupName,
      '',
      'No hay movimientos cargados para este grupo.',
      '',
      ...footerLines,
    ].join('\n');
  }

  const participantCount = summary.participants.length;
  const divisionPerParticipant = participantCount > 0 ? summary.totalAmount / participantCount : 0;
  const payerUsers = new Map(users.map(user => [user._id.toString(), user]));

  const payerLines = summary.payers.length === 0
    ? ['- No hubo pagadores cargados.']
    : summary.payers.map(payer => `- ${payer.userName}: puso $${formatTotalAmount(payer.paid)} en total`);

  const divisionLines = summary.payers.length === 0
    ? ['- No hay pagos para repartir entre participantes.']
    : summary.payers.map(payer => {
      const payerUser = payerUsers.get(payer.userId);
      const payerName = getPayeeDisplayName(payerUser, payer.userName);
      const paymentHandle = formatPaymentHandleForShare(payerUser?.paymentHandle);
      const amountPerParticipant = participantCount > 0 ? payer.paid / participantCount : 0;

      return `pagar a ${payerName}: $${formatTotalAmount(amountPerParticipant)}${paymentHandle ? ` ${paymentHandle}` : ''}`;
    });

  return [
    groupName,
    '',
    `Total gastado: $${formatTotalAmount(summary.totalAmount)}.`,
    ...payerLines,
    '',
    `PARTICIPANTES: (${participantCount})`,
    `División de los gastos por cada integrante es de: $${formatTotalAmount(divisionPerParticipant)}`,
    ...divisionLines,
    '',
    ...footerLines,
  ].join('\n');
}

function buildIndividualSettlementMessage(transfer: SettlementTransfer, groupName: string, users: UserView[]) {
  const creditor = users.find(user => user._id.toString() === transfer.toUserId);
  const creditorName = getPayeeDisplayName(creditor, transfer.toUserName);
  const paymentHandle = getRawPaymentHandle(creditor?.paymentHandle);

  return [
    groupName,
    '',
    `Te toca pagar $${formatTotalAmount(transfer.amount)} a ${creditorName}.`,
    paymentHandle,
  ].filter(Boolean).join('\n');
}

export default function HomeScreen({ navigation, route }: any) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expenses, setExpenses] = useState<ExpenseView[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [transfers, setTransfers] = useState<SettlementTransfer[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<UserView[]>([]);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName ?? 'Grupo';

  const loadExpenses = async () => {
    if (!groupId) {
      setExpenses([]);
      setUsers([]);
      setUserNames({});
      setBalances([]);
      setTransfers([]);
      return;
    }

    const [expenseData, userData, groupData] = await Promise.all([getExpensesByGroup(groupId), getUsersByGroup(groupId), getGroupById(groupId)]);
    const nextUserNames = userData.reduce<Record<string, string>>((accumulator, user) => {
      accumulator[user._id.toString()] = user.alias?.trim() || user.name;
      return accumulator;
    }, {});
    const settlement = calculateSettlement(expenseData, userData);

    setExpenses(expenseData);
    setUsers(userData);
    setGroupDetails(groupData);
    setUserNames(nextUserNames);
    setBalances(settlement.balances);
    setTransfers(settlement.transfers);
  };

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

    const message = buildGroupAmountsMessage(groupName, expenses, users);
    const groupWhatsappLink = groupDetails?.whatsappGroupLink?.trim();

    if (groupWhatsappLink) {
      try {
        await Clipboard.setStringAsync(message);
        Alert.alert(
          'Mensaje listo',
          `${message.slice(0, 220)}${message.length > 220 ? '...' : ''}`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir grupo',
              onPress: async () => {
                try {
                  await Linking.openURL(groupWhatsappLink);
                } catch {
                  Alert.alert('Error', 'No se pudo abrir el grupo de WhatsApp configurado.');
                }
              },
            },
          ],
        );
        return;
      } catch {
        Alert.alert('Error', 'No se pudo abrir el grupo de WhatsApp configurado.');
        return;
      }
    }

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      const canOpenWhatsapp = await Linking.canOpenURL(whatsappUrl);

      if (canOpenWhatsapp) {
        await Linking.openURL(whatsappUrl);
        return;
      }

      await Share.share({ message, title: 'División de los gastos' });
    } catch {
      Alert.alert('Error', 'No se pudo compartir la liquidación.');
    }
  };

  const handleNotifyTransferByWhatsapp = async (transfer: SettlementTransfer) => {
    const debtor = users.find(user => user._id.toString() === transfer.fromUserId);
    const normalizedPhone = normalizeWhatsappPhone(debtor?.phone);

    if (!normalizedPhone) {
      Alert.alert('Falta teléfono', `No hay un teléfono válido cargado para ${transfer.fromUserName}.`);
      return;
    }

    const message = buildIndividualSettlementMessage(transfer, groupName, users);
    const appUrl = `whatsapp://send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

    try {
      const canOpenWhatsapp = await Linking.canOpenURL(appUrl);

      if (canOpenWhatsapp) {
        await Linking.openURL(appUrl);
        return;
      }

      await Linking.openURL(webUrl);
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp para ese integrante.');
    }
  };

  const handleDeleteExpense = async (expense: ExpenseView) => {
    const shouldDelete = await confirmAction({
      title: 'Eliminar gasto',
      message: `Se va a borrar ${expense.description} por $${formatTotalAmount(expense.amount)}.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteExpense(expense._id.toString());
      await loadExpenses();
      Alert.alert('Gasto eliminado', 'La liquidación del grupo se recalculó automáticamente.');
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el gasto.');
    }
  };

  const handleClearExpenses = async () => {
    if (!groupId) {
      return;
    }

    const shouldClear = await confirmAction({
      title: 'Limpiar gastos',
      message: 'Se van a borrar todos los gastos de este grupo. Los integrantes se conservan, pero la liquidación vuelve a cero.',
      confirmText: 'Limpiar',
      cancelText: 'Cancelar',
      destructive: true,
    });

    if (!shouldClear) {
      return;
    }

    try {
      await deleteExpensesByGroup(groupId);
      await loadExpenses();
      Alert.alert('Gastos limpiados', 'El grupo quedó listo para empezar una nueva ronda de gastos.');
    } catch {
      Alert.alert('Error', 'No se pudieron limpiar los gastos del grupo.');
    }
  };

  useEffect(() => {
    loadExpenses();
    const unsubscribe = navigation.addListener('focus', loadExpenses);

    return unsubscribe;
  }, [groupId, navigation]);

  const renderExpenseItem = ({ item }: { item: ExpenseView }) => {
    const breakdown = calculateExpenseBreakdown(item, users);
    const paymentLabel = breakdown.paymentSummary.length === 0
      ? 'Sin pagos cargados'
      : breakdown.paymentSummary.map(payment => `${payment.userName} $${formatTotalAmount(payment.amount)}`).join(' · ');

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseTitleBlock}>
            <Text style={styles.expenseTitle}>{item.description}</Text>
            <Text style={styles.expenseAmount}>${formatTotalAmount(item.amount)}</Text>
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
              <Text style={styles.breakdownValue}>${formatTotalAmount(share.share)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.inlineActions}>
          <Pressable
            onPress={() => navigation.navigate('AddExpense', { groupId, groupName, expense: item })}
            style={[styles.inlineActionButton, styles.inlineActionPrimary]}
          >
            <Text style={styles.inlineActionPrimaryText}>Editar gasto</Text>
          </Pressable>
          <Pressable
            onPress={() => handleDeleteExpense(item)}
            style={[styles.inlineActionButton, styles.inlineActionDanger]}
          >
            <Text style={styles.inlineActionDangerText}>Eliminar gasto</Text>
          </Pressable>
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
              <Text style={styles.statValue}>${formatTotalAmount(totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.actionsCard}>
            <Text style={styles.sectionHeading}>Acciones</Text>
            <CustomButton title="Agregar Gasto" onPress={() => navigation.navigate('AddExpense', { groupId, groupName })} />
            <CustomButton title="Ver Integrantes" onPress={() => navigation.navigate('Users', { groupId, groupName })} color={colors.success} />
          </View>

          <View style={styles.actionsCard}>
            <Text style={styles.sectionHeading}>Compartir</Text>
            <Text style={styles.shareHint}>Mandá un único mensaje corto con la división de los gastos.</Text>
            <CustomButton title="Compartir mensaje de la división de los gastos" onPress={handleShareSettlement} color="#2563eb" />
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
                    {balance.balance > 0 ? '+' : '-'}${formatTotalAmount(Math.abs(balance.balance))}
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
                  <View style={styles.transferBottomRow}>
                    <View style={styles.transferAmountBlock}>
                      <Text style={styles.transferText}>{transfer.toUserName}</Text>
                      <Text style={styles.transferAmount}>${formatTotalAmount(transfer.amount)}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleNotifyTransferByWhatsapp(transfer)}
                      style={styles.transferWhatsappButton}
                    >
                      <Text style={styles.transferWhatsappText}>WhatsApp</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          <Text style={styles.listHeading}>Gastos registrados</Text>
        </View>
      )}
      ListFooterComponent={expenses.length > 0 ? (
        <View style={styles.footerCard}>
          <Text style={styles.sectionHeading}>Cierre del grupo</Text>
          <Text style={styles.footerText}>
            Cuando ya se liquidó todo y mandaste los mensajes, podés limpiar los gastos para arrancar una ronda nueva sin borrar el grupo.
          </Text>
          <CustomButton title="Limpiar gastos" onPress={handleClearExpenses} color={colors.danger} />
        </View>
      ) : null}
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

const createStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  headerStack: { gap: 12, marginBottom: 16 },
  heroCard: {
    backgroundColor: colors.hero,
    borderRadius: 20,
    padding: 20,
  },
  eyebrow: {
    color: colors.heroMuted,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.textOnHero, marginBottom: 6 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.heroMuted },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  statLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  shareHint: { color: colors.textMuted, lineHeight: 20, marginBottom: 6 },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  breakdownBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  breakdownTitle: { fontWeight: '600', marginBottom: 6, color: colors.text },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownName: { color: colors.textMuted },
  breakdownValue: { color: colors.text, fontWeight: '600' },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  summaryEmpty: { color: colors.textMuted },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryName: { color: colors.text, fontWeight: '500' },
  summaryAmount: { fontWeight: '700' },
  amountPositive: { color: colors.success },
  amountNegative: { color: colors.danger },
  transferCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  transferText: { color: colors.text, fontWeight: '600' },
  transferArrow: { color: colors.textMuted, marginVertical: 2 },
  transferBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, gap: 8 },
  transferAmountBlock: { flex: 1 },
  transferAmount: { color: colors.success, fontWeight: '700', marginTop: 4 },
  transferWhatsappButton: {
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  transferWhatsappText: { color: colors.success, fontWeight: '700' },
  listHeading: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
  expenseSeparator: { height: 12 },
  expenseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  expenseHeader: { marginBottom: 8 },
  expenseTitleBlock: { marginBottom: 8 },
  expenseTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  expenseAmount: { fontSize: 15, color: colors.success, fontWeight: '700', marginTop: 3 },
  payerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.infoSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  payerBadgeText: { color: colors.info, fontWeight: '600', fontSize: 12 },
  expenseMeta: { color: colors.textMuted, lineHeight: 20 },
  inlineActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  inlineActionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  inlineActionPrimary: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  inlineActionDanger: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  inlineActionPrimaryText: { color: colors.primary, fontWeight: '700' },
  inlineActionDangerText: { color: colors.danger, fontWeight: '700' },
  footerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  footerText: { color: colors.textMuted, lineHeight: 20, marginBottom: 6 },
  emptyStateCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptyStateText: { color: colors.textMuted, lineHeight: 21 },
});
