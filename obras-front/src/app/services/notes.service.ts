import { Injectable, effect, signal, inject } from '@angular/core';
import { ApiService } from '../core/api';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ElementsService } from './elements.service';
import { Note } from '../models/interfaces.model';

export type UserType = 'architect' | 'worker';

export interface NoteCreateDto {
  title: string;
  text: string;
  elementId: number;
  createdBy: number;
  createdByType: UserType;
}

export interface NoteUpdateDto {
  title: string;
  text: string;
  updatedBy: number;
  updatedByType: UserType;
}

export interface NoteDeleteDto {
  deletedBy: number;
  deletedByType: UserType;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private api = inject(ApiService);
  private elementsSvc = inject(ElementsService);

  notes = signal<Note[]>([]);

  constructor() {
    // 🔄 Mantener notas sincronizadas con los elementos cargados
    effect(() => {
      const els = this.elementsSvc.elements();
      const extracted = els
        .map((el: any) => el?.note)
        .filter((n: any): n is Note => !!n);
      this.notes.set(extracted);
    });
  }

  /** Garantiza que haya elementos (y por lo tanto notas) inicializados */
  ensureInitialized(architectId: number) {
    return this.elementsSvc.init(architectId);
  }

  /** CRUD directo a /note, manteniendo la signal local */
  create(dto: NoteCreateDto): Observable<Note> {
    return this.api
      .request<Note>('POST', 'note', dto)
      .pipe(
        tap((created) => {
          this.notes.update((curr) => [
            created,
            ...curr.filter((n) => n.id !== created.id),
          ]);

          this.elementsSvc.elements.update((curr) =>
            curr.map((el) =>
              el.id === (created.element?.id ?? dto.elementId)
                ? { ...el, note: created }
                : el,
            ),
          );
        }),
      );
  }

  update(id: number, dto: NoteUpdateDto): Observable<Note> {
    return this.api
      .request<Note>('PUT', `note/${id}`, dto)
      .pipe(
        tap((updated) =>
          this.notes.update((curr) =>
            curr.map((n) => (n.id === updated.id ? updated : n))
          ),
        ),
        tap((updated) =>
          this.elementsSvc.elements.update((curr) =>
            curr.map((el) =>
              el.note?.id === updated.id ? { ...el, note: updated } : el,
            ),
          ),
        )
      );
  }

  delete(id: number, dto: NoteDeleteDto): Observable<void> {
    return this.api
      .request<void>('DELETE', `note/${id}`, dto)
      .pipe(
        tap(() =>
          this.notes.update((curr) => curr.filter((n) => n.id !== id)),
        ),
        tap(() =>
          this.elementsSvc.elements.update((curr) =>
            curr.map((el) =>
              el.note?.id === id ? { ...el, note: null } : el,
            ),
          ),
        ),
      );
  }
}
