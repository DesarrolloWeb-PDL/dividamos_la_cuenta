// Pantalla de detalle de grupo: gastos, liquidación y cobranza

import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import ExpenseInput from '../components/ExpenseInput';
import { calculateNetPositions, minimizeTransactions } from '../services/settlement';
import { generateWhatsAppLink, fetchAlias, openWhatsApp } from '../services/whatsappLink';
import { getRealm } from '../services/realm';

export default function GroupDetail({ route }) {
  const [group, setGroup] = useState(null);
  const [payments, setPayments] = useState([]);
  const groupId = route?.params?.groupId;

  useEffect(() => {
    let realm;
    (async () => {
      realm = await getRealm();
      const found = realm.objectForPrimaryKey('Group', groupId);
      if (found) {
        setGroup(JSON.parse(JSON.stringify(found)));
        const net = calculateNetPositions(found.participants, found.transactions);
        setPayments(minimizeTransactions(net));
      }
    })();
    return () => {
      if (realm) realm.close();
    };
  }, [groupId]);

  async function handleAddExpense(expense) {
    const realm = await getRealm();
    realm.write(() => {
      const found = realm.objectForPrimaryKey('Group', groupId);
      if (found) {
        found.transactions.push(expense);
      }
    });
    realm.close();
    // Refresca datos
    let realm2 = await getRealm();
    const updated = realm2.objectForPrimaryKey('Group', groupId);
    if (updated) {
      setGroup(JSON.parse(JSON.stringify(updated)));
      const net = calculateNetPositions(updated.participants, updated.transactions);
      setPayments(minimizeTransactions(net));
    }
    realm2.close();
  }

  async function handleRequestPayment(payment) {
    const alias = await fetchAlias(payment.to);
    const debtor = group.participants.find(p => p.id === payment.from);
    const url = generateWhatsAppLink(debtor.phone, payment.amount, alias);
    openWhatsApp(url);
  }

  if (!group) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Cargando grupo...</Text></View>;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{group.name}</Text>
      <ExpenseInput participants={group.participants} onAdd={handleAddExpense} />
      <Text style={{ marginVertical: 8 }}>Liquidación de gastos y pagos mínimos:</Text>
      <FlatList
        data={payments}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            <Text>
              {group.participants.find(p => p.id === item.from)?.name} debe pagar ${item.amount.toFixed(2)} a {group.participants.find(p => p.id === item.to)?.name}
            </Text>
            <Button title="Solicitar Pago por WhatsApp" onPress={() => handleRequestPayment(item)} />
          </View>
        )}
        ListEmptyComponent={<Text>No hay pagos pendientes.</Text>}
      />
    </View>
  );
}
