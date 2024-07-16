export async function withCursorPagination(
  queryFn: Function,
  cursor: number | null,
  limit: number,
) {
  const results = await queryFn(cursor, limit);
  return results;
}
