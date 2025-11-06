import { Injectable, effect, signal, inject } from '@angular/core';
import { ApiService } from '../core/api';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ElementsService } from './elements.service';
import { Element, Note } from '../models/interfaces.model';

export type UserType = 'architect' | 'worker';

export interface NoteCreateDto {
  title?: string;
  text: string;
  elementId?: number;
  missingId?: number;
  createdBy: number;
  createdByType: UserType;
  context?: string;
}

export interface NoteUpdateDto {
  title?: string;
  text?: string;
  updatedBy: number;
  updatedByType: UserType;
  context?: string;
}

export interface NoteDeleteDto {
  deletedBy: number;
  deletedByType: UserType;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private api = inject(ApiService);
  private elementsSvc = inject(ElementsService);

  private externalNotes = signal<Note[]>([]);
  notes = signal<Note[]>([]);

  constructor() {
    effect(() => {
      const elements = this.elementsSvc.elements();
      const manual = this.externalNotes();

      const map = new Map<number, Note>();
      for (const note of manual) {
        map.set(note.id, note);
      }

      for (const el of elements) {
        const notes = Array.isArray((el as any)?.notes) ? (el as any).notes : [];
        for (const note of notes) {
          map.set(note.id, note);
        }
      }

      const ordered = Array.from(map.values()).sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

      this.notes.set(ordered);
    });
  }

  ensureInitialized(architectId: number) {
    return this.elementsSvc.init(architectId);
  }

  loadForWorker(workerId: number): Observable<Note[]> {
    return this.api
      .request<Note[]>('GET', `note/worker/${workerId}`)
      .pipe(tap((notes) => this.externalNotes.set(notes ?? [])));
  }

  create(dto: NoteCreateDto): Observable<Note> {
    return this.api.request<Note>('POST', 'note', dto).pipe(
      tap((created) => {
        const elementId = created.element?.id ?? dto.elementId ?? null;
        if (elementId) {
          this.upsertElementNote(elementId, created);
          this.externalNotes.update((curr) => curr.filter((n) => n.id !== created.id));
        } else {
          this.externalNotes.update((curr) => [created, ...curr.filter((n) => n.id !== created.id)]);
        }
      }),
    );
  }

  update(id: number, dto: NoteUpdateDto): Observable<Note> {
    return this.api.request<Note>('PUT', `note/${id}`, dto).pipe(
      tap((updated) => {
        const elementId = updated.element?.id ?? null;
        if (elementId) {
          this.upsertElementNote(elementId, updated);
          this.externalNotes.update((curr) => curr.filter((n) => n.id !== updated.id));
        } else {
          this.externalNotes.update((curr) => [
            updated,
            ...curr.filter((n) => n.id !== updated.id),
          ]);
        }
      }),
    );
  }

  delete(id: number, dto: NoteDeleteDto): Observable<void> {
    return this.api.request<void>('DELETE', `note/${id}`, dto).pipe(
      tap(() => {
        this.elementsSvc.elements.update((curr) =>
          curr.map((el) => {
            const notes = Array.isArray((el as any)?.notes) ? (el as any).notes : [];
            if (!notes.some((n: Note) => n.id === id)) return el;
            return {
              ...el,
              notes: notes.filter((n: Note) => n.id !== id),
            } as Element;
          }),
        );
        this.externalNotes.update((curr) => curr.filter((n) => n.id !== id));
      }),
    );
  }

  private upsertElementNote(elementId: number, note: Note) {
    this.elementsSvc.elements.update((curr) =>
      curr.map((el) => {
        if (el.id !== elementId) return el;
        const notes = Array.isArray((el as any)?.notes) ? (el as any).notes : [];
        return {
          ...el,
          notes: [note, ...notes.filter((n: Note) => n.id !== note.id)],
        } as Element;
      }),
    );
  }
}

