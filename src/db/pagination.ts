interface PaginatedResult<T, C> {
  data: T[];
  nextCursor: C | undefined;
}

export async function withCursorPagination<T, C>(
  queryFn: (
    cursor: number | null,
    limit: number,
  ) => Promise<PaginatedResult<T, C>>,
  cursor: number | null,
  limit: number,
): Promise<PaginatedResult<T, C>> {
  const results = await queryFn(cursor, limit);
  return results;
}
