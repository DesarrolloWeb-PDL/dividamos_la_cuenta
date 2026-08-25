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

type WebContactRecord = {
  name?: string[];
  tel?: string[];
};

type ContactPickerNavigator = Navigator & {
  contacts?: {
    select: (
      properties: Array<'name' | 'tel'>,
      options?: { multiple?: boolean },
    ) => Promise<WebContactRecord[]>;
  };
};

function pickFirstValue(values: string[] | undefined) {
  return values?.find(value => typeof value === 'string' && value.trim())?.trim() ?? '';
}

function buildDisplayName(contact: WebContactRecord) {
  return pickFirstValue(contact.name) || 'Contacto importado';
}

function buildAlias(name: string) {
  return name.split(' ')[0]?.trim() ?? '';
}

function extractPhone(contact: WebContactRecord) {
  return pickFirstValue(contact.tel);
}

export async function importSingleContactDraft(): Promise<ContactImportResult> {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    return { status: 'unsupported' };
  }

  const contactNavigator = navigator as ContactPickerNavigator;

  if (!contactNavigator.contacts?.select) {
    return { status: 'unsupported' };
  }

  try {
    const contacts = await contactNavigator.contacts.select(['name', 'tel'], { multiple: false });
    const selectedContact = contacts[0];

    if (!selectedContact) {
      return { status: 'cancelled' };
    }

    const name = buildDisplayName(selectedContact);
    const phone = extractPhone(selectedContact);

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
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { status: 'cancelled' };
    }

    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return { status: 'permission-denied' };
    }

    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo importar el contacto.',
    };
  }
}