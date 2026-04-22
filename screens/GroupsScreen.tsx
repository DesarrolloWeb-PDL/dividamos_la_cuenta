import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import CustomButton from '../components/CustomButton';
import { APP_DISPLAY_NAME, APP_TAGLINE } from '../services/appConfig';
import { confirmAction } from '../services/dialogService';
import { deleteExpensesByGroup, getAllExpenses } from '../services/expenseService';
import { deleteGroup, getAllGroups } from '../services/groupService';
import { promptPwaInstall, subscribeToPwaInstallState, type PwaInstallState } from '../services/pwaInstallService';
import { deleteUsersByGroup, getAllUsers } from '../services/userService';
import { AppPalette, useAppTheme } from '../theme/appTheme';

type GroupView = {
  _id: { toString(): string } | string;
  name: string;
  description: string;
};

export default function GroupsScreen({ navigation }: any) {
  const { colors, mode, cycleMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [groups, setGroups] = useState<GroupView[]>([]);
  const [memberCountByGroup, setMemberCountByGroup] = useState<Record<string, number>>({});
  const [expenseCountByGroup, setExpenseCountByGroup] = useState<Record<string, number>>({});
  const [pwaInstallState, setPwaInstallState] = useState<PwaInstallState>({
    supported: false,
    installed: false,
    canInstall: false,
    instructions: null,
  });

  const loadGroups = async () => {
    const [groupData, userData, expenseData] = await Promise.all([
      getAllGroups(),
      getAllUsers(),
      getAllExpenses(),
    ]);

    const nextMemberCountByGroup = userData.reduce<Record<string, number>>((accumulator, user) => {
      if (!user.groupId) {
        return accumulator;
      }

      accumulator[user.groupId] = (accumulator[user.groupId] ?? 0) + 1;
      return accumulator;
    }, {});

    const nextExpenseCountByGroup = expenseData.reduce<Record<string, number>>((accumulator, expense) => {
      if (!expense.groupId) {
        return accumulator;
      }

      accumulator[expense.groupId] = (accumulator[expense.groupId] ?? 0) + 1;
      return accumulator;
    }, {});

    setGroups(groupData);
    setMemberCountByGroup(nextMemberCountByGroup);
    setExpenseCountByGroup(nextExpenseCountByGroup);
  };

  const handleDeleteGroup = async (group: GroupView) => {
    const shouldDelete = await confirmAction({
      title: 'Eliminar grupo',
      message: `Se va a borrar ${group.name} con sus integrantes y gastos. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });

    if (!shouldDelete) {
      return;
    }

    try {
      const groupId = group._id.toString();
      await Promise.all([
        deleteGroup(groupId),
        deleteUsersByGroup(groupId),
        deleteExpensesByGroup(groupId),
      ]);
      await loadGroups();
      Alert.alert('Grupo eliminado', 'También se borraron sus integrantes y gastos.');
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el grupo.');
    }
  };

  const handleInstallApp = async () => {
    const wasInstalled = await promptPwaInstall();

    if (wasInstalled) {
      Alert.alert('App instalada', `Ahora podés abrir ${APP_DISPLAY_NAME} desde la pantalla de inicio.`);
      return;
    }

    if (pwaInstallState.instructions) {
      Alert.alert('Instalar app', pwaInstallState.instructions);
    }
  };

  useEffect(() => {
    loadGroups();
    const unsubscribe = navigation.addListener('focus', loadGroups);

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    return subscribeToPwaInstallState(setPwaInstallState);
  }, []);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={groups}
      keyExtractor={item => item._id.toString()}
      renderItem={({ item }) => {
        const groupId = item._id.toString();

        return (
          <View style={styles.groupCard}>
            <Text style={styles.groupTitle}>{item.name}</Text>
            <Text style={styles.groupDescription}>
              {item.description.trim() || 'Grupo listo para dividir cuentas y llevar saldos propios.'}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Integrantes</Text>
                <Text style={styles.statValue}>{memberCountByGroup[groupId] ?? 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Gastos</Text>
                <Text style={styles.statValue}>{expenseCountByGroup[groupId] ?? 0}</Text>
              </View>
            </View>
            <CustomButton
              title="Abrir grupo"
              onPress={() => navigation.navigate('GroupHome', { groupId, groupName: item.name })}
              color="#0f766e"
            />
            <View style={styles.inlineActions}>
              <Pressable
                onPress={() => navigation.navigate('AddGroup', { group: item })}
                style={[styles.inlineActionButton, styles.inlineActionPrimary]}
              >
                <Text style={styles.inlineActionPrimaryText}>Editar</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDeleteGroup(item)}
                style={[styles.inlineActionButton, styles.inlineActionDanger]}
              >
                <Text style={styles.inlineActionDangerText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={(
        <View style={styles.headerStack}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Text style={styles.eyebrow}>Aplicación para dividir gastos</Text>
              <Pressable onPress={cycleMode} style={styles.themeToggle}>
                <Text style={styles.themeToggleIcon}>{mode === 'dark' ? '☀' : '☾'}</Text>
              </Pressable>
            </View>
            <Text style={styles.title}>{APP_DISPLAY_NAME}</Text>
            <Text style={styles.tagline}>{APP_TAGLINE}</Text>
            <Text style={styles.subtitle}>
              Organizá grupos, cargá gastos compartidos y resolvé cuánto tiene que pagar cada integrante sin mensajes eternos ni cuentas confusas.
            </Text>
          </View>
          <View style={styles.actionsCard}>
            <Text style={styles.sectionHeading}>Pantalla principal</Text>
            <Text style={styles.introText}>
              Cada grupo conserva su propia liquidación, sus integrantes y sus gastos para que puedas ordenar viajes, salidas o compras comunes en pocos pasos.
            </Text>
            <CustomButton title="Crear nuevo grupo" onPress={() => navigation.navigate('AddGroup')} />
          </View>
          <View style={styles.signatureCard}>
            <Text style={styles.signatureLabel}>Última versión</Text>
            <Text style={styles.signatureText}>Desarrollado por Desarrollo Web - PDL</Text>
          </View>
          {pwaInstallState.supported && !pwaInstallState.installed ? (
            <View style={styles.installCard}>
              <Text style={styles.sectionHeading}>Instalar app</Text>
              <Text style={styles.installText}>
                {pwaInstallState.canInstall
                  ? 'Si la abriste desde el celular, ya podés instalarla y usarla como acceso directo.'
                  : pwaInstallState.instructions}
              </Text>
              <CustomButton
                title={pwaInstallState.canInstall ? 'Instalar en este dispositivo' : 'Ver cómo instalarla'}
                onPress={handleInstallApp}
                color="#0f766e"
              />
            </View>
          ) : null}
        </View>
      )}
      ListEmptyComponent={(
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>Todavía no hay grupos</Text>
          <Text style={styles.emptyStateText}>
            Creá un grupo para separar cuentas de salidas, viajes o cualquier plan compartido.
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
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: {
    color: colors.heroMuted,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  themeToggle: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: colors.heroMuted,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  themeToggleIcon: { color: colors.textOnHero, fontWeight: '700', fontSize: 18 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textOnHero, marginBottom: 6 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.heroMuted },
  tagline: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.heroMuted,
    marginBottom: 10,
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  introText: { color: colors.textMuted, lineHeight: 20, marginBottom: 4 },
  installCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.success,
  },
  signatureCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signatureLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  signatureText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  installText: { color: colors.textMuted, lineHeight: 20 },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  separator: { height: 12 },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  groupTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
  groupDescription: { color: colors.textMuted, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
  },
  inlineActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
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
  statLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  emptyStateCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptyStateText: { color: colors.textMuted, lineHeight: 21 },
});