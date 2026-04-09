import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import CustomButton from '../components/CustomButton';
import { addGroup } from '../services/groupService';

export default function AddGroupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAddGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Poné un nombre para el grupo.');
      return;
    }

    const group = await addGroup({
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date(),
    });

    Alert.alert('Éxito', 'Grupo creado');
    navigation.replace('GroupHome', {
      groupId: group._id.toString(),
      groupName: group.name,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear grupo</Text>
      <Text style={styles.subtitle}>
        Usá un grupo distinto para cada salida, viaje o mesa que quieras liquidar aparte.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del grupo"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descripción opcional"
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />
      <CustomButton title="Crear grupo" onPress={handleAddGroup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#475569', lineHeight: 21, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  textArea: { minHeight: 96 },
});