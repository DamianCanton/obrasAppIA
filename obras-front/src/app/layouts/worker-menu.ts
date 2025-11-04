import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-worker-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonModule],
  template: `
    <nav class="flex flex-column gap-2 p-2">
      <a routerLink="/worker/elements" routerLinkActive="font-bold">
        <button pButton label="Elementos" class="w-full"></button>
      </a>
      <a routerLink="/worker/missings" routerLinkActive="font-bold">
        <button pButton label="Faltantes" class="w-full"></button>
      </a>
      <a routerLink="/worker/notas" routerLinkActive="font-bold">
        <button pButton label="Notas" class="w-full"></button>
      </a>
      <button pButton label="Salir" (click)="logout()" class="w-full"></button>
    </nav>
  `,
})
export class WorkerMenu {
  authService = inject(AuthService);
  router = inject(Router);

  logout() {
    const confirmed = window.confirm(
      '¿Seguro que querés cerrar la sesión?'
    );
    if (!confirmed) return;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
