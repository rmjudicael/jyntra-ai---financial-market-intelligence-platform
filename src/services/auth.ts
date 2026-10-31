import { LocalStore, STORAGE_KEYS, UserAccount, UserSession } from './storage';

async function hashPassword(password: string, salt: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback for non-browser environments
    let hash = 0;
    const combined = password + salt;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt + 'jyntra_secret_salt_v1');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type AuthErrorCode =
  | 'NAME_SHORT'
  | 'EMAIL_INVALID'
  | 'PASSWORD_SHORT'
  | 'EMAIL_EXISTS'
  | 'NO_ACCOUNT'
  | 'WRONG_PASSWORD'
  | 'USER_NOT_FOUND';

export class AuthService {
  static getSession(): UserSession | null {
    const session = LocalStore.get<UserSession | null>(STORAGE_KEYS.SESSION, null);
    if (!session || !session.userId || !session.token) {
      return null;
    }
    return session;
  }

  static async register(name: string, email: string, password: string): Promise<{ success: boolean; error?: string; code?: AuthErrorCode; user?: UserAccount }> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, code: 'NAME_SHORT', error: 'Le nom doit contenir au moins 2 caractères.' };
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return { success: false, code: 'EMAIL_INVALID', error: 'Veuillez saisir une adresse email valide.' };
    }

    if (!password || password.length < 6) {
      return { success: false, code: 'PASSWORD_SHORT', error: 'Le mot de passe doit comporter au moins 6 caractères.' };
    }

    const users = LocalStore.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const exists = users.some((u) => u.email === trimmedEmail);
    if (exists) {
      return { success: false, code: 'EMAIL_EXISTS', error: 'Un compte avec cet email existe déjà. Veuillez vous connecter.' };
    }

    const passwordHash = await hashPassword(password, trimmedEmail);
    const newUser: UserAccount = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      role: 'trader',
      preferredAsset: 'BTC/USDT',
    };

    users.push(newUser);
    LocalStore.set(STORAGE_KEYS.USERS, users);

    return { success: true, user: newUser };
  }

  /**
   * Log into existing account and create an active session.
   */
  static async login(email: string, password: string): Promise<{ success: boolean; error?: string; code?: AuthErrorCode; session?: UserSession }> {
    const trimmedEmail = email.trim().toLowerCase();
    const users = LocalStore.get<UserAccount[]>(STORAGE_KEYS.USERS, []);

    const user = users.find((u) => u.email === trimmedEmail);
    if (!user) {
      return { success: false, code: 'NO_ACCOUNT', error: 'Aucun compte trouvé avec cet email.' };
    }

    const inputHash = await hashPassword(password, trimmedEmail);
    if (user.passwordHash !== inputHash) {
      return { success: false, code: 'WRONG_PASSWORD', error: 'Mot de passe incorrect.' };
    }

    // Update lastLoginAt
    user.lastLoginAt = Date.now();
    LocalStore.set(STORAGE_KEYS.USERS, users);

    const session: UserSession = {
      userId: user.id,
      name: user.name,
      email: user.email,
      token: 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      role: user.role,
      loginTimestamp: Date.now(),
    };

    LocalStore.set(STORAGE_KEYS.SESSION, session);
    window.dispatchEvent(new Event('jyntra_auth_change'));

    return { success: true, session };
  }

  /**
   * Log out active user and clear session.
   */
  static logout(): void {
    LocalStore.remove(STORAGE_KEYS.SESSION);
    window.dispatchEvent(new Event('jyntra_auth_change'));
  }

  /**
   * Update active user profile.
   */
  static updateProfile(userId: string, updates: Partial<UserAccount>): { success: boolean; error?: string; code?: AuthErrorCode } {
    const users = LocalStore.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, code: 'USER_NOT_FOUND', error: 'Utilisateur non trouvé.' };

    users[idx] = { ...users[idx], ...updates };
    LocalStore.set(STORAGE_KEYS.USERS, users);

    // If current session belongs to this user, update session name
    const currentSession = this.getSession();
    if (currentSession && currentSession.userId === userId) {
      if (updates.name) currentSession.name = updates.name;
      LocalStore.set(STORAGE_KEYS.SESSION, currentSession);
      window.dispatchEvent(new Event('jyntra_auth_change'));
    }

    return { success: true };
  }
}
