import 'react-native-gesture-handler';
import * as React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddGroupScreen from './screens/AddGroupScreen';
import GroupsScreen from './screens/GroupsScreen';
import HomeScreen from './screens/HomeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import UsersScreen from './screens/UsersScreen';
import AddUserScreen from './screens/AddUserScreen';
import { ThemeProvider, useAppTheme } from './theme/appTheme';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { colors, mode } = useAppTheme();
  const navigationTheme = mode === 'dark'
    ? {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    }
    : {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };

  return (
    <NavigationContainer theme={navigationTheme}>
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

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
