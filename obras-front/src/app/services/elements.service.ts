import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from '../core/api';
import { Observable, forkJoin, of } from 'rxjs';
import { finalize, map, shareReplay, tap } from 'rxjs/operators';
import { Element } from '../models/interfaces.model';

export type CategoryOpt = { id: number; name: string };
export type LocationOpt = {
  key: string;
  id: number;
  type: 'deposit' | 'construction';
  name: string;
};

@Injectable({ providedIn: 'root' })
export class ElementsService {
  elements = signal<Element[]>([]);
  private deposits = signal<Array<{ id: number; name: string }>>([]);
  private constructions = signal<Array<{ id: number; title: string }>>([]);

  // 🔹 Categorías únicas derivadas
  categories = computed<CategoryOpt[]>(() => {
    const map = new Map<number, CategoryOpt>();
    for (const el of this.elements()) {
      const c = (el as any)?.category;
      if (c?.id && !map.has(c.id)) map.set(c.id, { id: c.id, name: c.name });
    }
    return Array.from(map.values());
  });

  // 🔹 Ubicaciones disponibles (depósitos + obras)
  locations = computed<LocationOpt[]>(() => {
    const opts: LocationOpt[] = [];

    for (const dep of this.deposits()) {
      opts.push({
        key: `deposit:${dep.id}`,
        id: dep.id,
        type: 'deposit',
        name: dep.name || `Depósito #${dep.id}`,
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

    return opts;
  });

  private _loaded = signal(false);
  private _loading = signal(false);
  private inflight$?: Observable<Element[]>; // <- cache de la request en curso

  constructor(private api: ApiService) {}

  private normalizeElement(raw: any): Element {
    const currentLocationType =
      raw?.currentLocationType ?? raw?.location?.locationType ?? null;
    const currentLocationId =
      raw?.currentLocationId ?? raw?.location?.locationId ?? null;

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

  /** Garantiza datos: usa init() */
  ensureLoaded(architectId: number): Observable<Element[]> {
    return this.init(architectId);
  }

  /** Fuerza refresh desde backend (por si hiciste CRUD) */
  refresh(architectId: number): Observable<Element[]> {
    return this.loadAll(architectId).pipe(shareReplay(1));
  }

  /** Helpers si los necesitás */
  get loaded() {
    return this._loaded();
  }
  get loading() {
    return this._loading();
  }

  /** CRUD con actualización local simple */
  create(architectId: number, dto: any): Observable<void> {
    const payload = this.toPayload(dto);
    return this.api
      .request<void>('POST', `architect/${architectId}/element`, payload)
      .pipe(
        tap(() => {
          // tras crear, refrescamos para mantener consistencia
          this.loadAll(architectId).subscribe();
        }),
      );
  }

  update(architectId: number, elementId: number, dto: any): Observable<void> {
    const payload = this.toPayload(dto);
    return this.api
      .request<void>(
        'PUT',
        `architect/${architectId}/element/${elementId}`,
        payload,
      )
      .pipe(
        tap(() => {
          this.loadAll(architectId).subscribe();
        }),
      );
  }

  delete(architectId: number, elementId: number): Observable<void> {
    return this.api
      .request<void>('DELETE', `architect/${architectId}/element/${elementId}`)
      .pipe(
        tap(() => {
          this.elements.set(this.elements().filter((e) => e.id !== elementId));
        })
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
