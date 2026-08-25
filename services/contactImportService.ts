import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';

export type ImportedContactDraft = {
  name: string;
  phone: string;
  alias: string;
};

export type ContactImportResult =
  | { status: 'success'; draft: ImportedContactDraft }
  | { status: 'cancelled' }
  | { status: 'unsupported' }
  | { status: 'permission-denied' }
  | { status: 'missing-phone' }
  | { status: 'error'; message: string };

function buildDisplayName(contact: any) {
  const nameParts = [contact?.firstName, contact?.middleName, contact?.lastName]
    .filter(Boolean)
    .map((value: string) => value.trim())
    .filter(Boolean);

  if (typeof contact?.name === 'string' && contact.name.trim()) {
    return contact.name.trim();
  }

  if (nameParts.length > 0) {
    return nameParts.join(' ');
  }

  return 'Contacto importado';
}

function buildAlias(name: string) {
  return name.split(' ')[0]?.trim() ?? '';
}

function extractPhone(contact: any) {
  const phoneCandidates = Array.isArray(contact?.phoneNumbers)
    ? contact.phoneNumbers
    : [];

  const selectedPhone = phoneCandidates.find((item: any) => typeof item?.number === 'string' && item.number.trim())?.number;

  return selectedPhone?.trim() ?? '';
}

export async function importSingleContactDraft(): Promise<ContactImportResult> {
  try {
    const isAvailable = await Contacts.isAvailableAsync();

    if (!isAvailable) {
      return { status: 'unsupported' };
    }

    if (Platform.OS === 'android') {
      const permission = await Contacts.requestPermissionsAsync();

      if (!permission.granted) {
        return { status: 'permission-denied' };
      }
    }

    const contact = await Contacts.presentContactPickerAsync();

    if (!contact) {
      return { status: 'cancelled' };
    }

    const name = buildDisplayName(contact);
    const phone = extractPhone(contact);

    if (!phone) {
      return { status: 'missing-phone' };
    }

    return {
      status: 'success',
      draft: {
        name,
        phone,
        alias: buildAlias(name),
      },
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo importar el contacto.',
    };
  }
}