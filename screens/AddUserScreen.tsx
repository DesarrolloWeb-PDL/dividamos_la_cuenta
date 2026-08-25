import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import CustomButton from '../components/CustomButton';
import { getPaymentHandleLabel, validatePaymentHandle } from '../services/paymentHandle';
import { addUser, getUsersByGroup, updateUser } from '../services/userService';
import { AppPalette, useAppTheme } from '../theme/appTheme';

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export default function AddUserScreen({ navigation, route }: any) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alias, setAlias] = useState('');
  const [paymentHandle, setPaymentHandle] = useState('');
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName ?? 'este grupo';
  const draftContact = route?.params?.draftContact;
  const draftToken = route?.params?.draftToken;
  const existingUser = route?.params?.user;
  const isEditing = Boolean(existingUser?._id);
  const paymentHandleLabel = paymentHandle.trim() ? getPaymentHandleLabel(paymentHandle) : null;

  useEffect(() => {
    if (existingUser) {
      setName(existingUser.name ?? '');
      setPhone(existingUser.phone ?? '');
      setAlias(existingUser.alias ?? '');
      setPaymentHandle(existingUser.paymentHandle ?? '');
      return;
    }

    if (draftContact) {
      setName(draftContact.name ?? '');
      setPhone(draftContact.phone ?? '');
      setAlias(draftContact.alias ?? '');
      setPaymentHandle('');
      return;
    }

    setName('');
    setPhone('');
    setAlias('');
    setPaymentHandle('');
  }, [draftContact, draftToken, existingUser]);

  const handleAdd = async () => {
    if (!groupId) {
      Alert.alert('Error', 'No se encontró el grupo para agregar integrantes.');
      return;
    }

    if (!name || !phone) {
      Alert.alert('Error', 'Completá nombre y teléfono');
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    const groupUsers = await getUsersByGroup(groupId);
    const duplicatedUser = groupUsers.find(user => (
      normalizePhone(user.phone) === normalizedPhone
      && user._id.toString() !== existingUser?._id?.toString()
    ));

    if (duplicatedUser) {
      Alert.alert('Duplicado', 'Ya existe un integrante en este grupo con ese teléfono.');
      return;
    }

    const paymentHandleError = validatePaymentHandle(paymentHandle);

    if (paymentHandleError) {
      Alert.alert('Dato de cobro inválido', paymentHandleError);
      return;
    }

    if (isEditing) {
      const updatedUser = await updateUser(existingUser._id.toString(), {
        name: name.trim(),
        phone: phone.trim(),
        alias: alias.trim(),
        paymentHandle: paymentHandle.trim(),
      });

      if (!updatedUser) {
        Alert.alert('Error', 'No se pudo actualizar el integrante.');
        return;
      }

      Alert.alert('Éxito', 'Integrante actualizado');
      navigation?.goBack && navigation.goBack();
      return;
    }

    await addUser({
      groupId,
      name: name.trim(),
      phone: phone.trim(),
      alias: alias.trim(),
      paymentHandle: paymentHandle.trim(),
    });
    Alert.alert('Éxito', 'Usuario agregado');
    setName('');
    setPhone('');
    setAlias('');
    setPaymentHandle('');
    navigation?.goBack && navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Editar integrante' : 'Agregar integrante'}</Text>
      <Text style={styles.subtitle}>Se suma a {groupName}.</Text>
      {draftContact && !isEditing ? <Text style={styles.importedBadge}>Contacto importado del teléfono</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        placeholderTextColor={colors.textMuted}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Alias (opcional)"
        placeholderTextColor={colors.textMuted}
        value={alias}
        onChangeText={setAlias}
      />
      <TextInput
        style={styles.input}
        placeholder="Alias, CVU o link de cobro (opcional)"
        placeholderTextColor={colors.textMuted}
        value={paymentHandle}
        onChangeText={setPaymentHandle}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {paymentHandleLabel ? <Text style={styles.helperText}>Se detecta como {paymentHandleLabel.toLowerCase()}.</Text> : null}
      <CustomButton title={isEditing ? 'Guardar cambios' : 'Agregar integrante'} onPress={handleAdd} />
    </View>
  );
}

const createStyles = (colors: AppPalette) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: colors.text },
  subtitle: { color: colors.textMuted, lineHeight: 20, marginBottom: 16 },
  importedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successSoft,
    color: colors.success,
    fontWeight: '700',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 10, marginBottom: 12, color: colors.text, backgroundColor: colors.surface },
  helperText: { color: colors.textMuted, marginTop: -4, marginBottom: 12 },
});
