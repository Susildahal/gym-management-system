export const DEFAULT_PAGE_SIZE = 10;

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePageParams(searchParams: Record<string, string | string[] | undefined>): PageParams {
  const pageRaw = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  const limit = DEFAULT_PAGE_SIZE;
  return { page, limit, skip: (page - 1) * limit };
}

export function getParam(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const v = searchParams[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
