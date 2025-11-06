import { Injectable, computed, signal } from '@angular/core';

export type UserRole = 'ADMIN' | 'WORKER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  architectId?: number | null;
}

const LS_USER = 'auth_user';
const LS_ROLE = 'auth_role';
const LS_TOKEN = 'auth_token';
const LS_TIMESTAMP = 'auth_time';
const MAX_SESSION_MS = 60 * 60 * 1000; // 1 hora

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userSignal = signal<User | null>(null);
  private readonly roleSignal = signal<UserRole | null>(null);
  private readonly tokenSignal = signal<string | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly role = this.roleSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly authenticated = computed(() => !!this.tokenSignal());

  constructor() {
    const storedUser = localStorage.getItem(LS_USER);
    const storedRole = localStorage.getItem(LS_ROLE);
    const storedToken = localStorage.getItem(LS_TOKEN);
    const timestamp = localStorage.getItem(LS_TIMESTAMP);

    if (!storedUser || !storedRole || !storedToken || !timestamp) {
      this.clearStorage();
      return;
    }

    const elapsed = Date.now() - Number(timestamp);
    if (Number.isNaN(elapsed) || elapsed > MAX_SESSION_MS) {
      this.logout();
      return;
    }

    try {
      const user = JSON.parse(storedUser) as User;
      const normalizedRole =
        this.normalizeRole(storedRole) ?? this.normalizeRole(user.role);
      const userWithRole = {
        ...user,
        role: normalizedRole ?? 'ADMIN',
      };

      this.userSignal.set(userWithRole);
      this.roleSignal.set(normalizedRole ?? 'ADMIN');
      this.tokenSignal.set(storedToken);
    } catch {
      this.clearStorage();
    }
  }

  setSession(user: User, token: string) {
    const normalizedRole = this.normalizeRole(user.role) ?? 'ADMIN';
    const normalizedUser = { ...user, role: normalizedRole };

    this.userSignal.set(normalizedUser);
    this.roleSignal.set(normalizedRole);
    this.tokenSignal.set(token);

    localStorage.setItem(LS_USER, JSON.stringify(normalizedUser));
    localStorage.setItem(LS_ROLE, normalizedRole);
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_TIMESTAMP, String(Date.now()));
  }

  logout() {
    this.userSignal.set(null);
    this.roleSignal.set(null);
    this.tokenSignal.set(null);
    this.clearStorage();
  }

  isAuthenticated() {
    return this.authenticated();
  }

  accessToken(): string | null {
    return this.tokenSignal();
  }

  actorType(): 'architect' | 'worker' | null {
    const role = this.roleSignal();
    if (!role) return null;
    return role === 'ADMIN' ? 'architect' : 'worker';
  }

  private clearStorage() {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_ROLE);
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_TIMESTAMP);
  }

  private normalizeRole(role: string | null | undefined): UserRole | null {
    if (!role) return null;
    const value = role.toString().toUpperCase();
    if (value === 'ADMIN' || value === 'WORKER') {
      return value as UserRole;
    }
    if (value === 'ARCHITECT' || value === 'ARQUITECTO') {
      return 'ADMIN';
    }
    if (value === 'TRABAJADOR' || value === 'OBRERO') {
      return 'WORKER';
    }
    return null;
  }
}
