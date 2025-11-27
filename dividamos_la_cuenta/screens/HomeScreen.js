// Pantalla principal: listado de grupos y acceso a gastos

import { RealmContext } from '../models';
const { useQuery } = RealmContext;

export default function HomeScreen({ navigation }) {
  const groups = useQuery('Group');

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
