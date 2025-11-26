// Pantalla principal: listado de grupos y acceso a gastos

import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { getRealm } from '../services/realm';

export default function HomeScreen({ navigation }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    let realm;
    (async () => {
      realm = await getRealm();
      const realmGroups = realm.objects('Group');
      setGroups([...realmGroups]);
    })();
    return () => {
      if (realm) realm.close();
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Dividamos la Cuenta</Text>
      <Button title="Crear Grupo" onPress={() => navigation.navigate('CreateGroup')} />
      <FlatList
        data={groups}
        keyExtractor={item => item.id?.toString()}
        renderItem={({ item }) => (
          <Button title={item.name} onPress={() => navigation.navigate('GroupDetail', { groupId: item.id?.toString() })} />
        )}
        ListEmptyComponent={<Text>No hay grupos aún.</Text>}
      />
    </View>
  );
}
