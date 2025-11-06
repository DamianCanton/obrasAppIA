import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-worker-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    ConfirmDialogModule,
  ],
  template: `
    <p-confirmDialog></p-confirmDialog>
    <nav class="flex flex-column gap-2">
      <a
        routerLink="/worker/elements"
        routerLinkActive="active-link"
        class="block"
        (click)="emitNavigate()"
      >
        <button
          pButton
          type="button"
          label="Elementos"
          class="w-full justify-content-start text-left"
          text
        ></button>
      </a>

      <a
        routerLink="/worker/inventory"
        routerLinkActive="active-link"
        class="block"
        (click)="emitNavigate()"
      >
        <button
          pButton
          type="button"
          label="Inventario"
          class="w-full justify-content-start text-left"
          text
        ></button>
      </a>

      <a
        routerLink="/worker/missings"
        routerLinkActive="active-link"
        class="block"
        (click)="emitNavigate()"
      >
        <button
          pButton
          type="button"
          label="Faltantes"
          class="w-full justify-content-start text-left"
          text
        ></button>
      </a>

      <a
        routerLink="/worker/notes"
        routerLinkActive="active-link"
        class="block"
        (click)="emitNavigate()"
      >
        <button
          pButton
          type="button"
          label="Notas"
          class="w-full justify-content-start text-left"
          text
        ></button>
      </a>

      <button
        pButton
        type="button"
        label="Salir"
        class="w-full justify-content-start mt-3 text-left"
        severity="danger"
        (click)="logout()"
      ></button>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .active-link button {
        color: var(--brand-yellow-500) !important;
      }
    `,
  ],
  providers: [ConfirmationService],
})
export class WorkerMenu {
  @Output() navigate = new EventEmitter<void>();

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationService);

  emitNavigate() {
    this.navigate.emit();
  }

  isActive(url: string) {
    return this.router.isActive(url, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  logout() {
    this.confirmation.confirm({
      header: 'Cerrar sesion',
      message: 'Confirma que deseas salir del panel?',
      acceptLabel: 'Cerrar sesion',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.authService.logout();
        this.navigate.emit();
        this.router.navigate(['/login']);
      },
    });
  }
}
