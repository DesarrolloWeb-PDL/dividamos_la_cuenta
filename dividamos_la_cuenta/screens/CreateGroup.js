// Pantalla para crear grupo y seleccionar participantes desde contactos
import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import Contacts from 'react-native-contacts';
import { RealmContext } from '../models';
const { useRealm } = RealmContext;
import { Group } from '../models/Group';
import { Participant } from '../models/Participant';
import { PermissionsAndroid, Platform } from 'react-native';

export default function CreateGroup({ navigation }) {
  const [groupName, setGroupName] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState([]);
  const realm = useRealm();

  async function requestContactsPermission() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async function loadContacts() {
    const hasPermission = await requestContactsPermission();
    if (hasPermission) {
      Contacts.getAll().then(setContacts);
    }
  }

  function toggleSelect(contact) {
    setSelected(prev =>
      prev.some(c => c.recordID === contact.recordID)
        ? prev.filter(c => c.recordID !== contact.recordID)
        : [...prev, contact]
    );
  }

  function createGroup() {
    realm.write(() => {
      const participants = selected.map(contact =>
        realm.create('Participant', {
          name: contact.displayName,
          phone: contact.phoneNumbers?.[0]?.number || '',
          contactId: contact.recordID,
        })
      );
      realm.create('Group', {
        name: groupName,
        participants,
        transactions: [],
      });
    });
    navigation.navigate('HomeScreen');
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20 }}>Nombre del Grupo</Text>
      <TextInput value={groupName} onChangeText={setGroupName} placeholder="Ej: Asado" style={{ borderWidth: 1, marginBottom: 8 }} />
      <Button title="Cargar Contactos" onPress={loadContacts} />
      {contacts.map(contact => (
        <Button
          key={contact.recordID}
          title={contact.displayName}
          color={selected.some(c => c.recordID === contact.recordID) ? 'green' : undefined}
          onPress={() => toggleSelect(contact)}
        />
      ))}
      <Button title="Crear Grupo" onPress={createGroup} disabled={!groupName || selected.length === 0} />
    </View>
  );
}
