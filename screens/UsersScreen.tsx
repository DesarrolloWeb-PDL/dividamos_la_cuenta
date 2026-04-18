
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Pressable, TextInput } from 'react-native';
import { importSingleContactDraft } from '../services/contactImportService';
import { confirmAction } from '../services/dialogService';
import { isUserLinkedToGroupExpenses } from '../services/expenseService';
import { detectPaymentHandleKind, getPaymentHandleLabel } from '../services/paymentHandle';
import { addUser, deleteUser, getUsersByGroup } from '../services/userService';
import CustomButton from '../components/CustomButton';
import { AppPalette, useAppTheme } from '../theme/appTheme';


export default function UsersScreen({ navigation, route }: any) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [users, setUsers] = useState<any[]>([]);
  const [inviteCount, setInviteCount] = useState('');
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName ?? 'Grupo';

  const loadUsers = async () => {
    if (!groupId) {
      setUsers([]);
      return;
    }

    const data = await getUsersByGroup(groupId);
    setUsers(data);
  };

  const navigateToAddUser = (draftContact: { name: string; phone: string; alias: string } | null) => {
    navigation.navigate('AddUser', {
      groupId,
      groupName,
      draftContact,
      draftToken: Date.now(),
    });
  };

  const handleDeleteUser = async (user: any) => {
    const shouldDelete = await confirmAction({
      title: 'Eliminar integrante',
      message: `Se va a borrar ${user.alias?.trim() || user.name}.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });

    if (!shouldDelete || !groupId) {
      return;
    }

    try {
      const isLinked = await isUserLinkedToGroupExpenses(groupId, user._id.toString());

      if (isLinked) {
        Alert.alert(
          'No se puede eliminar',
          'Este integrante ya participa en gastos del grupo. Primero tendrías que borrar esos gastos para no romper la liquidación.',
        );
        return;
      }

      await deleteUser(user._id.toString());
      await loadUsers();
      Alert.alert('Integrante eliminado', 'El integrante se borró del grupo.');
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el integrante.');
    }
  };

  const handleImportContact = async () => {
    const result = await importSingleContactDraft();

    if (result.status === 'success') {
      navigateToAddUser(result.draft);
      return;
    }

    if (result.status === 'cancelled') {
      return;
    }

    if (result.status === 'unsupported') {
      Alert.alert('No disponible', 'Este navegador no permite elegir contactos. En Chrome para Android sí debería funcionar y, si no, podés cargar el integrante manualmente.');
      return;
    }

    if (result.status === 'permission-denied') {
      Alert.alert('Permiso requerido', 'Necesitás permitir acceso a contactos para importar integrantes.');
      return;
    }

    if (result.status === 'missing-phone') {
      Alert.alert('Sin teléfono', 'El contacto elegido no tiene un número de teléfono utilizable.');
      return;
    }

    Alert.alert('Error', result.message);
  };

  const handleGenerateQuickUsers = async () => {
    const targetCount = Number(inviteCount.trim());

    if (!inviteCount.trim() || Number.isNaN(targetCount) || targetCount <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresá una cantidad válida de integrantes.');
      return;
    }

    if (!groupId) {
      Alert.alert('Error', 'No se encontró el grupo para generar integrantes.');
      return;
    }

    if (users.length >= targetCount) {
      Alert.alert(
        'Sin cambios',
        `Este grupo ya tiene ${users.length} integrante${users.length === 1 ? '' : 's'}. No hace falta generar más para llegar a ${targetCount}.`,
      );
      return;
    }

    const generatedIndexes = users.reduce<number[]>((accumulator, user) => {
      const label = user.alias?.trim() || user.name;
      const match = label.match(/^Integrante (\d+)$/i);

      if (match) {
        accumulator.push(Number(match[1]));
      }

      return accumulator;
    }, []);

    const nextIndexBase = generatedIndexes.length > 0 ? Math.max(...generatedIndexes) : 0;
    const missingCount = targetCount - users.length;

    try {
      for (let index = 0; index < missingCount; index += 1) {
        const userNumber = nextIndexBase + index + 1;

        await addUser({
          groupId,
          name: `Integrante ${userNumber}`,
          alias: `Integrante ${userNumber}`,
          phone: '',
          paymentHandle: '',
        });
      }

      await loadUsers();
      Alert.alert(
        'Integrantes generados',
        `Se agregaron ${missingCount} integrante${missingCount === 1 ? '' : 's'} automáticos para llegar a ${targetCount}.`,
      );
    } catch {
      Alert.alert('Error', 'No se pudieron generar los integrantes automáticos.');
    }
  };

  useEffect(() => {
    loadUsers();
    const unsubscribe = navigation.addListener('focus', loadUsers);

    return unsubscribe;
  }, [groupId, navigation]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={users}
      keyExtractor={item => item._id.toString()}
      renderItem={({ item }) => {
          const paymentHandleKind = detectPaymentHandleKind(item.paymentHandle);
          const paymentBadgeStyle = paymentHandleKind === 'link'
            ? styles.paymentBadgelink
            : paymentHandleKind === 'cvu'
              ? styles.paymentBadgecvu
              : styles.paymentBadgealias;
          const paymentBadgeTextStyle = paymentHandleKind === 'link'
            ? styles.paymentBadgeTextlink
            : paymentHandleKind === 'cvu'
              ? styles.paymentBadgeTextcvu
              : styles.paymentBadgeTextalias;

          return (
            <View style={styles.item}>
              <Text style={styles.itemName}>{item.alias?.trim() || item.name}</Text>
              <Text style={styles.itemMeta}>{item.phone?.trim() ? `${item.name} · ${item.phone}` : 'Integrante rápido sin teléfono'}</Text>
              {item.paymentHandle?.trim() ? (
                <View style={[styles.paymentBadge, paymentBadgeStyle]}>
                  <Text style={[styles.paymentBadgeText, paymentBadgeTextStyle]}>
                    {getPaymentHandleLabel(item.paymentHandle)}
                  </Text>
                  <Text style={styles.paymentValue}>{item.paymentHandle}</Text>
                </View>
              ) : null}
              <View style={styles.itemActions}>
                <Pressable
                  onPress={() => navigation.navigate('AddUser', { groupId, groupName, user: item })}
                  style={[styles.actionButton, styles.editButton]}
                >
                  <Text style={styles.editButtonText}>Editar</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteUser(item)}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={(
        <View style={styles.headerStack}>
          <Text style={styles.title}>Integrantes</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
          <CustomButton title="Agregar integrante" onPress={() => navigateToAddUser(null)} />
          <CustomButton title="Importar desde contactos" onPress={handleImportContact} color="#198754" />
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>Generar integrantes rápidos</Text>
            <Text style={styles.inviteText}>Si no querés cargar integrantes uno por uno, indicá cuántos son y la app va a crear integrantes automáticos para dividir los gastos por esa cantidad.</Text>
            <TextInput
              style={styles.input}
              placeholder="Cantidad de integrantes"
              placeholderTextColor={colors.textMuted}
              value={inviteCount}
              onChangeText={setInviteCount}
              keyboardType="numeric"
            />
            <CustomButton title="Generar integrantes automáticos" onPress={handleGenerateQuickUsers} color={colors.primary} />
          </View>
          <Text style={styles.helperText}>En Android nativo funciona con la agenda del teléfono. En Chrome para Android, si el navegador lo soporta, también podés elegir un contacto.</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No hay integrantes en este grupo todavía.</Text>}
    />
  );
}

const createStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  headerStack: { marginBottom: 12 },
  separator: { height: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: colors.text },
  subtitle: { color: colors.textMuted, marginBottom: 16 },
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  inviteTitle: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  inviteText: { color: colors.textMuted, lineHeight: 20, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    color: colors.text,
    backgroundColor: colors.background,
  },
  helperText: { color: colors.textMuted, lineHeight: 20, marginBottom: 12 },
  emptyText: { color: colors.textMuted },
  item: { padding: 12, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 8 },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemMeta: { color: colors.textMuted, marginTop: 2 },
  paymentBadge: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  paymentBadgealias: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  paymentBadgecvu: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
  paymentBadgelink: { backgroundColor: colors.successSoft, borderColor: colors.success },
  paymentBadgeText: { fontWeight: '700', marginBottom: 2 },
  paymentBadgeTextalias: { color: colors.primary },
  paymentBadgeTextcvu: { color: colors.warning },
  paymentBadgeTextlink: { color: colors.success },
  paymentValue: { color: colors.textMuted },
  itemActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  editButton: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  deleteButton: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  editButtonText: { color: colors.primary, fontWeight: '700' },
  deleteButtonText: { color: colors.danger, fontWeight: '700' },
});
