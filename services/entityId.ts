function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

    return `{${entries.map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

export function normalizeEntityId(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
    return String(value);
  }

  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return `legacy:${stableStringify(value)}`;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    for (const key of ['$oid', 'oid', 'id', '_id']) {
      if (key in record) {
        const nestedId = normalizeEntityId(record[key]);

        if (nestedId) {
          return nestedId;
        }
      }
    }

    const maybeToString = record.toString;

    if (typeof maybeToString === 'function' && maybeToString !== Object.prototype.toString) {
      const customValue = maybeToString.call(record);

      if (typeof customValue === 'string' && customValue && customValue !== '[object Object]') {
        return customValue;
      }
    }

    return `legacy:${stableStringify(record)}`;
  }

  return String(value);
}

export function didCollectionChange<T>(currentItems: T[], nextItems: T[]) {
  return JSON.stringify(currentItems) !== JSON.stringify(nextItems);
}