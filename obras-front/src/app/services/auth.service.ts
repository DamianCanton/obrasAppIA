/**
 * Authentication Service
 *
 * Manages user authentication state and session persistence.
 * Handles login/logout operations and maintains user information.
 *
 * Features:
 * - Session persistence using localStorage
 * - Automatic session timeout detection (1 hour)
 * - Role-based user identification
 * - Angular signals for reactive state management
 */

import { Injectable, signal } from '@angular/core';

/**
 * User interface representing authenticated user information
 */
export interface User {
  id: number;
  name: string;
  email: string;
}

/** LocalStorage key for storing user data */
const LS_USER = 'auth_user';
/** LocalStorage key for storing user role */
const LS_ROLE = 'auth_role';
/** LocalStorage key for storing session timestamp */
const LS_TIMESTAMP = 'auth_time';
/** Session timeout duration: 1 hour in milliseconds */
const MAX_SESSION_MS = 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** Current authenticated user, or null if not logged in */
  user = signal<User | null>(null);
  /** Current user role: 'architect' or 'worker', or null */
  role = signal<string | null>(null);

  constructor() {
    // Restore session from localStorage on service initialization
    this.restoreSessionFromStorage();
  }

  /**
   * Restores authentication session from localStorage if valid
   *
   * Process:
   * 1. Retrieves user, role, and timestamp from localStorage
   * 2. Checks if session has expired (> 1 hour old)
   * 3. If valid: restores session signals
   * 4. If expired: clears session (logout)
   *
   * @private
   */
  private restoreSessionFromStorage() {
    const userStr = localStorage.getItem(LS_USER);
    const role = localStorage.getItem(LS_ROLE);
    const time = localStorage.getItem(LS_TIMESTAMP);

    if (userStr && role && time) {
      // Check if session has expired
      const elapsed = Date.now() - Number(time);
      if (elapsed < MAX_SESSION_MS) {
        // Session is valid, restore it
        this.user.set(JSON.parse(userStr));
        this.role.set(role);
      } else {
        // Session expired, perform cleanup
        this.logout();
      }
    }
  }

  /**
   * Store authentication data in session state and localStorage
   *
   * Called after successful login.
   * Persists user information to localStorage for session recovery
   * and updates reactive signals.
   *
   * @param {User} user - Authenticated user information
   * @param {string} role - User role (architect or worker)
   *
   * @example
   * this.auth.setAuth({ id: 1, name: 'John', email: 'john@example.com' }, 'architect');
   */
  setAuth(user: User, role: string) {
    // Update in-memory signals
    this.user.set(user);
    this.role.set(role);
    // Persist to localStorage for session recovery
    localStorage.setItem(LS_USER, JSON.stringify(user));
    localStorage.setItem(LS_ROLE, role);
    localStorage.setItem(LS_TIMESTAMP, String(Date.now()));
  }

  /**
   * Clear authentication session and logout user
   *
   * Removes user data from both in-memory state (signals)
   * and persistent storage (localStorage).
   *
   * Typically called when:
   * - User clicks logout button
   * - Session expires
   * - Authentication error occurs
   */
  logout() {
    // Clear in-memory state
    this.user.set(null);
    this.role.set(null);
    // Clear persistent storage
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_ROLE);
    localStorage.removeItem(LS_TIMESTAMP);
  }

  /**
   * Check if user has an active authentication session
   *
   * @returns {boolean} true if user is logged in, false otherwise
   */
  isAuthenticated() {
    return !!this.user();
  }
}
