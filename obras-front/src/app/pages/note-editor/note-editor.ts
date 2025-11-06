import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabel } from 'primeng/iftalabel';
import {
  NotesService,
  NoteCreateDto,
  NoteUpdateDto,
} from '../../services/notes.service';
import { AuthService } from '../../services/auth.service';
import { EditorModule } from 'primeng/editor';
import { TableModule } from 'primeng/table';
import { Location } from '@angular/common';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ToastModule,
    ConfirmPopupModule,
    InputTextModule,
    IftaLabel,
    EditorModule,
    TableModule,
  ],
  templateUrl: './note-editor.html',
  styleUrl: './note-editor.scss',
  providers: [MessageService, ConfirmationService],
})
export class NoteEditor implements OnInit {
  private notesSvc = inject(NotesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);
  private location = inject(Location);

  mode: 'create' | 'edit' = 'create';
  noteId?: number;
  elementId?: number;
  busy = false;

  // 👇 Editor model
  editorText = '';

  form = this.fb.group({
    title: ['', Validators.required],
    text: ['', Validators.required], // seguimos usando este control para validación/envío
  });

  get headerTitle() {
    return this.mode === 'edit' ? 'Editar nota' : 'Nueva nota';
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id'); // "new" | noteId
    const architectId = this.auth.user()?.id;

    if (idParam === 'new') {
      this.mode = 'create';
      this.elementId =
        Number(this.route.snapshot.queryParamMap.get('elementId') || 0) ||
        undefined;
      if (!this.elementId) {
        this.msg.add({
          severity: 'warn',
          summary: 'Falta elementId en la URL',
        });
      }
      this.form.reset({ title: '', text: '' });
      return;
    }

    this.mode = 'edit';
    this.noteId = Number(idParam);
    if (!this.noteId) {
      this.msg.add({ severity: 'error', summary: 'ID de nota inválido' });
      this.navigateBack();
      return;
    }
    if (!architectId) {
      this.msg.add({
        severity: 'error',
        summary: 'No se pudo identificar al usuario',
      });
      this.navigateBack();
      return;
    }

    this.notesSvc
      .ensureInitialized(architectId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          const note = this.notesSvc.notes().find((n) => n.id === this.noteId);
          if (!note) {
            this.msg.add({ severity: 'warn', summary: 'Nota no encontrada' });
            this.navigateBack();
            return;
          }
          this.elementId = note.element?.id;
          this.editorText = note.text || '';
          this.form.patchValue({ title: note.title, text: note.text || '' });
        },
        error: () =>
          this.msg.add({
            severity: 'error',
            summary: 'No se pudieron inicializar datos',
          }),
      });
  }

  onEditorChange(val: any) {
    this.editorText = val ?? '';
    this.form.get('text')?.setValue(this.editorText);
  }
  save() {
    if (this.form.invalid || this.busy) return;
    const userId = this.auth.user()?.id!;
    const actorType = this.auth.actorType();
    if (!actorType) {
      this.msg.add({
        severity: 'error',
        summary: 'No se pudo identificar el rol del usuario',
      });
      return;
    }
    this.busy = true;

    const dtoBase = {
      title: this.form.value.title!,
      text: this.form.value.text!,
    };

    const goBack = () => this.location.back();

    if (this.mode === 'edit' && this.noteId) {
      const dto: NoteUpdateDto = {
        ...dtoBase,
        updatedBy: userId,
        updatedByType: actorType,
      };
      this.notesSvc
        .update(this.noteId, dto)
        .pipe(finalize(() => (this.busy = false)))
        .subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Nota guardada' });
            goBack();
          },
          error: () =>
            this.msg.add({ severity: 'error', summary: 'Error al guardar' }),
        });
    } else {
      if (!this.elementId) {
        this.msg.add({ severity: 'error', summary: 'Falta elementId' });
        this.busy = false;
        return;
      }
      const dto: NoteCreateDto = {
        ...dtoBase,
        elementId: this.elementId,
        createdBy: userId,
        createdByType: actorType,
      };
      this.notesSvc
        .create(dto)
        .pipe(finalize(() => (this.busy = false)))
        .subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Nota creada' });
            goBack();
          },
          error: () =>
            this.msg.add({ severity: 'error', summary: 'Error al crear' }),
        });
    }
  }

  confirmDelete(event: Event) {
    if (this.mode !== 'edit' || !this.noteId) return;
    this.confirm.confirm({
      target: event.currentTarget as HTMLElement,
      message: '¿Seguro que deseas borrar esta nota?',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Borrar', severity: 'danger' },
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      accept: () => this.delete(),
    });
  }

  private delete() {
    const userId = this.auth.user()?.id!;
    const actorType = this.auth.actorType();
    if (!actorType) {
      this.msg.add({
        severity: 'error',
        summary: 'No se pudo identificar el rol del usuario',
      });
      return;
    }
    this.busy = true;
    this.notesSvc
      .delete(this.noteId!, { deletedBy: userId, deletedByType: actorType })
      .pipe(finalize(() => (this.busy = false)))
      .subscribe({
        next: () => {
          this.msg.add({ severity: 'success', summary: 'Nota eliminada' });
          this.navigateBack();
        },
        error: () =>
          this.msg.add({ severity: 'error', summary: 'Error al eliminar' }),
      });
  }

  navigateBack() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) this.router.navigateByUrl(returnUrl);
    else this.router.navigate(['/notes']);
  }
}
