import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import CustomButton from '../components/CustomButton';
import { addUser } from '../services/userService';

export default function AddUserScreen({ navigation, route }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alias, setAlias] = useState('');
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName ?? 'este grupo';

  const handleAdd = async () => {
    if (!groupId) {
      Alert.alert('Error', 'No se encontró el grupo para agregar integrantes.');
      return;
    }

    if (!name || !phone) {
      Alert.alert('Error', 'Completá nombre y teléfono');
      return;
    }
    await addUser({
      groupId,
      name,
      phone,
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
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
});
