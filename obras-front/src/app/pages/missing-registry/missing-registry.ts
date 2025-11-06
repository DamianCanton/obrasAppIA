import { Component, OnInit, computed, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissingsService } from '../../services/missings.service';
import { MissingStatus } from '../../models/interfaces.model';
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

  @Input() architectId!: number;      // pÃ¡salo desde layout/auth
  @Input() constructionId?: number;

  statusOptions: { label: string; value: MissingStatus | null }[] = [
    { label: 'Todos', value: null },
    { label: 'Se quedo sin', value: 'SE_QUEDO_SIN' as MissingStatus },
    { label: 'Se rompio', value: 'SE_ROMPIO' as MissingStatus },
    { label: 'Se perdio', value: 'SE_PERDIO' as MissingStatus },
  ];
  statusChangeOptions = this.statusOptions.filter(
    (option): option is { label: string; value: MissingStatus } =>
      option.value !== null,
  );

  statusFilter: MissingStatus | null = null;
  onlyUrgent = false;

  filtered = computed(() => {
    let list = this.svc.missings();
    if (this.statusFilter) list = list.filter(m => m.status === this.statusFilter);
    if (this.onlyUrgent) list = list.filter(m => m.urgent);
    // urgentes primero, luego por fecha
    return list.slice().sort((a, b) => {
      const u = Number(b.urgent) - Number(a.urgent);
      if (u !== 0) return u;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  });

  ngOnInit(): void {
    // inicializa si no hay datos (Ãºtil cuando se entra directo por URL)
    if (!this.svc.lastQuery() && this.architectId) {
      this.svc.initForArchitect(this.architectId, this.constructionId).subscribe();
    }
    // si viene ?tab=pending del drawer
    const tab = this.route.snapshot.queryParamMap.get('tab') as MissingStatus | null;
    if (tab && ['SE_QUEDO_SIN', 'SE_ROMPIO', 'SE_PERDIO'].includes(tab)) {
      this.statusFilter = tab;
    }
  }

  statusLabel(s: MissingStatus) {
    switch (s) {
      case 'SE_QUEDO_SIN':
        return 'Se quedo sin';
      case 'SE_ROMPIO':
        return 'Se rompio';
      case 'SE_PERDIO':
        return 'Se perdio';
      default:
        return 'Desconocido';
    }
  }

  applyFilter() {
    /* la signal computed se recalcula sola */
  }

  refresh() {
    this.svc.refresh().subscribe();
  }

  changeStatus(id: number, status: MissingStatus) {
    this.svc.setStatus(id, status).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: 'Se marco el faltante como ' + this.statusLabel(status) + '.',
        });
        this.refresh();
      },
    });
  }
}

