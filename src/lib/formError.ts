// API routes return either a plain string error or a Zod .flatten() object
// ({ formErrors, fieldErrors }). This turns either into one readable string
// instead of the raw object rendering as "[object Object]" in the UI.
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const flat = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const messages = [
      ...(flat.formErrors ?? []),
      ...Object.values(flat.fieldErrors ?? {}).flat(),
    ].filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }

  return fallback;
}
