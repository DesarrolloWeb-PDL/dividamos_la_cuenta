// Pantalla de detalle de grupo: gastos, liquidación y cobranza

import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import ExpenseInput from '../components/ExpenseInput';
import { calculateNetPositions, minimizeTransactions } from '../services/settlement';
import { generateWhatsAppLink, fetchAlias, openWhatsApp } from '../services/whatsappLink';
import { RealmContext } from '../models';
const { useObject, useRealm } = RealmContext;
import { BSON } from 'realm';

export default function GroupDetail({ route }) {
  const groupId = route?.params?.groupId;
  const group = useObject('Group', new BSON.ObjectId(groupId));
  const realm = useRealm();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (group) {
      const net = calculateNetPositions(group.participants, group.transactions);
      setPayments(minimizeTransactions(net));
    }
  }, [group]);

  function handleAddExpense(expense) {
    realm.write(() => {
      group.transactions.push(expense);
    });
  }

  function handleRequestPayment(payment) {
    const debtor = group.participants.find(p => p.id.toString() === payment.from.toString());
    // Note: payment.to/from are ObjectIds in settlement logic? 
    // Wait, settlement logic uses ids from participants.
    // If participants ids are ObjectIds, then payment.from is ObjectId.
    // We need to check how settlement.js handles ids.
    // It uses p.id.

    // fetchAlias is async.
    fetchAlias(payment.to).then(alias => {
      const url = generateWhatsAppLink(debtor.phone, payment.amount, alias);
      openWhatsApp(url);
    });
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
