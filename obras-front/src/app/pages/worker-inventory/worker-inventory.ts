import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { WorkerInventoryService, WorkerInventoryEntry } from '../../services/worker-inventory.service';
import { AuthService } from '../../services/auth.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-worker-inventory',
  standalone: true,
  templateUrl: './worker-inventory.html',
  styleUrls: ['./worker-inventory.scss'],
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class WorkerInventoryComponent {
  private auth = inject(AuthService);
  private inventoryService = inject(WorkerInventoryService);
  private messageService = inject(MessageService);
  private confirmation = inject(ConfirmationService);

  workerId = this.auth.user()?.id ?? null;
  returning = signal<number | null>(null);

  entries = this.inventoryService.inventory;
  loading = this.inventoryService.loadingInventory;

  constructor() {
    if (this.workerId) {
      this.refresh();
    }
  }

  refresh() {
    if (!this.workerId) return;
    this.inventoryService.loadInventory(this.workerId).subscribe();
  }

  confirmReturn(entry: WorkerInventoryEntry) {
    this.confirmation.confirm({
      header: 'Devolver elemento',
      message: `Confirmas que devolviste ${entry.element.name}?`,
      acceptLabel: 'Devolver',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text',
      icon: 'pi pi-undo',
      accept: () => this.executeReturn(entry),
    });
  }

  private executeReturn(entry: WorkerInventoryEntry) {
    if (!this.workerId) return;
    this.returning.set(entry.element.id);
    this.inventoryService
      .returnElement(this.workerId, entry.element.id)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            detail: entry.element.name + ' devuelto al deposito',
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            detail: err?.error?.error?.message ?? 'No se pudo devolver el elemento',
          });
        },
        complete: () => this.returning.set(null),
      });
  }
}
