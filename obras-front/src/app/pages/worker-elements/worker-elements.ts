import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  WorkerInventoryService,
  WorkerElementView,
} from '../../services/worker-inventory.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-worker-elements',
  standalone: true,
  templateUrl: './worker-elements.html',
  styleUrls: ['./worker-elements.scss'],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class WorkerElementsComponent {
  private auth = inject(AuthService);
  inventoryService = inject(WorkerInventoryService);
  private messageService = inject(MessageService);

  workerId = this.auth.user()?.id ?? null;
  categoryFilter = signal<'all' | 'Herramienta' | 'Material'>('all');
  categoryFilterValue: 'all' | 'Herramienta' | 'Material' = 'all';
  searchTerm = signal('');
  assigning = signal<number | null>(null);

  elements = this.inventoryService.elements;
  loading = this.inventoryService.loadingElements;

  filteredElements = computed(() => {
    const list = this.elements();
    const category = this.categoryFilter();
    const term = this.searchTerm().toLowerCase();

    return list.filter((element) => {
      const matchesCategory =
        category === 'all' ||
        element.category?.name?.toLowerCase() === category.toLowerCase();
      const matchesTerm =
        !term ||
        [element.name, element.brand, element.category?.name]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())
          .some((value) => value.includes(term));
      return matchesCategory && matchesTerm;
    });
  });

  categories = [
    { label: 'Todos', value: 'all' as const },
    { label: 'Herramientas', value: 'Herramienta' as const },
    { label: 'Materiales', value: 'Material' as const },
  ];

  constructor() {
    if (this.workerId) {
      this.refresh();
    }
  }

  refresh() {
    if (!this.workerId) return;
    this.inventoryService.loadElements(this.workerId).subscribe();
  }

  onCategoryChange(value: 'all' | 'Herramienta' | 'Material') {
    this.categoryFilterValue = value;
    this.categoryFilter.set(value);
  }

  onSearch(term: string) {
    this.searchTerm.set(term);
  }

  assign(element: WorkerElementView) {
    if (!this.workerId) return;
    if (this.isAssignDisabled(element)) return;
    this.assigning.set(element.id);
    this.inventoryService
      .assignElement(this.workerId, element.id)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            detail: element.name + ' agregado a tu inventario',
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            detail:
              err?.error?.error?.message ?? 'No se pudo asignar el elemento',
          });
        },
        complete: () => this.assigning.set(null),
      });
  }

  isAssignDisabled(element: WorkerElementView) {
    return (
      (element.isAssigned && !element.isAssignedToCurrentWorker) ||
      this.assigning() === element.id
    );
  }
}
