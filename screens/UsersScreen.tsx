
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getAllUsers } from '../services/userService';
import CustomButton from '../components/CustomButton';


export default function UsersScreen({ navigation }: any) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const data = await getAllUsers();
      setUsers(data);
    };

    loadUsers();
    const unsubscribe = navigation.addListener('focus', loadUsers);

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Usuarios</Text>
      <CustomButton title="Agregar Usuario" onPress={() => navigation.navigate('AddUser')} />
      <FlatList
        data={users}
        keyExtractor={item => item._id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name} ({item.phone})</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No hay usuarios aún.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
});
