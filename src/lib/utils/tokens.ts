import { randomUUID } from 'crypto';

/** Generate a URL-safe confirmation token */
export function generateConfirmationToken(): string {
  return randomUUID();
}
