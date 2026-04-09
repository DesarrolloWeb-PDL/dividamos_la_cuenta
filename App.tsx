import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddGroupScreen from './screens/AddGroupScreen';
import GroupsScreen from './screens/GroupsScreen';
import HomeScreen from './screens/HomeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import UsersScreen from './screens/UsersScreen';
import AddUserScreen from './screens/AddUserScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Groups">
        <Stack.Screen name="Groups" component={GroupsScreen} options={{ title: 'Grupos' }} />
        <Stack.Screen name="AddGroup" component={AddGroupScreen} options={{ title: 'Nuevo Grupo' }} />
        <Stack.Screen name="GroupHome" component={HomeScreen} options={{ title: 'Resumen del Grupo' }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Agregar Gasto' }} />
        <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Integrantes' }} />
        <Stack.Screen name="AddUser" component={AddUserScreen} options={{ title: 'Agregar Integrante' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
