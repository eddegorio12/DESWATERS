export type SearchParamValue = string | string[] | undefined;

export function getSearchParamText(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export function matchesSearch(
  values: Array<string | null | undefined>,
  query: string
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}
