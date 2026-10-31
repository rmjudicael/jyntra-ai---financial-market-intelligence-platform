import type { AuthErrorCode } from '../services/auth';

/**
 * Les services d'authentification renvoient des codes stables ; l'interface
 * choisit le libellé dans la langue active. Les messages français renvoyés par
 * le service restent un secours pour les appels hors interface.
 */
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
