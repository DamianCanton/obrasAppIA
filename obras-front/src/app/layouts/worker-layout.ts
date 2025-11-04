/**
 * Worker Layout Component
 *
 * Main layout wrapper for construction worker role pages.
 * Provides responsive design with role-specific navigation.
 *
 * Features:
 * - Fixed sidebar on desktop displaying worker menu
 * - Mobile drawer for navigation
 * - Header with role identification
 * - Responsive grid layout
 *
 * Layout Structure:
 * - Header: "Panel de Obrero" title + mobile menu toggle
 * - Sidebar: Worker-specific navigation menu (desktop only)
 * - Drawer: Mobile navigation alternative
 * - Main: Page content area for worker features
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { WorkerMenu } from './worker-menu';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DrawerModule, ButtonModule, WorkerMenu],
  template: `
  <div class="h-screen flex flex-column">
    <!-- Header with role identification -->
    <header class="surface-200 p-3 flex align-items-center justify-content-between">
      <div class="text-xl font-bold">Worker Panel</div>
      <div class="lg:hidden">
        <p-button (click)="sidebarVisible = true" icon="pi pi-bars"></p-button>
      </div>
    </header>

    <div class="flex flex-1 min-h-0">
      <!-- Sidebar fijo desktop (menú worker) -->
      <!-- Fixed sidebar displays worker navigation on desktop screens -->
      <aside class="hidden lg:block shrink-0 lg:w-12rem surface-100 p-2">
        <app-worker-menu></app-worker-menu>
      </aside>

      <!-- Drawer mobile -->
      <!-- Mobile navigation drawer toggled by header button -->
      <p-drawer [(visible)]="sidebarVisible" position="left" header="Menú" [modal]="true" closable="false">
        <app-worker-menu></app-worker-menu>
      </p-drawer>

      <!-- Main content area -->
      <!-- Primary content region where routed components are displayed -->
      <main class="flex-1 overflow-auto p-3 surface-50">
        <router-outlet></router-outlet>
      </main>
    </div>
  </div>
  `,
})
export class WorkerLayout {
  /** Controls visibility of mobile navigation drawer */
  sidebarVisible = false;
}
