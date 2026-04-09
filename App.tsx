import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import UsersScreen from './screens/UsersScreen';
import AddUserScreen from './screens/AddUserScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Gastos' }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Agregar Gasto' }} />
        <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Usuarios' }} />
        <Stack.Screen name="AddUser" component={AddUserScreen} options={{ title: 'Agregar Usuario' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
