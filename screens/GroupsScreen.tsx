import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import CustomButton from '../components/CustomButton';
import { getAllExpenses } from '../services/expenseService';
import { getAllGroups } from '../services/groupService';
import { getAllUsers } from '../services/userService';

type GroupView = {
  _id: { toString(): string } | string;
  name: string;
  description: string;
};

export default function GroupsScreen({ navigation }: any) {
  const [groups, setGroups] = useState<GroupView[]>([]);
  const [memberCountByGroup, setMemberCountByGroup] = useState<Record<string, number>>({});
  const [expenseCountByGroup, setExpenseCountByGroup] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadGroups = async () => {
      const [groupData, userData, expenseData] = await Promise.all([
        getAllGroups(),
        getAllUsers(),
        getAllExpenses(),
      ]);

      const nextMemberCountByGroup = userData.reduce<Record<string, number>>((accumulator, user) => {
        if (!user.groupId) {
          return accumulator;
        }

        accumulator[user.groupId] = (accumulator[user.groupId] ?? 0) + 1;
        return accumulator;
      }, {});

      const nextExpenseCountByGroup = expenseData.reduce<Record<string, number>>((accumulator, expense) => {
        if (!expense.groupId) {
          return accumulator;
        }

        accumulator[expense.groupId] = (accumulator[expense.groupId] ?? 0) + 1;
        return accumulator;
      }, {});

      setGroups(groupData);
      setMemberCountByGroup(nextMemberCountByGroup);
      setExpenseCountByGroup(nextExpenseCountByGroup);
    };

    loadGroups();
    const unsubscribe = navigation.addListener('focus', loadGroups);

    return unsubscribe;
  }, [navigation]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={groups}
      keyExtractor={item => item._id.toString()}
      renderItem={({ item }) => {
        const groupId = item._id.toString();

        return (
          <View style={styles.groupCard}>
            <Text style={styles.groupTitle}>{item.name}</Text>
            <Text style={styles.groupDescription}>
              {item.description.trim() || 'Grupo listo para dividir cuentas y llevar saldos propios.'}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Integrantes</Text>
                <Text style={styles.statValue}>{memberCountByGroup[groupId] ?? 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Gastos</Text>
                <Text style={styles.statValue}>{expenseCountByGroup[groupId] ?? 0}</Text>
              </View>
            </View>
            <CustomButton
              title="Abrir grupo"
              onPress={() => navigation.navigate('GroupHome', { groupId, groupName: item.name })}
              color="#0f766e"
            />
          </View>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={(
        <View style={styles.headerStack}>
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Dividamos la Cuenta</Text>
            <Text style={styles.title}>Tus grupos</Text>
            <Text style={styles.subtitle}>
              Cada grupo tiene sus integrantes, sus gastos y su liquidación independiente.
            </Text>
          </View>
          <View style={styles.actionsCard}>
            <Text style={styles.sectionHeading}>Empezar</Text>
            <CustomButton title="Crear nuevo grupo" onPress={() => navigation.navigate('AddGroup')} />
          </View>
        </View>
      )}
      ListEmptyComponent={(
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>Todavía no hay grupos</Text>
          <Text style={styles.emptyStateText}>
            Creá un grupo para separar cuentas de salidas, viajes o cualquier plan compartido.
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f5f8' },
  content: { padding: 16, paddingBottom: 32 },
  headerStack: { gap: 12, marginBottom: 16 },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
  },
  eyebrow: {
    color: '#93c5fd',
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#cbd5e1' },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
  },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  separator: { height: 12 },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  groupTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6 },
  groupDescription: { color: '#475569', lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  statLabel: { color: '#64748b', fontSize: 13, marginBottom: 6 },
  statValue: { color: '#111827', fontSize: 20, fontWeight: '700' },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyStateText: { color: '#64748b', lineHeight: 21 },
});