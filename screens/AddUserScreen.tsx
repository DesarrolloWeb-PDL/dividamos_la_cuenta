import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import CustomButton from '../components/CustomButton';
import { addUser, getUsersByGroup } from '../services/userService';

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export default function AddUserScreen({ navigation, route }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alias, setAlias] = useState('');
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName ?? 'este grupo';
  const draftContact = route?.params?.draftContact;
  const draftToken = route?.params?.draftToken;

  useEffect(() => {
    if (draftContact) {
      setName(draftContact.name ?? '');
      setPhone(draftContact.phone ?? '');
      setAlias(draftContact.alias ?? '');
      return;
    }

    setName('');
    setPhone('');
    setAlias('');
  }, [draftContact, draftToken]);

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
    const duplicatedUser = groupUsers.find(user => normalizePhone(user.phone) === normalizedPhone);

    if (duplicatedUser) {
      Alert.alert('Duplicado', 'Ya existe un integrante en este grupo con ese teléfono.');
      return;
    }

    await addUser({
      groupId,
      name: name.trim(),
      phone: phone.trim(),
      alias: alias.trim(),
    });
    Alert.alert('Éxito', 'Usuario agregado');
    setName('');
    setPhone('');
    setAlias('');
    navigation?.goBack && navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar integrante</Text>
      <Text style={styles.subtitle}>Se suma a {groupName}.</Text>
      {draftContact ? <Text style={styles.importedBadge}>Contacto importado del teléfono</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Alias (opcional)"
        value={alias}
        onChangeText={setAlias}
      />
      <CustomButton title="Agregar integrante" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { color: '#475569', lineHeight: 20, marginBottom: 16 },
  importedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontWeight: '700',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
});
