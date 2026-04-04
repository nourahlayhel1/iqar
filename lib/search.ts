function flattenValue(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenValue);
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(flattenValue);
  }

  return [String(value)];
}

export function stringifySearchableFields(input: unknown): string {
  return flattenValue(input)
    .join(" ")
    .toLowerCase();
}

export function matchesGlobalSearch<T>(item: T, query?: string): boolean {
  if (!query?.trim()) {
    return true;
  }

  return stringifySearchableFields(item).includes(query.trim().toLowerCase());
}
