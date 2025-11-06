import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea'; // standalone directive
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../services/auth.service';
import { MissingsService, CreateMissingDto, UpdateMissingStatusDto } from '../../services/missings.service';
import { WorkerInventoryService } from '../../services/worker-inventory.service';
import { Missing, MissingStatus } from '../../models/interfaces.model';

interface StatusOption {
  label: string;
  value: MissingStatus;
}

@Component({
  selector: 'app-worker-missings',
  standalone: true,
  templateUrl: './worker-missings.html',
  styleUrls: ['./worker-missings.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    InputTextarea,
    DialogModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class WorkerMissingsComponent {
  private auth = inject(AuthService);
  private missingsService = inject(MissingsService);
  private inventoryService = inject(WorkerInventoryService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  workerId = this.auth.user()?.id ?? null;

  createForm: FormGroup = this.fb.group({
    elementId: [undefined as number | undefined, Validators.required],
    title: ['', [Validators.required, Validators.maxLength(140)]],
    text: ['', Validators.required],
    status: ['SE_QUEDO_SIN' as MissingStatus, Validators.required],
    urgent: [false],
  });

  statusForm: FormGroup = this.fb.group({
    status: ['SE_QUEDO_SIN' as MissingStatus, Validators.required],
    noteTitle: [''],
    noteText: ['', Validators.required],
  });

  statusDialogVisible = signal(false);
  selectedMissing = signal<Missing | null>(null);

  missings = this.missingsService.missings;
  loading = this.missingsService.loading;

  elements = this.inventoryService.elements;
  elementOptions = computed(() =>
    this.elements().map((element) => ({
      label: element.name,
      value: element.id,
      category: element.category?.name ?? '',
    })),
  );

  statusOptions: StatusOption[] = [
    { label: 'Se quedo sin', value: 'SE_QUEDO_SIN' },
    { label: 'Se rompio',     value: 'SE_ROMPIO' },
    { label: 'Se perdio',     value: 'SE_PERDIO' },
  ];

  constructor() {
    if (this.workerId) {
      this.refresh();
      this.inventoryService.loadElements(this.workerId).subscribe();
    }
  }

  refresh() {
    if (!this.workerId) return;
    this.missingsService.loadForWorker(this.workerId).subscribe();
  }

  submitMissing() {
    if (!this.workerId || this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const dto: CreateMissingDto = {
      elementId: this.createForm.value.elementId as number, // asegurado por optionValue y validators
      title: this.createForm.value.title ?? '',
      text: this.createForm.value.text ?? '',
      status: this.createForm.value.status as MissingStatus,
      urgent: !!this.createForm.value.urgent,
    };

    this.missingsService.createForWorker(this.workerId, dto).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', detail: 'Faltante registrado correctamente' });
        this.createForm.reset({
          elementId: undefined,
          title: '',
          text: '',
          status: 'SE_QUEDO_SIN',
          urgent: false,
        });
        this.refresh();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          detail: err?.error?.error?.message ?? 'No se pudo crear el faltante',
        });
      },
    });
  }

  openStatusDialog(missing: Missing) {
    this.selectedMissing.set(missing);
    this.statusForm.reset({
      status: missing.status,
      noteTitle: 'Cambio de estado',
      noteText: '',
    });
    this.statusDialogVisible.set(true);
  }

  closeStatusDialog() {
    this.statusDialogVisible.set(false);
    this.selectedMissing.set(null);
  }

  changeStatus() {
    const missing = this.selectedMissing();
    if (!missing || !this.workerId || this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    const dto: UpdateMissingStatusDto = {
      status: this.statusForm.value.status as MissingStatus,
      noteTitle: this.statusForm.value.noteTitle ?? '',
      noteText: this.statusForm.value.noteText ?? '',
    };

    this.missingsService.updateStatusForWorker(this.workerId, missing.id, dto).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', detail: 'Estado actualizado' });
        this.closeStatusDialog();
        this.refresh();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          detail: err?.error?.error?.message ?? 'No se pudo actualizar el estado',
        });
      },
    });
  }

  statusLabel(status: MissingStatus) {
    switch (status) {
      case 'SE_QUEDO_SIN': return 'Se quedo sin';
      case 'SE_ROMPIO':    return 'Se rompio';
      case 'SE_PERDIO':    return 'Se perdio';
      default:             return status;
    }
  }
}
