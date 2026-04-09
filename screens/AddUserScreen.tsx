import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { addUser } from '../services/userService';

export default function AddUserScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alias, setAlias] = useState('');

  const handleAdd = async () => {
    if (!name || !phone) {
      Alert.alert('Error', 'Completá nombre y teléfono');
      return;
    }
    await addUser({
      name,
      phone,
      alias,
    });
    Alert.alert('Éxito', 'Usuario agregado');
    setName('');
    setPhone('');
    setAlias('');
    navigation?.goBack && navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar Usuario</Text>
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
      <Button title="Agregar" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
});
