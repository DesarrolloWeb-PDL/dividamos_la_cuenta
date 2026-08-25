import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Image, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import CreateGroup from './screens/CreateGroup';
import GroupDetail from './screens/GroupDetail';
import { RealmContext } from './models';
import { colors } from './theme';

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
                <Stack.Navigator 
                    initialRouteName="HomeScreen"
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: colors.surface,
                            elevation: 0,
                            shadowOpacity: 0,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                        },
                        headerTintColor: colors.text,
                        headerTitleStyle: {
                            fontWeight: '600',
                        },
                        headerRight: () => (
                            <Image 
                                source={require('./assets/logo.svg')} 
                                style={styles.headerLogo}
                            />
                        ),
                    }}
                >
                    <Stack.Screen 
                        name="HomeScreen" 
                        component={HomeScreen} 
                        options={{ title: 'Dividamos la Cuenta' }} 
                    />
                    <Stack.Screen 
                        name="CreateGroup" 
                        component={CreateGroup} 
                        options={{ title: 'Crear Grupo' }} 
                    />
                    <Stack.Screen 
                        name="GroupDetail" 
                        component={GroupDetail} 
                        options={{ title: 'Detalle del Grupo' }} 
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </RealmProvider>
    );
}

const styles = StyleSheet.create({
    headerLogo: {
        width: 32,
        height: 32,
        marginRight: 16,
    },
});