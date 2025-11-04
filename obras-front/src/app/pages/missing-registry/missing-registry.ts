import { Component, OnInit, computed, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissingsService, MissingStatus } from '../../services/missings.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-missing-registry',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, DropdownModule, CheckboxModule, ToastModule],
  templateUrl: './missing-registry.html',
  providers: [MessageService],
})
export class MissingRegistry implements OnInit {
  svc = inject(MissingsService);
  route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  @Input() architectId!: number;      // pásalo desde layout/auth
  @Input() constructionId?: number;

  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'En espera', value: 'pending' as MissingStatus },
    { label: 'Listos', value: 'done' as MissingStatus },
    { label: 'Cancelados', value: 'cancelled' as MissingStatus },
  ];

  statusFilter: MissingStatus | null = 'pending';
  onlyUrgent = false;

  filtered = computed(() => {
    let list = this.svc.missings();
    if (this.statusFilter) list = list.filter(m => m.status === this.statusFilter);
    if (this.onlyUrgent) list = list.filter(m => m.urgent);
    // urgentes primero, luego por fecha
    return list.slice().sort((a, b) => {
      const u = Number(b.urgent) - Number(a.urgent);
      if (u !== 0) return u;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  ngOnInit(): void {
    // inicializa si no hay datos (útil cuando se entra directo por URL)
    if (!this.svc.lastQuery() && this.architectId) {
      this.svc.initForArchitect(this.architectId, this.constructionId).subscribe();
    }
    // si viene ?tab=pending del drawer
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'pending') this.statusFilter = 'pending';
  }

  statusLabel(s: MissingStatus) {
    return s === 'pending' ? 'En espera' : s === 'done' ? 'Listo' : 'Cancelado';
  }

  applyFilter() { /* la signal computed se recalcula sola */ }

  refresh() { this.svc.refresh().subscribe(); }

  markDone(id: number) {
    this.svc.markDone(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Faltante resuelto',
          detail: 'El material volvió al inventario.',
        });
        this.refresh();
      },
    });
  }
  cancel(id: number) { this.svc.cancel(id).subscribe(); }
  reopen(id: number) { this.svc.reopen(id).subscribe(); }
}
