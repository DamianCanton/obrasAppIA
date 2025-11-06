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
    <div class="min-h-screen flex flex-column lg:flex-row surface-ground text-color">
      <aside
        class="hidden lg:flex flex-column w-18rem surface-card shadow-4 border-round-none"
      >
        <div class="px-4 py-5 border-bottom-1 surface-border">
          <span class="text-xl font-semibold text-900">Panel Obrero</span>
          <p class="text-sm text-600 mt-1">
            Gestiona tus elementos, faltantes y notas
          </p>
        </div>
        <app-worker-menu
          class="p-3 flex-1"
          (navigate)="sidebarVisible = false"
        ></app-worker-menu>
      </aside>

      <div class="flex-1 flex flex-column min-h-0">
        <header
          class="lg:hidden surface-card flex align-items-center justify-content-between px-4 py-3 shadow-2"
        >
          <div>
            <span class="text-lg font-semibold text-900">Panel Obrero</span>
            <p class="text-xs text-600 m-0">Gestiona tus tareas diarias</p>
          </div>
          <button
            pButton
            type="button"
            icon="pi pi-bars"
            severity="secondary"
            text
            (click)="sidebarVisible = true"
            aria-label="Abrir menu"
          ></button>
        </header>

        <p-drawer
          [visible]="sidebarVisible"
          (visibleChange)="sidebarVisible = $event"
          position="left"
          header="Menu"
          [modal]="true"
          [showCloseIcon]="true"
        >
          <app-worker-menu
            class="w-18rem"
            (navigate)="sidebarVisible = false"
          ></app-worker-menu>
        </p-drawer>

        <main class="flex-1 overflow-auto px-3 py-4 sm:px-5">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class WorkerLayout {
  sidebarVisible = false;
}
