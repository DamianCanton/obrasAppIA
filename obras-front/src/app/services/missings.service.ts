import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from '../core/api';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Missing, MissingStatus } from '../models/interfaces.model';

export interface MissingQuery {
  architectId?: number;
  constructionId?: number;
  status?: MissingStatus;
  urgent?: boolean;
  page?: number;
  pageSize?: number;
  workerId?: number;
}

export interface CreateMissingDto {
  title: string;
  text: string;
  urgent?: boolean;
  constructionId?: number;
  elementId: number;
  status: MissingStatus;
}

export interface UpdateMissingDto {
  title?: string;
  text?: string;
  urgent?: boolean;
}

export interface UpdateMissingStatusDto {
  status: MissingStatus;
  noteText?: string;
  noteTitle?: string;
}

@Injectable({ providedIn: 'root' })
export class MissingsService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  missings = signal<Missing[]>([]);
  loading = signal(false);
  lastQuery = signal<MissingQuery | null>(null);

  byStatus = (status: MissingStatus) =>
    computed(() => this.missings().filter((m) => m.status === status));

  statusCount = computed(() => {
    return this.missings().reduce(
      (acc, missing) => {
        acc[missing.status] = (acc[missing.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<MissingStatus, number>,
    );
  });

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
            typeof query.urgent === 'boolean' ? String(query.urgent) : undefined,
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 100,
          workerId: query.workerId,
        },
      )
      .pipe(
        tap((resp) => {
          this.missings.set(resp.items ?? []);
          this.loading.set(false);
        }),
      );
  }

  initForArchitect(architectId: number, constructionId?: number) {
    const q: MissingQuery = {
      architectId,
      constructionId,
      page: 1,
      pageSize: 100,
    };
    return this.fetch(q);
  }

  loadForWorker(workerId: number): Observable<{ items: Missing[]; total: number }> {
    this.loading.set(true);
    return this.api
      .request<{ items: Missing[]; total: number }>(
        'GET',
        `workers/${workerId}/missings`,
      )
      .pipe(
        tap((resp) => {
          this.missings.set(resp.items ?? []);
          this.loading.set(false);
        }),
      );
  }

  refresh(): Observable<void> {
    const q = this.lastQuery();
    if (!q) return of(void 0);
    return this.fetch(q).pipe(map(() => void 0));
  }

  createForWorker(workerId: number, dto: CreateMissingDto): Observable<Missing> {
    return this.api
      .request<Missing>('POST', `workers/${workerId}/missings`, dto)
      .pipe(
        tap((created) =>
          this.missings.update((curr) => [created, ...curr]),
        ),
      );
  }

  updateForWorker(workerId: number, missingId: number, dto: UpdateMissingDto) {
    return this.api
      .request<Missing>(
        'PATCH',
        `workers/${workerId}/missings/${missingId}`,
        dto,
      )
      .pipe(
        tap((updated) =>
          this.missings.update((curr) =>
            curr.map((m) => (m.id === updated.id ? updated : m)),
          ),
        ),
      );
  }

  updateStatusForWorker(
    workerId: number,
    missingId: number,
    dto: UpdateMissingStatusDto,
  ) {
    return this.api
      .request<Missing>(
        'PATCH',
        `workers/${workerId}/missings/${missingId}/status`,
        dto,
      )
      .pipe(
        tap((updated) =>
          this.missings.update((curr) =>
            curr.map((m) => (m.id === updated.id ? updated : m)),
          ),
        ),
      );
  }

  create(dto: CreateMissingDto): Observable<Missing> {
    return this.api
      .request<Missing>('POST', 'missings', dto)
      .pipe(tap((created) => this.missings.update((curr) => [created, ...curr])));
  }

  update(id: number, dto: UpdateMissingDto): Observable<Missing> {
    return this.api
      .request<Missing>('PATCH', `missings/${id}`, dto)
      .pipe(
        tap((updated) =>
          this.missings.update((curr) =>
            curr.map((m) => (m.id === updated.id ? updated : m)),
          ),
        ),
      );
  }

  setStatus(id: number, status: MissingStatus): Observable<Missing> {
    const user = this.auth.user();
    const currentRole = this.auth.role();
    const actorRole =
      currentRole === 'ADMIN'
        ? 'ARCHITECT'
        : currentRole === 'WORKER'
          ? 'WORKER'
          : undefined;

    return this.api
      .request<Missing>('PATCH', `missings/${id}/status`, {
        status,
        actorId: user?.id,
        actorRole,
      })
      .pipe(
        tap((updated) =>
          this.missings.update((curr) =>
            curr.map((m) => (m.id === updated.id ? updated : m)),
          ),
        ),
      );
  }
}

