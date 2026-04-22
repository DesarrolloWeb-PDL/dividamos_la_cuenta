import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Linking, Pressable, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { confirmAction } from '../services/dialogService';
import { deleteExpense, deleteExpensesByGroup, getExpensesByGroup } from '../services/expenseService';
import { getUsersByGroup } from '../services/userService';
import { getGroupById } from '../services/groupService';
import { APP_PUBLIC_URL } from '../services/appConfig';
import { calculateDetailedSettlement, calculateExpenseBreakdown, calculateSettlement, formatSettlementMessage, SettlementMessageVariant, SettlementTransfer, UserBalance } from '../services/settlementService';
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
  return amount.toFixed(2);
}

function formatPerParticipantAmount(amount: number) {
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildPayerTarget(user: UserView) {
  const displayName = user.alias?.trim() || user.name;
  const paymentHandle = user.paymentHandle?.trim();

  if (!paymentHandle) {
    return displayName;
  }

  return `${displayName}: ${paymentHandle}`;
}

function buildPayerTargetByValues(name: string, paymentHandle?: string) {
  if (!paymentHandle) {
    return name;
  }

  return `${name}: ${paymentHandle}`;
}

const APP_SHARE_LINK = APP_PUBLIC_URL;

function buildSettlementBaseLines(expenses: ExpenseView[], users: UserView[]) {
  const summary = calculateDetailedSettlement(expenses, users);

  if (summary.members.length === 0) {
    return [
      'No hay movimientos cargados para este grupo.',
    ];
  }

  const participants = summary.participants;
  const participantCount = participants.length;
  const divisionPerParticipant = participantCount > 0 ? summary.totalAmount / participantCount : 0;
  const payerUsers = new Map(users.map(user => [user._id.toString(), user]));

  const payerLines = summary.payers.length === 0
    ? ['- No hubo pagadores cargados.']
    : summary.payers.map(payer => `- ${payer.userName}: puso $${formatTotalAmount(payer.paid)} en total`);

  const distributionLines = summary.payers.length === 0
    ? ['- No hay pagos para repartir entre participantes.']
    : summary.payers.map(payer => {
      const payerUser = payerUsers.get(payer.userId);
      const payerTarget = payerUser ? buildPayerTarget(payerUser) : payer.userName;
      const amountPerParticipant = participantCount > 0 ? payer.paid / participantCount : 0;

      return `Cada integrante tiene que pagar $${formatPerParticipantAmount(amountPerParticipant)} A ${payerTarget}`;
    });

  const transferLines = !summary.isUniformSplit
    ? (
      summary.transfers.length === 0
        ? ['- No hay transferencias pendientes.']
        : summary.transfers.map(transfer => {
          const payerUser = payerUsers.get(transfer.toUserId);
          const payerTarget = buildPayerTargetByValues(
            payerUser?.alias?.trim() || payerUser?.name || transfer.toUserName,
            payerUser?.paymentHandle?.trim(),
          );

          return `- ${transfer.fromUserName} paga $${formatPerParticipantAmount(transfer.amount)} a ${payerTarget}`;
        })
    )
    : [];

  return [
    `Total gastado: $${formatTotalAmount(summary.totalAmount)}.`,
    ...payerLines,
    '',
    `PARTICIPANTES: (${participantCount})`,
    summary.isUniformSplit
      ? `División total c/u: $${formatPerParticipantAmount(divisionPerParticipant)}`
      : 'División variable según los gastos en los que participó cada integrante.',
    ...(summary.isUniformSplit ? distributionLines : []),
    ...transferLines,
  ];
}

function buildGroupAmountsMessage(groupName: string, expenses: ExpenseView[], users: UserView[]) {
  const footerLines = [
    '****',
    'Este mensaje fue creado por la aplicación Cuentas Claras.',
    APP_SHARE_LINK,
    'Muchas gracias por usar la aplicación.',
  ];
  const baseLines = buildSettlementBaseLines(expenses, users);

  return [
    groupName,
    '',
    ...baseLines,
    '',
    ...footerLines,
  ].join('\n');
}

function buildShortGroupMessage(groupName: string, expenses: ExpenseView[], users: UserView[], transfers: SettlementTransfer[]) {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const usersById = new Map(users.map(user => [user._id.toString(), user]));

  if (transfers.length === 0) {
    return [
      groupName,
      '',
      `Total gastado: $${formatTotalAmount(totalAmount)}.`,
      'No hay transferencias pendientes.',
    ].join('\n');
  }

  return [
    groupName,
    '',
    `Total gastado: $${formatTotalAmount(totalAmount)}.`,
    '',
    ...transfers.map(transfer => {
      const creditor = usersById.get(transfer.toUserId);
      const creditorTarget = buildPayerTargetByValues(
        creditor?.alias?.trim() || creditor?.name || transfer.toUserName,
        creditor?.paymentHandle?.trim(),
      );

      return `- ${transfer.fromUserName} paga $${transfer.amount.toFixed(2)} a ${creditorTarget}`;
    }),
  ].join('\n');
}

function buildIndividualSettlementMessage(transfer: SettlementTransfer, groupName: string, expenses: ExpenseView[], users: UserView[]) {
  const summary = calculateDetailedSettlement(expenses, users);
  const footerLines = [
    '**',
    'Este mensaje fue creado por la aplicación Cuentas Claras.',
    APP_SHARE_LINK,
    'Muchas gracias por usar la aplicación.',
  ];
  const creditor = users.find(user => user._id.toString() === transfer.toUserId);
  const creditorTarget = buildPayerTargetByValues(
    creditor?.alias?.trim() || creditor?.name || transfer.toUserName,
    creditor?.paymentHandle?.trim(),
  );

  if (!summary.isUniformSplit) {
    return [
      groupName,
      '',
      `Total gastado: $${formatTotalAmount(summary.totalAmount)}.`,
      `Te toca pagar $${transfer.amount.toFixed(2)} a ${creditorTarget}.`,
      '',
      ...footerLines,
    ].join('\n');
  }

  const baseLines = buildSettlementBaseLines(expenses, users);

  return [
    groupName,
    '',
    ...baseLines,
    '',
    ...footerLines,
  ].join('\n');
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

  const handleShareSettlement = async (variant: SettlementMessageVariant) => {
    if (expenses.length === 0) {
      Alert.alert('Sin datos', 'Agregá al menos un gasto antes de compartir la liquidación.');
      return;
    }

    const messageTitleByVariant: Record<SettlementMessageVariant, string> = {
      full: 'Monto por integrante',
      'transfers-only': 'Liquidación sugerida',
      short: 'Mensaje corto',
    };
    const message = variant === 'full'
      ? buildGroupAmountsMessage(groupName, expenses, users)
      : variant === 'short'
        ? buildShortGroupMessage(groupName, expenses, users, transfers)
      : `${groupName}\n\n${formatSettlementMessage({ balances, transfers }, variant)}`;
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

      await Share.share({ message, title: messageTitleByVariant[variant] });
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

    const message = buildIndividualSettlementMessage(transfer, groupName, expenses, users);
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
      message: `Se va a borrar ${expense.description} por $${expense.amount.toFixed(2)}.`,
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
              <Text style={styles.statValue}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.actionsCard}>
            <Text style={styles.sectionHeading}>Acciones</Text>
            <CustomButton title="Agregar Gasto" onPress={() => navigation.navigate('AddExpense', { groupId, groupName })} />
            <CustomButton title="Ver Integrantes" onPress={() => navigation.navigate('Users', { groupId, groupName })} color={colors.success} />
          </View>

          <View style={styles.actionsCard}>
            <Text style={styles.sectionHeading}>Compartir</Text>
            <Text style={styles.shareHint}>Elegí el formato que querés mandar por WhatsApp o por el share del sistema.</Text>
            <CustomButton title="Compartir monto por integrante" onPress={() => handleShareSettlement('full')} color="#198754" />
            <CustomButton title="Compartir sólo transferencias" onPress={() => handleShareSettlement('transfers-only')} color="#0f766e" />
            <CustomButton title="Compartir mensaje corto" onPress={() => handleShareSettlement('short')} color="#2563eb" />
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
                  <View style={styles.transferBottomRow}>
                    <View style={styles.transferAmountBlock}>
                      <Text style={styles.transferText}>{transfer.toUserName}</Text>
                      <Text style={styles.transferAmount}>${transfer.amount.toFixed(2)}</Text>
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
