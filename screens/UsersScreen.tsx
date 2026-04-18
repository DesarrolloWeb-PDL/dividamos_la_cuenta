
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Pressable } from 'react-native';
import { importSingleContactDraft } from '../services/contactImportService';
import { confirmAction } from '../services/dialogService';
import { isUserLinkedToGroupExpenses } from '../services/expenseService';
import { detectPaymentHandleKind, getPaymentHandleLabel } from '../services/paymentHandle';
import { deleteUser, getUsersByGroup } from '../services/userService';
import CustomButton from '../components/CustomButton';
import { AppPalette, useAppTheme } from '../theme/appTheme';


export default function UsersScreen({ navigation, route }: any) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [users, setUsers] = useState<any[]>([]);
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

  useEffect(() => {
    loadUsers();
    const unsubscribe = navigation.addListener('focus', loadUsers);

    return unsubscribe;
  }, [groupId, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Integrantes</Text>
      <Text style={styles.subtitle}>{groupName}</Text>
      <CustomButton title="Agregar integrante" onPress={() => navigateToAddUser(null)} />
      <CustomButton title="Importar desde contactos" onPress={handleImportContact} color="#198754" />
      <Text style={styles.helperText}>En Android nativo funciona con la agenda del teléfono. En Chrome para Android, si el navegador lo soporta, también podés elegir un contacto.</Text>
      <FlatList
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
              <Text style={styles.itemMeta}>{item.name} · {item.phone}</Text>
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
        ListEmptyComponent={<Text>No hay integrantes en este grupo todavía.</Text>}
      />
    </View>
  );
}

const createStyles = (colors: AppPalette) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: colors.text },
  subtitle: { color: colors.textMuted, marginBottom: 16 },
  helperText: { color: colors.textMuted, lineHeight: 20, marginBottom: 12 },
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
