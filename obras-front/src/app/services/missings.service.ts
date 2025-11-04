import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ApiService } from '../core/api';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export type MissingStatus = 'pending' | 'done' | 'cancelled';

export interface Missing {
  id: number;
  title: string;
  text: string;
  urgent: boolean;
  status: MissingStatus;
  createdAt: string; // ISO
  architect: { id: number; name?: string };
  construction: { id: number; title?: string };
  constructionWorker: { id: number; name?: string };
}

export interface MissingQuery {
  architectId?: number;
  constructionId?: number;
  status?: MissingStatus;
  urgent?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateMissingDto {
  title: string;
  text: string;
  urgent?: boolean;
  constructionId: number;
  architectId: number;
}

export interface UpdateMissingDto {
  title?: string;
  text?: string;
  urgent?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MissingsService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  missings = signal<Missing[]>([]);
  loading = signal(false);
  lastQuery = signal<MissingQuery | null>(null);
  pending = computed(() =>
    this.missings().filter((m) => m.status === 'pending')
  );
  urgentPending = computed(() =>
    this.pending()
      .slice()
      .sort((a, b) => Number(b.urgent) - Number(a.urgent))
      .slice(0, 20)
  );
  pendingCount = computed(() => this.pending().length);
  urgentCount = computed(() => this.pending().filter((m) => m.urgent).length);

  initForArchitect(architectId: number, constructionId?: number) {
    const q: MissingQuery = {
      architectId,
      constructionId,
      page: 1,
      pageSize: 100,
    };
    return this.fetch(q);
  }
  fetch(query: MissingQuery): Observable<{ items: Missing[]; total: number }> {
    this.loading.set(true);
    this.lastQuery.set(query);

    return this.api
      .request<{ items: Missing[]; total: number }>(
        'GET',
        'missings',
        undefined,
        {
          architectId: query.architectId,
          constructionId: query.constructionId,
          status: query.status,
          urgent:
            typeof query.urgent === 'boolean'
              ? String(query.urgent)
              : undefined,
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 100,
        }
      )
      .pipe(
        tap((resp) => {
          this.missings.set(resp.items ?? []);
          this.loading.set(false);
        })
      );
  }

  refresh(): Observable<void> {
    const q = this.lastQuery();
    if (!q) return of(void 0);
    return this.fetch(q).pipe(map(() => void 0));
  }

  create(dto: CreateMissingDto): Observable<Missing> {
    return this.api
      .request<Missing>('POST', 'missings', dto)
      .pipe(
        tap((created) => this.missings.update((curr) => [created, ...curr]))
      );
  }

  update(id: number, dto: UpdateMissingDto): Observable<Missing> {
    return this.api
      .request<Missing>('PATCH', `missings/${id}`, dto)
      .pipe(
        tap((updated) =>
          this.missings.update((curr) =>
            curr.map((m) => (m.id === updated.id ? updated : m))
          )
        )
      );
  }

  remove(id: number): Observable<{ success: true }> {
    return this.api
      .request<{ success: true }>('DELETE', `missings/${id}`)
      .pipe(
        tap(() =>
          this.missings.update((curr) => curr.filter((m) => m.id !== id))
        )
      );
  }

  // Acciones de arquitecto sobre estado
  setStatus(id: number, status: MissingStatus): Observable<Missing> {
    const user = this.auth.user();
    const role = this.auth.role()?.toUpperCase();

    return this.api
      .request<Missing>('PATCH', `missings/${id}/status`, {
        status,
        actorId: user?.id,
        actorRole: role,
      })
      .pipe(
        tap((updated) =>
          this.missings.update((curr) =>
            curr.map((m) => (m.id === updated.id ? updated : m))
          )
        )
      );
  }
  markDone(id: number) {
    return this.setStatus(id, 'done');
  }
  cancel(id: number) {
    return this.setStatus(id, 'cancelled');
  }
  reopen(id: number) {
    return this.setStatus(id, 'pending');
  }
}
