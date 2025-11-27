import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import CreateGroup from './screens/CreateGroup';
import GroupDetail from './screens/GroupDetail';
import { RealmContext } from './models';

const { RealmProvider } = RealmContext;

type RootStackParamList = {
    HomeScreen: undefined;
    CreateGroup: undefined;
    GroupDetail: { groupId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    return (
        <RealmProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="HomeScreen">
                    <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Inicio' }} />
                    <Stack.Screen name="CreateGroup" component={CreateGroup} options={{ title: 'Crear Grupo' }} />
                    <Stack.Screen name="GroupDetail" component={GroupDetail} options={{ title: 'Detalle del Grupo' }} />
                </Stack.Navigator>
            </NavigationContainer>
        </RealmProvider>
    );
}
