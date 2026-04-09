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

export async function importSingleContactDraft(): Promise<ContactImportResult> {
  return { status: 'unsupported' };
}