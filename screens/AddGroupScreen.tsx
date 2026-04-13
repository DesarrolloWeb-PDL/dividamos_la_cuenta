import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import CustomButton from '../components/CustomButton';
import { addGroup, updateGroup } from '../services/groupService';
import { AppPalette, useAppTheme } from '../theme/appTheme';

export default function AddGroupScreen({ navigation, route }: any) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const existingGroup = route?.params?.group;
  const isEditing = Boolean(existingGroup?._id);

  useEffect(() => {
    if (!existingGroup) {
      setName('');
      setDescription('');
      setWhatsappGroupLink('');
      return;
    }

    setName(existingGroup.name ?? '');
    setDescription(existingGroup.description ?? '');
    setWhatsappGroupLink(existingGroup.whatsappGroupLink ?? '');
  }, [existingGroup]);

  const handleAddGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Poné un nombre para el grupo.');
      return;
    }

    if (isEditing) {
      const updatedGroup = await updateGroup(existingGroup._id.toString(), {
        name: name.trim(),
        description: description.trim(),
        whatsappGroupLink: whatsappGroupLink.trim(),
      });

      if (!updatedGroup) {
        Alert.alert('Error', 'No se pudo actualizar el grupo.');
        return;
      }

      Alert.alert('Éxito', 'Grupo actualizado');
      navigation.replace('GroupHome', {
        groupId: updatedGroup._id.toString(),
        groupName: updatedGroup.name,
      });
      return;
    }

    const group = await addGroup({
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date(),
      whatsappGroupLink: whatsappGroupLink.trim(),
    });

    Alert.alert('Éxito', 'Grupo creado');
    navigation.replace('GroupHome', {
      groupId: group._id.toString(),
      groupName: group.name,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Editar grupo' : 'Crear grupo'}</Text>
      <Text style={styles.subtitle}>
        {isEditing
          ? 'Ajustá el nombre o la descripción para mantener tus grupos ordenados.'
          : 'Usá un grupo distinto para cada salida, viaje o mesa que quieras liquidar aparte.'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del grupo"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descripción opcional"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />
      <TextInput
        style={styles.input}
        placeholder="Link opcional del grupo de WhatsApp"
        placeholderTextColor={colors.textMuted}
        value={whatsappGroupLink}
        onChangeText={setWhatsappGroupLink}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.helperText}>Si lo cargás, el share general copia el mensaje y abre ese grupo para pegarlo ahí.</Text>
      <CustomButton title={isEditing ? 'Guardar cambios' : 'Crear grupo'} onPress={handleAddGroup} />
    </View>
  );
}

const createStyles = (colors: AppPalette) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: colors.text },
  subtitle: { color: colors.textMuted, lineHeight: 21, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 12, color: colors.text, backgroundColor: colors.surface },
  helperText: { color: colors.textMuted, lineHeight: 20, marginBottom: 8 },
  textArea: { minHeight: 96 },
});