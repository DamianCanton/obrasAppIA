/**
 * Authentication Guard
 *
 * Route guard that protects routes requiring authentication.
 * Validates user session and enforces role-based access control.
 *
 * Responsibilities:
 * - Check if user is authenticated (session exists in AuthService)
 * - Validate user role against route requirements
 * - Redirect unauthenticated users to login
 * - Redirect unauthorized users to their role-specific home page
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Determines the home page URL based on user role
 *
 * @param {string | null} role - User role (architect or worker)
 * @returns {string} Home page path for the user role
 */
function roleHome(role: string | null): string {
  if (role === 'worker') return '/worker/elements';
  // Default to architect home
  return '/';
}

/**
 * Angular Route Guard Function
 *
 * Protects routes by verifying:
 * 1. User is authenticated (session exists)
 * 2. User has appropriate role for the route (if roles defined)
 *
 * Flow:
 * - Unauthenticated user → redirect to /login
 * - Authenticated user with wrong role → redirect to role-specific home
 * - Authorized user → allow route activation
 *
 * @param {ActivatedRouteSnapshot} route - Current route being accessed
 * @returns {boolean} true if access granted, false if redirected
 *
 * @example
 * // In routes configuration:
 * {
 *   path: 'construction',
 *   component: ConstructionComponent,
 *   canActivate: [AuthGuard],
 *   data: { roles: ['architect'] } // Optional role requirement
 * }
 */
export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Validate role-based access control (if route defines specific roles)
  const expectedRoles = route.data?.['roles'] as string[] | undefined;
  const currentRole = auth.role();

  if (expectedRoles && currentRole && !expectedRoles.includes(currentRole)) {
    // Redirect to appropriate home page for user's actual role
    router.navigate([roleHome(currentRole)]);
    return false;
  }

  // All checks passed, allow route activation
  return true;
};
