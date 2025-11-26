// App principal con navegación
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import CreateGroup from './screens/CreateGroup';
import GroupDetail from './screens/GroupDetail';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreen">
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Inicio' }} />
        <Stack.Screen name="CreateGroup" component={CreateGroup} options={{ title: 'Crear Grupo' }} />
        <Stack.Screen name="GroupDetail" component={GroupDetail} options={{ title: 'Detalle del Grupo' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
