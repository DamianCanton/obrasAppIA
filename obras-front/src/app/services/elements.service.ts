import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from '../core/api';
import { Observable, forkJoin, of } from 'rxjs';
import { finalize, map, shareReplay, tap } from 'rxjs/operators';
import { Element } from '../models/interfaces.model';

export type CategoryOpt = { id: number; name: string };
export type LocationOpt = {
  key: string;
  id: number;
  type: 'deposit' | 'construction' | 'worker';
  name: string;
};

@Injectable({ providedIn: 'root' })
export class ElementsService {
  elements = signal<Element[]>([]);
  private deposits = signal<Array<{ id: number; name: string }>>([]);
  private constructions = signal<Array<{ id: number; title: string }>>([]);

  // Categorias unicas derivadas
  categories = computed<CategoryOpt[]>(() => {
    const map = new Map<number, CategoryOpt>();
    for (const el of this.elements()) {
      const c = (el as any)?.category;
      if (c?.id && !map.has(c.id)) map.set(c.id, { id: c.id, name: c.name });
    }
    return Array.from(map.values());
  });

  // Ubicaciones disponibles (depositos, obras y obreros)
  locations = computed<LocationOpt[]>(() => {
    const opts: LocationOpt[] = [];

    for (const dep of this.deposits()) {
      opts.push({
        key: `deposit:${dep.id}`,
        id: dep.id,
        type: 'deposit',
        name: dep.name || `Deposito #${dep.id}`,
      });
    }

    for (const cons of this.constructions()) {
      opts.push({
        key: `construction:${cons.id}`,
        id: cons.id,
        type: 'construction',
        name: cons.title || `Obra #${cons.id}`,
      });
    }

    const workers = new Map<number, string>();
    for (const el of this.elements()) {
      const assignments = (el as any)?.assignments ?? [];
      const active = assignments.find((a: any) => a && !a.returnedAt && a.worker);
      if (active?.worker?.id) {
        const workerId = active.worker.id;
        const workerName = active.worker.name || `Obrero #${workerId}`;
        workers.set(workerId, workerName);
      }
    }

    for (const [id, name] of workers.entries()) {
      opts.push({
        key: `worker:${id}`,
        id,
        type: 'worker',
        name,
      });
    }

    return opts;
  });

  private _loaded = signal(false);
  private _loading = signal(false);
  private inflight$?: Observable<Element[]>;

  constructor(private api: ApiService) {}

  private normalizeElement(raw: any): Element {
    const currentLocationType =
      raw?.currentLocationType ?? raw?.location?.locationType ?? null;
    const currentLocationId =
      raw?.currentLocationId ?? raw?.location?.locationId ?? null;

    const assignments = Array.isArray(raw?.assignments)
      ? raw.assignments
      : [];
    const notes = Array.isArray(raw?.notes) ? raw.notes : [];

    return {
      ...raw,
      currentLocationType,
      currentLocationId,
      location:
        currentLocationType && currentLocationId
          ? {
              locationType: currentLocationType,
              locationId: currentLocationId,
            }
          : null,
      assignments,
      notes,
    };
  }

  private loadAll(architectId: number): Observable<Element[]> {
    this._loading.set(true);
    return forkJoin({
      elements: this.api.request<Element[]>(
        'GET',
        `architect/${architectId}/element`,
      ),
      deposits: this.api.request<Array<{ id: number; name: string }>>(
        'GET',
        `architect/${architectId}/deposit`,
      ),
      constructions: this.api.request<Array<{ id: number; title: string }>>(
        'GET',
        `architect/${architectId}/construction`,
      ),
    }).pipe(
      tap(({ elements, deposits, constructions }) => {
        const normalized = (elements ?? []).map((el) =>
          this.normalizeElement(el),
        );
        this.elements.set(normalized);
        this.deposits.set(deposits ?? []);
        this.constructions.set(constructions ?? []);
        this._loaded.set(true);
      }),
      map(() => this.elements()),
      finalize(() => this._loading.set(false)),
    );
  }

  init(architectId: number): Observable<Element[]> {
    if (this._loaded()) return of(this.elements());
    if (this._loading() && this.inflight$) return this.inflight$;

    this.inflight$ = this.loadAll(architectId).pipe(
      shareReplay(1),
      finalize(() => (this.inflight$ = undefined)),
    );
    return this.inflight$;
  }

  ensureLoaded(architectId: number): Observable<Element[]> {
    return this.init(architectId);
  }

  refresh(architectId: number): Observable<Element[]> {
    return this.loadAll(architectId).pipe(shareReplay(1));
  }

  get loaded() {
    return this._loaded();
  }
  get loading() {
    return this._loading();
  }

  create(architectId: number, dto: any): Observable<void> {
    const payload = this.toPayload(dto);
    return this.api
      .request<void>('POST', `architect/${architectId}/element`, payload)
      .pipe(tap(() => this.loadAll(architectId).subscribe()));
  }

  update(architectId: number, elementId: number, dto: any): Observable<void> {
    const payload = this.toPayload(dto);
    return this.api
      .request<void>(
        'PUT',
        `architect/${architectId}/element/${elementId}`,
        payload,
      )
      .pipe(tap(() => this.loadAll(architectId).subscribe()));
  }

  delete(architectId: number, elementId: number): Observable<void> {
    return this.api
      .request<void>('DELETE', `architect/${architectId}/element/${elementId}`)
      .pipe(
        tap(() => {
          this.elements.set(this.elements().filter((e) => e.id !== elementId));
        }),
      );
  }

  private toPayload(dto: any) {
    const currentLocation =
      dto?.currentLocationType !== undefined ||
      dto?.currentLocationId !== undefined
        ? {
            currentLocationType: dto.currentLocationType,
            currentLocationId: dto.currentLocationId,
          }
        : {
            currentLocationType: dto.locationType,
            currentLocationId: dto.locationId,
          };

    return {
      name: dto.name,
      brand: dto.brand,
      provider: dto.provider,
      buyDate: dto.buyDate,
      categoryId: dto.categoryId,
      ...currentLocation,
    };
  }
}

