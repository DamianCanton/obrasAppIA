/**
 * Architect Layout Component
 *
 * Main layout wrapper for architect-role pages.
 * Provides responsive navigation with:
 * - Fixed sidebar on desktop (width: 10rem)
 * - Slide-out drawer for mobile navigation
 * - Missing items menu component
 * - Role-based access control
 *
 * Layout Structure:
 * - Header: Toggle button (mobile only) + status bar
 * - Sidebar: Fixed navigation menu (desktop) or drawer (mobile)
 * - Main: Page content area with router outlet
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { MenuComponent } from '../shared/menu/menu';
import { MissingMenu } from '../shared/missing-menu/missing-menu';
import { DrawerVisibility } from '../services/drawer_visibility.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-architect-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DrawerModule,
    ButtonModule,
    MenuComponent,
    MissingMenu,
  ],
  template: `
    <div class="h-screen flex flex-column">
      <div class="flex flex-1 min-h-0">
        <!-- Sidebar fijo desktop -->
        <aside
          class="flex justify-content-center align-content-center hidden lg:block shrink-0 lg:w-10rem"
          *ngIf="auth.isAuthenticated()"
        >
          <div class="hidden lg:block">
            <app-menu></app-menu>
          </div>
        </aside>

        <!-- Drawer mobile -->
        <p-drawer
          [(visible)]="sidebarVisible"
          header="Menu"
          position="left"
          [modal]="true"
          closable="false"
        >
          <app-menu></app-menu>
        </p-drawer>

        <!-- Main -->
        <main class="flex-1 overflow-auto min-h-0 relative surface-50">
          <div class="bg-custom p-3 flex justify-content-between">
            <div class="lg:hidden">
              <p-button (click)="openDrawer()" icon="pi pi-bars" />
            </div>
            <div class="hidden lg:block"></div>
            <app-missing-menu></app-missing-menu>
          </div>
          <div class="p-3">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class ArchitectLayout {
  drawer = inject(DrawerVisibility);
  auth = inject(AuthService);

  get sidebarVisible() {
    return this.drawer.sidebarVisible();
  }
  set sidebarVisible(b: boolean) {
    this.drawer.sidebarVisible.set(b);
  }
  openDrawer() {
    this.drawer.openSidebar();
  }
}
