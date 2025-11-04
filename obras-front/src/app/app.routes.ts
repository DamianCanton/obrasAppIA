/**
 * Application Routing Configuration
 *
 * Defines all routes for the ObrasApp frontend.
 * Implements role-based routing with protected routes for architects and workers.
 *
 * Route Structure:
 * 1. Public routes: Login page (no authentication required)
 * 2. Architect routes: Protected routes under ArchitectLayout
 * 3. Worker routes: Protected routes under WorkerLayout
 * 4. Wildcard: Catch-all redirect to login
 *
 * Authentication:
 * - AuthGuard protects all authenticated routes
 * - Role-based access control via route data
 * - Unauthorized users redirected to appropriate home page
 */

import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { ConstructionComponent } from './pages/construction/construction';
import { ConstructionDetail } from './pages/construction-detail/construction-detail';
import { Deposit } from './pages/deposit/deposit';
import { Events } from './pages/events/events';
import { Notes } from './pages/notes/notes';
import { ConstructionWorkers } from './pages/construction-workers/construction-workers';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { EventDetail } from './pages/event-detail/event-detail';
import { NoteEditor } from './pages/note-editor/note-editor';
import { MissingRegistry } from './pages/missing-registry/missing-registry';

import { ArchitectLayout } from './layouts/architect-layout';
import { WorkerLayout } from './layouts/worker-layout';

export const routes: Routes = [
  /**
   * Public Routes
   */

  // Login page - no authentication required
  { path: 'login', component: LoginComponent },

  /**
   * Architect Routes
   * Protected by AuthGuard - requires architect role
   * All routes use ArchitectLayout for consistent sidebar/header
   */
  {
    path: '',
    component: ArchitectLayout,
    canActivate: [AuthGuard],
    data: { roles: ['architect'] }, // Role-based access control
    children: [
      // Dashboard - main architect view
      { path: '', component: Dashboard },
      // Construction worker management
      { path: 'construction-workers', component: ConstructionWorkers },
      // List all constructions
      { path: 'constructions', component: ConstructionComponent },
      // View and edit specific construction project
      { path: 'construction/:id', component: ConstructionDetail },
      // Inventory/deposit management
      { path: 'deposit', component: Deposit },
      // Historical events and audit trail
      { path: 'events', component: Events },
      // Missing/lost items registry
      { path: 'missings', component: MissingRegistry },
      // Event detail view
      { path: 'event/:id', component: EventDetail },
      // Project notes list
      { path: 'notes', component: Notes },
      // Edit existing note or create new note
      { path: 'note-editor/:id', component: NoteEditor },
      { path: 'note-editor/new', component: NoteEditor },
    ],
  },

  /**
   * Worker Routes
   * Protected by AuthGuard - requires worker role
   * All routes use WorkerLayout for consistent navigation
   * Limited to inventory and missing items views
   */
  {
    path: 'worker',
    component: WorkerLayout,
    canActivate: [AuthGuard],
    data: { roles: ['worker'] }, // Role-based access control
    children: [
      // Element/inventory view for workers
      { path: 'elements', component: Deposit },
      // Missing items they can report
      { path: 'missings', component: MissingRegistry },
      // Project notes view
      { path: 'notas', component: Notes },
      // Default worker route
      { path: '', pathMatch: 'full', redirectTo: 'elements' },
    ],
  },

  /**
   * Catch-all Route
   * Redirects unmatched routes to login page
   */
  { path: '**', redirectTo: '/login' },
];
