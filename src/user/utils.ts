export function safeJsonParse<S extends Record<string, unknown>, T>(
  val: any,
): [null | T, null | S] {
  try {
    if (typeof val === 'object') return [null, val];
    return [null, JSON.parse(val)];
    //@ts-ignore
  } catch (err: any) {
    return [err, null];
  }
}
