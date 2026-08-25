import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { RealmContext } from '../models';
import { Group } from '../models/Group';
import { StackNavigationProp } from '@react-navigation/stack';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { typography, colors, spacing } from '../theme';

const { useQuery } = RealmContext;

type RootStackParamList = {
    HomeScreen: undefined;
    CreateGroup: undefined;
    GroupDetail: { groupId: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeScreen'>;

interface Props {
    navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
    const groups = useQuery(Group);

    return (
        <Screen>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola! 👋</Text>
                    <Text style={styles.title}>Mis Grupos</Text>
                </View>
                <Button
                    title="+ Nuevo"
                    onPress={() => navigation.navigate('CreateGroup')}
                    style={styles.newButton}
                />
            </View>

            <FlatList
                data={groups}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ paddingBottom: spacing.xl }}
                renderItem={({ item }) => (
                    <Card>
                        <View style={styles.cardContent}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.groupName}>{item.name}</Text>
                                <Text style={styles.groupInfo}>
                                    {item.participants.length} participantes
                                </Text>
                            </View>
                            <Button
                                title="Ver"
                                variant="outline"
                                onPress={() => navigation.navigate('GroupDetail', { groupId: item.id.toString() })}
                                style={styles.viewButton}
                            />
                        </View>
                    </Card>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyText}>No tienes grupos creados</Text>
                        <Text style={styles.emptySubtext}>Crea uno para empezar a dividir gastos</Text>
                    </View>
                }
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    greeting: {
        ...typography.caption,
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.h1,
        color: colors.text,
    },
    newButton: {
        width: 100,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    groupName: {
        ...typography.h2,
        marginBottom: 4,
    },
    groupInfo: {
        ...typography.caption,
    },
    viewButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: spacing.xl * 3,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        ...typography.h2,
        color: colors.textLight,
        marginBottom: spacing.sm,
    },
    emptySubtext: {
        ...typography.body,
        color: colors.textLight,
        textAlign: 'center',
    },
});