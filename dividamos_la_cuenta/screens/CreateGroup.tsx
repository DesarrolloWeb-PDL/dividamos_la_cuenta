import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, PermissionsAndroid, Platform } from 'react-native';
import Contacts from 'react-native-contacts';
import { RealmContext } from '../models';
import { StackNavigationProp } from '@react-navigation/stack';
import Screen from '../components/ui/Screen';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { colors, spacing, typography } from '../theme';

const { useRealm } = RealmContext;

type RootStackParamList = {
    HomeScreen: undefined;
    CreateGroup: undefined;
};

type CreateGroupNavigationProp = StackNavigationProp<RootStackParamList, 'CreateGroup'>;

interface Props {
    navigation: CreateGroupNavigationProp;
}

export default function CreateGroup({ navigation }: Props) {
    const [groupName, setGroupName] = useState('');
    const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
    const [selected, setSelected] = useState<Contacts.Contact[]>([]);
    const realm = useRealm();

    async function requestContactsPermission() {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    }

    async function loadContacts() {
        const hasPermission = await requestContactsPermission();
        if (hasPermission) {
            Contacts.getAll().then(setContacts);
        }
    }

    function toggleSelect(contact: Contacts.Contact) {
        setSelected(prev =>
            prev.some(c => c.recordID === contact.recordID)
                ? prev.filter(c => c.recordID !== contact.recordID)
                : [...prev, contact]
        );
    }

    function createGroup() {
        realm.write(() => {
            const participants = selected.map(contact =>
                realm.create('Participant', {
                    name: contact.displayName,
                    phone: contact.phoneNumbers?.[0]?.number || '',
                    contactId: contact.recordID,
                })
            );
            realm.create('Group', {
                name: groupName,
                participants,
                transactions: [],
            });
        });
        navigation.navigate('HomeScreen');
    }

    return (
        <Screen>
            <Text style={styles.title}>Nuevo Grupo</Text>
            <Text style={styles.subtitle}>Creá un grupo para dividir gastos</Text>

            <Card>
                <Input
                    label="Nombre del Grupo"
                    placeholder="Ej: Asado del Domingo"
                    value={groupName}
                    onChangeText={setGroupName}
                />
            </Card>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Participantes ({selected.length})</Text>
                <Button 
                    title="Cargar Contactos" 
                    onPress={loadContacts} 
                    variant="secondary" 
                    style={styles.loadButton} 
                />
            </View>

            <ScrollView style={styles.contactsList}>
                {contacts.map(contact => {
                    const isSelected = selected.some(c => c.recordID === contact.recordID);
                    return (
                        <Button
                            key={contact.recordID}
                            title={contact.displayName}
                            variant={isSelected ? 'primary' : 'outline'}
                            onPress={() => toggleSelect(contact)}
                            style={styles.contactButton}
                        />
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Crear Grupo"
                    onPress={createGroup}
                    disabled={!groupName || selected.length === 0}
                />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    title: {
        ...typography.h1,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.caption,
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        ...typography.h2,
    },
    loadButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    contactsList: {
        flex: 1,
    },
    contactButton: {
        marginBottom: spacing.sm,
    },
    footer: {
        paddingTop: spacing.md,
    },
});