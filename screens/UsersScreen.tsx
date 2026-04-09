
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getUsersByGroup } from '../services/userService';
import CustomButton from '../components/CustomButton';


export default function UsersScreen({ navigation, route }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName ?? 'Grupo';

  useEffect(() => {
    const loadUsers = async () => {
      if (!groupId) {
        setUsers([]);
        return;
      }

      const data = await getUsersByGroup(groupId);
      setUsers(data);
    };

    loadUsers();
    const unsubscribe = navigation.addListener('focus', loadUsers);

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Integrantes</Text>
      <Text style={styles.subtitle}>{groupName}</Text>
      <CustomButton title="Agregar integrante" onPress={() => navigation.navigate('AddUser', { groupId, groupName })} />
      <FlatList
        data={users}
        keyExtractor={item => item._id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.alias?.trim() || item.name}</Text>
            <Text style={styles.itemMeta}>{item.name} · {item.phone}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No hay integrantes en este grupo todavía.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { color: '#475569', marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  itemMeta: { color: '#64748b', marginTop: 2 },
});
