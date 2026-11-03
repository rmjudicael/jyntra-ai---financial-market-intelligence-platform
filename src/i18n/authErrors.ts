import type { AuthErrorCode } from '../services/auth';

/* Authentication services return stable codes; the UI picks the label in the
   active language. French service messages remain a fallback for non-UI calls. */
export type AuthErrorKey =
  | 'errNameShort'
  | 'errEmailInvalid'
  | 'errPasswordShort'
  | 'errEmailExists'
  | 'errNoAccount'
  | 'errWrongPassword'
  | 'errUserNotFound';

export const AUTH_ERROR_KEYS: Record<AuthErrorCode, AuthErrorKey> = {
  NAME_SHORT: 'errNameShort',
  EMAIL_INVALID: 'errEmailInvalid',
  PASSWORD_SHORT: 'errPasswordShort',
  EMAIL_EXISTS: 'errEmailExists',
  NO_ACCOUNT: 'errNoAccount',
  WRONG_PASSWORD: 'errWrongPassword',
  USER_NOT_FOUND: 'errUserNotFound',
};
