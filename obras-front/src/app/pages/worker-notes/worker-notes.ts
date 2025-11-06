import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea'; // standalone directive
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { NotesService, NoteCreateDto } from '../../services/notes.service';
import { MissingsService } from '../../services/missings.service';
import { WorkerInventoryService } from '../../services/worker-inventory.service';
import { AuthService } from '../../services/auth.service';
import { Missing } from '../../models/interfaces.model';

@Component({
  selector: 'app-worker-notes',
  standalone: true,
  templateUrl: './worker-notes.html',
  styleUrls: ['./worker-notes.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextarea,
    DropdownModule,
    ButtonModule,
    CardModule,
    DividerModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class WorkerNotesComponent {
  private auth = inject(AuthService);
  private notesService = inject(NotesService);
  private missingsService = inject(MissingsService);
  private inventoryService = inject(WorkerInventoryService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  // Puede ser null si todavía no hay sesión; en submit() se valida.
  workerId = this.auth.user()?.id ?? null;

  form = this.fb.group({
    title: [''],
    text: ['', Validators.required],
    elementId: [undefined as number | undefined],
    missingId: [undefined as number | undefined],
  });

  notes = this.notesService.notes;
  missings = this.missingsService.missings;
  elements = this.inventoryService.elements;

  constructor() {
    if (this.workerId) {
      this.notesService.loadForWorker(this.workerId).subscribe();
      this.missingsService.loadForWorker(this.workerId).subscribe();
      this.inventoryService.loadElements(this.workerId).subscribe();
    }
  }

  elementOptions = computed(() =>
    this.elements().map((el) => ({ label: el.name, value: el.id })),
  );

  missingOptions = computed(() =>
    this.missings().map((missing: Missing) => ({
      label: `${missing.element?.name ?? 'Elemento'} - ${this.statusLabel(missing.status)}`,
      value: missing.id,
    })),
  );

  submit() {
    if (!this.workerId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const elementId = this.form.value.elementId ?? undefined;
    const missingId = this.form.value.missingId ?? undefined;

    const dto: NoteCreateDto = {
      title: this.form.value.title ?? '',
      text: this.form.value.text ?? '',
      createdBy: this.workerId!,       // ya validado arriba
      createdByType: 'worker',
      ...(elementId != null ? { elementId } : {}), // no enviar null
      ...(missingId != null ? { missingId } : {}),
    };

    this.notesService.create(dto).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', detail: 'Nota guardada' });
        this.form.reset({ title: '', text: '', elementId: undefined, missingId: undefined });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          detail: err?.error?.error?.message ?? 'No se pudo guardar la nota',
        });
      },
    });
  }

  // Acepta string | undefined para plantillas sin casteos
  statusLabel(status: string | undefined): string {
    switch (status) {
      case 'SE_QUEDO_SIN': return 'Se quedo sin';
      case 'SE_ROMPIO':    return 'Se rompio';
      case 'SE_PERDIO':    return 'Se perdio';
      default:             return status ?? '';
    }
  }
}

